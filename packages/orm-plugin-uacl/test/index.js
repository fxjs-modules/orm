#!/usr/bin/env fibjs

var test = require("test");
test.setup();

const ORM = require('@fxjs/orm');
const ORMPluginUACL = require('../');

describe('orm-plugin-uacl', () => {
    it('settings:connection.pool', () => {
        assert.ok(ORM.settings.get('uacl.enabled') === true);
    });


    it('orm.$grant', () => {
        const trigged = {
            beforeSyncModel: false,
            afterSyncModel: false,
            afterLoad: false
        }

        const orm = ORM.connectSync('sqlite:plugin-uacl.db')
        orm.settings.set('connection.pool', true)
        
        orm.use(ORMPluginUACL, {
            definitions: [
                (orm) => {
                    assert.ok(orm.settings.get('connection.pool') === true);
                }
            ],
            timeout: 2
        })

        assert.ok(trigged.afterLoad === true)
    });
})

test.run(console.DEBUG);
