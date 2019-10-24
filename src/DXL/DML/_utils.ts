import util = require('util');

import * as QueryGrammers from '../../Base/Query/QueryGrammar';
import { arraify, preDestruct } from '../../Utils/array';
import {
  gnrWalkWhere,
  parseOperatorFunctionAsValue,
  mapConjunctionOpSymbolToText,
  normalizeInInput,
  normalizeWhereInput,
  gnrWalkJoinOn,
} from '../../Base/Query/onWalkConditions';
import { isOperatorFunction } from '../../Base/Query/Operator';
import { mapObjectToTupleList } from '../../Utils/object';
import { normalizeCollectionColumn } from '../../Utils/endpoints';

export function filterKnexBuilderBeforeQuery (
	builder: any,
	beforeQuery: Function | Function[],
	ctx?: any
) {
	if (Array.isArray(beforeQuery)) {
		beforeQuery.forEach(bQ => {
			builder = filterKnexBuilderBeforeQuery(builder, bQ, ctx)
		})

		return builder
	}

	if (typeof beforeQuery === 'function') {
		const kqbuilder = beforeQuery(builder, {...ctx, builder})

		if (kqbuilder)
			builder = kqbuilder
	}

	return builder
}

export function filterResultAfterQuery (
	result: any,
	afterQuery: Function | Function[],
  ctx?: any
): any {
	if (Array.isArray(afterQuery)) {
		return afterQuery.map(aQ => filterResultAfterQuery(result, afterQuery, ctx))
	}

	if (typeof afterQuery === 'function') {
		result = afterQuery(result, ctx)
	}

	return result
}

const filterWhereToKnexActionsInternal = gnrWalkWhere<
  null,
  {
    bQList: FxOrmDML.BeforeQueryItem[]
  }
>({
  onNode: ({ scene, nodeFrame, walk_fn, walk_fn_context, input }) => {
    const dfltReturn = { isReturn: false, result: <any>null }
    const { bQList } = walk_fn_context

    switch (scene) {
      case 'inputAs:conjunctionAsAnd': {
        return dfltReturn
      }
      case 'walkJoinOn:opsymbol:conjunction': {
        const [pres, last] = preDestruct(mapObjectToTupleList((<any>input)[nodeFrame.symbol]))
        const op_name = mapConjunctionOpSymbolToText(nodeFrame.symbol)

        walk_fn(pres, { ...walk_fn_context, parent_conjunction_op: op_name })
        walk_fn(last, { ...walk_fn_context, parent_conjunction_op: op_name })

        return dfltReturn
      }
      case 'walkWhere:opfn:in':
      case 'walkWhere:opfn:between':
      case 'walkWhere:opfn:like':
      case 'walkWhere:opfn:comparator': {
        const cmpr_opfn_result = <FxOrmQueries.OperatorFunctionResult>nodeFrame.cmpr_opfn_result
        const field_name = nodeFrame.field_name

        if (field_name) {
          let fValue = cmpr_opfn_result.value
          if (isOperatorFunction(fValue)) fValue = parseOperatorFunctionAsValue(fValue)
          else
            switch (scene) {
              case 'walkWhere:opfn:in': fValue = normalizeInInput(fValue); break
              case 'walkWhere:opfn:between': fValue = normalizeWhereInput(fValue); break
            }

          switch (cmpr_opfn_result.func_ref) {
            case QueryGrammers.Qlfn.Operators.eq:
              bQList.push((builder) => { builder.where(field_name, '=', fValue) }); break
            case QueryGrammers.Qlfn.Operators.ne:
              bQList.push((builder) => { builder.whereNot(field_name, '=', fValue) }); break
            case QueryGrammers.Qlfn.Operators.gt:
              bQList.push((builder) => { builder.where(field_name, '>', fValue) }); break
            case QueryGrammers.Qlfn.Operators.gte:
              bQList.push((builder) => { builder.where(field_name, '>=', fValue) }); break
            case QueryGrammers.Qlfn.Operators.lt:
              bQList.push((builder) => { builder.where(field_name, '<', fValue) }); break
            case QueryGrammers.Qlfn.Operators.lte:
              bQList.push((builder) => { builder.where(field_name, '<=', fValue) }); break
            // case QueryGrammers.Qlfn.Operators.is:
            //   bQList.push((builder) => { builder.where(field_name, fValue) }); break
            // case QueryGrammers.Qlfn.Operators.not:
            //   bQList.push((builder) => { builder.whereNot(field_name, fValue) }); break
            case QueryGrammers.Qlfn.Operators.in:
              bQList.push((builder) => { builder.whereIn(field_name, fValue) }); break
            case QueryGrammers.Qlfn.Operators.notIn:
              bQList.push((builder) => { builder.whereNotIn(field_name, fValue) }); break
            case QueryGrammers.Qlfn.Operators.between:
              bQList.push((builder) => { builder.whereBetween(field_name, [fValue.lower, fValue.higher]) }); break
            case QueryGrammers.Qlfn.Operators.notBetween:
              bQList.push((builder) => { builder.whereNotBetween(field_name, [fValue.lower, fValue.higher]) }); break
            case QueryGrammers.Qlfn.Operators.like:
              bQList.push((builder) => { builder.where(field_name, 'like', fValue) }); break
            case QueryGrammers.Qlfn.Operators.notLike:
              bQList.push((builder) => { builder.whereNot(field_name, 'like', fValue) }); break
            case QueryGrammers.Qlfn.Operators.startsWith:
              bQList.push((builder) => { builder.where(field_name, 'like', `${fValue}%`) }); break
            case QueryGrammers.Qlfn.Operators.endsWith:
              bQList.push((builder) => { builder.where(field_name, 'like', `%${fValue}`) }); break
            case QueryGrammers.Qlfn.Operators.substring:
              bQList.push((builder) => { builder.where(field_name, 'like', `%${fValue}%`) }); break
            default:
              throw new Error(`[filterWhereToKnexActions::unsupported_scene]`)
          }
        }

        return dfltReturn
      }
      default:
        new Error(`[filterWhereToKnexActions::unsupported_scene]`)
    }
  }
})

