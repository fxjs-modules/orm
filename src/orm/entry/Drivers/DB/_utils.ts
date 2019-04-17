import FibPool = require('fib-pool');

export function parsePoolConfig (
    input: boolean | FxOrmNS.IConnectionOptions | any
): FxOrmNS.IConnectionPoolOptions {
    if (!input || input === true)
        return {};

    if (typeof input !== 'object')
        return {};

    const {
        maxsize = undefined,
        timeout = undefined,
        retry = undefined
    } = <FxOrmNS.IConnectionPoolOptions>(input || {})

    return {
        maxsize,
        timeout,
        retry
    }
}

export function mountPoolToDb (db: FxOrmDb.DatabaseBase, pool_input?: FxOrmNS.IConnectionOptions['pool']) {
    db.pool = FibPool<FxOrmNS.IDbConnection>({
        create: () => {
            return db.connect()
        },
        destroy: (conn: FxOrmNS.IDbConnection) => {
            return conn.close()
        },
        ...parsePoolConfig(db.opts.pool)
    })
}