/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />
/// <reference types="@fxjs/knex" />

/// <reference path="_common.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="assoc.d.ts" />
/// <reference path="query.d.ts" />

declare namespace FxOrmDML {
    interface DMLDriver<ConnType = any> {
        customTypes: {[key: string]: FxOrmProperty.CustomPropertyType}

        find: {
            <T=Fibjs.AnyObject[]>(
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
}