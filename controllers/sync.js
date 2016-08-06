"use strict";
const db = require('./db'),
    express = require('express'),
    router = express.Router();

/**
 * Converte una stringa IP nel corrispettivo numerico.
 *
 * @param      {string}  ip      IP nel formato aaa.bbb.ccc.ddd
 * @return     {number}  rappresentazione numerica dell'IP
 */
function ip2long(ip) {
    // https://github.com/indutny/node-ip/blob/master/lib/ip.js
    let ipl = 0;
    ip.split('.').forEach(octet => {
        ipl <<= 8;
        ipl += parseInt(octet);
    });
    return (ipl >>> 0);
}

/**
 * Rimuove tutti i dati inerenti ad una sincronizzazione.
 *
 * @param      {string}  sid     identificativo della sincronizzazione
 * @return     {promise}  una promessa
 */
function removeSyncData(sid) {
    //TODO: rimuovere i dati anche dalle altre tabelle
    return db.Sync.remove({ "sid": sid }).exec();
}

/**
 * Crea un nuovo sid e lo salva sul DB.
 * Se l'inserimento va male risponde con lo stato 500, altrimenti chiama next().
 *
 * @param      {Object}    req     request
 * @param      {Object}    res     response
 * @param      {Function}  next    prossimo step da richiamare
 */
function newSid(req, res, next) {
    // il sid deve essere univoco: sommo l'ip (numerico) e il timestamp, tutto negato
    const now = Date.now();
    req.newsid = ~(ip2long(req.ip) + now);
    // registro nel database il sid e il timestamp di generazione in modo da gestire la scadenza
    new db.Sync({ "sid": req.newsid, "lastSync": now, "remoteIp": req.ip, "status": 0 })
        .save()
        .then(() => next())
        .catch(err => {
            db.utils.err(err);
            res.status(500).send(db.utils.parseError(err).descr);
        });
}

/**
 * Presetazione del codice di sincronizzazione (sid).
 * Il codice deve essere essere registrato su DB da non più di 30 secondi.
 * Se il sid è scaduto verrà rimosso il record, altrimenti verrà aggiornato.
 */
router.post('/:sid', (req, res) => {
    db.Sync.findOne({ "sid": req.params.sid })
        .then(doc => {
            if (doc) {
                const now = Date.now();
                if (doc.lastSync + 30000 > now) {
                    doc.update({ "lastSync": now, "status": db.Sync.SYNCED }).exec();
                    res.send('sync ok');
                } else {
                    removeSyncData(req.params.sid);
                    res.status(403).send('sync expired');
                }
            } else {
                res.status(404).send('sync not found');
            }
        })
        .catch(err => {
            db.utils.err(err);
            res.status(500).send(db.utils.parseError(err).descr);
        });
});

/**
 * Restituisce la pagina "synclist" renderizzata con il contenuto di Sync.
 */
router.get('/list', (req, res) => {
    db.Sync.find({})
        .then(docs => { res.render('synclist.mustache', { "syncitems": docs }) })
        .catch(err => {
            db.utils.err(err);
            res.status(500).send(db.utils.parseError(err).descr);
        });
});

/**
 * Controlla che il sid e' stato richiesto.
 */
router.get('/check/:sid', (req, res) => {
    db.Sync.findOne({ "sid": req.params.sid })
        .then(doc => {
            res.json({
                "sid": req.params.sid,
                "synced": (!!doc && doc.status === db.Sync.DATA_RECEIVED)
            });
        })
        .catch(err => {
            db.utils.err(err);
            res.status(500).send(db.utils.parseError(err).descr);
        });
});

/**
 * NB: attenzione, mantenere sotto /check/:sid
 * altrimenti quest'ultime verranno interpretate come /:sid(check)/:time(sid)
 */
router.get('/:sid/:time', (req, res) => {
    res.status(503).send('Service Unavailable');
});

router.post('/:sid/:time', (req, res) => {
    res.status(503).send('Service Unavailable');
});

/**
 * Genera un nuovo sid e lo restituisce.
 */
router.get('/newsid', newSid, (req, res) => {
    res.json({ "sid": req.newsid });
});

/**
 * Restituisce la pagina "sync" renderizzata.
 */
router.get('/', newSid, (req, res) => {
    res.render('sync.mustache', { "sid": req.newsid });
});

module.exports = router;
