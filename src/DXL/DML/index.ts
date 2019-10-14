import { default as sqlite } from './sqlite'
import { default as mysql } from './mysql'

export function getDML (
    type: FxDbDriverNS.Driver['type'],
): (typeof FxOrmDML.DMLDriver) {
    switch (type) {
        case 'sqlite':
            return sqlite as (typeof FxOrmDML.DMLDriver) as any
        case 'mysql':
            return mysql as (typeof FxOrmDML.DMLDriver) as any
        default:
            throw new Error(`[getDML] unsupported type: ${type}`)
    }
}