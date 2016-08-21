/**
 * prjcmk-s by narsenico
 * supporto web per l'applicazione prjcmk (comikku)
 */
"use strict";
const chalk = require('chalk'),
    dateFormat = require('dateformat'),
    db = require('./controllers/db'),
    bodyParser = require('body-parser'),
    express = require('express'),
    mustacheExpress = require('mustache-express'),
    app = express(),
    expressWs = require('express-ws')(app);
// var options = {
//     root: __dirname + '/public/',
//     dotfiles: 'deny',
//     headers: {
//         'x-timestamp': Date.now()
//     }
// };
// registro i file .mustache perche' vengano renderizzati con mustacheExpress
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/public/views');
// disabilito la cache delle viste, da riabilitare in produzione
app.disable('view cache');
// request log
app.use((req, res, next) => {
    console.log('[%s] %s %s',
        chalk.gray(dateFormat('HH:MM:ss.l')),
        chalk.bgGreen(req.method),
        chalk.cyan(req.originalUrl));
    next();
});
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
app.use('/comics', require('./controllers/comics_v1'));
app.use('/releases', require('./controllers/releases_v1'));
app.use('/categories', require('./controllers/categories_v1'));
app.use('/sync', require('./controllers/sync'));
app.use('/remote', require('./controllers/remote'));
// inizializzo il database
db.init().then(() => {
    // in ascolto sulla porta 3000
    app.listen(3000, '0.0.0.0', () => {
        console.log('express listen on port', chalk.green(3000));
    });
}).catch(err => {
    console.log(err);
});
