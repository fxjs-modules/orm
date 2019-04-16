import db = require('db');
import url = require('url');
const events = require('events')
const EventEmitter: typeof Class_EventEmitter = events.EventEmitter

export class Database extends EventEmitter implements FxOrmDb.DatabaseBase_SQLite {
    conn: FxOrmNS.IDbConnection;
    opts: FxOrmNS.IDBConnectionConfig;

    pool: any
    
    constructor(private sqlite_conn_str: string) {
        super();
        
        this.opts = url.parse(sqlite_conn_str) as any;
    }

    connect(cb?: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>): any {
        let err = null as Error
            
        try {
            this.conn = db.openSQLite(this.sqlite_conn_str);
        } catch (e) {
            err = e;
            this.conn = null;
        }

        if (typeof cb == "function") cb(err, this.conn);

        return this.conn;
    }

    execute(sql: string, ...args: any[]) {
        return this.conn.execute(sql, ...args);
    }

    query<T = any>(sql: string, cb?: FxOrmNS.GenericCallback<T>) {
        return this.conn.execute(sql, cb);
    }

    close<T=void>(cb?: FxOrmNS.GenericCallback<T>) {
        return this.conn.close(cb);
    }

    all<T = any>(sql: string, cb?: FxOrmNS.GenericCallback<T>) {
        return this.query(sql, cb);
    }

    get<T extends any[] =any>(sql: string, cb?: FxOrmNS.GenericCallback<T>) {
        const results = this.all(sql)[0];

        if (typeof cb === 'function')
            return cb(null, results);

        return results;
    }
}
