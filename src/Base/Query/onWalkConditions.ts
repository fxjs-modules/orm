import { isOperatorFunction } from './Operator'
import * as QueryGrammers from './QueryGrammar'
import { idify, preDestruct, arraify } from '../../Utils/array'
import { mapObjectToTupleList } from '../../Utils/object'

export function normalizeWhereInput (input: any) {
  if (Array.isArray(input))
    return { lower: input[0], higher: input[1] }
  else if (typeof input === 'object')
    return { lower: input.lower, higher: input.higher }

  throw new Error(`[normalizeWhereInput] input must be tuple[lower, higher] or object{lower, higher}, check your input`)
}

export function normalizeInInput (input: any) {
  input = arraify(input)

  return input.filter((x: any) => isRawEqValue(x))
}

export function parseOperatorFunctionAsValue (opFnValue: FxOrmQueries.OperatorFunction): any {
  switch (opFnValue.$op_name) {
    case 'refTableCol': {
      const payload = opFnValue().value
      if (Array.isArray(payload))
        return { table: payload[0], column: payload[0] }
      else if (typeof payload === 'object')
        return { table: payload.table, column: payload.column }
      else if (typeof payload === 'string' && payload.indexOf('.') > 0) {
        const [table, column] = payload.split('.')
        return { table, column }
      }
    }
    case 'colref':
      return opFnValue().value
    case 'like':
      return opFnValue().value
    case 'between': {
      return normalizeWhereInput(opFnValue().value)
    }
    case 'in': {
      // only support raw-type IN value, no identifier as IN-node's expressions' item
      return normalizeInInput(opFnValue().value)
    }
    default:
      throw new Error('[parseOperatorFunctionAsValue] unsupported operator function as value! check your input!')
  }
}

export function isRawEqValue (input: any): input is (string | number | null | boolean) {
  const _t = typeof input
  return (_t === 'number')
  || (_t === 'string')
  || (_t === 'boolean')
  || input === null
}

export function filterRawEqValue (input: any): string | number | null {
  const ty = typeof input
  switch (ty) {
    case 'string':
      if (!input) return ''
      return input
    case 'number':
      if (isNaN(input)) return 0
      if (!Number.isFinite(input)) return 0
      return input
    case 'undefined':
      return null
    case 'object':
      if (!input)
      return null
  }

  return null
}

export function mapComparisonOperatorToSymbol (op: FxOrmQueries.OPERATOR_TYPE_COMPARISON) {
  switch (op) {
    case 'eq': return '='
    case 'ne': return '<>'
    case 'gt': return '>'
    case 'gte': return '>='
    case 'lt': return '<'
    case 'lte': return '<='
  }
}

export function mapConjunctionOpSymbolToText (op_sym: symbol) {
  switch (op_sym) {
    case QueryGrammers.Ql.Operators.and: return 'and'
    case QueryGrammers.Ql.Operators.or: return 'or'
    // case QueryGrammers.Ql.Operators.xor: return 'xor'
  }
}

function mapVTypeToHQLNodeType (value: any): FxHQLParser.ValueTypeRawNode['type'] | 'identifier' | 'column' {
  switch (typeof value) {
    default:
      if (isOperatorFunction(value) && value.$op_name === 'colref') return 'identifier'
      else if (isOperatorFunction(value) && value.$op_name === 'refTableCol') return 'column'
    case 'string':
      return 'string'
    case 'number':
      return 'decimal'
  }
}

function getComparisionNodeByValueNodeType (
  vtype: FxOrmTypeHelpers.ReturnType<typeof mapVTypeToHQLNodeType>,
  value: any
) {
  switch (vtype) {
    case 'identifier': return { type: 'identifier' as 'identifier', value: value }
    case 'decimal': return { type: 'decimal' as 'decimal', value: value }
    case 'string': return { type: 'string' as 'string', string: value }
    case 'column': return { type: 'column' as 'column', table: value.table, name: value.column }
  }
}

const noOp = function () { return null as any };
export function gnrWalkWhere<
  T_NODE extends FxHQLParser.WhereNode['condition'],
  T_CTX extends Fibjs.AnyObject
