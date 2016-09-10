// TODO: da rifare
// "use strict";
// var db = require('./db');
// var _ = require('lodash');
// var express = require('express');
// var router = express.Router();
// //campi di Category che possono essere restituiti
// var CATEGORY_FIELDS = ['catid', 'descr'];

// function categoryFromBody(req, res, next) {
//     req.category = _.pick(req.body, CATEGORY_FIELDS);
//     next();
// }

// router.param('catid', function(req, res, next, catid) {
//     db.Category.findOne({
//         "catid": catid
//     }, function(err, comic) {
//         if (err) {
//             res.status(500).json(err);
//         } else if (comic) {
//             req.category = category;
//         }
//         next();
//     });
// });

// // elimina tutto
// router.delete('/all', function(req, res) {
//     db.Category.remove(function(err) {
//         if (err) {
//             req.status(500).json(err);
//         } else {
//             res.sendStatus(200);
//         }
//     });
// });

// // elimina categoria
// router.delete('/:wcatid', function(req, res) {
//     db.Category.remove({
//         "catid": req.params.wcatid
//     }, function(err) {
//         if (err) {
//             req.status(500).json(err);
//         } else {
//             res.sendStatus(200);
//         }
//     });
// });

// // crea categoria
// router.post('/', categoryFromBody, function(req, res) {
//     new db.Category(req.category)
//         .save(function(err) {
//             if (err) {
//                 res.status(500).json(err);
//             } else {
//                 res.sendStatus(200);
//             }
//         });
// });

// // aggiorna categoria
// router.put('/:wcatid', categoryFromBody, function(req, res) {
//     db.Category.findOneAndUpdate({
//         "catid": req.params.wcatid
//     }, req.category, function(err) {
//         if (err) {
//             req.status(500).json(err);
//         } else {
//             res.sendStatus(200);
//         }
//     });
// });

// // estraggo i fumetti con la categoria specificata
// router.get('/:rcatid/comics', function(req, res) {
//     db.Comic.find({
//             "categories": {
//                 $all: req.params.rcatid
//             }
//         },
//         function(err, comics) {
//             if (err) {
//                 res.status(500).json(err);
//             } else {
//                 res.json(comics);
//             }
//         });
// });

// // estraggo la categoria richiesta
// router.get('/:catid', function(req, res) {
//     if (req.category) {
//         res.json(_.pick(req.category, CATEGORY_FIELDS));
//     } else {
//         res.sendStatus(404);
//     }
// });

// // estraggo tutte le categorie
// router.get('/', function(req, res) {
//     db.Category.find({}, CATEGORY_FIELDS.join(' '), function(err, categories) {
//         if (err) {
//             res.status(500).json(err);
//         } else {
//             res.json(categories);
//         }
//     });
// });

// module.exports = router;
