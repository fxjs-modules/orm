module.exports;

exports.info = require('./info');
exports.orm = require('./orm');
exports.connect = require('./connect').connect;

exports.addPerson = require('./connect').addPerson;