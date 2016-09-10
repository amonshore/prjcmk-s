(() => {
    "use strict";
    const chalk = require('chalk'),
        dateformat = require('dateformat');

    module.exports = {
        log: (...args) => {
            console.log(chalk.gray(dateformat('HH:mm:ss.l')), ...args);
        },

        /**
         * Descrizione errori
         */
        errors: {
            1001: "ValidationError",
            11000: "Duplicate key"
        },

        /**
         * Elabora un errore restituito dal DB e ne restuituisce 
         * una versione edulcorata da informazioni non sicure.
         *
         * @param      {Object}  err     l'errore
         * @return     {Object}  ritorna un oggetto con il solo codice errore e la descrizione
         */
        parseError: function(err) {
            if (err.code) {
                return { "code": err.code, "descr": this.errors[err.code] || "Generic error" };
            } else if (err.name === 'ValidationError') {
                return {
                    "code": 1001,
                    "descr": this.errors[1001],
                    "message": Object.keys(err.errors).map((key) => {
                        return err.errors[key].message;
                    }).join(', ')
                };
            }
        },

        /**
         * Converte una stringa IP nel corrispettivo numerico.
         *
         * @param      {string}  ip      IP nel formato aaa.bbb.ccc.ddd
         * @return     {number}  rappresentazione numerica dell'IP
         */
        ip2long: function(ip) {
            // https://github.com/indutny/node-ip/blob/master/lib/ip.js
            let ipl = 0;
            ip.split('.').forEach(octet => {
                ipl <<= 8;
                ipl += parseInt(octet);
            });
            return (ipl >>> 0);
        }
        
    }
})();
