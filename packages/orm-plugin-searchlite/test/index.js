#!/usr/bin/env fibjs

var test = require("test");
test.setup();

const ORM = require('@fxjs/orm');
const ORMPluginPool = require('../');

describe('orm-plugin-pool', () => {
    var orm = null;

    function setup() {
        orm = ORM.connectSync('sqlite:test.db?pool=true')
        orm.use(ORMPluginPool);

        orm.define('user', {
            name: String
        }, {
        });

        orm.define('role', {
            name: String
        }, {
        });

        orm.models['user'].hasMany('role', orm.models['role'], {}, {
            hooks: {
                afterAdd ({ associations }) {
                    
                }
            }
        });
    }

    before(() => {
        setup()
    });

    after(() => {
        orm.closeSync()
    });
})

test.run(console.DEBUG);
