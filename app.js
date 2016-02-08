var chalk = require('chalk');
var express = require('express');
var app = express();

function log(req, res, next) {
	console.log(chalk.red(req.method), req.originalUrl);
	next();
} 

app.use(log);
app.use('/', express.static(__dirname + '/public'));

app.listen(3000, function() {
	console.log('listen on', chalk.red(3000));
});