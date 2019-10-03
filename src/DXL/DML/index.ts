import { default as sqlite } from './sqlite'

export function getDML (
    type: FxDbDriverNS.Driver['type'],
): typeof sqlite {
    switch (type) {
        case 'sqlite':
            return sqlite
        default:
            return sqlite
    }
}