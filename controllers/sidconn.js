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
             * Indica se la connessione è in attesa di un segnale
             *
             * @return     {boolean}  True è in attesa, false altrimenti
             */
            isWaiting: function() {
                return !!_wh;
            },
            /**
             * Se non viene chiamato signal() per il tempo definito da timeout, risolve la promise.
             * La promessa viene rifiutata se waitFor è stato chiamato più di una volta senza chiamare stopWaiting.
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
             * Il conto alla rovescia viene rinnovato.
             */
            signal: function() {
                if (_wh.next().done) {
                    throw new Error('SidConn signal error: timeout reached');
                } else {
                    this.time = Date.now();
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
