const ORM = require('@fxjs/orm')
const Sync = require('@fxjs/sql-ddl-sync')

const { defs } = require('../_orm')

module.exports = (args) => {
    return `dbs/create`;
}