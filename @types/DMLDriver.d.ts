/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />

/// <reference path="_common.d.ts" />
/// <reference path="connect.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="assoc.d.ts" />
/// <reference path="query.d.ts" />

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
        new (config: FxOrmNS.IDBConnectionConfig, connection: FxOrmDb.DatabaseBase, opts: FxOrmDMLDriver.DMLDriverOptions): DMLDriver
        prototype: DMLDriver
    }


    type AggregationFuncTuple = [string, string]
    interface DMLDriver extends DefaultSqlDriver {
        db: FxOrmDb.DatabaseBase
        dialect: FxSqlQueryDialect.DialectType
        config: FxOrmNS.IDBConnectionConfig
        opts: DMLDriverOptions
        customTypes: {[key: string]: FxOrmProperty.CustomPropertyType}

        /* shared :start */
        sync: {
            <T>(opts: FxOrmDMLShared.SyncOptions, cb?: FxOrmNS.GenericCallback<FxOrmSqlDDLSync.SyncResult>): DMLDriver            
        }
        drop: {
            <T>(opts: FxOrmDMLShared.DropOptions, cb?: FxOrmNS.GenericCallback<void>): DMLDriver            
        }
        /* shared :end */

        connect: {
            (cb?: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>): void
        }
        reconnect: {
            (cb: null | FxOrmNS.VoidCallback, connection: null | FxOrmDb.DatabaseBase): void
        }
        ping: {
            (cb?: FxOrmNS.VoidCallback): void
        }
        on: {
            <T>(ev: string, cb?: FxOrmNS.GenericCallback<T>): void
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
            <T=any>(query: string, cb?: FxOrmNS.GenericCallback<T>): void
        }
        /**
         * @description do eager-query
         */
        eagerQuery: {
            <T = any>(
                association: FxOrmAssociation.InstanceAssociationItem,
                opts: FxOrmQuery.ChainFindOptions,
                keys: string[],
                cb?: FibOrmNS.GenericCallback<T>
            ): void
        }

        find: {
            <T=FxOrmDMLDriver.QueryDataPayload[]>(
                fields: FxSqlQueryColumns.SelectInputArgType[],
                table: string,
                conditions: FxSqlQuerySubQuery.SubQueryConditions,
                opts: DMLDriver_FindOptions,
                cb?: FxOrmNS.GenericCallback<T>
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
                cb?: FxOrmNS.GenericCallback<T>
            ): void
        }
        insert: {
            (
                table: string,
                data: FxSqlQuerySql.DataToSet,
                keyProperties: FxOrmProperty.NormalizedProperty[],
                cb?: FxOrmNS.GenericCallback<FxOrmQuery.InsertResult>
            ): void
        }
        update: {
            <T=any>(
                table: string,
                changes: FxSqlQuerySql.DataToSet,
                conditions: FxSqlQuerySubQuery.SubQueryConditions,
                cb?: FxOrmNS.GenericCallback<T>
            ): void
        }
        remove: {
            <T=any>(
                table: string,
                conditions: FxSqlQuerySubQuery.SubQueryConditions,
                cb?: FxOrmNS.GenericCallback<T>
            ): void
        }
        clear: {
            <T=any>(
                table: string,
                cb?: FxOrmNS.GenericCallback<T>
            ): void
        }
        poolQuery: {
            <T=any>(
                query: string,
                cb?: FxOrmNS.GenericCallback<T>
            ): void
        }
        valueToProperty: {
            (value: any, property: FxOrmProperty.NormalizedProperty): any
        }
        propertyToValue: {
            (value: any, property: FxOrmProperty.NormalizedProperty): any
        }
        readonly isSql: boolean

        /* patched :start */
        // uniq id
        uid: string
        hasMany?: {
            (Model: FxOrmModel.Model, association: FxOrmAssociation.InstanceAssociationItem): any
        }
        
        execQuerySync: (query: string, opt: FxOrmDMLDriver.OrigOrmExecQueryOpts) => any
        /* patched :end */

        [ext_key: string]: any
    }
    /* ============================= DMLDriver API Options :start ============================= */
    // type ChainWhereExistsInfoPayload = {[key: string]: FxOrmQuery.ChainWhereExistsInfo} | FxOrmQuery.ChainWhereExistsInfo[]
    type ChainWhereExistsInfoPayload = FxOrmQuery.ChainWhereExistsInfo[]
    
    interface DMLDriver_FindOptions {
        offset?: number
        limit?: number
        order?: FxOrmQuery.OrderNormalizedResult[]
        merge?: FxOrmQuery.ChainFindMergeInfo[]
        exists?: ChainWhereExistsInfoPayload
    }
    interface DMLDriver_CountOptions {
        merge?: DMLDriver_FindOptions['merge']
        exists?: DMLDriver_FindOptions['exists']
    }
    /* ============================= DMLDriver API Options :end   ============================= */

    /* ============================= typed db :start ============================= */

    interface DMLDriverConstructor_MySQL extends DMLDriverConstructor {
        (this: DMLDriver_MySQL, config: FxOrmNS.IDBConnectionConfig, connection: FxOrmDb.DatabaseBase_MySQL, opts: FxOrmDMLDriver.DMLDriverOptions): void
        prototype: DMLDriver_MySQL
    }
    interface DMLDriver_MySQL extends DMLDriver {
        db: FxOrmDb.DatabaseBase_MySQL
    }
    interface DMLDriverConstructor_PostgreSQL extends DMLDriverConstructor {
        (this: DMLDriver_PostgreSQL, config: FxOrmNS.IDBConnectionConfig, connection: FxOrmDb.DatabaseBase_PostgreSQL, opts: FxOrmDMLDriver.DMLDriverOptions): void
        prototype: DMLDriver_PostgreSQL
    }
    interface DMLDriver_PostgreSQL extends DMLDriver {
        db: FxOrmDb.DatabaseBase_PostgreSQL
    }

    interface DMLDriverConstructor_SQLite extends DMLDriverConstructor {
        (this: DMLDriver_SQLite, config: FxOrmNS.IDBConnectionConfig, connection: FxOrmDb.DatabaseBase_SQLite, opts: FxOrmDMLDriver.DMLDriverOptions): void
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

    type DefaultSqlDriver = FxOrmSqlDDLSync__Driver.Driver<FxSqlQuery.Class_Query>
    type DefaultSqlDialect = FxOrmSqlDDLSync__Dialect.Dialect<FxSqlQuery.Class_Query>
}

declare namespace FxOrmDMLShared {
    interface SyncOptions {
        id: string[]
        extension: boolean
        table: string
        properties: FxOrmProperty.NormalizedPropertyHash
        allProperties: FxOrmProperty.NormalizedPropertyHash
        indexes: string[]
        customTypes: {
            [key: string]: FxOrmProperty.CustomPropertyType;
        }
        one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[]
        many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[]
        extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[]
    }

    interface DropOptions {
        table: string
        properties: FxOrmProperty.NormalizedPropertyHash
        one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[]
        many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[]
    }
}