import db = require('db');
import url = require('url');
const events = require('events')
const EventEmitter: typeof Class_EventEmitter = events.EventEmitter

declare var setImmediate: any;

class Database extends EventEmitter implements FxOrmDb.DatabaseBase_MySQL {
    conn: FxOrmNS.IDbConnection;
    opts: FxOrmNS.IDBConnectionConfig;
    pool: any;
    
    constructor(conn_opts: string | FxOrmNS.IDBConnectionConfig) {
        super();
        
        if (typeof conn_opts === 'object') {
            this.opts = conn_opts as FxOrmNS.IDBConnectionConfig
            this.opts.username = this.opts.username || this.opts.user
        } else if (typeof conn_opts === 'string') {
            this.opts = url.parse(conn_opts) as any;
        }
    }

    ping(cb?: FxOrmNS.VoidCallback) {
        if (typeof cb === 'function')
            setImmediate(cb);
    }

    connect(cb?: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>): any {
        let err = null as Error
            
        try {
            this.conn = db.openMySQL.call(db.openMySQL, this.opts);
        } catch (e) {
            err = e;
            this.conn = null;
        }

        if (typeof cb === "function") cb(err, this.conn);

        return this.conn;
    }

    execute(sql: string, ...args: any[]) {
        return this.conn.execute(sql, ...args);
    }

    query<T = any>(sql: string, cb?: FxOrmNS.GenericCallback<T>) {
        return this.execute(sql, cb);
    }

    close(cb?: FxOrmNS.VoidCallback) {
        return this.conn.close(cb);
    }

    end(cb?: FxOrmNS.VoidCallback) {
        return this.close(cb);
    }
}

export const createConnection = function (conn_opts: FxOrmNS.IDBConnectionConfig): FxOrmDb.DatabaseBase_MySQL {
    return new Database(conn_opts);
};

export const createPool = function (conn_opts: FxOrmNS.IDBConnectionConfig) {

}