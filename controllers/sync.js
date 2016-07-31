const db = require('./db'),
    _ = require('lodash'),
    express = require('express'),
    router = express.Router();

router.get('/:syncid/:time', (req, res) => {

});

router.post('/:syncid/:time', (req, res) => {

});

router.post('/:syncid', (req, res) => {

});

router.get('/', (req, res) => {
	//TODO: il sid deve essere univoco
    res.render('sync.mustache', { "sid": 123456 });
});

module.exports = router;
