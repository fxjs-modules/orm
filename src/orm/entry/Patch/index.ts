import url = require('url')
import util = require('util')

import { patchSync, patchDriver, patchModel, execQuerySync } from './utils';

export = function (connection: FxOrmNS.ConnectFunction) {
    const conn = util.sync(connection) 

    const connectSync = function (opts: FxOrmNS.FibORMIConnectionOptions) {
        if (typeof opts == 'string')
            opts = url.parse(opts, true).toJSON();
        else if (typeof opts == 'object')
            opts = util.clone(opts);

        if (opts.protocol === 'sqlite:' && opts.timezone === undefined)
            opts.timezone = 'UTC';

        var orm: FxOrmNS.FibOrmDB = conn.call(this, opts);

        patchSync(orm, [
            'sync',
            'close',
            'drop',
            'ping'
        ]);

        patchDriver(orm.driver);

        var def = orm.define;
        orm.define = function (name: string, properties: FxOrmNS.Property, opts: FxOrmNS.ModelOptions) {
            if (opts !== undefined) {
                opts = util.clone(opts);
                if (opts.hooks !== undefined)
                    opts.hooks = util.clone(opts.hooks);
            }

            var m: FxOrmNS.Model = def.call(this, name, properties, opts);
            patchModel(m, opts);
            return m;
        }

        orm.begin = function () {
            return this.driver.db.conn.begin();
        };

        orm.commit = function () {
            return this.driver.db.conn.commit();
        };

        orm.rollback = function () {
            return this.driver.db.conn.rollback();
        };

        orm.trans = function (func) {
            return this.driver.db.conn.trans(func);
        };

        orm.driver.execQuerySync = execQuerySync;

        return orm;
    }

    return connectSync
}
