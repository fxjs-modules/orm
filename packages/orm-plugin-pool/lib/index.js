const coroutine = require("coroutine");
const Pool = require("fib-pool");
const ORM = require("@fxjs/orm");
ORM.settings.set('connection.pool', true);
const getPool = (options) => {
    options = options || { connection: '' };
    const { connection = '', definitions = [], hooks = {}, } = options || {};
    let synchronized = false;
    const sync_lock = new coroutine.Lock();
    return Pool({
        create: () => {
            const orm = ORM.connectSync(connection);
            ;
            (() => {
                definitions.forEach(def => def(orm));
                ORM.Helpers.hookWait(undefined, hooks.beforeSyncModel, () => void 0);
                if (!synchronized) {
                    sync_lock.acquire();
                    orm.syncSync();
                    synchronized = true;
                    sync_lock.release();
                }
                ORM.Helpers.hookWait(undefined, hooks.afterSyncModel, () => void 0);
            })();
            return orm;
        },
        destroy: (orm) => {
            orm.closeSync();
        },
        maxsize: options.maxsize,
        timeout: options.timeout,
        retry: options.retry,
    });
};
const Plugin = function (orm, opts) {
    opts = opts || {};
    orm.$pool = getPool({
        connection: orm.driver.config,
        definitions: opts.definitions || [],
        hooks: undefined,
        maxsize: opts.maxsize,
        timeout: opts.timeout,
        retry: opts.retry
    });
    const { useConnectionPool = true } = opts || {};
    if (!useConnectionPool)
        orm.settings.set('connection.pool', false);
    return {
        define(model) {
            if (!useConnectionPool)
                model.settings.set('connection.pool', false);
        }
    };
};
ORM.getPool = getPool;
module.exports = Plugin;
