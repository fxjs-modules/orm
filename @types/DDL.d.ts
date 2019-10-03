/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />
/// <reference types="@fxjs/knex" />

/// <reference path="_common.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="assoc.d.ts" />
/// <reference path="query.d.ts" />

declare namespace FxOrmDDL {
    type DriverUidType = string

    interface QueryDataPayload {
        [key: string]: any
    }

    interface QueriedCountDataPayload {
        c: number
    }

    interface DDLDriverOptions {
        // useless now
        pool?: boolean
        debug?: boolean
        
        settings: FxOrmSettings.SettingInstance
    }

    interface DDLDriverConstructor {
        new (config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.DatabaseBase, opts: FxOrmDDL.DDLDriverOptions): DDLDriver
        prototype: DDLDriver
    }

    interface DDLDriver<ConnType = any> {
        createTable: {
            (
                table: string,
                opts?: {
                    beforeQuery?: (kq: FXJSKnex.FXJSKnexModule.KnexInstance['schema']) => typeof kq | void
                }
            ): boolean
        }
        dropTable: {
            (
                table: string,
                opts?: {
                    beforeQuery?: (kq: FXJSKnex.FXJSKnexModule.KnexInstance['schema']) => typeof kq | void
                }
            ): boolean
        }

        [ext_key: string]: any
    }
    /* ============================= DDLDriver API Options :start ============================= */
    // type ChainWhereExistsInfoPayload = {[key: string]: FxOrmQuery.ChainWhereExistsInfo} | FxOrmQuery.ChainWhereExistsInfo[]
    type ChainWhereExistsInfoPayload = FxOrmQuery.ChainWhereExistsInfo[]
    
    interface DDLDriver_FindOptions {
        offset?: number
        limit?: number
        order?: FxOrmQuery.OrderNormalizedResult[]
        merge?: FxOrmQuery.ChainFindMergeInfo[]
        exists?: ChainWhereExistsInfoPayload
    }
    interface DDLDriver_CountOptions {
        merge?: DDLDriver_FindOptions['merge']
        exists?: DDLDriver_FindOptions['exists']
    }
    /* ============================= DDLDriver API Options :end   ============================= */

    /* ============================= typed db :start ============================= */

    interface DDLDriverConstructor_MySQL extends DDLDriverConstructor {
        (this: DDLDriver_MySQL, config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.DatabaseBase<Class_MySQL>, opts: FxOrmDDL.DDLDriverOptions): void
        prototype: DDLDriver_MySQL
    }
    interface DDLDriver_MySQL extends DDLDriver {
        db: FxOrmDb.DatabaseBase<Class_MySQL>

        aggregate_functions: (FxOrmDb.AGGREGATION_METHOD_MYSQL | FxOrmDb.AGGREGATION_METHOD_TUPLE__MYSQL)[]
    }
    interface DDLDriverConstructor_PostgreSQL extends DDLDriverConstructor {
        (this: DDLDriver_PostgreSQL, config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.DatabaseBase_PostgreSQL, opts: FxOrmDDL.DDLDriverOptions): void
        prototype: DDLDriver_PostgreSQL
    }
    interface DDLDriver_PostgreSQL extends DDLDriver {
        db: FxOrmDb.DatabaseBase_PostgreSQL

        aggregate_functions: (FxOrmDb.AGGREGATION_METHOD_POSTGRESQL)[]
    }

    interface DDLDriverConstructor_SQLite extends DDLDriverConstructor {
        (this: DDLDriver_SQLite, config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.DatabaseBase_SQLite, opts: FxOrmDDL.DDLDriverOptions): void
        prototype: DDLDriver_SQLite
    }
    interface DDLDriver_SQLite extends DDLDriver {
        db: FxOrmDb.DatabaseBase_SQLite

        aggregate_functions: (FxOrmDb.AGGREGATION_METHOD_SQLITE)[]
    }

    /* ============================= typed db :end   ============================= */
    // type DefaultSqlDialect = FxOrmSqlDDLSync__Dialect.Dialect<FxSqlQuery.Class_Query>
    type DefaultSqlDialect = FxOrmSqlDDLSync__Dialect.Dialect
}