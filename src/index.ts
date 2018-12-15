import fibTypify = require('fib-typify');
const sbox = fibTypify.generateLoaderbox();

const ORM = sbox.require('./orm/entry/ORM', __dirname);

export = ORM;
