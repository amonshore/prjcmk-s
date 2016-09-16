(() => {
    "use strict";
    /**
     * Configuro il logger.
     * 
     * @see http://tostring.it/2014/06/23/advanced-logging-with-nodejs/
     */
    const winston = require('winston'),
        conf = require('../conf.json');
    winston.emitErrs = true;

	const tsFormat = () => (new Date()).toLocaleTimeString();
    const logger = new winston.Logger({
        transports: [
            new winston.transports.File({
                level: conf.logger.level,
                filename: './logs/all-logs.log',
                handleExceptions: true,
                json: true,
                maxsize: 5242880, //5MB
                maxFiles: 5,
                colorize: false
            }),
            new winston.transports.Console({
                level: conf.debug ? conf.logger.level : 'silly',
                handleExceptions: true,
                json: false,
                colorize: true,
                timestamp: tsFormat,
            })
        ],
        exitOnError: false
    });

    module.exports = logger;
    module.exports.stream = {
        write: function(message, encoding) {
            logger.info(message);
        }
    };
})();
