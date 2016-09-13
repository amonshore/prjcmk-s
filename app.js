(() => {
    "use strict";
    /**
     * prjcmk-s by narsenico
     * supporto web per l'applicazione prjcmk (comikku)
     */
    const chalk = require('chalk'),
        dateFormat = require('dateformat'),
        db = require('./controllers/db'),
        bodyParser = require('body-parser'),
        express = require('express'),
        mustacheExpress = require('mustache-express'),
        app = express(),
        expressWs = require('express-ws')(app),
        logger = require('./controllers/logger'),
        conf = require('./conf');

    // registro i file .mustache perche' vengano renderizzati con mustacheExpress
    app.engine('mustache', mustacheExpress());
    app.set('view engine', 'mustache');
    app.set('views', __dirname + '/public/views');
    // disabilito la cache delle viste, da riabilitare in produzione
    app.disable('view cache');
    // uso lo stream definito nel logger
    app.use(require('morgan')(conf.morganFormat, { "stream": logger.stream }));
    // parsing application/json
    app.use(bodyParser.json());
    // parsing application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    // file statici
    app.use('/', express.static(__dirname + '/public'));
    // test
    app.get('/hello', (req, res) => {
        res.status(200).json({ "message": "Hello dear, this is version 1 of prjcmk-s" });
    });
    app.ws('/echo', (ws, res) => {
        ws.on('message', (msg) => {
            ws.send(msg);
        });
    });
    // routing
    // app.use('/comics', require('./controllers/comics_v1'));
    // app.use('/releases', require('./controllers/releases_v1'));
    // app.use('/categories', require('./controllers/categories_v1'));
    app.use('/sync', require('./controllers/sync'));
    app.use('/remote', require('./controllers/remote'));
    // inizializzo il database
    db.init('mongodb://localhost:27017/prjcmk-s').then(() => {
        // avvio il listener sulla porta specificata
        app.listen(conf.serverPort, '0.0.0.0', () => {
            logger.info('express listen on port', conf.serverPort);
        });
    }).catch(err => {
        logger.error(err);
    });
})();
