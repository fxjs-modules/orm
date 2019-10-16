/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />
/// <reference types="@fxjs/knex" />

/// <reference path="_common.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="Queries.d.ts" />

declare namespace FxOrmDML {
    type BeforeQueryItem = (
        builer: FxOrmTypeHelpers.ReturnType<FXJSKnex.FXJSKnexModule.KnexInstance['queryBuilder']>,
        ctx: { dml: DMLDriver }
    ) => typeof builer | void

    class DMLDriver<CONN_TYPE = any> extends FxOrmDXL.DXLDriver<CONN_TYPE> {
        find: {
            <T=Fibjs.AnyObject[]>(
                collection: string,
                opts?: {
                    where?: Fibjs.AnyObject, // FxOrmQueries.Class_QueryNormalizer['where'],
                    fields?: string[],// FxOrmTypeHelpers.FirstParameter<FXJSKnex.FXJSKnexModule.KnexInstance['select']>,

                    offset?: FxOrmTypeHelpers.FirstParameter<FXJSKnex.FXJSKnexModule.KnexInstance['offset']>
                    limit?: FxOrmTypeHelpers.FirstParameter<FXJSKnex.FXJSKnexModule.KnexInstance['limit']>
                    orderBy?: FxOrmTypeHelpers.Parameters<FXJSKnex.FXJSKnexModule.KnexInstance['orderBy']>

                    beforeQuery?: FxOrmTypeHelpers.ItOrListOfIt<BeforeQueryItem>
                }
            ): T
        }
        count: {
            <T=number>(
                collection: string,
                opts?: {
                    where?: Fibjs.AnyObject, // FxOrmQueries.Class_QueryNormalizer['where'],
                    countParams?: FxOrmTypeHelpers.Parameters<FXJSKnex.FXJSKnexModule.KnexInstance['count']>
                    beforeQuery?: FxOrmTypeHelpers.ItOrListOfIt<BeforeQueryItem>
                    filterQueryResult?: <T2 = any>(result: any) => T2
                }
            ): number
        }
        exists: {
            <T=boolean>(
                collection: string,
                opts?: {
                    where?: Fibjs.AnyObject, // FxOrmQueries.Class_QueryNormalizer['where'],
                    beforeQuery?: FxOrmTypeHelpers.ItOrListOfIt<BeforeQueryItem>
                    filterQueryResult?: <T2 = any>(result: any) => T2
                }
            ): boolean
        }
        insert: {
            (
                collection: string,
                data: FxSqlQuerySql.DataToSet,
                opts?: {
                    idPropertyList?: FxOrmProperty.NormalizedProperty[],
                    beforeQuery?: FxOrmTypeHelpers.ItOrListOfIt<BeforeQueryItem>
                }
            ): Fibjs.AnyObject
        }
        update: {
            <T=any>(
                collection: string,
                changes: FxSqlQuerySql.DataToSet,
                opts?: {
                    where?: Fibjs.AnyObject, // FxOrmQueries.Class_QueryNormalizer['where'],
                    idPropertyList?: FxOrmProperty.NormalizedProperty[],
                    beforeQuery?: FxOrmTypeHelpers.ItOrListOfIt<BeforeQueryItem>
                }
            ): T
        }
        remove: {
            <T=number>(
                collection: string,
                opts?: {
                    where: Fibjs.AnyObject, // FxOrmQueries.Class_QueryNormalizer['where'],
                    beforeQuery?: FxOrmTypeHelpers.ItOrListOfIt<BeforeQueryItem>
                }
            ): T
        }
        clear: {
            <T=any>(
                collection: string
            ): T
        }
    }
}
