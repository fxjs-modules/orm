#!/usr/bin/env fibjs

var test = require("test");
test.setup();

const ORM = require('@fxjs/orm');
const ORMPluginPool = require('../');

describe('orm-plugin-pool', () => {
    it('settings:connection.pool', () => {
        assert.ok(ORM.settings.get('connection.pool') === true);
    });

    it('ORM.getPool', () => {
        assert.ok(ORM.getPool)

        const trigged = {
            beforeSyncModel: false,
            afterSyncModel: false,
            afterLoad: false
        }

        const pool = ORM.getPool({
            connection: 'sqlite:plugin-pool.db',
            definitions: [
                (orm) => {
                    assert.ok(orm.settings.get('connection.pool') === true);

                    orm.define('user', {
                        name: String
                    }, {
                        hooks: {
                            afterLoad () { trigged.afterLoad = true }
                        }
                    })
                }
            ],
            hooks: {
                // would be trigged
                beforeSyncModel () { trigged.beforeSyncModel = true },
                // would be trigged
                afterSyncModel () { trigged.afterSyncModel = true }
            },
            timeout: 1
        })

        pool((orm) => {
            new orm.models.user()
            
            assert.ok(trigged.beforeSyncModel === true)
            assert.ok(trigged.afterSyncModel === true)

            assert.ok(orm.models.user.settings.get('connection.pool') === true);
        });

        assert.ok(trigged.afterLoad === true)
    });


    it('orm.$pool', () => {
        const trigged = {
            beforeSyncModel: false,
            afterSyncModel: false,
            afterLoad: false
        }

        const orm = ORM.connectSync('sqlite:plugin-tool2.db')
        
        orm.use(ORMPluginPool, {
            definitions: [
                (orm) => {
                    assert.ok(orm.settings.get('connection.pool') === true);

                    orm.define('user', {
                        name: String
                    }, {
                        hooks: {
                            afterLoad () { trigged.afterLoad = true }
                        }
                    })
                }
            ],
            hooks: {
                // wouldn't be trigged
                beforeSyncModel () { trigged.beforeSyncModel = true },
                // wouldn't be trigged
                afterSyncModel () { trigged.afterSyncModel = true }
            },
            timeout: 2
        })

        orm.$pool((orm) => {
            new orm.models.user()
            
            assert.ok(trigged.beforeSyncModel === false)
            assert.ok(trigged.afterSyncModel === false)

            assert.ok(orm.models.user.settings.get('connection.pool') === true);
        });

        assert.ok(trigged.afterLoad === true)
    });
})

test.run(console.DEBUG);