> ({
  onNode = noOp,
}: {
  onNode?: (nodeInfo: {
    /**
     * @shouldit be symbol?
     */
    scene: 'inputIs:opfn:bracketRound'
    | 'inputAs:conjunctionAsAnd'
    | 'walkJoinOn:opfn:bracketRound'
    | 'walkJoinOn:opfn:refTableCol'
    | 'walkJoinOn:opfn:colref'
    | 'walkJoinOn:opfn:like'
    | 'walkJoinOn:opfn:between'
    | 'walkJoinOn:opfn:in'
    | 'walkJoinOn:opfn:comparator'
    | 'walkJoinOn:opsymbol:bracketRound'
    | 'walkJoinOn:opsymbol:conjunction'
    ,
    walk_fn: FxOrmTypeHelpers.ReturnType<typeof gnrWalkWhere>,
    /**
     * walk_fn_context must be immutable
     */
    walk_fn_context: T_CTX
    input: any,
    nodeFrame: any
  }) => {
    isReturn: Boolean,
    result: any
  }
} = {}): ((
  input: FxOrmTypeHelpers.ItOrListOfIt<null | undefined | FxOrmQueries.WhereObjectInput | FxOrmQueries.OperatorFunction>,
  context: {
    source_collection?: string
    parent_conjunction_op?: FxOrmQueries.OPERATOR_TYPE_CONJUNCTION
  } & T_CTX
) => T_NODE) {
  const walk_fn: FxOrmTypeHelpers.ReturnType<typeof gnrWalkWhere> = function (input, context) {
    if (!context)
      throw new Error(`[gnrWalkWhere::walk_fn] context missing! report to your administrator that there's walk routing not passing context to it's sub node!`)

    const staticOnNodeParams = <FxOrmTypeHelpers.FirstParameter<typeof onNode>>{ input, walk_fn, walk_fn_context: context, nodeFrame: undefined }
    if (!input) return null
    else if (isOperatorFunction(input)) {
      switch (input.$wrapper) {
        case QueryGrammers.Qlfn.Others.bracketRound:
          const state = onNode({ ...staticOnNodeParams, scene: 'inputIs:opfn:bracketRound' })
          if (state && state.isReturn)
            return state.result
          break
        default:
          break
      }
    }

    if (typeof input !== 'object') return null

    let parsedNode = <T_NODE>null;

    if (Array.isArray(input)) {
      if (!input.length) return null
      if (input.length === 1) return walk_fn(idify(input), context)

      const state = onNode({ ...staticOnNodeParams, scene: 'inputAs:conjunctionAsAnd' })
      if (state && state.isReturn)
        return state.result
    }

    const inputSyms = Object.getOwnPropertySymbols(input)
    const inputKeys = Object.keys(input)
    const topAnd = inputSyms.length + inputKeys.length > 1

    if (topAnd)
      return walk_fn({
        [QueryGrammers.Ql.Operators.and]: []
                          .concat(inputSyms.map(sym => ({[sym]: (<any>input)[sym]})))
                          .concat(inputKeys.map(key => ({[key]: (<any>input)[key]})))
      }, context)

    inputSyms.forEach((_sym) => {
      switch (_sym) {
        case QueryGrammers.Ql.Others.bracketRound: {
          parsedNode = onNode({
            ...staticOnNodeParams,
            scene: 'walkJoinOn:opsymbol:bracketRound',
            nodeFrame: { symbol: _sym }
          }).result
          break
        }
        case QueryGrammers.Ql.Operators.or:
        case QueryGrammers.Ql.Operators.and: {
          parsedNode = onNode({
            ...staticOnNodeParams,
            scene: 'walkJoinOn:opsymbol:conjunction',
            nodeFrame: { symbol: _sym }
          }).result

          break
        }
      }
    })

    inputKeys.forEach((field_name: string) => {
      let v = (<any>input)[field_name]
      if (Array.isArray(v))
        v = QueryGrammers.Qlfn.Operators.in(v)
      if (isRawEqValue(v))
        v = QueryGrammers.Qlfn.Operators.eq(filterRawEqValue(v))

      if (!isOperatorFunction(v)) return

      let payv: ReturnType<typeof v>
      switch (v.$wrapper) {
        default:
          payv = v()
          break
        case QueryGrammers.Qlfn.Others.refTableCol:
        case QueryGrammers.Qlfn.Operators.colref:
          payv = QueryGrammers.Qlfn.Operators.eq(v)()
          break
      }
      // for some special operator: like, between
      let isNot = false

      switch (payv.func_ref) {
        /* ref verb :start */
        case QueryGrammers.Qlfn.Others.refTableCol:
          parsedNode = onNode({
            ...staticOnNodeParams,
            scene: 'walkJoinOn:opfn:refTableCol',
            nodeFrame: { ref_opfn_result: payv, field_name }
          }).result
          break
        /* ref verb :end */
        /* comparison verb :start */
        case QueryGrammers.Qlfn.Operators.notLike: isNot = true
        case QueryGrammers.Qlfn.Operators.like: {
          parsedNode = onNode({
            ...staticOnNodeParams,
            scene: 'walkJoinOn:opfn:like',
            nodeFrame: { cmpr_opfn_result: payv, not: isNot, field_name }
          }).result
          break
        }
        case QueryGrammers.Qlfn.Operators.notBetween: isNot = true
        case QueryGrammers.Qlfn.Operators.between: {
          parsedNode = onNode({
            ...staticOnNodeParams,
            scene: 'walkJoinOn:opfn:between',
            nodeFrame: { cmpr_opfn_result: payv, not: isNot, field_name }
          }).result
          break
        }
        /* comparison verb :end */
        /* comparison operator :start */
        case QueryGrammers.Qlfn.Operators.notIn: isNot = true
        case QueryGrammers.Qlfn.Operators.in: {
          parsedNode = onNode({
            ...staticOnNodeParams,
            scene: 'walkJoinOn:opfn:in',
            nodeFrame: { cmpr_opfn_result: payv, not: isNot, field_name }
          }).result
          break
        }
        case QueryGrammers.Qlfn.Operators.ne:
        case QueryGrammers.Qlfn.Operators.eq:
        case QueryGrammers.Qlfn.Operators.gt:
        case QueryGrammers.Qlfn.Operators.gte:
        case QueryGrammers.Qlfn.Operators.lt:
        case QueryGrammers.Qlfn.Operators.lte:

        {
          parsedNode = onNode({
            ...staticOnNodeParams,
            scene: 'walkJoinOn:opfn:comparator',
            nodeFrame: { cmpr_opfn_result: payv, not: isNot, field_name }
          }).result
          break
        }
        /* comparison operator :end */
        default:
          throw new Error(`[gnrWalkWhere::walk_fn] unsupported op_name ${payv.op_name}`)
      }
    })

    return parsedNode
  }

  return walk_fn
}

