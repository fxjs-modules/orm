import db = require('db');

export class Database implements FxOrmDb.DatabaseBase {
    conn: FxOrmNS.IDbConnection;
    pool: any
    
    constructor(fname: string) {
        this.conn = db.openSQLite(fname);
    }

    on(ev: string) {}

    all<T=any>(sql: string, cb: FxOrmNS.GenericCallback<T>) {
        this.conn.execute(sql, cb);
    }

    get<T=any>(sql: string, cb: FxOrmNS.GenericCallback<T>) {
        this.all(sql, function (e: Error, r: T) {
            if (e)
                cb(e);
            cb(e, r[0]);
        });
    }

    execute<T=any>(sql: string): T {
        return this.conn.execute(sql);
    }

    close() {
        this.conn.close();
    }
}
