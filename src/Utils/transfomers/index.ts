import * as mysql from './mysql'
import * as sqlite from './sqlite'
import * as mongodb from './mongodb'

export function getDataStoreTransformer (
    type: FxDbDriverNS.Driver['type'],
): typeof sqlite {
    switch (type) {
        case 'sqlite':
            return sqlite
        default:
            return sqlite
    }
}