import coroutine = require('coroutine')
import ORM = require('@fxjs/orm')

ORM.settings.set('connection.pool', true);

const MEMORY_SQLITE_STR = ':memory:'

const Plugin: FxOrmPluginSearchlite = function (orm, opts) {
    opts = opts || {};
    const { sqlite_connection = `sqlite:${MEMORY_SQLITE_STR}` } = opts || {}

    const sorm = ORM.connectSync(sqlite_connection)

    return {
        beforeDefine (name, props, m_opts) {

        },
        define (model) {
            model.afterSave(function () {
                
            })
        }
    }
};

export = Plugin