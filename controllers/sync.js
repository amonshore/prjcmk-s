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

router.get('/:sid/:time', (req, res) => {

});

router.post('/:sid/:time', (req, res) => {

});

router.post('/:sid', (req, res) => {

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