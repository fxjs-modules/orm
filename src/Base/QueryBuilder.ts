import util = require('util');
import SqlQuery = require('@fxjs/sql-query');

import * as SYMBOLS from '../Utils/symbols';
import { configurable } from '../Decorators/accessor';
import { buildDescriptor } from '../Decorators/property';
import { arraify } from '../Utils/array';
import { isEmptyPlainObject } from '../Utils/object';
import Normalizer from './Query/Normalizer';
import { dfltWalkWhere, dfltWalkOn } from './Query/onWalkConditions';

import * as QueryGrammers from './Query/QueryGrammar'

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

function isIdsInput (id: any) {
    return Array.isArray(id) || typeof id === 'string' || (typeof id === 'number' && !isNaN(id))
}

class Class_QueryBuilder<TUPLE_ITEM = any> implements FxOrmQueries.Class_QueryBuilder<TUPLE_ITEM> {
    @buildDescriptor({ enumerable: false, configurable: false })
    private _tuples: TUPLE_ITEM[] = [];

    get Op () { return QueryGrammers.Ql.Operators }
    get Opf () { return QueryGrammers.Qlfn.Operators }
    get Ql () { return QueryGrammers.Ql }
    get Qlfn () { return QueryGrammers.Qlfn }

    model: FxOrmModel.Class_Model;

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
        const _opts = {...opts}

        let filteredFileds = arraify(opts.fields).filter(x => typeof x === 'string' && this.model.isPropertyName(x))
        if (!filteredFileds.length)
            filteredFileds = this.model.propertyNames

        _opts.fields = Array.from(new Set(filteredFileds.map(x => this.model.properties[x].mapsTo)))

        if (_opts.where && !isEmptyPlainObject(_opts.where)) {
            const where = <typeof _opts.where>{};
            this.model.normalizePropertiesToData(_opts.where, where);
            _opts.where = where;
        }

        const results = this.model.$dml.find(this.model.collection, _opts)

        this._tuples = results.map((x: TUPLE_ITEM) => {
            const inst = this.model.New(this.model.normalizeDataToProperties(x))
            return inst as any
        });

        return Array.from(this._tuples);
    }

    /**
     * @description get first tuple from remote endpoints
     */
    one (
        opts?: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>
    ): TUPLE_ITEM {
        opts = {...opts, limit: 1}
        return this.find(opts)[0]
    }

    /**
     * @description get first tuple from remote endpoints
     */
    @transformToQCIfModel
    get (
        id?: FxOrmTypeHelpers.FirstParameter<FxOrmQueries.Class_QueryBuilder['get']>,
    ): TUPLE_ITEM {
        let where: Fibjs.AnyObject

        if (isIdsInput(id))
            where = {[this.model.id]: id}
        else if (typeof id === 'object')
            where = id

        const opts = <FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>>{}
        opts.where = {...opts.where, ...where}
        opts.limit = 1

        return this.find(opts)[0];
    }

    /**
     * @description check if one item existed in remote endpoints
     */
    @transformToQCIfModel
    exists (
        id?: string | number | FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['count']>['where']
    ): boolean {
        if (isIdsInput(id))
            return !!this.get(id)
        else if (typeof id === 'object')
            return !!this.one({ where: id })

        throw new Error(`[QueryBuilder::exists] invalid input! its type must be one of string, number, object`)
    }

    /**
     * @description count tuples from remote endpoints
     */
    @transformToQCIfModel
    count (
        opts: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['count']> = {}
    ): number {
        return this.model.$dml.count(
            this.model.collection,
            opts
        )
    }

    /**
     * @description build one query from hql
     */
    @transformToQCIfModel
    queryByHQL <T = any> (hql: string): any {
      const normalizedQ = new Normalizer(hql, {
        models: {
          [this.model.collection]: this.model
        }
      })

      return normalizedQ
    }

    /**
     * @description normalize one input to where
     */
    @transformToQCIfModel
    walkWhere (...args: FxOrmTypeHelpers.Parameters<typeof dfltWalkWhere>) {
      const [input, opts] = args || []
      return dfltWalkWhere(input, {
        source_collection: undefined/* this.model.collection */,
        parent_conjunction_op: undefined,
        ...opts
      })
    }

    /**
     * @description normalize one input to on conditions
     */
    @transformToQCIfModel
    walkOn (...args: FxOrmTypeHelpers.Parameters<typeof dfltWalkOn>) {
      const [input] = args || []
      return dfltWalkOn(input, {
        source_collection: this.model.collection,
        is_joins: true
      })
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
