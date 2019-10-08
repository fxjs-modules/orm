/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />
/// <reference types="@fxjs/knex" />

/// <reference path="_common.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="assoc.d.ts" />
/// <reference path="query.d.ts" />

declare namespace FxOrmDML {
    class DMLDriver<ConnType = any> extends FxOrmDXL.DXLDriver<ConnType> {
        // uid: string
        find: {
            <T=Fibjs.AnyObject[]>(
                collection: string,
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
                collection: string,
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
        exists: {
            <T=boolean>(
                collection: string,
                opts?: {
                    where?: Fibjs.AnyObject
                }
            ): boolean
        }
        insert: {
            (
                collection: string,
                data: FxSqlQuerySql.DataToSet,
                opts?: {
                    idPropertyList?: FxOrmProperty.NormalizedProperty[],
                    beforeQuery?: (
                        builer: FxOrmTypeHelpers.ReturnType<FXJSKnex.FXJSKnexModule.KnexInstance['queryBuilder']>,
                        ctx: { dml: DMLDriver }
                    ) => typeof builer | void
                }
            ): FxOrmQuery.InsertResult
        }
        update: {
            <T=any>(
                collection: string,
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
                collection: string,
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
                collection: string
            ): T
        }
    }
}