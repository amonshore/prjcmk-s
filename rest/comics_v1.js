var db = require('./db');
var express = require('express');
var router = express.Router();

router.param('cid', function(req, res, next, cid) {
    db.Comic.findOne({
        "cid": cid
    }, function(err, comic) {
        if (err) {
            res.status(500).json(err);
        } else if (comic) {
            req.comic = comic;
        }
        next();
    });
});

// crea fumetto
router.post('/', function(req, res) {
    new db.Comic({
        cid: req.body.cid,
        name: req.body.name
    }).save(function(err) {
        if (err) {
            res.status(500).json(err);
        } else {
            res.sendStatus(200);
        }
    });
});

// aggiorna fumetto
router.put('/:cid', function(req, res) {
    if (req.comic) {
        // TODO
    } else {
        res.sendStatus(404);
    }
});

router.get('/:cid/releases', function(req, res) {
    var rels = [1, 2, 3, 4, 5].map(num => {
        return {
            "cid": req.comics.cid,
            "number": num
        };
    });
    res.json(rels);
});

router.get('/search', function(req, res) {
    res.json([]);
});

// estraggo il fumetto richiesto
router.get('/:cid', function(req, res) {
    if (req.comic) {
        res.json(req.comic);
    } else {
        res.sendStatus(404);
    }
});

// estraggo tutti i fumetti
router.get('/', function(req, res) {
    db.Comic.find(function(err, comics) {
        if (err) {
            res.status(500).json(err);
        } else {
            res.json(comics);
        }
    });
});

module.exports = router;