export function filterWhereToKnexActions (
    opts: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>
) {
    if (!opts) return
    const { where = null } = opts || {}
    if (!where) return

    const bQList = (opts.beforeQuery ? arraify(opts.beforeQuery) : []).filter(x => typeof x === 'function')

    filterWhereToKnexActionsInternal(where, {bQList});
    opts.beforeQuery = bQList
    opts.where = undefined
}

export const filterJoinOnConditionToClauseBuilderActions = gnrWalkWhere<
  null,
  {
    source_collection: string,
    target_collection: string,
    jbuilder: FKnexNS.Knex.JoinClause,
    knex: FKnexNS.KnexInstance
  }
>({
  onNode: ({ scene, nodeFrame, walk_fn, walk_fn_context, input }) => {
    const dfltReturn = { isReturn: false, result: <any>null }
    const { jbuilder, source_collection, target_collection, knex } = walk_fn_context

    if (!jbuilder) throw new Error(`[filterJoinOnConditionToClauseBuilderActions] jbuilder required!`)
    if (!source_collection) throw new Error(`[filterJoinOnConditionToClauseBuilderActions] source_collection required!`)
    if (!target_collection) throw new Error(`[filterJoinOnConditionToClauseBuilderActions] target_collection required!`)

    switch (scene) {
      case 'inputAs:conjunctionAsAnd': {
        return dfltReturn
      }
      case 'walkJoinOn:opsymbol:conjunction': {
        const [pres, last] = preDestruct(mapObjectToTupleList((<any>input)[nodeFrame.symbol]))
        const op_name = mapConjunctionOpSymbolToText(nodeFrame.symbol)

        walk_fn(pres, { ...walk_fn_context, parent_conjunction_op: op_name })
        walk_fn(last, { ...walk_fn_context, parent_conjunction_op: op_name })

        return dfltReturn
      }
      case 'walkWhere:opfn:in':
      case 'walkWhere:opfn:between':
      case 'walkWhere:opfn:comparator': {
        const cmpr_opfn_result = <FxOrmQueries.OperatorFunctionResult>nodeFrame.cmpr_opfn_result
        const field_name = nodeFrame.field_name

        if (field_name) {
          const sourceVarNode = normalizeCollectionColumn(field_name, source_collection)

          let fValue = cmpr_opfn_result.value

          if (isOperatorFunction(fValue)) {
            fValue = parseOperatorFunctionAsValue(fValue)
            
            switch (cmpr_opfn_result.value.$wrapper) {
              case QueryGrammers.Qlfn.Others.refTableCol: fValue = `${fValue.table}.${fValue.column}`
                break
              case QueryGrammers.Qlfn.Operators.colref: fValue = normalizeCollectionColumn(fValue, target_collection)
                break
              case QueryGrammers.Qlfn.Operators.between: fValue = parseOperatorFunctionAsValue(fValue)
                break
              case QueryGrammers.Qlfn.Operators.in: fValue = parseOperatorFunctionAsValue(fValue)
                break
              default:
                new Error('unsupported operator here!')
            }
          } else {
            switch (scene) {
              case 'walkWhere:opfn:in': fValue = normalizeInInput(fValue)
                break
              case 'walkWhere:opfn:between': fValue = normalizeWhereInput(fValue)
                break
              default:
                fValue = knex.raw("?", [fValue])
                break
            }
          }

          switch (cmpr_opfn_result.func_ref) {
            case QueryGrammers.Qlfn.Operators.eq:
              jbuilder.on(sourceVarNode, '=', fValue); break
            case QueryGrammers.Qlfn.Operators.ne:
              jbuilder.on(sourceVarNode, '<>', fValue); break
            case QueryGrammers.Qlfn.Operators.in:
              jbuilder.onIn(sourceVarNode, fValue); break
            case QueryGrammers.Qlfn.Operators.notIn:
              jbuilder.onNotIn(sourceVarNode, fValue); break
            case QueryGrammers.Qlfn.Operators.between:
              jbuilder.onBetween(sourceVarNode, [fValue.lower, fValue.higher]); break
            case QueryGrammers.Qlfn.Operators.notBetween:
              jbuilder.onNotBetween(sourceVarNode, [fValue.lower, fValue.higher]); break
            default:
              throw new Error(`[filterJoinOnConditionToClauseBuilderActions::unsupported_scene] (scene: ${scene}, op_name: ${cmpr_opfn_result.op_name})`)
          }
        }

        return dfltReturn
      }
      default:
        new Error(`[filterJoinOnConditionToClauseBuilderActions::unsupported_scene] (scene: ${scene})`)
    }
  }
})

