"use strict";
const db = require('./db'),
    _ = require('lodash'),
    fs = require('fs'),
    conf = require('../conf.json'),
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
 * Applica delle modifiche al record di sincronizzazione.
 * Usare a solo scopo di debug.
 */
router.post('/change/:sid', (req, res) => {
    db.Sync.findOne({ "sid": req.params.sid })
        .then(doc => {
            return doc.update(req.body).exec();
        })
        .then(doc => { //e' la risposta di update {ok: 1, nModified: 1, n: 1}
            res.json(doc);
        })
        .catch(err => {
            db.utils.err(err);
            res.status(500).send(db.utils.parseError(err).descr);
        });
});

// NB: attenzione, mantenere sotto /check/:sid altrimenti 
//  quest'ultime verranno interpretate come /:sid(check)/:time(sid)

/**
 * Recupera gli aggiornamenti relativi a sid e con timestamp superiore a time.
 * 
 * @param      {string} sid codice di sincronizzazione
 * @param      {number} time timestamp degli ultimi aggiornamenti
 */
router.get('/:sid/:time', (req, res) => {
    // TODO: sync da fare
    res.status(503).send('Service Unavailable');
});

/**
 * Invio al server dei comics con relative uscite.
 * Se time è 0 tutti i dati presenti nel db relativi al sid devono essere eliminati 
 * e sostituiti con quelli appena ricevuti.
 * Se tutto va bene ritorna {sid, lastSync}
 * 
 * @param      {string} sid codice di sincronizzazione
 * @param      {number} time timestamp di riferimento
 */
router.post('/:sid/:time', (req, res) => {
    if (conf.debug) {
        console.log(' - received ' + (+req.get('content-length') / 1024).toFixed(2) + ' KB');
        fs.open('./sync.log', 'w', (err, fd) => {
            if (err) {
                console.error(err);
            } else {
                fs.write(fd, JSON.stringify(req.body, null, 2), (err) => {
                    err && console.error(err);
                });
            }
        })
    }

    if (+req.params.time === 0) {
        //pulisco tutte le tabelle con il sid corrente
        db.Release.remove({ "sid": req.params.sid }).exec()
            .then(() => db.Comic.remove({ "sid": req.params.sid }).exec())
            //inserisco tutti i dati ricevuti
            .then(() => {
                return db.Comic.insertMany(
                        req.body.comics.map(comics => {
                            return {
                                "cid": comics.id,
                                "name": comics.name,
                                "series": comics.series,
                                "publisher": comics.publisher,
                                "authors": comics.authors,
                                "price": comics.price,
                                "periodicity": comics.periodicity,
                                "reserved": comics.reserved,
                                "notes": comics.notes,
                                //"image": comics.image,
                                //"categories": comics.categories,
                                "sid": req.params.sid
                            }
                        }))
                    .then(docs => {
                        console.log(' -', docs.length, 'comics added for sid ', req.params.sid);
                    });
            })
            .then(() => {
                return db.Release.insertMany(
                        req.body.comics.reduce((p, comics) => {
                            return p.concat(comics.releases.map(release => {
                                return {
                                    "relid": comics.id + '_' + release.number,
                                    "cid": comics.id,
                                    "number": release.number,
                                    "date": release.date,
                                    "price": release.price,
                                    "ordered": release.ordered === 'T',
                                    "purchased": release.purchased === 'T',
                                    "notes": release.notes,
                                    "sid": req.params.sid
                                }
                            }));
                        }, []))
                    .then(docs => {
                        console.log(' -', docs.length, 'releases added for sid ', req.params.sid);
                    });
            })
            //aggiorno lo stato del sid
            .then(() => {
                console.log(' - update sync status');
                return db.Sync.findOneAndUpdate({ "sid": req.params.sid }, { "lastSync": Date.now(), "status": db.Sync.DATA_RECEIVED })
                    .exec().then(doc => {
                        res.json(_.pick(doc, ['sid', 'lastSync']));
                    })
            })
            .catch((err) => {
                console.log(' - catch');
                db.utils.err(err);
                res.status(500).send(db.utils.parseError(err).descr);
            });
    } else {
        // TODO solo aggiornamento
        res.status(503).send('Service Unavailable');
    }
});

/**
 * Presetazione del codice di sincronizzazione (sid).
 * Il codice deve essere essere registrato su DB da non più di n secondi.
 * Se il sid è scaduto verrà rimosso il record, altrimenti verrà aggiornato.
 * 
 * NB: Il timeout viene recuperato da conf.sync.syncIdTimeout
 */
router.post('/:sid', (req, res) => {
    db.Sync.findOne({ "sid": req.params.sid })
        .then(doc => {
            if (doc) {
                const now = Date.now();
                if (doc.lastSync + conf.sync.syncIdTimeout > now) {
                    doc.update({ "lastSync": now, "status": db.Sync.SYNCED }).exec();
                    res.json(_.pick(doc, ['sid', 'lastSync']));
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
 * Genera un nuovo sid e lo restituisce.
 */
router.get('/newsid', newSid, (req, res) => {
    res.json({ "sid": req.newsid });
});

/**
 * Restituisce la pagina "sync" renderizzata.
 */
router.get('/', newSid, (req, res) => {
    res.render('sync.mustache', { "sid": req.newsid, "timeout": conf.sync.syncIdTimeout });
});

module.exports = router;
