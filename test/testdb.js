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
            db.addComics({ "cid": "999999999", "name": "ccc", "sid": "1" })
                .then(function(doc) {
                    assert.ok(doc != null);
                }).then(done).catch(done);
        });
        it('add 10 comics as array', function(done) {
            db.addComics(Array(10).fill().map((v, i) => {
                    return { "cid": "999999999_" + i, "name": "ccc", "sid": "1" }
                }))
                .then(function(docs) {
                    assert.ok(docs.length === 10, 'comics length will be 10');
                }).then(done).catch(done);
        });
        it('add 10 comics as arguments', function(done) {
            db.addComics(...Array(10).fill().map((v, i) => {
                    return { "cid": "999999999_" + i, "name": "ccc", "sid": "1" }
                }))
                .then(function(docs) {
                    assert.ok(docs.length === 10, 'comics length will be 10');
                }).then(done).catch(done);
        });
        it('comics without cid is not permitted', function(done) {
            db.addComics({ "name": "ccc", "sid": "1" })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be inserted');
                }).catch(done);
        });
        it('comics with empty cid is not permitted', function(done) {
            db.addComics({ "cid": " ", "name": "ccc", "sid": "1" })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be inserted');
                }).catch(done);
        });
        it('comics without name is not permitted', function(done) {
            db.addComics({ "cid": Date.now(), "sid": "1" })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be inserted');
                }).catch(done);
        });
        it('comics with empty name is not permitted', function(done) {
            db.addComics({ "cid": Date.now(), "name": " ", "sid": "1" })
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
            db.updateComics("999999999", {})
                .then(function(doc) {
                    assert.ok(doc != null, 'comics not found');
                }).then(done).catch(done);
        });
        it('update a comics with data not in schema is not permitted', function(done) {
            db.updateComics("999999999", { "extra": 0 })
                .then(function(doc) {
                    assert.ok(doc != null && doc.extra === undefined, 'extra data is not permitted');
                }).then(done).catch(done);
        });
        it('update a comics with empty name is not permitted', function(done) {
            db.updateComics("999999999", { "name": " " })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be updated');
                }).catch(done);
        });
        it('add or update 1 comics (that exists)', function(done) {
            db.addOrUpdateComics("1", "999999999", { "name": "updated_2", "sid": "1" })
                .then(function(doc) {
                    assert.ok(doc != null, 'comics not found');
                    assert.ok(doc.cid === '999999999' && doc.name === 'updated_2', 'updated values doesn\'t matchs');
                }).then(done).catch(done);
        });
        it('add or update 1 comics (that not exists)', function(done) {
            db.addOrUpdateComics("1", "999999999_10", { "name": "updated_2", "sid": "1" })
                .then(function(doc) {
                    assert.ok(doc != null, 'comics not found');
                    assert.ok(doc.cid === '999999999_10' && doc.name === 'updated_2', 'updated values doesn\'t matchs');
                }).then(done).catch(done);
        });
        it('update a comics with different cid is not permitted', function(done) {
            db.addOrUpdateComics("1", "999999999", { "cid": "x" })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be updated');
                }).catch(done);
        });
        it('update a comics with an empty cid is not permitted', function(done) {
            db.addOrUpdateComics("1", " ", { "name": "x" })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'comcis cannot be updated');
                }).catch(done);
        });
        it('remove a comics', function(done) {
            db.removeComics("999999999")
                .then(function(doc) {
                    assert.ok(doc != null && doc.cid === "999999999");
                }).then(done).catch(done);
        });
        it('remove a comics with sid', function(done) {
            db.removeComics("1", "999999999_10")
                .then(function(doc) {
                    assert.ok(doc != null && doc.cid === "999999999_10");
                }).then(done).catch(done);
        });
        it('remove a comics that not exists', function(done) {
            db.removeComics("xxx")
                .then(function(doc) {
                    assert.ok(doc == null);
                }).then(done).catch(done);
        });
        it('remove all comics by sid', function(done) {
            db.clearComics(1)
                .then(function(r) {
                    assert.ok(r.result.ok === 1 && r.result.n > 0);
                }).then(done).catch(done);
        });
    });

    describe('releases', () => {
        before(function() {
            it('add 1 comics', function(done) {
                db.addComics({ "cid": "999999999", "name": "ccc", "sid": "1" })
                    .then(function(doc) {
                        assert.ok(doc != null);
                    }).then(done).catch(done);
            });
        });

        it('add 1 release', function(done) {
            db.addReleases({ "cid": "999999999", "number": 1, "sid": "1" })
                .then(function(doc) {
                    assert.ok(doc != null);
                }).then(done).catch(done);
        });
        it('add 10 releaes as array', function(done) {
            db.addReleases(Array(10).fill().map((v, i) => {
                    return { "cid": "999999999", "number": i, "sid": "1" }
                }))
                .then(function(docs) {
                    assert.ok(docs.length === 10, 'releases length will be 10');
                }).then(done).catch(done);
        });
        it('add 10 releaes as arguments', function(done) {
            db.addReleases(...Array(10).fill().map((v, i) => {
                    return { "cid": "999999999", "number": i, "sid": "1" }
                }))
                .then(function(docs) {
                    assert.ok(docs.length === 10, 'releases length will be 10');
                }).then(done).catch(done);
        });
        it('release without cid is not permitted', function(done) {
            db.addReleases({ "number": 1, "sid": "1" })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'release cannot be inserted');
                }).catch(done);
        });
        it('release without number is not permitted', function(done) {
            db.addReleases({ "cid": "999999999", "sid": "1" })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'release cannot be inserted');
                }).catch(done);
        });
        it('release with empty cid is not permitted', function(done) {
            db.addReleases({ "cid": " ", "sid": "1" })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'release cannot be inserted');
                }).catch(done);
        });
        it('update a release', function(done) {
            db.updateRelease("1", "999999999", 1, { "date": "2016-01-01" })
                .then(function(doc) {
                    assert.ok(doc != null, 'release not found');
                    assert.ok(doc.cid === '999999999' && doc.date === '2016-01-01', 'updated values doesn\'t matchs');
                }).then(done).catch(done);
        });
        it('update a release with empty object', function(done) {
            db.updateRelease("1", "999999999", 1, {})
                .then(function(doc) {
                    assert.ok(doc != null, 'release not found');
                }).then(done).catch(done);
        });
        it('update a release with data not in schema is not permitted', function(done) {
            db.updateRelease("1", "999999999", 1, { "extra": 0 })
                .then(function(doc) {
                    assert.ok(doc != null && doc.extra === undefined, 'extra data is not permitted');
                }).then(done).catch(done);
        });
        it('add or update 1 release (that exists)', function(done) {
            db.addOrUpdateRelease("1", "999999999", 1, { "date": "2016-01-01", "sid": "1" })
                .then(function(doc) {
                    assert.ok(doc != null, 'release not found');
                    assert.ok(doc.cid === '999999999' && doc.number === 1 && doc.date === '2016-01-01', 'updated values doesn\'t matchs');
                }).then(done).catch(done);
        });
        it('add or update 1 release (that not exists)', function(done) {
            db.addOrUpdateRelease("1", "999999999", 11, { "date": "2016-01-01", "sid": "1" })
                .then(function(doc) {
                    assert.ok(doc != null, 'release not found');
                    assert.ok(doc.cid === '999999999' && doc.number === 11 && doc.date === '2016-01-01', 'updated values doesn\'t matchs');
                }).then(done).catch(done);
        });
        it('update a release with different cid is not permitted', function(done) {
            db.addOrUpdateRelease("1", "999999999", 1, { "cid": "x" })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'release cannot be updated');
                }).catch(done);
        });
        it('update a release with different number is not permitted', function(done) {
            db.addOrUpdateRelease("1", "999999999", 1, { "number": 2 })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'release cannot be updated');
                }).catch(done);
        });
        it('update a release with an empty cid is not permitted', function(done) {
            db.addOrUpdateRelease("1", " ", 1, { "date": "2016-0-01" })
                .catch(() => done()).then(function(doc) {
                    assert.ok(doc == null, 'release cannot be updated');
                }).catch(done);
        });
        it('remove a release', function(done) {
            db.removeRelease("999999999", 1)
                .then(function(doc) {
                    assert.ok(doc != null && doc.cid === "999999999" && doc.number === 1);
                }).then(done).catch(done);
        });
        it('remove a release with sid', function(done) {
            db.removeRelease("1", "999999999", 2)
                .then(function(doc) {
                    assert.ok(doc != null && doc.cid === "999999999" && doc.number === 2);
                }).then(done).catch(done);
        });
        it('remove a release that not exists', function(done) {
            db.removeRelease("999999999", 99)
                .then(function(doc) {
                    assert.ok(doc == null);
                }).then(done).catch(done);
        });

    });
})();
