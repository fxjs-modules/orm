/// <reference types="fib-pool" />

declare namespace FxOrmDb {
    interface DatabaseBaseConfig extends FxOrmNS.IDBConnectionConfig, Class_UrlObject {
        pool: FxOrmNS.IConnectionPoolOptions
    }

    interface DatabaseBase extends Class_EventEmitter {
        conn: FxOrmNS.IDbConnection;
        readonly uri: string;

        opts: DatabaseBaseConfig;

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
            (cb?: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>): FxOrmNS.IDbConnection
        }
        pool: FibPoolNS.FibPoolFunction<DatabaseBase['conn']>
    }

    interface DatabaseBase_SQLite extends DatabaseBase {
        readonly use_memory: boolean
        
        all: DatabaseBase_SQLite['query']
        get: DatabaseBase_SQLite['query']
    }

    interface DatabaseBase_MySQL extends DatabaseBase {
        ping: {
            (cb?: FxOrmNS.VoidCallback): void
        }
    }

    // not supported now.
    interface DatabaseBase_PostgreSQL extends DatabaseBase {
    }
}