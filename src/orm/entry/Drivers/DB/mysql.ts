import db = require('db');

declare var setImmediate;

class Database implements FxOrmDb.DatabaseBase_MySQL {
    conn: FxOrmNS.IDbConnection;
    opts: FxOrmNS.IDBConnectionConfig;
    pool: any;
    
    constructor(conn_opts: FxOrmNS.IDBConnectionConfig) {
        this.opts = conn_opts;
    }

    on(ev: string) {}

    ping(cb: FxOrmNS.VoidCallback) {
        setImmediate(cb);
    }

    connect(cb: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>): void {
        const that = this;
        const openMySQL: {
            (connString: string, cb: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>)
            (connString: FxOrmNS.IDBConnectionConfig, cb: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>)
        } = db.openMySQL as any

        openMySQL(this.opts, function (e: Error, conn: FxOrmNS.IDbConnection) {
            if (!e)
                that.conn = conn;
            cb(e, conn);
        });
    }

    execute(sql: string, ...args: any[]) {
        return this.conn.execute(sql, ...args);
    }

    query<T = any>(sql: string, cb: FxOrmNS.GenericCallback<T>) {
        this.conn.execute(sql, cb);
    }

    end(cb?: FxOrmNS.VoidCallback) {
        this.conn.close(cb);
    }
}

export const createConnection = function (conn_opts: FxOrmNS.IDBConnectionConfig): FxOrmDb.DatabaseBase_MySQL {
    return new Database(conn_opts);
};

export const createPool = function (conn_opts: FxOrmNS.IDBConnectionConfig) {

}