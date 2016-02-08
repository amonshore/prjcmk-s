var chalk = require('chalk');
var db = require('./rest/db');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
// log
app.use(function log(req, res, next) {
    console.log(chalk.magenta(req.method), req.originalUrl);
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
// routing per versione 1 di /comics
app.use('/v1/comics', require('./rest/comics_v1'));
// routing per versione 1 di /categories
app.use('/v1/categories', require('./rest/categories_v1'));
// in ascolto sulla porta 3000
app.listen(3000, function() {
    console.log('listen on', chalk.red(3000));
    db.init(function(err) {
        if (err) {
            throw err;
        } else {
            console.log('db connected');
        }
    });
});
