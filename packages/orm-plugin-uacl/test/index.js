#!/usr/bin/env fibjs

var test = require("test");
test.setup();

const coroutine = require('coroutine')

const ORM = require('@fxjs/orm');
const ORMPluginUACL = require('../');

const ACLTreeAbout = require('../lib/acl-tree');

const ormDefs = {
    basicAllSyncMode: require('./defs/basic-allsync-mode'),
    basicElegantMode: require('./defs/basic-elegant-mode')
}

describe('orm-plugin-uacl', () => {
    require('./units/tree-only')
    require('./intergrations/basic-local');
    require('./intergrations/basic-remote');
})

test.run(console.DEBUG);
