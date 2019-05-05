import * as mysql from './mysql'

const postgresql: any = require('./postgresql')

import * as sqlite from './sqlite'

export = {
    mysql: mysql as FxOrmSqlDDLSync__Dialect.Dialect,
    postgresql: postgresql as FxOrmSqlDDLSync__Dialect.Dialect,
    sqlite: sqlite as FxOrmSqlDDLSync__Dialect.Dialect,
    mssql: null as FxOrmSqlDDLSync__Dialect.Dialect,
}