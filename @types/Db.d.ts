declare namespace FxOrmDb {
    interface DatabaseBase {
        on: {
            <T=any>(ev: string, func: FxOrmNS.GenericCallback<T>): void
        };
        execute: {
            (sql: string, ...args: any[]): any[];
        }

        end?: {
            (cb: FxOrmNS.VoidCallback): void
        };
        connect?: {
            (cb: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>): void
        }
        // useless now
        pool: any
    }

    interface DatabaseBase_SQLite extends DatabaseBase {
        close: {
            <T=any>(cb?: FxOrmNS.GenericCallback<T>): void
        }
        all: {
            <T=any>(query: string, cb?: FxOrmNS.GenericCallback<T>): void
        }
    }

    interface DatabaseBase_MySQL extends DatabaseBase {
        conn: FxOrmNS.IDbConnection;
        opts: FxOrmNS.IDBConnectionConfig;

        ping: {
            (cb?: FxOrmNS.VoidCallback): void
        }
    }
}