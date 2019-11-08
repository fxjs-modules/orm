import { isOperatorFunction } from './Operator'
import * as QueryGrammers from './QueryGrammar'
import { idify, arraify } from '../../Utils/array'

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

const noOp = function () { return null as any };
type WalkThroughNodeCallback<T_CTX = any, T_FN = any, T_EVENTS = any> = (
  nodeInfo: {
    /**
     * @shouldit be symbol?
     */
    scene: T_EVENTS,
    walk_fn: T_FN,
    /**
     * walk_fn_context must be immutable
     */
    walk_fn_context: T_CTX
    input: any,
    nodeFrame: any
  }
) => {
  isReturn: Boolean,
  result: any
}

type WalkWhereOnNodeCallback<T_CTX> = WalkThroughNodeCallback<
  T_CTX,
  any,
  'inputIs:opfn:bracketRound'
  | 'inputAs:conjunctionAsAnd'
  | 'walkWhere:opfn:bracketRound'
  | 'walkWhere:opfn:refTableCol'
  | 'walkWhere:opfn:colref'
  | 'walkWhere:opfn:like'
  | 'walkWhere:opfn:between'
  | 'walkWhere:opfn:in'
  | 'walkWhere:opfn:comparator'
  | 'walkJoinOn:opsymbol:bracketRound'
  | 'walkJoinOn:opsymbol:conjunction'
>
export function gnrWalkWhere<
  T_NODE extends FxHQLParser.WhereNode['condition'],
  T_CTX extends Fibjs.AnyObject
> ({
  onNode = noOp,
}: {
  onNode?: WalkWhereOnNodeCallback<T_CTX>
} = {}): ({
  (
    input: FxOrmTypeHelpers.ItOrListOfIt<null | undefined | FxOrmQueries.WhereObjectInput | FxOrmQueries.OperatorFunction>,
    context: {
      source_collection?: string
      parent_conjunction_op?: FxOrmQueries.OPERATOR_TYPE_CONJUNCTION
    } & T_CTX
  ): T_NODE,
  onNode: WalkWhereOnNodeCallback<T_CTX>
}) {
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
            scene: 'walkWhere:opfn:refTableCol',
            nodeFrame: { ref_opfn_result: payv, field_name }
          }).result
          break
        /* ref verb :end */
        /* comparison verb :start */
        case QueryGrammers.Qlfn.Operators.startsWith:
        case QueryGrammers.Qlfn.Operators.endsWith:
        case QueryGrammers.Qlfn.Operators.substring:
        case QueryGrammers.Qlfn.Operators.notLike: isNot = true
        case QueryGrammers.Qlfn.Operators.like: {
          parsedNode = onNode({
            ...staticOnNodeParams,
            scene: 'walkWhere:opfn:like',
            nodeFrame: { cmpr_opfn_result: payv, not: isNot, field_name }
          }).result
          break
        }
        case QueryGrammers.Qlfn.Operators.notBetween: isNot = true
        case QueryGrammers.Qlfn.Operators.between: {
          parsedNode = onNode({
            ...staticOnNodeParams,
            scene: 'walkWhere:opfn:between',
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
            scene: 'walkWhere:opfn:in',
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
            scene: 'walkWhere:opfn:comparator',
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

  walk_fn.onNode = onNode

  return <any>walk_fn
}

type WalkJoinOnOnNodeCallback<T_CTX> = WalkThroughNodeCallback<
  T_CTX,
  any,
  'inputIs:opfn:joinVerb'
>
export function gnrWalkJoinOn<
  T_NODE extends FxOrmQueries.HqLNormalizer['joins'][any],
  T_CTX extends Fibjs.AnyObject = Fibjs.AnyObject
> ({
  onJoinNode = noOp,
  walkerWhereConditions = <any>noOp
}: {
  onJoinNode?: WalkJoinOnOnNodeCallback<T_CTX>,
  walkerWhereConditions?: ReturnType<typeof gnrWalkWhere>
} = {}): (
  {
    (
      input: FxOrmTypeHelpers.ItOrListOfIt<null | undefined | FxOrmQueries.WhereObjectInput | FxOrmQueries.OperatorFunction>,
      context: T_CTX & {
        source_collection: string,
        is_top_output?: boolean
        joinParams?: {
          side?: FxOrmQueries.HqLNormalizer['joins'][any]['side']
          specific_outer?: FxOrmQueries.HqLNormalizer['joins'][any]['specific_outer']
          inner?: FxOrmQueries.HqLNormalizer['joins'][any]['inner']
        }
      }
    ): FxOrmTypeHelpers.ItOrListOfIt<T_NODE>,
    onJoinNode: WalkJoinOnOnNodeCallback<T_CTX>
    walkerWhereConditions: ReturnType<typeof gnrWalkWhere>
  }
) {
  const walk_fn: FxOrmTypeHelpers.ReturnType<typeof gnrWalkJoinOn> = function (input, context) {
    if (!context)
      throw new Error(`[gnrWalkJoinOn::walk_fn] context missing! report to your administrator that there's walk routing not passing context to it's sub node!`)

    const staticOnNodeParams = <FxOrmTypeHelpers.FirstParameter<typeof onJoinNode>><unknown>{ input, walk_fn, walk_fn_context: {...context, is_top_output: false}, nodeFrame: undefined }
    if (!input) return null
    else if (isOperatorFunction(input)) {
      switch (input.$wrapper) {
        case QueryGrammers.Qlfn.Selects.join: {
          const state = onJoinNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,specific_outer: false }
          })
          if (state && state.isReturn) return state.result
        }
          break
        case QueryGrammers.Qlfn.Selects.leftJoin: {
          const state = onJoinNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,side: 'left', specific_outer: false }
          })
          if (state && state.isReturn) return state.result
        }
          break
        case QueryGrammers.Qlfn.Selects.leftOuterJoin: {
          const state = onJoinNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,side: 'left', specific_outer: true }
          })
          if (state && state.isReturn) return state.result
        }
          break
        case QueryGrammers.Qlfn.Selects.rightJoin: {
          const state = onJoinNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,side: 'right', specific_outer: false }
          })
          if (state && state.isReturn) return state.result
        }
        case QueryGrammers.Qlfn.Selects.rightOuterJoin: {
          const state = onJoinNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,side: 'right', specific_outer: true }
          })
          if (state && state.isReturn) return state.result
        }
        case QueryGrammers.Qlfn.Selects.fullOuterJoin: {
          const state = onJoinNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,side: 'full', specific_outer: true }
          })
          if (state && state.isReturn) return state.result
        }
        case QueryGrammers.Qlfn.Selects.innerJoin: {
          const state = onJoinNode({
            ...staticOnNodeParams, scene: 'inputIs:opfn:joinVerb', nodeFrame: { use_list: !!context.is_top_output ,specific_outer: false, inner: true }
          })
          if (state && state.isReturn) return state.result
        }
          break
        default:
          throw new Error(`[gnrWalkJoinOn::#main] unsupported Query Language ${input.$op_name}`)
      }
    }

    if (typeof input !== 'object') return null

    if (Array.isArray(input)) {
      if (!input.length) return null
      if (input.length === 1) return walk_fn(idify(input), context)

      return input.map(item => walk_fn(item, context))
    }

    return walk_fn(QueryGrammers.Qlfn.Selects.join({ collection: undefined, on: input }), context)
  }

  walk_fn.onJoinNode = onJoinNode
  walk_fn.walkerWhereConditions= walkerWhereConditions

  return <any>walk_fn
}