/**
 * default use preorder-strategy to build where condition
 */
export const dfltWalkWhere = gnrWalkWhere({
  onNode: (nodeInfo) => {
    const { scene, walk_fn, input, walk_fn_context, nodeFrame } = nodeInfo;

    switch (scene) {
      case 'inputIs:opfn:bracketRound':
        return {
          isReturn: true,
          result: {
            type: 'expr_comma_list',
            exprs: [walk_fn(input().value, walk_fn_context)]
          }
        }
      case 'walkJoinOn:opfn:bracketRound':
        return {
          isReturn: false,
          result: {
            type: 'expr_comma_list',
            exprs: [walk_fn(nodeFrame.cmpr_opfn_result, walk_fn_context)]
          }
        }
      case 'walkJoinOn:opfn:refTableCol':
        return {
          isReturn: false,
          result: {
            type: 'column',
            table: nodeFrame.ref_opfn_result.value.table,
            column: nodeFrame.ref_opfn_result.value.column,
          }
        }
      case 'walkJoinOn:opfn:colref':
        return {
          isReturn: false,
          result: {
            type: 'identifier',
            value: nodeFrame.cmpr_opfn_result.value
          }
        }
      case 'walkJoinOn:opfn:comparator':
      case 'walkJoinOn:opfn:like':
      case 'walkJoinOn:opfn:between':
        case 'walkJoinOn:opfn:in': {
        let value = nodeFrame.cmpr_opfn_result.value

        const { source_collection } = walk_fn_context || {};
        const varNode = !!source_collection ? {
          type: 'column',
          table: source_collection,
          name: nodeFrame.field_name,
        } : {
          type: 'identifier',
          value: nodeFrame.field_name
        }

        switch (scene) {
          case 'walkJoinOn:opfn:comparator': {
            const vtype = mapVTypeToHQLNodeType(value)
            if (isOperatorFunction(value)) value = parseOperatorFunctionAsValue(value)

            return {
              isReturn: false,
              result: {
                type: 'operator',
                operator: mapComparisonOperatorToSymbol(nodeFrame.cmpr_opfn_result.op_name),
                op_left: varNode,
                op_right: getComparisionNodeByValueNodeType(vtype, value)
              }
            }
          }
          case 'walkJoinOn:opfn:like': {
            const vtype = mapVTypeToHQLNodeType(value)
            if (isOperatorFunction(value)) value = parseOperatorFunctionAsValue(value)
            /**
             * @shouldit alert when value has no any '%' char ?
             */

            return {
              isReturn: false,
              result: {
                type: "like",
                not: nodeFrame.not,
                value: varNode,
                comparison: getComparisionNodeByValueNodeType(vtype, value)
              }
            }
          }
          case 'walkJoinOn:opfn:between': {
            if (isOperatorFunction(value)) value = parseOperatorFunctionAsValue(value)
            else value = normalizeWhereInput(value)

            return {
              isReturn: false,
              result: {
                type: "between",
                value: varNode,
                not: nodeFrame.not,
                lower: getComparisionNodeByValueNodeType(mapVTypeToHQLNodeType(value.lower), value.lower),
                upper: getComparisionNodeByValueNodeType(mapVTypeToHQLNodeType(value.higher), value.higher),
              }
            }
          }
          case 'walkJoinOn:opfn:in': {
            if (isOperatorFunction(value)) value = parseOperatorFunctionAsValue(value)
            else value = normalizeInInput(value)

            return {
              isReturn: false,
              result: {
                type: 'in',
                value: varNode,
                not: nodeFrame.not,
                expressions: value.map((x: any) =>
                  getComparisionNodeByValueNodeType(mapVTypeToHQLNodeType(x), x)
                )
              }
            }
          }
        }
      }
      case 'walkJoinOn:opsymbol:bracketRound': {
        return {
          isReturn: false,
          result: {
            type: 'expr_comma_list',
            exprs: [walk_fn((<any>input)[nodeFrame.symbol], walk_fn_context)]
          }
        }
      }
      case 'walkJoinOn:opsymbol:conjunction': {
        const [pres, last] = preDestruct(mapObjectToTupleList((<any>input)[nodeFrame.symbol]))
        const op_name = mapConjunctionOpSymbolToText(nodeFrame.symbol)

        return {
          isReturn: false,
          result: {
            type: 'operator',
            operator: op_name,
            op_left: walk_fn(pres, { ...walk_fn_context, parent_conjunction_op: op_name }),
            op_right: walk_fn(last, { ...walk_fn_context, parent_conjunction_op: op_name }),
          }
        }
      }
      case 'inputAs:conjunctionAsAnd':
        const {
          // when input is array with length >= 2, 'and' is valid
          parent_conjunction_op = 'and'
        } = walk_fn_context || {}

        const [pres, last] = preDestruct(input)
        return {
          isReturn: true,
          result: {
            type: 'operator',
            operator: parent_conjunction_op,
            op_left: walk_fn(pres, walk_fn_context),
            op_right: walk_fn(last, walk_fn_context)
          }
        }
      default:
        return {isReturn: false, result: null}
    }
  }
});

