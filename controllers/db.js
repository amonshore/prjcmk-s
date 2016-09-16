(() => {
    "use strict";
    /**
     * Interfaccia verso il db, definizione schema delle collection.
     * Richiamare db.init(<url>) per inizializzare il db, ritorna una promise
     */
    const Q = require('q'),
        mongoose = require('mongoose'),
        Schema = mongoose.Schema,
        ObjectId = Schema.ObjectId,
        logger = require('./logger');

    // schema utente
    // NB: Comic.sid e Release.relid non sono più chiave primarie, 
    //  perché possono essere presenti più record con lo stesso cid/relid ma per diversi sid
    const Comic = mongoose.model('Comic', new Schema({
        cid: {
            type: String,
            match: /[^\s]/,
            required: true,
            index: true
        },
        name: {
            type: String,
            match: /[^\s]/,
            required: true
        },
        series: String,
        publisher: String,
        authors: String,
        price: Number,
        periodicity: String,
        reserved: String,
        notes: String,
        image: String,
        categories: [String],
        sid: {
            type: String,
            index: true
        },
        syncTime: Number,
        syncStatus: Number
    }));
    // schema release
    const Release = mongoose.model('Release', new Schema({
        relid: { // combinazione di cid e number
            type: String,
            required: true
        },
        cid: String,
        number: Number,
        date: String,
        price: Number,
        flags: Number,
        notes: String,
        sid: {
            type: String,
            index: true
        },
        syncTime: Number,
        syncStatus: Number
    }));
    // schema categorie
    const Category = mongoose.model('Category', new Schema({
        catid: {
            type: String,
            index: {
                unique: true
            }
        },
        descr: String
    }));
    // schema sync
    const Sync = mongoose.model('Sync', new Schema({
        sid: {
            type: String,
            index: {
                unique: true
            }
        },
        // timestamp dell'utlima operazione di sync
        lastSync: Number,
        remoteIp: String,
        // stato 0: sid non ancora richiesto, 1: sid richiesto, 2: primi dati da app ricevuti
        status: Number
    }));

    // uso Q come promises per mongoose
    mongoose.Promise = Q.Promise;

    const db = {
        /**
         * Inizializza il db.
         * 
         * @param      {String} url indirizzo del database
         * @return     {Promise}  promise
         */
        init: function(url) {
            return mongoose.connect(url)
                .then(() => {
                    logger.info('mongodb connected on', url);
                })
                .then(Sync.remove().then(() => {
                    logger.debug('sync cleared');
                }))
                .then(Comic.remove({ "sid": { "$exists": true } }).then(() => {
                    logger.debug('comics (with sid) cleared');
                }))
                .then(Release.remove({ "sid": { "$exists": true } }).then(() => {
                    logger.debug('releases (with sid) cleared');
                }));
        },

        stats: function() {
            return mongoose.connection.db.stats();
        },

        /**
         * Elimina l'intero database.
         *
         * @return     {Promise}  promise
         */
        dropDatabase: function() {
            return mongoose.connection.db.dropDatabase();
        },

        // costanti per Sync.status
        SyncStatus: {
            NO_SYNC: 0b00000000,
            SYNCED: 0b00000001,
            DATA_RECEIVED: 0b00000011,
            DATA_ADDED: 0b00000101,
            DATA_UPDATED: 0b00001001,
            DATA_REMOVED: 0b00010001
        },

        /**
         * Rimuove tutti i dati inerenti ad una sincronizzazione.
         *
         * @param      {string}  sid     identificativo della sincronizzazione
         * @return     {promise}  una promessa
         */
        removeSyncData: function(sid) {
            //TODO: rimuovere i dati anche dalle altre tabelle
            return Comic.remove({ "sid": sid })
                .then(() => Release.remove({ "sid": sid }))
                .then(() => Sync.remove({ "sid": sid }));
        },

        /**
         * Pulisce tutti i dati delle tabelle relativi ad una sincronizzazione.
         * Contrariamente a removeSyncData, non elimina la sincronizzazione.
         *
         * @param      {string}  sid     identificativo della sincronizzazione
         * @return     {promise}  una promessa
         */
        clearSyncData: function(sid) {
            return Release.remove({ "sid": sid })
                .then(() => Comic.remove({ "sid": sid }))
        },

        /**
         * Crea un nuovo sid e lo salva sul DB.
         * 
         * @param      {Number} key chiave numerica da usare per creare il codice univoco
         * @return     {promise}  una promessa
         */
        newSid: function(key) {
            // il sid deve essere univoco: sommo la chiave numerica e il timestamp, tutto negato
            const now = Date.now();
            const sid = ~(+key + now);
            // registro nel database il sid e il timestamp di generazione in modo da gestire la scadenza
            return new Sync({ "sid": sid, "lastSync": now, "status": this.SyncStatus.NO_SYNC })
                .save();
        },

        getSyncList: function() {
            return Sync.find({}).sort({ "lastSync": -1 });
        },

        getComcisBySid: function(sid) {
            return Comic.find({ "sid": sid }).sort({ "name": "asc" });
        },

        getSync: function(sid) {
            return Sync.findOne({ "sid": sid });
        },

        /**
         * Modfifica una sincronizzazione esistente. 
         * Il sid non può essere modificato.
         *
         * @param      {String} sid l'identificativo della sincronizzazione da modificare
         * @param      {Sync}  sync    la sincronizzazione modificata
         * @return     {Promise}  nella promise viene ritornata la sincronizzazione modificata
         */
        updateSync: function(sid, sync) {
            const update = Object.assign({}, sync);
            delete update.sid;
            return Sync.findOneAndUpdate({ "sid": sid }, update, { "new": true, "runValidators": true }).exec();
        },

        /**
         * Aggiunge uno o più comics.
         *
         * @param      {Array}  comics  comics da aggiungere
         * @return     {Promise}  una promise sul salvataggio dei dati
         */
        addComics: function(...comics) {
            if (comics.length === 1 && comics[0] instanceof Array) {
                comics = comics[0];
            }
            if (comics.length > 1) {
                return Comic.insertMany(comics);
            } else {
                return new Comic(comics[0]).save();
            }
        },

        /**
         * Modfifica un comics esistente. 
         * Il cid non può essere modificato.
         *
         * @param      {String} cid l'identificativo del comics da modificare
         * @param      {Comics}  comics    il comics modificata
         * @return     {Promise}  nella promise viene ritornata il comics modificato
         */
        updateComics: function(cid, comics) {
            const update = Object.assign({}, comics);
            delete update.cid;
            return Comic.findOneAndUpdate({ "cid": cid }, update, { "new": true, "runValidators": true }).exec();
        },

        /**
         * Aggiunge un comics o lo aggiorna se già esiste.
         *
         * @param      {String}  cid     l'identificativo del comics da modificare o aggiungere
         * @param      {Comics}  comics  il comcis contenente le modifiche
         * @return     {Promise}  nella promise viene ritornato il comics modificato
         */
        addOrUpdateComics: function(cid, comics) {
            const update = Object.assign({}, comics);
            return Q.try(function() {
                if (update.hasOwnProperty('cid')) {
                    if (update.cid !== cid) {
                        throw new Error('Cannot update comcis with different cid');
                    }
                } else {
                    update.cid = cid;
                }
                return Comic.findOneAndUpdate({ "cid": cid },
                    update, {
                        "new": true,
                        "upsert": true,
                        "setDefaultsOnInsert": true,
                        "runValidators": true
                    }).exec();
            });
        },

        /**
         * Elimina un comics e relative release.
         *
         * @param      {String}  cid     l'identificativo del comics da eliminare
         * @param      {String}  sid     [opzionale] identificativo della sincronizzazione
         * @return     {Promise}  nella promise viene ritornato il comics eliminato
         */
        removeComics: function(cid, sid) {
            const filter = (sid === undefined ? { "cid": cid } : { "cid": cid, "sid": sid });
            return Release.remove(filter)
                .then(() => Comic.findOneAndRemove(filter));
        },

        /**
         * Aggiunge una o più release.
         *
         * @param      {Array}    releases  release da aggiungere
         * @return     {Promise}  una promise sul salvataggio dei dati
         */
        addReleases: function(...releases) {
            if (releases.length === 1 && releases[0] instanceof Array) {
                releases = releases[0];
            }
            if (releases.length > 1) {
                return Release.insertMany(releases);
            } else {
                return new Release(releases[0]).save();
            }
        }
    };

    module.exports = db;
})();
