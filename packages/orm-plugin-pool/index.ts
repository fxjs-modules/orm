import coroutine = require('coroutine')
import Pool = require('fib-pool')
import ORM = require('@fxjs/orm')

ORM.settings.set('connection.pool', true);

const getPool: FxOrmNS.ExportModule['getPool'] = (options) => {
    options = options || { connection: '' };

    const {
        connection = '',
        definitions = [],
        hooks = {},
    } = options || {};
    
    let synchronized = false;
    const sync_lock = new coroutine.Lock();

    return Pool<FxOrmNS.ORM>({
        create: () => {
            const orm = ORM.connectSync(connection) as FxOrmNS.ORM;

            ;(() => {
                definitions.forEach(def => def(orm));

                ORM.Helpers.hookWait(undefined, hooks.beforeSyncModel, () => void 0)

                if (!synchronized) {
                    sync_lock.acquire();
                    
                    orm.syncSync();
                    
                    synchronized = true;
                    sync_lock.release();
                }

                ORM.Helpers.hookWait(undefined, hooks.afterSyncModel, () => void 0)
            })();

            return orm;
        },
        destroy: (orm: FxOrmNS.ORM) => {
            orm.closeSync()
        },

        maxsize: options.maxsize,
        timeout: options.timeout,
        retry: options.retry,
    });
}

const Plugin: FxOrmPluginPool = function (orm, opts) {
    opts = opts || {};

    orm.$pool = getPool({
        connection: orm.driver.config,
        definitions: opts.definitions || [],
        hooks: undefined,
        
        maxsize: opts.maxsize,
        timeout: opts.timeout,
        retry: opts.retry
    });
    
    const { useConnectionPool = true } = opts || {}
    
    if (!useConnectionPool)
        orm.settings.set('connection.pool', false);

    return {
        define (model) {
            if (!useConnectionPool)
                model.settings.set('connection.pool', false);
        }
    }
};

ORM.getPool = getPool;

export = Plugin