export function gnrWalkOn<
  T_NODE extends FxOrmQueries.Class_QueryNormalizer['joins'][any],
  T_CTX extends {
    source_collection: string,
    is_top_output?: boolean
    joinParams?: {
      side?: FxOrmQueries.Class_QueryNormalizer['joins'][any]['side']
      specific_outer?: FxOrmQueries.Class_QueryNormalizer['joins'][any]['specific_outer']
      inner?: FxOrmQueries.Class_QueryNormalizer['joins'][any]['inner']
    }
  }
> ({
  onNode = noOp,
}: {
  onNode?: (nodeInfo: {
    /**
     * @shouldit be symbol?
     */
    scene: 'inputIs:joinList'
    | 'inputIs:opfn:joinVerb'
    ,
    walk_fn: FxOrmTypeHelpers.ReturnType<typeof gnrWalkOn>,
    /**
     * walk_fn_context must be immutable
     */
    walk_fn_context: T_CTX
    input: any,
    nodeFrame: any
  }) => {
    isReturn: Boolean,
    result: any
  }
} = {}): ((
  input: FxOrmTypeHelpers.ItOrListOfIt<null | undefined | FxOrmQueries.WhereObjectInput | FxOrmQueries.OperatorFunction>,
  context: Fibjs.AnyObject & T_CTX
) => FxOrmTypeHelpers.ItOrListOfIt<T_NODE>) {
  const walk_fn: FxOrmTypeHelpers.ReturnType<typeof gnrWalkOn> = function (input, context) {
    if (!context)
      throw new Error(`[gnrWalkOn::walk_fn] context missing! report to your administrator that there's walk routing not passing context to it's sub node!`)

    const staticOnNodeParams = <FxOrmTypeHelpers.FirstParameter<typeof onNode>>{ input, walk_fn, walk_fn_context: {...context, is_top_output: false}, nodeFrame: undefined }
    if (!input) return null
    else if (isOperatorFunction(input)) {
      switch (input.$wrapper) {
        case QueryGrammers.Qlfn.Selects.join: {
          const state = onNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,specific_outer: false }
          })
          if (state && state.isReturn) return state.result
        }
          break
        case QueryGrammers.Qlfn.Selects.leftJoin: {
          const state = onNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,side: 'left', specific_outer: false }
          })
          if (state && state.isReturn) return state.result
        }
          break
        case QueryGrammers.Qlfn.Selects.leftOuterJoin: {
          const state = onNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,side: 'left', specific_outer: true }
          })
          if (state && state.isReturn) return state.result
        }
          break
        case QueryGrammers.Qlfn.Selects.rightJoin: {
          const state = onNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,side: 'right', specific_outer: false }
          })
          if (state && state.isReturn) return state.result
        }
        case QueryGrammers.Qlfn.Selects.rightOuterJoin: {
          const state = onNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,side: 'right', specific_outer: true }
          })
          if (state && state.isReturn) return state.result
        }
        case QueryGrammers.Qlfn.Selects.fullOuterJoin: {
          const state = onNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,side: 'full', specific_outer: true }
          })
          if (state && state.isReturn) return state.result
        }
        case QueryGrammers.Qlfn.Selects.innerJoin: {
          const state = onNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,specific_outer: false, inner: true }
          })
          if (state && state.isReturn) return state.result
        }
          break
        default:
          throw new Error(`[gnrWalkOn::#main] unsupported Query Language ${input.$op_name}`)
      }
    }

    if (typeof input !== 'object') return null

    if (Array.isArray(input)) {
      if (!input.length) return null
      if (input.length === 1) return walk_fn(idify(input), context)

      const state = onNode({ ...staticOnNodeParams, scene: 'inputIs:joinList' })
      if (state && state.isReturn)
        return state.result
    }

    return walk_fn(QueryGrammers.Qlfn.Selects.join({ collection: undefined, on: input }), context)
  }

  return walk_fn
}

