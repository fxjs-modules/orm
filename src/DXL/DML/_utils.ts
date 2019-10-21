import util = require('util');

import * as QueryGrammers from '../../Base/Query/QueryGrammar';
import { arraify, preDestruct } from '../../Utils/array';
import { gnrWalkWhere, parseOperatorFunctionAsValue, mapConjunctionOpSymbolToText, normalizeInInput, normalizeWhereInput } from '../../Base/Query/onWalkConditions';
import { isOperatorFunction } from '../../Base/Query/Operator';
import { mapObjectToTupleList } from '../../Utils/object';

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
		const kqbuilder = beforeQuery(builder, ctx)

		if (kqbuilder)
			builder = kqbuilder
	}

	return builder
}

const filterWhereToKnexActionsInternal = gnrWalkWhere<
  null,
  {
    bQList: FxOrmDML.BeforeQueryItem[],
    restWhere: {[k: string]: any}
  }
>({
  onNode: ({ scene, nodeFrame, walk_fn, walk_fn_context, input }) => {
    const dfltReturn = { isReturn: false, result: <any>null }
    const { bQList } = walk_fn_context || {}

    switch (scene) {
      case 'inputAs:conjunctionAsAnd': {
        return dfltReturn
      }
      case 'walkOn:opsymbol:conjunction': {
        const [pres, last] = preDestruct(mapObjectToTupleList((<any>input)[nodeFrame.symbol]))
        const op_name = mapConjunctionOpSymbolToText(nodeFrame.symbol)

        walk_fn(pres, { ...walk_fn_context, parent_conjunction_op: op_name })
        walk_fn(last, { ...walk_fn_context, parent_conjunction_op: op_name })

        return dfltReturn
      }
      case 'walkOn:opfn:in':
      case 'walkOn:opfn:between':
      case 'walkOn:opfn:like':
      case 'walkOn:opfn:comparator': {
        const cmpr_opfn_result = <FxOrmQueries.OperatorFunctionResult>nodeFrame.cmpr_opfn_result
        const field_name = nodeFrame.field_name

        if (field_name) {
          let fValue = cmpr_opfn_result.value
          if (isOperatorFunction(fValue)) fValue = parseOperatorFunctionAsValue(fValue)
          else
            switch (scene) {
              case 'walkOn:opfn:in': fValue = normalizeInInput(fValue); break
              case 'walkOn:opfn:between': fValue = normalizeWhereInput(fValue); break
            }

          // console.log('field_name', field_name);
          // console.log('fValue', fValue);
          // console.log(
          //   'func_ref',
          //   QueryGrammers.Qlfn.Operators.between === cmpr_opfn_result.func_ref,
          //   QueryGrammers.Qlfn.Operators.notBetween === cmpr_opfn_result.func_ref
          // );

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
    const restWhere: {[k: string]: Exclude<any, symbol>} = {};

    filterWhereToKnexActionsInternal(where, {bQList, restWhere});
    opts.beforeQuery = bQList
    opts.where = restWhere

    return
}

export function getFindOptionValueIfNotFunc (optValue: Function | any) {
	if (typeof optValue === 'function')
		return optValue.apply(null, [])

	return optValue
}

export function filterResultAfterQuery (
	result: any,
	afterQuery: Function
) {
	if (typeof afterQuery === 'function') {
		result = afterQuery(result)
	}

	return result
}
