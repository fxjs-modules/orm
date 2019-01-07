/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />

/// <reference path="connect.d.ts" />

declare namespace FxOrmDMLDriver {
    type DriverUidType = string

    interface QueryDataPayload {
        [key: string]: any
    }

    interface QueriedCountDataPayload {
        c: number
    }

    interface DMLDriverOptions {
        // useless now
        pool?: boolean
        debug?: boolean
        
        settings: FxOrmSettings.SettingInstance
    }

    interface DMLDriverConstructor {
        (this: DMLDriver, config: FxOrmNS.IDBConnectionConfig, connection: FxOrmDb.DatabaseBase, opts: DMLDriverOptions): void
        prototype: DMLDriver
    }

    type AggregationFuncTuple = [string, string]
    interface DMLDriver extends FxOrmSqlDDLSync__Driver.Driver {
        dialect: FxSqlQueryDialect.DialectType
        config: FxOrmNS.IDBConnectionConfig
        opts: DMLDriverOptions
        customTypes: {[key: string]: FxOrmProperty.CustomPropertyType}

        /* shared :start */
        sync: {
            <T>(opts: FxOrmDMLShared.SyncOptions, cb: FxOrmNS.GenericCallback<T>): DMLDriver            
        }
        drop: {
            <T>(opts: FxOrmDMLShared.DropOptions, cb: FxOrmNS.GenericCallback<T>): DMLDriver            
        }
        /* shared :end */

        connect: {
            (cb?: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>)
        }
        reconnect: {
            (cb: null | FxOrmNS.VoidCallback, connection: null | FxOrmDb.DatabaseBase_MySQL)
        }
        ping: {
            (cb?: FxOrmNS.VoidCallback): void
        }
        on: {
            <T>(ev: string, cb: FxOrmNS.GenericCallback<T>): void
        }
        close: {
            (cb?: FxOrmNS.VoidCallback): void
        }
        getQuery: {
            (): FxSqlQuery.Class_Query
        }
        /**
         * @description
         *  aggregate_functions could be string tuple such as
         * 
         *  [`RANDOM`, `RAND`] ---> AggregationFuncTuple
         */
        aggregate_functions: (string|AggregationFuncTuple)[]
        execSimpleQuery: {
            <T=any>(query: string, cb: FxOrmNS.GenericCallback<T>)
        }
        find: {
            <T=FxOrmDMLDriver.QueryDataPayload[]>(
                fields: FxOrmModel.ModelFieldItem[],
                table: string,
                conditions: FxSqlQuerySubQuery.SubQueryConditions,
                opts: DMLDriver_FindOptions,
                cb: FxOrmNS.GenericCallback<T>
            ): void
        }
        count: {
            /**
             * mysql: {c: number}
             * sqlite: {c: number}
             */
            <T=QueriedCountDataPayload[]>(
                table: string,
                conditions: FxSqlQuerySubQuery.SubQueryConditions,
                opts: DMLDriver_CountOptions,
                cb: FxOrmNS.GenericCallback<T>
            )
        }
        insert: {
            (
                table: string,
                data: FxSqlQuerySql.DataToSet,
                keyProperties: FxOrmProperty.NormalizedProperty[],
                cb: FxOrmNS.GenericCallback<FxOrmQuery.InsertResult>
            )
        }
        update: {
            <T=any>(
                table: string,
                changes: FxSqlQuerySql.DataToSet,
                conditions: FxSqlQuerySubQuery.SubQueryConditions,
                cb: FxOrmNS.GenericCallback<T>
            )
        }
        remove: {
            <T=any>(
                table: string,
                conditions: FxSqlQuerySubQuery.SubQueryConditions,
                cb: FxOrmNS.GenericCallback<T>
            )
        }
        clear: {
            <T=any>(
                table: string,
                cb: FxOrmNS.GenericCallback<T>
            )
        }
        poolQuery: {
            <T=any>(
                query: string,
                cb: FxOrmNS.GenericCallback<T>
            )
        }
        valueToProperty: {
            (value: any, property: FxOrmProperty.NormalizedProperty): any
        }
        propertyToValue: {
            (value: any, property: FxOrmProperty.NormalizedProperty): any
        }
        readonly isSql: boolean

        [ext_key: string]: any
    }
    /* ============================= DMLDriver API Options :start ============================= */
    interface DMLDriver_FindOptions {
        offset?: number
        limit?: number
        order?: string
        merge?: FxOrmQuery.ChainFindMergeInfo
        exists?: FxOrmQuery.ChainWhereExistsInfo
    }
    interface DMLDriver_CountOptions {
        merge?: FxOrmQuery.ChainFindMergeInfo
        exists?: FxOrmQuery.ChainWhereExistsInfo
    }
    /* ============================= DMLDriver API Options :end   ============================= */

    /* ============================= typed db :start ============================= */

    interface DMLDriverConstructor_MySQL extends DMLDriverConstructor {
        (this: DMLDriver_MySQL, config: FxOrmNS.IDBConnectionConfig, connection: FxOrmDb.DatabaseBase_MySQL, opts: DMLDriverOptions): void
        prototype: DMLDriver_MySQL
    }
    interface DMLDriver_MySQL extends DMLDriver {
        db: FxOrmDb.DatabaseBase_MySQL
    }

    interface DMLDriverConstructor_SQLite extends DMLDriverConstructor {
        (this: DMLDriver_SQLite, config: FxOrmNS.IDBConnectionConfig, connection: FxOrmDb.DatabaseBase_SQLite, opts: DMLDriverOptions): void
        prototype: DMLDriver_SQLite
    }
    interface DMLDriver_SQLite extends DMLDriver {
        db: FxOrmDb.DatabaseBase_SQLite
    }

    /* ============================= typed db :end   ============================= */

    /* Connection About Patch :start */
    interface DbInstanceInOrmConnDriver {
        conn: FxOrmNS.IDbConnection
    }
    export interface OrigOrmExecQueryOpts {
        [key: string]: any;
    }
    /* Connection About Patch :end */
}

declare namespace FxOrmDMLShared {
    interface SyncOptions {
        extension: boolean
        id
        table
        properties
        allProperties
        indexes
        customTypes
        one_associations
        many_associations
        extend_associations
    }

    interface DropOptions {
        table
        properties
        one_associations
        many_associations
    }
}