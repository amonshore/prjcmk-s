(() => {
    "use strict";
    /**
     * Router per la gestione della sincronizzazione dei dati con l'app.
     */
    const _ = require('lodash'),
        fs = require('fs'),
        Q = require('q'),
        Ut = require('./utility'),
        db = require('./db'),
        logger = require('./logger'),
        sidConn = require('./sidconn'),
        conf = require('../conf.json'),
        express = require('express'),
        router = express.Router();

    // ogni attività di sincronizzazione avrà la sua entry in questo oggetto dove la chiave è il sid
    const sidconns = {
        // <sid>: <sidconn>
    };

    function getOrCreateSidConn(sid) {
        return sidconns[sid] || (sidconns[sid] = sidConn(sid));
    }

    function removeSidConn(sidconn) {
        logger.debug(sidconn.sid, 'delete sidconn');
        // rimuovo la connessione dall'elenco e tutti i suoi dati presenti nel db
        delete sidconns[sidconn.sid];
        sidconn.stopWaiting();
        db.removeSyncData(sidconn.sid).fail((err) => {
            logger.error(err);
        });
    }

    /**
     * Invia dei messaggi ai client.
     *
     * @param      {Object}  sidconn  la connessione
     * @param      {Object}  from     il socket da escludere
     * @param      {Object}  value    il messaggio da inviare
     */
    function send(sidconn, from, value) {
        const message = JSON.stringify(value);
        logger.debug(sidconn.sid, 'send', message);
        sidconn.clients.filter(client => client != from).forEach((client) => {
            client.send(message);
        })
    }

    function waitForSync(sidconn) {
        logger.debug(sidconn.sid, 'waitForSync');
        sidconn.waitFor(conf.sync.syncIdTimeout).then(() => {
            // invio il messaggio a tutti i client
            logger.debug(sidconn.sid, 'timeout');
            send(sidconn, null, { "message": "sync timeout" });
            sidconn.stopWaiting();
        });
    }

    function normalizeComics(comics, sid, status, time) {
        comics.cid = comics.id;
        comics.sid = sid;
        comics.syncStatus = +status || db.SyncStatus.DATA_RECEIVED;
        comics.syncTime = +time || Date.now();
        return comics;
    }

    function hello(sidconn, data) {
        if (sidconn.isWaiting()) {
            logger.debug(sidconn.sid, 'hello');
            sidconn.signal();
            if (conf.debug) {
                fs.open(`./logs/sync${sidconn.sid}.log`, 'w', (err, fd) => {
                    if (err) {
                        logger.error(err);
                    } else {
                        fs.write(fd, JSON.stringify(data, null, 2), (err) => {
                            err && logger.error(err);
                        });
                    }
                })
            }
            // pulisco tutte le tabelle con il sid corrente
            db.clearSyncData(sidconn.sid)
                // inserisco tutti i dati ricevuti
                .then(() => {
                    return db.addComics(
                            data.comics.map(comics => {
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
                                    "sid": sidconn.sid,
                                    "syncTime": 0,
                                    "syncStatus": db.SyncStatus.DATA_RECEIVED
                                }
                            }))
                        .then(docs => {
                            logger.debug(sidconn.sid, 'comics added');
                        });
                })
                .then(() => {
                    return db.addReleases(
                            data.comics.reduce((p, comics) => {
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
                                        "sid": sidconn.sid,
                                        "syncTime": 0,
                                        "syncStatus": db.SyncStatus.DATA_RECEIVED
                                    }
                                }));
                            }, []))
                        .then(docs => {
                            logger.debug(sidconn.sid, 'releases added');
                        });
                })
                // aggiorno lo stato del sid e invio la risposta
                .then(() => {
                    logger.debug(sidconn.sid, 'update sync status');
                    return db.updateSync(sidconn.sid, { "lastSync": Date.now(), "status": db.SyncStatus.DATA_RECEIVED });
                })
                // segnalo che la sincronizzazione è stata accettata e i primi dati sono arrivati
                .then(() => {
                    send(sidconn, null, { "message": "sync start" });
                })
                // in caso di errore segnalo che la sincronizzazione è terminata
                .catch((err) => {
                    logger.error(err);
                    send(sidconn, null, { "message": "sync end" });
                });

        } else {
            logger.warn(sidconn.sid, 'hello w/o waiting');
            send(sidconn, null, { "message": "sync end" });
        }
    }

    function putComics(sidconn, ws, data) {
        sidconn.signal();
        Q.all(data instanceof Array ?
                Q.all(data.map(comics => db.addOrUpdateComics(comics.id, normalizeComics(comics, sidconn.sid)))) :
                db.addOrUpdateComics(data.id, normalizeComics(data, sidconn.sid)))
            .then((docs) => {
                send(sidconn, ws, { "message": "comics updated", "data": docs });
            }).catch((err) => {
                logger.error(err);
            });
    }

    function removeComics(sidconn, ws, data) {
        sidconn.signal();
        Q.all(data instanceof Array ?
                Q.all(data.map(id => db.removeComics(id, sidconn.sid))) :
                db.removeComics(data, sidconn.sid))
            .then((docs) => {
                if (docs instanceof Array) {
                    send(sidconn, ws, { "message": "comics removed", "data": docs.map(doc => doc.cid) });
                } else if (docs) {
                    send(sidconn, ws, { "message": "comics removed", "data": docs.cid });
                }
            }).catch((err) => {
                logger.error(err);
            });        
    }

    /**
     * Gestione della comunicazione con la pagina web tramite websocket.
     */
    router.ws('/wsh/:sid', (ws, req) => {
        logger.debug('*** socket received');
        const sid = req.params.sid;
        // recupera (o crea se non esiste) una connessione grazie al sid
        const sidconn = getOrCreateSidConn(sid);
        // aggiungo il socket alla lista dei client gestiti dalla connessione
        sidconn.clients.push(ws);
        logger.debug(sidconn.sid, 'socket received');
        // gestione degli eventi
        ws.on('message', (message) => {
            logger.debug(sidconn.sid, 'message received', message);
            const msg = JSON.parse(message);
            switch (msg.message) {
                case 'wait for sync':
                    waitForSync(sidconn);
                    break;
                case 'hello':
                    hello(sidconn, msg.data);
                    break;
                case 'put comics':
                    putComics(sidconn, ws, msg.data);
                    break;
                case 'remove comics':
                    removeComics(sidconn, ws, msg.data);
                    break;
                case 'clear comics':
                case 'put releases':
                case 'remove releases':
                case 'stop sync':
                    sidconn.signal();
                    logger.debug('=>', message);
                    break;
                default:
                    logger.error(new Error('Message not valid: ' + msg.message));
            }
        });
        ws.on('close', () => {
            // un socket è stato chisuo, lo rimuovo dalla connessione
            // quando non ce ne sono più rimuovo tutta la connessione
            logger.debug(sid, 'socket closed');
            if (_.pull(sidconn.clients, ws).length === 0) {
                removeSidConn(sidconn);
            }
        });
    });

    /**
     * Restituisce la pagina "synclist" renderizzata con il contenuto di Sync.
     */
    router.get('/list', (req, res) => {
        db.getSyncList()
            .then(docs => { res.render('synclist.mustache', { "syncitems": docs }) })
            .catch(err => {
                res.status(500).send(Ut.parseError(err).descr);
            });
    });

    /**
     * Restituisce la pagina "synccomics" renderizzata con i comcis ordinati per nome.
     */
    router.get('/comics/:sid', (req, res) => {
        db.getComcisBySid(req.params.sid)
            .then(docs => {
                res.render('synccomics.mustache', {
                    "sid": req.params.sid,
                    "comics": docs,
                    "search": function() { //stringa da usare per la ricerca
                        return [this.name, this.publisher, this.authors].join('|').toUpperCase();
                    }
                })
            })
            .catch(err => {
                res.status(500).send(Ut.parseError(err).descr);
            });
    });

    /**
     * Controlla se il sid e' stato richiesto.
     */
    router.get('/check/:sid', (req, res) => {
        db.getSync(req.params.sid)
            .then(doc => {
                res.json({
                    "sid": req.params.sid,
                    "synced": (!!doc && doc.status === db.SyncStatus.DATA_RECEIVED)
                });
            })
            .catch(err => {
                res.status(500).send(Ut.parseError(err).descr);
            });
    });

    /**
     * Applica delle modifiche al record di sincronizzazione.
     * Usare a solo scopo di debug.
     */
    router.post('/change/:sid', (req, res) => {
        db.updateSync(req.params.sid, req.body)
            .then(() => {
                res.status(200).send();
            })
            .catch(err => {
                res.status(500).send(Ut.parseError(err).descr);
            });
    });

    /**
     * Rimuove tutti i dati legati a un sid.
     */
    router.post('/remove/:sid', (req, res) => {
        db.removeSyncData(req.params.sid)
            .then(() => {
                res.json({ "sid": req.params.sid });
            })
            .catch(err => {
                res.status(500).send(Ut.parseError(err).descr);
            });
    });

    /**
     * Restituisce la pagina "sync" renderizzata.
     */
    router.get('/', (req, res) => {
        db.newSid(Ut.ip2long(req.ip)).then((doc) => {
            logger.debug('new sid', doc.sid);
            res.render('sync.mustache', { "sid": doc.sid, "timeout": conf.sync.syncIdTimeout });
        }).fail((err) => {
            res.status(500).send(Ut.parseError(err).descr);
        })
    });

    module.exports = router;
})();
