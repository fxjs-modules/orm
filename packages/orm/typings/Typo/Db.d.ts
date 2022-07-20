/// <reference types="@fibjs/types" />
import { FxDbDriverNS, IDbDriver } from "@fxjs/db-driver";
import type { FxOrmCommon } from "./_common";
export declare namespace FxOrmDb {
    interface DatabaseBaseConfig extends /* FxDbDriverNS.DBConnectionConfig,  */ Class_UrlObject {
        pool: FxDbDriverNS.ConnectionPoolOptions;
    }
    interface Database<T extends IDbDriver.IConnTypeEnum = IDbDriver.IConnTypeEnum> extends IDbDriver<T> {
        eventor: Class_EventEmitter;
        query: {
            <T = any>(query: string, cb?: FxOrmCommon.GenericCallback<T>): T;
        };
        connect: {
            (cb?: FxOrmCommon.GenericCallback<T>): void;
            (): T;
        };
    }
    interface SQLDatabase<T extends IDbDriver.ISQLConn = IDbDriver.ISQLConn> extends Database<T> {
    }
    interface DatabaseBase_SQLite extends SQLDatabase<Class_SQLite> {
        readonly use_memory: boolean;
        all: DatabaseBase_SQLite['query'];
        get: DatabaseBase_SQLite['query'];
    }
    interface DatabaseBase_PostgreSQL extends SQLDatabase<IDbDriver.ISQLConn> {
    }
    type AGGREGATION_METHOD_COMMON = "ABS" | "ROUND" | "AVG" | "MIN" | "MAX" | "SUM" | "COUNT" | "DISTINCT";
    type AGGREGATION_METHOD_TUPLE__COMMON = [
        string,
        AGGREGATION_METHOD_COMPLEX
    ];
    type AGGREGATION_METHOD_SQLITE = AGGREGATION_METHOD_COMMON | "RANDOM";
    type AGGREGATION_METHOD_MYSQL = AGGREGATION_METHOD_COMMON | "CEIL" | "FLOOR" | "LOG" | "LOG2" | "LOG10" | "EXP" | "POWER" | "ACOS" | "ASIN" | "ATAN" | "COS" | "SIN" | "TAN" | "CONV" | "RAND" | "RADIANS" | "DEGREES" | "SUM" | "COUNT" | "DISTINCT";
    type AGGREGATION_METHOD_TUPLE__MYSQL = ["RANDOM", "RAND"];
    type AGGREGATION_METHOD_POSTGRESQL = AGGREGATION_METHOD_COMMON | "CEIL" | "FLOOR" | 'RANDOM' | "LOG" | "EXP" | "POWER" | "ACOS" | "ASIN" | "ATAN" | "COS" | "SIN" | "TAN" | "RADIANS" | "DEGREES";
    type AGGREGATION_METHOD_COMPLEX = AGGREGATION_METHOD_POSTGRESQL | AGGREGATION_METHOD_SQLITE | AGGREGATION_METHOD_MYSQL;
}
