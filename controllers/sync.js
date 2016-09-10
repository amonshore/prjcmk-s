(() => {
    "use strict";
    /**
     * Router per la gestione della sincronizzazione dei dati con l'app.
     */
    const _ = require('lodash'),
        fs = require('fs'),
        Q = require('q'),
        Ut = require('./utility.js'),
        sidConn = require('./sidconn.js'),
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

    function removeSidConn(sidconn, db) {
        // rimuovo la connessione dall'elenco e tutti i suoi dati presenti nel db
        console.log(sidconn.sid, 'delete sidconn');
        delete sidconns[sidconn.sid];
        sidconn.stopWaiting();
        db.removeSyncData(sidconn.sid).fail((err) => {
            console.error(err);
        });
    }

    function waitForSync(sidconn) {
        console.log(sidconn.sid, 'waitForSync');
        sidconn.waitFor(conf.sync.syncIdTimeout).then(() => {
            // invio il messaggio a tutti i client
            console.log(sidconn.sid, 'timeout');
            sidconn.signal({ "message": "sync timeout" });
            sidconn.stopWaiting();
        });
    }

    module.exports = (db) => {

        /**
         * Gestione della comunicazione con la pagina web tramite websocket.
         */
        router.ws('/wsh/:sid', (ws, req) => {
            const sid = req.params.sid;
            // recupera (o crea se non esiste) una connessione grazie al sid
            const sidconn = getOrCreateSidConn(sid);
            // aggiungo il socket alla lista dei client gestiti dalla connessione
            sidconn.clients.push(ws);
            console.log(sidconn.sid, 'socket received');
            // gestione degli eventi
            ws.on('message', (msg) => {
                msg = JSON.parse(msg);
                switch (msg.message) {
                    case 'wait for sync':
                        waitForSync(sidconn);
                        break;
                    case 'put comics':
                    case 'remove comics':
                    case 'put releases':
                    case 'remove releases':
                    case 'stop sync':
                        break;
                    default:
                        console.error(new Error('Message not valid: ' + msg.message));
                }
            });
            ws.on('close', () => {
                // un socket è stato chisuo, lo rimuovo dalla connessione
                // quando non ce ne sono più rimuovo tutta la connessione
                console.log(sid, 'socket closed');
                if (_.pull(sidconn.clients, ws).length === 0) {
                    removeSidConn(sidconn, db);
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

        // /**
        //  * Invio al server dei comics con relative uscite.
        //  * Se time è 0 tutti i dati presenti nel db relativi al sid devono essere eliminati 
        //  * e sostituiti con quelli appena ricevuti.
        //  * Se tutto va bene ritorna {sid, lastSync}
        //  * 
        //  * @param      {string} sid codice di sincronizzazione
        //  * @param      {number} time timestamp di riferimento
        //  */
        // router.post('/:sid/:time', (req, res) => {
        //     if (conf.debug) {
        //         console.log(' - received ' + (+req.get('content-length') / 1024).toFixed(2) + ' KB');
        //         fs.open('./sync.log', 'w', (err, fd) => {
        //             if (err) {
        //                 console.error(err);
        //             } else {
        //                 fs.write(fd, JSON.stringify(req.body, null, 2), (err) => {
        //                     err && console.error(err);
        //                 });
        //             }
        //         })
        //     }

        //     if (+req.params.time === 0) {
        //         //pulisco tutte le tabelle con il sid corrente
        //         db.clearSyncData({ "sid": req.params.sid })
        //             //inserisco tutti i dati ricevuti
        //             .then(() => {
        //                 return db.addComics(
        //                         req.body.comics.map(comics => {
        //                             return {
        //                                 "cid": comics.id,
        //                                 "name": comics.name,
        //                                 "series": comics.series,
        //                                 "publisher": comics.publisher,
        //                                 "authors": comics.authors,
        //                                 "price": comics.price,
        //                                 "periodicity": comics.periodicity,
        //                                 "reserved": comics.reserved,
        //                                 "notes": comics.notes,
        //                                 //"image": comics.image,
        //                                 //"categories": comics.categories,
        //                                 "sid": req.params.sid,
        //                                 "syncTime": 0,
        //                                 "syncStatus": db.SyncStatus.DATA_RECEIVED
        //                             }
        //                         }))
        //                     .then(docs => {
        //                         console.log(' -', docs.length, 'comics added for sid ', req.params.sid);
        //                     });
        //             })
        //             .then(() => {
        //                 return db.addReleases(
        //                         req.body.comics.reduce((p, comics) => {
        //                             return p.concat(comics.releases.map(release => {
        //                                 return {
        //                                     "relid": comics.id + '_' + release.number,
        //                                     "cid": comics.id,
        //                                     "number": release.number,
        //                                     "date": release.date,
        //                                     "price": release.price,
        //                                     "ordered": release.ordered === 'T',
        //                                     "purchased": release.purchased === 'T',
        //                                     "notes": release.notes,
        //                                     "sid": req.params.sid,
        //                                     "syncTime": 0,
        //                                     "syncStatus": db.SyncStatus.DATA_RECEIVED
        //                                 }
        //                             }));
        //                         }, []))
        //                     .then(docs => {
        //                         console.log(' -', docs.length, 'releases added for sid ', req.params.sid);
        //                     });
        //             })
        //             //aggiorno lo stato del sid e invio la risposta
        //             .then(() => {
        //                 console.log(' - update sync status');
        //                 const now = Date.now();
        //                 return db.updateSync(req.params.sid, { "lastSync": now, "status": db.SyncStatus.DATA_RECEIVED })
        //                     .exec().then(doc => {
        //                         res.json({ "sid": req.params.sid, "lastSync": now });
        //                     })
        //             })
        //             //segnalo che la sincronizzazione è stata accettata e i primi dati sono arrivati
        //             .then(() => {
        //                 console.log(' - signal sync status');
        //                 sidconns[req.params.sid].signal();
        //             })
        //             .catch((err) => {
        //                 console.log(' - catch');
        //                 res.status(500).send(Ut.parseError(err).descr);
        //             });
        //     } else {
        //         // TODO solo aggiornamento
        //         res.status(503).send('Service Unavailable');
        //     }
        // });

        /**
         * Restituisce la pagina "sync" renderizzata.
         */
        router.get('/', (req, res) => {
            db.newSid(Ut.ip2long(req.ip)).then((doc) => {
                console.log('new sid', doc.sid);
                res.render('sync.mustache', { "sid": doc.sid, "timeout": conf.sync.syncIdTimeout });
            }).fail((err) => {
                res.status(500).send(Ut.parseError(err).descr);
            })
        });

        return router;
    }
})();
