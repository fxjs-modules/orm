var helper = require('../support/spec_helper');
var common = require('../common');
var ORM = require('../../');

describe("Model.sync", function () {
    var db = null;

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.closeSync();
    });

    // SQLite scopes index names to a database and NOT a table, so
    // index name collisions were possible. This tests the workaround.
    it("should work with multiple same-named indexes", function () {
        var A, B, C;

        A = db.define('a', {
            name: String
        });
        B = db.define('b', {
            name: String
        });
        C = db.define('c', {
            name: String
        });

        A.hasMany('bees', B, {}, {
            reverse: 'eighs'
        });
        A.hasMany('cees', C, {}, {
            reverse: 'eighs'
        });

        helper.dropSync([A, B, C]);
    });

    if (common.dbType() !== 'sqlite') {
        it("support property comment", function () {
            var A, B, C;
    
            A = db.define('a', {
                name: {
                    type: 'text',
                    comment: 'field name.a'
                },
            });
            B = db.define('b', {
                name: {
                    type: 'text',
                    comment: 'field name.b'
                },
            });
            C = db.define('c', {
                name: {
                    type: 'text',
                    comment: 'field name.c'
                },
            });
    
            A.hasMany('bees', B, {}, {
                reverse: 'eighs'
            });
            A.hasMany('cees', C, {}, {
                reverse: 'eighs'
            });
            helper.dropSync([A, B, C]);
    
            var dbProperties = db.driver.ddlSync.getCollectionPropertiesSync(db.driver.sqlDriver, 'a');
            assert.equal(dbProperties.name.comment, 'field name.a')
    
            var dbProperties = db.driver.ddlSync.getCollectionPropertiesSync(db.driver.sqlDriver, 'b');
            assert.equal(dbProperties.name.comment, 'field name.b')
    
            var dbProperties = db.driver.ddlSync.getCollectionPropertiesSync(db.driver.sqlDriver, 'c');
            assert.equal(dbProperties.name.comment, 'field name.c')
        });
    }
});