export function findFirstOpRightColumnNodeInConditionResult (
  cond_result: ReturnType<typeof dfltWalkWhere>
): FxHQLParser.ColumnRefNode {
  let result: ReturnType<typeof findFirstOpRightColumnNodeInConditionResult>
  if (cond_result.type !== 'operator') return

  switch (cond_result.operator) {
    case 'and':
    case 'or':
    case 'xor':
      return (
        findFirstOpRightColumnNodeInConditionResult(<any>cond_result.op_right)
        || findFirstOpRightColumnNodeInConditionResult(<any>cond_result.op_left)
      )
    case '=':
    case '<>':
    case '>':
    case '>=':
    case '<':
    case '<=':
      switch (cond_result.op_right.type) {
        case 'column':
          return cond_result.op_right
        case 'column_expr':
          return findFirstOpRightColumnNodeInConditionResult(<any>cond_result.op_right.expression)
      }
  }

  return result
}

export const dfltWalkOn = gnrWalkOn({
  onNode: ({ scene, walk_fn, input, walk_fn_context, nodeFrame }) => {
    switch (scene) {
      case 'inputIs:opfn:joinVerb': {
        const condInput = input().value
        const conditions = dfltWalkWhere(condInput.on, { source_collection: walk_fn_context.source_collection });
        if (!conditions || conditions.type !== 'operator')
          throw new Error(`[dfltWalkOn::onNode] conditions result of join verb must be (type: 'operator'`)

        let targetCollection = condInput.collection
        if (!targetCollection) {
          const refNode = findFirstOpRightColumnNodeInConditionResult(conditions)
          if (refNode) targetCollection = refNode.table
        }

        const jonNode = {
          side: nodeFrame.side || undefined,
          specific_outer: nodeFrame.specific_outer === true,
          inner: !nodeFrame.specific_outer && nodeFrame.inner === true,
          conditions: arraify(conditions),
          ref_right: {
            type: 'table',
            table: targetCollection
          }
        }
        return {
          isReturn: true,
          result: nodeFrame.use_list ? arraify(jonNode) : jonNode
        }
      }
      case 'inputIs:joinList':
        return {
          isReturn: true,
          result: input.map((x: any) => walk_fn(x, walk_fn_context))
        }
    }
  }
})
