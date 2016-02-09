var chalk = require('chalk');
var mongoose = require('mongoose');
var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
var url = 'mongodb://localhost:27017/prjcmk-s';

// schema
var Comic = mongoose.model('Comic', new Schema({
    cid: {
        type: String,
        index: {
            unique: true
        }
    },
    name: {
        type: String,
        required: true
    }
}));
var Release = mongoose.model('Release', new Schema({
    relid: { // combinazione di cid e number
        type: String,
        index: {
            unique: true
        }
    },
    cid: {
        type: String
    },
    number: {
        type: Number
    },
    date: {
        type: String
    },
    notes: {
        type: String
    }
}));

Comic.on('index', function(err) {
    if (err) console.error(err);
});
Release.on('index', function(err) {
    if (err) console.error(err);
});

// cb(err)
function init(cb) {
    mongoose.connection.on('open', function() {
        console.log('mongodb connected on', chalk.red(url));
    });
    mongoose.connect(url);
}

exports.init = init;
exports.Comic = Comic;
exports.Release = Release;
