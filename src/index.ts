import vm = require('vm')
import patch = require('./patch');

import fibTypify = require('fib-typify');
const sbox = fibTypify.generateLoaderbox();
sbox.add({
    util: require('util'),
    events: require('events'),
    url: require('url'),
    tty: require('tty'),
    sqlite3: require('./modules/sqlite3'),
    mysql: require('./modules/mysql'),

    enforce: require('@fibjs/enforce')
});

const orm = sbox.require('./orm/entry/ORM', __dirname);

export = patch(orm);
