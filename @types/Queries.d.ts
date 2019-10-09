/// <reference types="@fxjs/knex" />

/// <reference path="_common.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="assoc.d.ts" />
/// <reference path="query.d.ts" />

declare namespace FxOrmQueries {
    interface Operators {
        [k: string]: symbol
    }
    // next generation model :start
    class Class_QueryBuilder<T_RETURN = any> {
        readonly notQueryBuilder: boolean

        model: any;
        conditions: any;
        sqlQuery: FxSqlQuery.Class_Query

        getQueryBuilder (): Class_QueryBuilder<T_RETURN>

        find (opts: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>): T_RETURN[]
        count (opts: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['count']>): number
        get (id?: string | number): T_RETURN

        first (): T_RETURN
        last (): T_RETURN
        all (): T_RETURN[]
    }
    // type WhereObject = FxOrmTypeHelpers.Parameters<FXJSKnex.FXJSKnexModule.KnexInstance['where']>
    type WhereObject = any | {
        [k: string]: any,
    }
}