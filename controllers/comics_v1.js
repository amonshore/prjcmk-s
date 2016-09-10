// TODO: da rifare
// "use strict";
// var db = require('./db');
// var _ = require('lodash');
// var express = require('express');
// var router = express.Router();
// //campi di Comic che possono essere restituiti
// var COMIC_FIELDS = ['cid', 'name', 'series', 'publisher', 'authors', 'price',
//     'periodicity', 'reserved', 'notes', 'image', 'categories'
// ];

// function comicFromBody(req, res, next) {
//     req.comic = _.pick(req.body, COMIC_FIELDS);
//     next();
// }

// // gestisco il parametro :cid
// router.param('cid', function(req, res, next, cid) {
//     db.Comic.findOne({
//         "cid": cid
//     }, function(err, comic) {
//         if (err) {
//             res.status(500).json(err);
//         } else if (comic) {
//             req.comic = comic;
//         }
//         next();
//     });
// });

// // elimina tutto
// router.delete('/all', function(req, res) {
//     db.Comic.remove(function(err) {
//         if (err) {
//             req.status(500).json(err);
//         } else {
//             res.sendStatus(200);
//         }
//     });
// });

// // elimina fumetto
// router.delete('/:wcid', function(req, res) {
//     db.Comic.remove({
//         "cid": req.params.wcid
//     }, function(err) {
//         if (err) {
//             req.status(500).json(err);
//         } else {
//             res.sendStatus(200);
//         }
//     });
// });

// // crea fumetto
// router.post('/', function(req, res) {
//     if (_.isArray(req.body)) {
//         var arr = _.map(req.body, function(item) {
//             return _.pick(item, COMIC_FIELDS);
//         });
//         db.Comic.collection.insert(arr, function(err, resp) {
//             if (err) {
//                 res.status(500).json(err);
//             } else {
//                 res.sendStatus(200);
//             }
//         });
//     } else {
//         new db.Comic(_.pick(req.body, COMIC_FIELDS))
//             .save(function(err) {
//                 if (err) {
//                     res.status(500).json(err);
//                 } else {
//                     res.sendStatus(200);
//                 }
//             });
//     }
// });

// // aggiorna fumetto
// router.put('/:wcid', comicFromBody, function(req, res) {
//     db.Comic.findOneAndUpdate({
//         "cid": req.params.wcid
//     }, req.comic, function(err) {
//         if (err) {
//             req.status(500).json(err);
//         } else {
//             res.sendStatus(200);
//         }
//     });
// });

// router.get('/search', function(req, res) {
//     // TODO: ricerca fumetto da fare
//     res.json([]);
// });

// // estraggo il fumetto richiesto
// router.get('/:cid', function(req, res) {
//     if (req.comic) {
//         res.json(_.pick(req.comic, COMIC_FIELDS));
//     } else {
//         res.sendStatus(404);
//     }
// });

// // estraggo tutti i fumetti
// router.get('/', function(req, res) {
//     console.log('- country:', req.get('X-prjcmk-country'));
//     db.Comic.find({}, COMIC_FIELDS.join(' '), function(err, comics) {
//         if (err) {
//             res.status(500).json(err);
//         } else {
//             res.json(comics);
//         }
//     });
// });

// module.exports = router;
