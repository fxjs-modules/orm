import util = require('util');
import SqlQuery = require('@fxjs/sql-query');

import * as SYMBOLS from '../Utils/symbols';
import { configurable } from '../Decorators/accessor';
import { Operators } from './Query/Operator';
import { arraify } from '../Utils/array';

function transformToQCIfModel (
    target: Class_QueryBuilder,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<Function>
) {
    let method = descriptor.value;

    descriptor.value = function () {
        // in-model
        if (this.notQueryBuilder) {
            const qc = new Class_QueryBuilder()
            qc.model = this;

            return qc[propertyName].apply(qc, arguments)
        }

        // just in Class_QueryBuilder
        switch (this.model.dbdriver.type) {
            case 'mysql':
            case 'mssql':
            case 'sqlite':
                this.sqlQuery = new SqlQuery.Query({
                    dialect: this.model.dbdriver.type,
                });
                break
        }

        return method.apply(this, arguments);
    }
}

function filterWhereToKnexActions (
    opts: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>
) {
    if (!opts) return
    const { where = null } = opts || {}
    if (!where) return

    const flattenedWhere: {[k: string]: Exclude<any, symbol>} = {};

    // if (where[Operators.or])

    const bQList = (opts.beforeQuery ? arraify(opts.beforeQuery) : []).filter(x => typeof x === 'function')

    opts.beforeQuery = bQList
    Object.keys(where).forEach((fieldName: string) => {
        if (!util.isObject(where[fieldName])) {
            flattenedWhere[fieldName] = where[fieldName];
            return ;
        }
        // @todo: deal with array-type where[fieldName]

        /**
         * @notice all non-operator symbol-index(string, number) would be ignored
         */
        const fieldOpSyms = Object.getOwnPropertySymbols(where[fieldName])

        // @todo: deal with case fieldName is symbol
        const v = <any>where[fieldName];

        // const oldBeforeQuery = opts.beforeQuery
        bQList.push(function (builder, ctx) {
            // if (typeof oldBeforeQuery === 'function') oldBeforeQuery.apply(null, arguments)

            fieldOpSyms.forEach(symbol => {
                switch (symbol) {
                    case Operators.eq:
                        builder.where(fieldName, '=', v[Operators.eq])
                        break
                    case Operators.ne:
                        // builder.whereNot(fieldName, '<>', v[Operators.ne])
                        builder.whereNot(fieldName, '=', v[Operators.ne])
                        break
                    case Operators.gt:
                        builder.where(fieldName, '>', v[Operators.gt])
                        break
                    case Operators.gte:
                        builder.where(fieldName, '>=', v[Operators.gte])
                        break
                    case Operators.lt:
                        builder.where(fieldName, '<', v[Operators.lt])
                        break
                    case Operators.lte:
                        builder.where(fieldName, '<=', v[Operators.lte])
                        break
                    case Operators.is:
                        builder.where(fieldName, v[Operators.is])
                        break
                    case Operators.not:
                        builder.whereNot(fieldName, v[Operators.not])
                        break
                    case Operators.in:
                        builder.whereIn(fieldName, v[Operators.in])
                        break
                    case Operators.notIn:
                        builder.whereNotIn(fieldName, v[Operators.notIn])
                        break
                    case Operators.between:
                        builder.whereBetween(fieldName, v[Operators.between])
                        break
                    case Operators.notBetween:
                        builder.whereNotBetween(fieldName, v[Operators.notBetween])
                        break
                    case Operators.like:
                        builder.where(fieldName, 'like', v[Operators.like])
                        break
                    case Operators.startsWith:
                        builder.where(fieldName, 'like', `${v[Operators.like]}%`)
                        break
                    case Operators.endsWith:
                        builder.where(fieldName, 'like', `%${v[Operators.like]}`)
                        break
                    case Operators.substring:
                        builder.where(fieldName, 'like', `%${v[Operators.like]}%`)
                        break
                    case Operators.notLike:
                        builder.whereNot(fieldName, 'like', v[Operators.notLike])
                        break
                }
            });
        })
    });

    opts.where = flattenedWhere
}

class Class_QueryBuilder<TUPLE_ITEM = any> implements FxOrmQueries.Class_QueryBuilder<TUPLE_ITEM> {
    private _tuples: TUPLE_ITEM[] = [];

    model: any;

    conditions: any;
    sqlQuery: FxSqlQuery.Class_Query

    [k: string]: any;

    @configurable(false)
    get _symbol () { return SYMBOLS.QueryBuilder };
    get notQueryBuilder () { return this.constructor !== Class_QueryBuilder };

    /**
     * @description find tuples from remote endpoints
     */
    @transformToQCIfModel
    getQueryBuilder () {
        return this
    }

    /**
     * @description find tuples from remote endpoints
     */
    @transformToQCIfModel
    find (
        opts: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']> = {}
    ): TUPLE_ITEM[] {
        filterWhereToKnexActions(opts)
        
        const results = this.model.$dml.find(this.model.collection, opts)

        this._tuples = results.map((x: TUPLE_ITEM) => {
            const inst = this.model.New(this.model.normalizeDataToProperties(x))
            inst.$isPersisted = true
            return inst
        });

        return Array.from(this._tuples);
    }

    /**
     * @description get first tuple from remote endpoints
     */
    @transformToQCIfModel
    get (
        id?: string | number | FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>['where'],
        opts?: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>
    ): TUPLE_ITEM {
        let where: Fibjs.AnyObject
        
        if (typeof id !== 'object' || Array.isArray(id))
            where = {[this.model.id]: id}
        else if (id !== undefined)
            where = id

        opts.where = {...opts.where, ...where}

        return this.find(opts)[0];
    }

    /**
     * @description check if one item existed in remote endpoints
     */
    @transformToQCIfModel
    exists (
        id?: string | number | FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['count']>['where']
    ): boolean {
        return !!this.get(id);
    }

    /**
     * @description get first tuple from remote endpoints
     */
    @transformToQCIfModel
    count (
        opts: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['count']> = {}
    ): number {
        filterWhereToKnexActions(opts)

        return this.model.$dml.count(
            this.model.collection,
            opts
        )
    }

    first (): TUPLE_ITEM {
        return util.first(this._tuples);
    }

    last (): TUPLE_ITEM {
        return util.last(this._tuples);
    }

    all (): TUPLE_ITEM[] {
        return Array.from(this._tuples);
    }
}

export default Class_QueryBuilder