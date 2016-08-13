"use strict";
const chalk = require('chalk'),
    dateFormat = require('dateformat'),
    Q = require('q'),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    url = 'mongodb://localhost:27017/prjcmk-s';
//
mongoose.Promise = Q.Promise;
// schema
// NB: Comic.sid e Release.relid non sono più chiave primarie, 
//  perché possono essere presenti più record con lo stesso cid/relid ma per diversi sid
const Comic = mongoose.model('Comic', new Schema({
    cid: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
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
    }
}));
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
    }
}));
const Category = mongoose.model('Category', new Schema({
    catid: {
        type: String,
        index: {
            unique: true
        }
    },
    descr: String
}));
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
Sync.NO_SYNC = 0;
Sync.SYNCED = 1;
Sync.DATA_RECEIVED = 2;

Comic.on('index', function(err) {
    if (err) console.error(err);
});
Release.on('index', function(err) {
    if (err) console.error(err);
});

const utils = {
    /**
     * Descrizione errori
     */
    errors: {
        11000: "Duplicate key"
    },
    /**
     * Stampa nello stout l'errore formattato con timestamp.
     *
     * @param      {object}  err     l'oggetto rappresentante l'errore
     */
    err: function(err) {
        console.log('[%s] %s %s',
            chalk.gray(dateFormat('HH:MM:ss.l')),
            chalk.bgRed('ERR'),
            chalk.cyan(JSON.stringify(err)));
    },
    /**
     * Elabora un errore restituito dal DB e ne restuituisce 
     * una versione edulcorata da informazioni non sicure.
     *
     * @param      {Object}  err     l'errore
     * @return     {Object}  ritorna un oggetto con il solo codice errore e la descrizione
     */
    parseError: function(err) {
        return { "code": err.code, "descr": this.errors[err.code] || "Generic error" };
    }
};

/**
 * Crea la connessione al DB e prepara le tabelle.
 *
 * @return     {promise}  una promessa
 */
function init() {
    return mongoose.connect(url)
        .then(() => {
            console.log('mongodb connected on', chalk.green(url));
        })
        .then(Sync.remove().then(() => {
            console.log(' - sync cleared');
        }))
        .then(Comic.remove({ "sid": { "$exists": true } }).then(() => {
           console.log(' - comics (with sid) cleared'); 
        }))
        .then(Release.remove({ "sid": { "$exists": true } }).then(() => {
           console.log(' - releases (with sid) cleared'); 
        }));
}

exports.init = init;
exports.utils = utils;
exports.Comic = Comic;
exports.Release = Release;
exports.Category = Category;
exports.Sync = Sync;
