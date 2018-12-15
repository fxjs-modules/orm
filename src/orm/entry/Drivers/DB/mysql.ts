import db = require('db');

declare var setImmediate;

class Database implements FxOrmDb.DatabaseBase {
    conn: FxOrmNS.ConnInstanceInOrmConnDriverDB;
    opts: FxOrmNS.OrmConnectionOpts;
    
    constructor(connOpts) {
        this.opts = connOpts;
    }

    on(ev) {}

    ping(cb: Function) {
        setImmediate(cb);
    }

    connect(cb: Function): void {
        const that = this;
        const openMySQL: Function = db.openMySQL

        openMySQL(this.opts, function (e: Error, conn: FxOrmNS.ConnInstanceInOrmConnDriverDB) {
            if (!e)
                that.conn = conn;
            cb(e);
        });
    }

    query(sql: string, cb: Function) {
        this.conn.execute(sql, cb);
    }

    execute(sql: string) {
        return this.conn.execute(sql);
    }

    end(cb: Function) {
        (this.conn as any).close(cb);
    }
}

export const createConnection = function (connOpts: FxOrmNS.OrmConnectionOpts) {
    return new Database(connOpts);
};
