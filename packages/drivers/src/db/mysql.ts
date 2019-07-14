import db = require('db');
import url = require('url');
import { mountPoolToDb } from './_utils';
import * as Utilities from '../../utils';

const events = require('events')
const EventEmitter: typeof Class_EventEmitter = events.EventEmitter

declare var setImmediate: any;

class Database extends EventEmitter implements FxOrmDb.DatabaseBase_MySQL {
    conn: FxOrmNS.IDbConnection;
    opts: FxOrmDb.DatabaseBaseConfig;
    get uri () {
        return url.format(this.opts.toJSON());
    }

    pool: FibPoolNS.FibPoolFunction<FxOrmDb.DatabaseBase_MySQL['conn']>
    
    constructor(conn_opts: string | FxOrmDb.DatabaseBaseConfig) {
        super();
        
        if (typeof conn_opts === 'object') {
            this.opts = conn_opts
            this.opts.username = this.opts.username || this.opts.user
        } else if (typeof conn_opts === 'string') {
            this.opts = url.parse(conn_opts, false, true) as any;
        }

        mountPoolToDb(this);
    }

    ping(cb?: FxOrmNS.VoidCallback) {
        if (typeof cb === 'function')
            setImmediate(cb);
    }

    connect(cb?: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>) {
        return this.conn = db.openMySQL.call(db, this.opts, cb)
    }

    execute(sql: string, ...args: any[]) {
        if (this.opts.pool)
            return this.pool(conn => conn.execute(sql, ...args));

        return this.conn.execute(sql, ...args);
    }

    query<T = any>(sql: string, cb?: FxOrmNS.GenericCallback<T>) {
        if (typeof cb !== 'function')
            return this.execute(sql);
            
        return this.execute(sql, cb);
    }

    close(cb?: FxOrmNS.VoidCallback) {
        if (this.pool)
            this.pool.clear();

        if (this.conn)
            this.conn.close();

        Utilities.throwErrOrCallabckErrResult({ error: null }, { callback: cb });
    }

    end(cb?: FxOrmNS.VoidCallback) {
        return this.close(cb);
    }
}

export const createConnection = function (conn_opts: string | FxOrmDb.DatabaseBaseConfig): FxOrmDb.DatabaseBase_MySQL {
    return new Database(conn_opts);
};

export const createPool = function (conn_opts: FxOrmDb.DatabaseBaseConfig) {

}