const SQLITE_CANNOT = `[filterJoinsToKnexActionsInternal::onwalk] sqlite doesn't support right/full/outer join now, just use left join`
const filterJoinsToKnexActionsInternal = gnrWalkJoinOn<
  null,
  {
    source_collection: string,
    bQList: FxOrmDML.BeforeQueryItem[],
  }
>({
  onJoinNode: ({ scene, nodeFrame, walk_fn, walk_fn_context, input }) => {
    const dfltReturn = { isReturn: false, result: <any>null }
    const { bQList, source_collection } = walk_fn_context

    switch (scene) {
      case 'inputIs:opfn:joinVerb': {
        const condInput = input().value
        const target_collection = condInput.collection
        
        const get_jcallback = function (knex: FxOrmTypeHelpers.SecondParameter<FxOrmDML.BeforeQueryItem>['knex']) {
          return function () {
            /**
             * @note `this` is  JoinClause, never use jcallback as arrow-function or change call it by other `this`
             */
            filterJoinOnConditionToClauseBuilderActions(condInput.on, {
              jbuilder: this,
              source_collection,
              target_collection,
              knex
            })
          }
        }

        switch (input.$wrapper) {
          case QueryGrammers.Qlfn.Selects.join: bQList.push((builder, { knex }) => { builder.join(target_collection, get_jcallback(knex) ) }); break
          case QueryGrammers.Qlfn.Selects.leftJoin: bQList.push((builder, { knex }) => { builder.leftJoin(target_collection, get_jcallback(knex) ) }); break
          case QueryGrammers.Qlfn.Selects.leftOuterJoin: bQList.push((builder, { knex }) => { builder.leftOuterJoin(target_collection, get_jcallback(knex) ) }); break
          case QueryGrammers.Qlfn.Selects.rightJoin: bQList.push((builder, { knex }) => {
            if ((<any>builder).client.config.client === 'sqlite') throw new Error(SQLITE_CANNOT)
            builder.rightJoin(target_collection, get_jcallback(knex) )
          }); break
          case QueryGrammers.Qlfn.Selects.rightOuterJoin: bQList.push((builder, { knex }) => {
            if ((<any>builder).client.config.client === 'sqlite') throw new Error(SQLITE_CANNOT)
            builder.rightOuterJoin(target_collection, get_jcallback(knex) )
          }); break
          case QueryGrammers.Qlfn.Selects.fullOuterJoin: bQList.push((builder, { knex }) => { builder.fullOuterJoin(target_collection, get_jcallback(knex) ) }); break
          case QueryGrammers.Qlfn.Selects.innerJoin: bQList.push((builder, { knex }) => { builder.innerJoin(target_collection, get_jcallback(knex) ) }); break
        }

        return dfltReturn
      }
      default:
        new Error(`[filterJoinsToKnexActionsInternal::unsupported_scene] `)
    }
  }
})

export function filterJoinSelectToKnexActions (
    opts: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>,
    source_collection: string
) {
    if (!opts) return
    const { joins = null } = opts || {}
    if (!joins) return

    const bQList = (opts.beforeQuery ? arraify(opts.beforeQuery) : []).filter(x => typeof x === 'function')

    filterJoinsToKnexActionsInternal(joins, {source_collection, bQList});
    opts.beforeQuery = bQList
    delete opts.joins

    return
}
