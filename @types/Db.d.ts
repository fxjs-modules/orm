declare namespace FxOrmDb {
    interface DatabaseBase extends Class_EventEmitter {
        conn: FxOrmNS.IDbConnection;
        opts: FxOrmNS.IDBConnectionConfig;

        execute: {
            (sql: string, ...args: any[]): any[];
        }
        query: {
            <T=any>(query: string, cb?: FxOrmNS.GenericCallback<T>): T
        }
        close: {
            <T=void>(cb?: FxOrmNS.GenericCallback<T>): void
        }
        end?: DatabaseBase['close']
        
        connect: {
            (cb: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>): void
            (): FxOrmNS.IDbConnection
        }
        // useless now
        pool: any
    }

    interface DatabaseBase_SQLite extends DatabaseBase {
        all: DatabaseBase_SQLite['query']
        get: DatabaseBase_SQLite['query']
    }

    interface DatabaseBase_MySQL extends DatabaseBase {
        // opts: FxOrmNS.IDBConnectionConfig;
        ping: {
            (cb?: FxOrmNS.VoidCallback): void
        }
    }

    // not supported now.
    interface DatabaseBase_PostgreSQL extends DatabaseBase {
    }
}