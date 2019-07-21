module.exports;

exports.info = require('./info');
exports.orm = require('./orm');

exports.connect = require('./connect').connect;
exports.addPerson = require('./connect').addPerson;

exports.isDbExisted = require('./db').isDbExisted;
exports.isTableExisted = require('./db').isTableExisted;

exports.getTableNames = require('./db').getTableNames;

exports.getTableColumns = require('./db').getTableColumns;
exports.getTableSemanticColumns = require('./db').getTableSemanticColumns;