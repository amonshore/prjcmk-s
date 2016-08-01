const chalk = require('chalk'),
    dateFormat = require('dateformat'),
    db = require('./controllers/db'),
    bodyParser = require('body-parser'),
    express = require('express'),
    mustacheExpress = require('mustache-express'),
    app = express();
// var options = {
//     root: __dirname + '/public/',
//     dotfiles: 'deny',
//     headers: {
//         'x-timestamp': Date.now()
//     }
// };
// log
// registro i file .mustache perche' vengano renderizzati con mustacheExpress
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', __dirname + '/public/views');
// disabilito la cache delle viste, da riabilitare in produzione
app.disable('view cache');
// request log
app.use(function log(req, res, next) {
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
app.get('/hello', function(req, res) {
    res.status(200).json({ "message": "Hello dear, this is version 1 of prjcmk-s" });
});
// routing
app.use('/comics', require('./controllers/comics_v1'));
app.use('/releases', require('./controllers/releases_v1'));
app.use('/categories', require('./controllers/categories_v1'));
app.use('/sync', require('./controllers/sync'));
app.use('/remote', require('./controllers/remote'));
// in ascolto sulla porta 3000
app.listen(3000, '0.0.0.0', function() {
    console.log('listen on', chalk.green(3000));
    db.init();
});