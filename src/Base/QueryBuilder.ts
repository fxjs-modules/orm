import util = require('util');

import * as SYMBOLS from '../Utils/symbols';
import { configurable } from '../Decorators/accessor';
import { buildDescriptor } from '../Decorators/property';
import { arraify } from '../Utils/array';
import { isEmptyPlainObject } from '../Utils/object';
import Normalizer from './Query/Normalizer';
import { dfltWalkWhere, dfltWalkOn } from './Query/walkOnHQL';

import * as QueryGrammers from './Query/QueryGrammar'
import { isOperatorFunction } from './Query/Operator';

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

    get join () { return QueryGrammers.Qlfn.Selects.join }
    get leftJoin () { return QueryGrammers.Qlfn.Selects.leftJoin }
    get leftOuterJoin () { return QueryGrammers.Qlfn.Selects.leftOuterJoin }
    get rightJoin () { return QueryGrammers.Qlfn.Selects.rightJoin }
    get rightOuterJoin () { return QueryGrammers.Qlfn.Selects.rightOuterJoin }
    get innerJoin () { return QueryGrammers.Qlfn.Selects.innerJoin }
    get fullOuterJoin () { return QueryGrammers.Qlfn.Selects.fullOuterJoin }
    get refTableCol () { return QueryGrammers.Qlfn.Others.refTableCol }

    model: FxOrmModel.Class_Model;

    conditions: any;

    [k: string]: any;

    @configurable(false)
    get _symbol () { return SYMBOLS.QueryBuilder };
    get notQueryBuilder () { return this.constructor !== Class_QueryBuilder };

    propIdentifier (propname: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['prop']>) {
      const model = <FxOrmModel.Class_Model>(this.notQueryBuilder ? this : this.model)

      return `${model.collection}.${model.prop(propname).mapsTo}`
    }

    associcatedPropIdentifier (assoc_name: string, propname: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['prop']>) {
      const model = <FxOrmModel.Class_Model>(this.notQueryBuilder ? this : this.model)

      const assoc = model.assoc(assoc_name)
      return `${assoc.collection}.${assoc.prop(propname).mapsTo}`
    }

    getModel () {
        return <FxOrmModel.Class_Model>(this.notQueryBuilder ? this : this.model)
    }

    /**
     * @description find tuples from remote endpoints
     */
    @transformToQCIfModel
    getQueryBuilder () { return this }

    @transformToQCIfModel
    find (
        opts: FxOrmTypeHelpers.FirstParameter<FxOrmQueries.Class_QueryBuilder['find']> = {}
    ): TUPLE_ITEM[] {
        const _opts = {...opts}

        let filteredFileds = arraify(opts.fields).filter(x => typeof x === 'string' && this.model.isPropertyName(x))
        if (!filteredFileds.length)
            filteredFileds = this.model.propertyNames

        _opts.fields = Array.from(new Set(filteredFileds.map(x => this.model.properties[x].mapsTo)))

        if (_opts.where && !isEmptyPlainObject(_opts.where)) {
            const where = <typeof _opts.where>{};
            this.model.normalizePropertiesToData(_opts.where, where);
            this.model.normalizeDataSetToWhere(
                util.omit(_opts.where, Object.keys(where)), where
            );
            _opts.where = where;
        }

        /**
         * @notce join could be item or list, but item of it's must be wrappeed by join-about OperatorFunction
         */
        const joins = (_opts.joins ? arraify(_opts.joins) : []).filter(x => isOperatorFunction(x))

        const results = this.model.$dml.find(this.model.collection, _opts)

        if (_opts.return_raw) return results as any

        this._tuples = results.map((x: TUPLE_ITEM) => {
            const inst = this.model.New(x)
            return inst as any
        });

        return Array.from(this._tuples);
    }

    @transformToQCIfModel
    findByRef <T = any>(
        ...args: FxOrmTypeHelpers.Parameters<FxOrmQueries.Class_QueryBuilder['findByRef']>
    ): T[] {
        const [refName, complexWhere, mergeModelFindOptions = {}] = args

        const sourceModel = this.getModel()
        const assocModel = sourceModel.assoc(refName)

        return <T[]>assocModel.associationInfo.onFindByRef({
            mergeModel: sourceModel.assoc(refName),
            complexWhere,
            mergeModelFindOptions
        })
    }

    one (
        opts?: FxOrmTypeHelpers.FirstParameter<FxOrmQueries.Class_QueryBuilder['one']>
    ): TUPLE_ITEM {
        opts = {...opts, limit: 1}
        return this.find(opts)[0]
    }

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

    @transformToQCIfModel
    exists (
        id?: string | number | FxOrmTypeHelpers.FirstParameter<FxOrmQueries.Class_QueryBuilder['count']>['where']
    ): boolean {
        if (isIdsInput(id))
            return !!this.get(id)
        else if (typeof id === 'object')
            return !!this.one({ where: id })

        throw new Error(`[QueryBuilder::exists] invalid input! its type must be one of string, number, object`)
    }

    @transformToQCIfModel
    count (
        opts: FxOrmTypeHelpers.FirstParameter<FxOrmQueries.Class_QueryBuilder['count']> = {}
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
      const [input, opts] = args
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
    walkJoinOn (...args: FxOrmTypeHelpers.Parameters<typeof dfltWalkOn>) {
      const [input] = args
      return dfltWalkOn(input, {
        source_collection: this.model.collection,
        is_top_output: true
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
