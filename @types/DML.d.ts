/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />
/// <reference types="@fxjs/knex" />

/// <reference path="_common.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="assoc.d.ts" />
/// <reference path="query.d.ts" />

declare namespace FxOrmDML {
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
        new (config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.DatabaseBase, opts: FxOrmDML.DMLDriverOptions): DMLDriver
        prototype: DMLDriver
    }

    interface DMLDriver<ConnType = any> {
        readonly db: FxOrmDb.DatabaseBase<ConnType>
        readonly config: FxOrmDb.DatabaseBase<ConnType>['config']

        customTypes: {[key: string]: FxOrmProperty.CustomPropertyType}

        knex: FXJSKnex.FXJSKnexModule.KnexInstance

        readonly query: FxSqlQuery.Class_Query
        /**
         * @deprecated
         */
        getQuery: {
            (): FxSqlQuery.Class_Query
        }
        
        readonly ddlDialect: FxOrmSqlDDLSync__Dialect.Dialect

        /* shared :start */
        doSync <T = any>(opts?: FxOrmDMLShared.SyncOptions): this
        doDrop <T = any>(opts?: FxOrmDMLShared.DropOptions): this
        /* shared :end */

        connect: {
            (cb: FxOrmNS.GenericCallback<FxDbDriverNS.Driver>): void
            (): FxDbDriverNS.Driver
        }
        reconnect: {
            (cb: FxOrmNS.GenericCallback<FxDbDriverNS.Driver>): void
            (): FxDbDriverNS.Driver
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
        /**
         * @description
         *  aggregate_functions could be string tuple such as
         * 
         *  [`RANDOM`, `RAND`] ---> FxOrmDb.AGGREGATION_METHOD_TUPLE__COMMON
         */
        aggregate_functions: ( (FxOrmDb.AGGREGATION_METHOD_COMPLEX) | FxOrmDb.AGGREGATION_METHOD_TUPLE__COMMON )[]
        execSimpleQuery: {
            <T=any>(query: string, cb?: FxOrmNS.GenericCallback<T>): T
        }
        /**
         * @description do eager-query
         */
        eagerQuery: {
            <T = any>(association: FxOrmAssociation.InstanceAssociationItem, opts: FxOrmQuery.ChainFindOptions, keys: string[], cb?: FibOrmNS.GenericCallback<T>): T
        }

        find: {
            <T=FxOrmDML.QueryDataPayload[]>(
                table: string,
                opts?: {
                    where?: FxOrmTypeHelpers.Parameters<FXJSKnex.FXJSKnexModule.KnexInstance['where']>,
                    fields?: FxOrmTypeHelpers.FirstParameter<FXJSKnex.FXJSKnexModule.KnexInstance['select']>,

                    offset?: FxOrmTypeHelpers.FirstParameter<FXJSKnex.FXJSKnexModule.KnexInstance['offset']>
                    limit?: FxOrmTypeHelpers.FirstParameter<FXJSKnex.FXJSKnexModule.KnexInstance['limit']>
                    orderBy?: FxOrmTypeHelpers.Parameters<FXJSKnex.FXJSKnexModule.KnexInstance['orderBy']>

                    beforeQuery?: (
                        builer: FxOrmTypeHelpers.ReturnType<FXJSKnex.FXJSKnexModule.KnexInstance['queryBuilder']>,
                        ctx: { dml: DMLDriver }
                    ) => typeof builer | void
                }
            ): T
        }
        count: {
            <T=number>(
                table: string,
                opts?: {
                    where?: FxOrmTypeHelpers.Parameters<FXJSKnex.FXJSKnexModule.KnexInstance['where']>,
                    countParams?: FxOrmTypeHelpers.Parameters<FXJSKnex.FXJSKnexModule.KnexInstance['count']>
                    beforeQuery?: (
                        builer: FxOrmTypeHelpers.ReturnType<FXJSKnex.FXJSKnexModule.KnexInstance['queryBuilder']>,
                        ctx: { dml: DMLDriver }
                    ) => typeof builer | void
                    filterQueryResult?: <T2 = any>(result: any) => T2
                }
            ): number
        }
        insert: {
            (
                table: string,
                data: FxSqlQuerySql.DataToSet,
                opts?: {
                    keyPropertyList?: FxOrmProperty.NormalizedProperty[],
                    beforeQuery?: (
                        builer: FxOrmTypeHelpers.ReturnType<FXJSKnex.FXJSKnexModule.KnexInstance['queryBuilder']>,
                        ctx: { dml: DMLDriver }
                    ) => typeof builer | void
                }
            ): FxOrmQuery.InsertResult
        }
        update: {
            <T=any>(
                table: string,
                changes: FxSqlQuerySql.DataToSet,
                opts?: {
                    where?: FxOrmTypeHelpers.Parameters<FXJSKnex.FXJSKnexModule.KnexInstance['where']>,
                    beforeQuery?: (
                        builer: FxOrmTypeHelpers.ReturnType<FXJSKnex.FXJSKnexModule.KnexInstance['queryBuilder']>,
                        ctx: { dml: DMLDriver }
                    ) => typeof builer | void
                }
            ): T
        }
        remove: {
            <T=any>(
                table: string,
                opts?: {
                    where: FxOrmTypeHelpers.Parameters<FXJSKnex.FXJSKnexModule.KnexInstance['where']>,
                    beforeQuery?: (
                        builer: FxOrmTypeHelpers.ReturnType<FXJSKnex.FXJSKnexModule.KnexInstance['queryBuilder']>,
                        ctx: { dml: DMLDriver }
                    ) => typeof builer | void
                }
                // conditions: FxSqlQuerySubQuery.SubQueryConditions
            ): T
        }
        clear: {
            <T=any>(
                table: string
            ): T
        }
        poolQuery: {
            <T=any>(query: string, cb?: FxOrmNS.GenericCallback<T>): T
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
        
        execQuerySync: (query: string, opt: Fibjs.AnyObject) => any
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
        (this: DMLDriver_MySQL, config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.DatabaseBase<Class_MySQL>, opts: FxOrmDML.DMLDriverOptions): void
        prototype: DMLDriver_MySQL
    }
    interface DMLDriver_MySQL extends DMLDriver {
        db: FxOrmDb.DatabaseBase<Class_MySQL>

        aggregate_functions: (FxOrmDb.AGGREGATION_METHOD_MYSQL | FxOrmDb.AGGREGATION_METHOD_TUPLE__MYSQL)[]
    }
    interface DMLDriverConstructor_PostgreSQL extends DMLDriverConstructor {
        (this: DMLDriver_PostgreSQL, config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.DatabaseBase_PostgreSQL, opts: FxOrmDML.DMLDriverOptions): void
        prototype: DMLDriver_PostgreSQL
    }
    interface DMLDriver_PostgreSQL extends DMLDriver {
        db: FxOrmDb.DatabaseBase_PostgreSQL

        aggregate_functions: (FxOrmDb.AGGREGATION_METHOD_POSTGRESQL)[]
    }

    interface DMLDriverConstructor_SQLite extends DMLDriverConstructor {
        (this: DMLDriver_SQLite, config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.DatabaseBase_SQLite, opts: FxOrmDML.DMLDriverOptions): void
        prototype: DMLDriver_SQLite
    }
    interface DMLDriver_SQLite extends DMLDriver {
        db: FxOrmDb.DatabaseBase_SQLite

        aggregate_functions: (FxOrmDb.AGGREGATION_METHOD_SQLITE)[]
    }

    /* ============================= typed db :end   ============================= */
    // type DefaultSqlDialect = FxOrmSqlDDLSync__Dialect.Dialect<FxSqlQuery.Class_Query>
    type DefaultSqlDialect = FxOrmSqlDDLSync__Dialect.Dialect
}