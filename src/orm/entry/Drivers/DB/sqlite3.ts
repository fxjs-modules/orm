import db = require('db');
import url = require('url');
import { mountPoolToDb } from './_utils';
import * as Utilities from '../../Utilities';

const events = require('events')
const EventEmitter: typeof Class_EventEmitter = events.EventEmitter

function isMemoryMode (href: string) {
    return href === ':memory:'
}

export class Database extends EventEmitter implements FxOrmDb.DatabaseBase_SQLite {
    conn: FxOrmNS.IDbConnection;
    opts: FxOrmDb.DatabaseBaseConfig;
    get uri () {
        if (this.use_memory)
            return this.opts.href;

        return this.opts.href;
    }
    get use_memory () {
        return isMemoryMode(this.opts.href)
    }

    pool: FibPoolNS.FibPoolFunction<FxOrmDb.DatabaseBase_SQLite['conn']>
    
    constructor(conn_opts: string | FxOrmDb.DatabaseBaseConfig) {
        super();
        
        if (typeof conn_opts === 'object') {
            this.opts = conn_opts
            this.opts.username = this.opts.username || this.opts.user
        } else if (typeof conn_opts === 'string') {
            this.opts = url.parse(conn_opts, false, true) as any;
        }
        
        if (!this.use_memory)
            this.opts.protocol = 'sqlite:'

        mountPoolToDb(this);
    }

    connect(cb?: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>): any {
        return this.conn = db.openSQLite.call(db, this.opts);
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

    close<T=void>(cb?: FxOrmNS.GenericCallback<T>) {
        if (this.pool)
            this.pool.clear();

        if (this.conn)
            this.conn.close();

        Utilities.throwErrOrCallabckErrResult({ error: null }, { callback: cb });
    }

    all<T = any>(sql: string, cb?: FxOrmNS.GenericCallback<T>) {
        return this.query(sql, cb);
    }

    get<T = any>(sql: string, cb?: FxOrmNS.GenericCallback<T>) {
        const results = this.all(sql)[0];

        if (typeof cb === 'function')
            return cb(null, results);

        return results;
    }
}
