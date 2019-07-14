/// <reference types="fib-pool" />
/// <reference path="connect.d.ts" />

declare namespace FxOrmDriversNS {
    interface DatabaseBaseConfig extends FxOrmDriversNS.IDBConnectionConfig, Class_UrlObject {
        pool: FxOrmDriversNS.IConnectionPoolOptions
    }

    interface DatabaseBase extends Class_EventEmitter {
        conn: FxOrmDriversNS.IDbConnection;
        readonly uri: string;

        opts: DatabaseBaseConfig;

        execute: {
            (sql: string, ...args: any[]): any[];
        }
        query: {
            <T=any>(query: string, cb?: FxOrmCoreCallbackNS.GenericCallback<T>): T
        }
        close: {
            <T=void>(cb?: FxOrmCoreCallbackNS.GenericCallback<T>): void
        }
        end?: DatabaseBase['close']
        
        connect: {
            (cb?: FxOrmCoreCallbackNS.GenericCallback<FxOrmDriversNS.IDbConnection>): FxOrmDriversNS.IDbConnection
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
            (cb?: FxOrmCoreCallbackNS.VoidCallback): void
        }
    }

    // not supported now.
    interface DatabaseBase_PostgreSQL extends DatabaseBase {
    }

    // common
    type AGGREGATION_METHOD_COMMON =
        "ABS"
        | "ROUND"
        | "AVG"
        | "MIN"
        | "MAX"
        | "SUM"
        | "COUNT"
        | "DISTINCT"

    type AGGREGATION_METHOD_TUPLE__COMMON = [
        /* alias */
        string,
        /* real method in sql */
        AGGREGATION_METHOD_COMPLEX
    ]

    type AGGREGATION_METHOD_SQLITE = AGGREGATION_METHOD_COMMON | "RANDOM"

    type AGGREGATION_METHOD_MYSQL = 
        AGGREGATION_METHOD_COMMON
            | "CEIL"
            | "FLOOR"
            | "LOG"
            | "LOG2"
            | "LOG10"
            | "EXP"
            | "POWER"
            | "ACOS"
            | "ASIN"
            | "ATAN"
            | "COS"
            | "SIN"
            | "TAN"
            | "CONV"
            | "RAND"
            | "RADIANS"
            | "DEGREES"
            | "SUM"
            | "COUNT"
            | "DISTINCT"
    type AGGREGATION_METHOD_TUPLE__MYSQL = [ "RANDOM", "RAND" ]

    type AGGREGATION_METHOD_POSTGRESQL = 
        AGGREGATION_METHOD_COMMON
        | "CEIL"
        | "FLOOR"
        | 'RANDOM'
        | "LOG"
        | "EXP"
        | "POWER"
        | "ACOS"
        | "ASIN"
        | "ATAN"
        | "COS"
        | "SIN"
        | "TAN"
        | "RADIANS"
        | "DEGREES"

    type AGGREGATION_METHOD_COMPLEX = AGGREGATION_METHOD_POSTGRESQL | AGGREGATION_METHOD_SQLITE | AGGREGATION_METHOD_MYSQL
}