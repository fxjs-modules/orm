import * as mysql from './mysql'
import * as sqlite from './sqlite'
import * as mongodb from './mongodb'

export function getDataStoreTransformer (
    type: FxDbDriverNS.Driver['type'],
): FxOrmDTransformer.Transformer {
    switch (type) {
        case 'sqlite':
            return sqlite
        case 'mysql':
            return mysql
        case 'mongodb':
            return mongodb
        default:
            throw new Error(`[getDataStoreTransformer] unsupported type: ${type}`)
    }
}