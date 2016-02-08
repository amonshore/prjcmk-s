var express = require('express');
var router = express.Router();

router.param('catid', function(req, res, next, catid) {
    req.category = {
        "catid": catid
    };
    next();
});

router.get('/:catid/comics', function(req, res) {
    res.json([]);
});

router.get('/:catid', function(req, res) {
	res.json(req.category);
});

router.get('/', function(req, res) {
    res.json([{
        "catid": "MNG",
        "descr": "Manga"
    }]);
});

module.exports = router;
