"use strict";
var db = require('./db');
var _ = require('lodash');
var express = require('express');
var router = express.Router();
//campi di Release che possono essere restituiti
var RELEASE_FIELDS = ['cid', 'number', 'date', 'price', 'flags', 'notes'];

function releaseFromBody(req, res, next) {
    req.release = _.pick(req.body, RELEASE_FIELDS);
    if (!req.release.relid) {
    	req.release.relid = req.release.cid + '_' + req.release.number;
    }
    next();
}

// elimina tutte le release di un fumetto
router.delete('/:cid/all', function(req, res) {
    db.Release.remove({
        "cid": req.params.cid
    }, function(err) {
        if (err) {
            req.status(500).json(err);
        } else {
            res.sendStatus(200);
        }
    });
});

// elimina release
router.delete('/:cid/:number', function(req, res) {
    db.Release.remove({
        "cid": req.params.cid,
        "number": req.params.number
    }, function(err) {
        if (err) {
            req.status(500).json(err);
        } else {
            res.sendStatus(200);
        }
    });
});

// crea release
router.post('/:cid', releaseFromBody, function(req, res) {
    new db.Release(req.release)
        .save(function(err) {
            if (err) {
                res.status(500).json(err);
            } else {
                res.sendStatus(200);
            }
        });
});

// aggiorna release
router.put('/:cid/:number', releaseFromBody, function(req, res) {
    db.Release.findOneAndUpdate({
        "cid": req.params.cid,
        "number": req.params.number
    }, req.release, function(err) {
        if (err) {
            req.status(500).json(err);
        } else {
            res.sendStatus(200);
        }
    });
});

// estraggo tutti le release del fumetti
router.get('/:cid', function(req, res) {
    db.Release.find({
        "cid": req.params.cid
    }, RELEASE_FIELDS.join(' '), function(err, releases) {
        if (err) {
            res.status(500).json(err);
        } else {
            res.json(releases);
        }
    });
});

module.exports = router;
