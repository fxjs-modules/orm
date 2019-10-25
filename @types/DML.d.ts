/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />
/// <reference types="@fxjs/knex" />

/// <reference path="_common.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="Queries.d.ts" />

declare namespace FxOrmDML {
    type KnexQueryBuilder = FxOrmTypeHelpers.ReturnType<FKnexNS.KnexInstance['queryBuilder']>;

    type BeforeQueryItem = (
        builer: KnexQueryBuilder,
        ctx: { dml: DMLDriver, knex: FKnexNS.KnexInstance }
    ) => typeof builer | void

    class DMLDriver<CONN_TYPE = any> extends FxOrmDXL.DXLDriver<CONN_TYPE> {
        query: {
            <T = any>(
                collection: string,
                opts?: {
                    where?: Fibjs.AnyObject,
                    fields?: string[],// FxOrmTypeHelpers.FirstParameter<FKnexNS.KnexInstance['select']>,

                    offset?: FxOrmTypeHelpers.FirstParameter<FKnexNS.KnexInstance['offset']>
                    limit?: FxOrmTypeHelpers.FirstParameter<FKnexNS.KnexInstance['limit']>
                    orderBy?: FxOrmTypeHelpers.Parameters<FKnexNS.KnexInstance['orderBy']>

                    having?: Fibjs.AnyObject,
                    joins?: FxHQLParser.ParsedResult['joins']

                    beforeQuery?: FxOrmTypeHelpers.ItOrListOfIt<BeforeQueryItem>
                }
            ): T
        }
        find: {
            <T = Fibjs.AnyObject[]>(
                collection: string,
                opts?: {
                    $dml?: FxOrmDML.DMLDriver,
                    where?: Fibjs.AnyObject,
                    joins?: FxOrmQueries.OperatorFunction[],
                    fields?: string[],
                    select?: {
                        [k: string]: string,
                        // FxOrmTypeHelpers.FirstParameter<FKnexNS.KnexInstance['select']>,
                    },

                    offset?: FxOrmTypeHelpers.FirstParameter<FKnexNS.KnexInstance['offset']>
                    limit?: FxOrmTypeHelpers.FirstParameter<FKnexNS.KnexInstance['limit']>
                    orderBy?: FxOrmTypeHelpers.Parameters<FKnexNS.KnexInstance['orderBy']>

                    beforeQuery?: FxOrmTypeHelpers.ItOrListOfIt<BeforeQueryItem>
                    filterQueryResult?: <T2 = any>(result: any) => T2
                }
            ): T
        }
        count: {
            <T = number>(
                collection: string,
                opts?: {
                    joins?: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>['joins'],
                    where?: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>['where'],
                    countParams?: FxOrmTypeHelpers.Parameters<FKnexNS.KnexInstance['count']>
                    beforeQuery?: FxOrmTypeHelpers.ItOrListOfIt<BeforeQueryItem>
                    filterQueryResult?: <T2 = any>(result: any) => T2
                }
            ): number
        }
        exists: {
            <T = boolean>(
                collection: string,
                opts?: {
                    where?: Fibjs.AnyObject,
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
            <T = any>(
                collection: string,
                changes: FxSqlQuerySql.DataToSet,
                opts?: {
                    where?: Fibjs.AnyObject,
                    idPropertyList?: FxOrmProperty.NormalizedProperty[],
                    beforeQuery?: FxOrmTypeHelpers.ItOrListOfIt<BeforeQueryItem>
                }
            ): T
        }
        remove: {
            <T = number>(
                collection: string,
                opts?: {
                    where: Fibjs.AnyObject,
                    beforeQuery?: FxOrmTypeHelpers.ItOrListOfIt<BeforeQueryItem>
                }
            ): T
        }
        clear: {
            <T = any>(
                collection: string
            ): T
        }
    }
}
