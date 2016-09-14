(() => {
    "use strict";
    const assert = require('assert'),
        conf = require('../conf.json'),
        _ = require('lodash'),
        db = require('../controllers/db');

    describe('database', () => {
        it('open connection', function(done) {
            db.init(conf.dbUrl).done(done);
        });
        it('retrieve stats', function(done) {
            db.stats().then(function(stats) {
                assert.ok(stats != null);
            }).then(done).catch(done);
        });
    });

    describe('comics', () => {
        it('add 1 comics', function(done) {
            db.addComics({ "cid": "999999999", "name": "ccc", "sid": 1 })
                .then(function(doc) {
                    assert.ok(doc != null);
                }).then(done).catch(done);
        });
        it('add 10 comics as array', function(done) {
            db.addComics(_.fill(Array(10), { "cid": Date.now(), "name": "ccc", "sid": 1 }))
                .then(function(docs) {
                    assert.ok(docs.length === 10, 'comics length will be 10');
                }).then(done).catch(done);
        });
        it('add 10 comics as arguments', function(done) {
            db.addComics(..._.fill(Array(10), { "cid": Date.now(), "name": "ccc", "sid": 1 }))
                .then(function(docs) {
                    assert.ok(docs.length === 10, 'comics length will be 10');
                }).then(done).catch(done);
        });
        it('comics without cid is not permitted', function(done) {
            db.addComics({ "name": "ccc", "sid": 1 })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be inserted');
                }).catch(done);
        });
        it('comics with empty cid is not permitted', function(done) {
            db.addComics({ "cid": " ", "name": "ccc", "sid": 1 })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be inserted');
                }).catch(done);
        });
        it('comics without name is not permitted', function(done) {
            db.addComics({ "cid": Date.now(), "sid": 1 })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be inserted');
                }).catch(done);
        });
        it('comics with empty name is not permitted', function(done) {
            db.addComics({ "cid": Date.now(), "name": " ", "sid": 1 })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be inserted');
                }).catch(done);
        });
        it('update a comics', function(done) {
            db.updateComics("999999999", { "name": "updated" })
                .then(function(doc) {
                    assert.ok(doc != null, 'comics not found');
                    assert.ok(doc.cid === '999999999' && doc.name === 'updated', 'updated values doesn\'t matchs');
                }).then(done).catch(done);
        });
        it('update a comics with empty object', function(done) {
            db.updateComics("999999999", { })
                .then(function(doc) {
                    assert.ok(doc != null, 'comics not found');
                }).then(done).catch(done);
        });
        it('update a comics with empty name is not permitted', function(done) {
            db.updateComics("999999999", { "name": " " })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be updated');
                }).catch(done);
        });
        it('add or update 1 comics (that exists)', function(done) {
            db.addOrUpdateComics("999999999", { "name": "updated_2", "sid": 1 })
                .then(function(doc) {
                    assert.ok(doc != null, 'comics not found');
                    assert.ok(doc.cid === '999999999' && doc.name === 'updated_2', 'updated values doesn\'t matchs');
                }).then(done).catch(done);
        });
        it('add or update 1 comics (that not exists)', function(done) {
            db.addOrUpdateComics("999999999_1", { "name": "updated_2", "sid": 1 })
                .then(function(doc) {
                    assert.ok(doc != null, 'comics not found');
                    assert.ok(doc.cid === '999999999_1' && doc.name === 'updated_2', 'updated values doesn\'t matchs');
                }).then(done).catch(done);
        });
        it('update a comics with different cid is not permitted', function(done) {
            db.addOrUpdateComics("999999999", { "cid": "x" })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be updated');
                }).catch(done);
        });
        it('update a comics with an empty cid is not permitted', function(done) {
            db.addOrUpdateComics(" ", { "name": "x" })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be updated');
                }).catch(done);
        });
    });
})();
