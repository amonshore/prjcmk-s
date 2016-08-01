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

router.get('/:sid/:time', (req, res) => {

});

router.post('/:sid/:time', (req, res) => {

});

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
                    doc.update({ "lastSync": now }).exec();
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
 * Crea un nuovo sid e lo salva sul DB.
 * Restituisce la pagina "sync" renderizzata.
 */
router.get('/', (req, res) => {
    // il sid deve essere univoco: sommo l'ip (numerico) e il timestamp, tutto negato
    const now = Date.now();
    const sid = ~(ip2long(req.ip) + now);
    // registro nel database il sid e il timestamp di generazione in modo da gestire la scadenza
    new db.Sync({ "sid": sid, "lastSync": now, "remoteIp": req.ip })
        .save()
        .then(() => res.render('sync.mustache', { "sid": sid }))
        .catch(err => {
            db.utils.err(err);
            res.status(500).send(db.utils.parseError(err).descr);
        });
});

module.exports = router;
