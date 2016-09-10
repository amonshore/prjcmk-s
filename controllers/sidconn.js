(() => {
    "use strict";
    const Q = require('Q'),
        logger = require('./logger');

    /**
     * Crea un Generator. Ad ogni chiamata di next() viene azzerato un contatore interno.
     * Se non viene chiamato next() entro il tempo specificato da timeout viene chiamata cb().
     * Per terminare il generator passare un valore true a next().
     *
     * @param      {Number}    timeout  millisecondi entro il quale deve essere chiamato next()
     * @param      {Function}  cb       callback chiamata a scadenza timeout
     */
    function* waitHandle(timeout, cb) {
        let stop = false;
        do {
            const hnd = setTimeout(() => {
                // è compito del chiamante interrompere il ciclo con next([true])
                cb();
            }, timeout);
            // blocco il ciclo e attendo il prossimo next()
            stop = yield;
            clearTimeout(hnd);
        } while (!stop);
    }

    module.exports = function(sid) {
        let _wh;
        return {
            sid: sid,
            // viene aggiornata ad ogni operazione
            time: Date.now(),
            // sockets
            clients: [],
            /**
             * Attende che NON venga inviato un segnale per un certo periodi di tempo.
             * Ritorna una Promise che viene risolta allo scadere del timeout, 
             * oppure rifiutata se waitFor è stato chiamato più di una volta senza chiamare stopWaiting.
             *
             * @param      {Number}  timeout  millisecondi entro i quali deve essere inviato un segnale
             * @return     {Promise}  una promessa che viene risolta allo scadere del timout
             */
            waitFor: function(timeout) {
                const def = Q.defer();
                if (_wh) {
                    def.reject();
                } else {
                    _wh = waitHandle(timeout, () => {
                        def.resolve(this);
                    });
                    _wh.next();
                    this.time = Date.now();
                }
                return def.promise;
            },
            /**
             * Invia un messaggio a tutti i client, tranne che al mittente.
             * Il mittente può essere omesso.
             *
             * @param      {WebSocket}  from    [opzionale] mittente
             * @param      {Object}  value   messaggio da inviare
             */
            signal: function(from, value) {
                if (value === undefined) {
                    value = from;
                }
                if (!_wh.next().done) {
                    const message = JSON.stringify(value);
                    logger.debug(this.sid, 'send', message);
                    this.time = Date.now();
                    this.clients.filter(client => client != from).forEach((client) => {
                        client.send(message);
                    })
                } else {
                    throw new Error('SidConn signal error: timeout reached');
                }
            },
            /**
             * 
             */
            stopWaiting: function() {
                if (_wh) {
                    _wh.next(true);
                    _wh = null;
                }
            }
        };
    };
})();
