import { default as sqlite } from './sqlite'
import { default as mysql } from './mysql'

export function getDDL (
    type: FxDbDriverNS.Driver['type'],
): typeof FxOrmDDL.DDLDialect {
    switch (type) {
        case 'sqlite':
            return sqlite
        case 'mysql':
            return mysql
        default:
            throw new Error(`[getDDL] unsupported type: ${type}`)
    }
}