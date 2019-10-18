import { isOperatorFunction } from './Operator'
import * as QueryGrammers from './QueryGrammar'
import { idify, preDestruct, arraify } from '../../Utils/array'

function mapComparisonOperatorToSymbol (op: FxOrmQueries.OPERATOR_TYPE_COMPARISON) {
  switch (op) {
    case 'eq': return '='
    case 'ne': return '<>'
    case 'gt': return '>'
    case 'gte': return '>='
    case 'lt': return '<'
    case 'lte': return '<='
  }
}

function mapConjunctionOpSymbolToText (op_sym: symbol) {
  switch (op_sym) {
    case QueryGrammers.Ql.Operators.and: return 'and'
    case QueryGrammers.Ql.Operators.or: return 'or'
    // case QueryGrammers.Ql.Operators.xor: return 'xor'
  }
}

function mapVType (value: any): FxHQLParser.ValueTypeRawNode['type'] | 'identifier' | 'column' {
  switch (typeof value) {
    default:
      if (isOperatorFunction(value) && value.operator_name === 'colref') return 'identifier'
      else if (isOperatorFunction(value) && value.operator_name === 'refTableCol') return 'column'
    case 'string':
      return 'string'
    case 'number':
      return 'decimal'
  }
}

function parseOperatorFunctionAsValue (opFnValue: FxOrmQueries.OperatorFunction): any {
  switch (opFnValue.operator_name) {
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
    default:
      throw new Error('[parseOperatorFunctionAsValue] unsupported operator function as value! check your input')
  }
}

function mapObjectToTupleList (input: object | any[]) {
  if (!input || typeof input !== 'object') return null

  return Array.isArray(input) ? input : Object.entries(input).map(([k, v]) => ({[k]: v}))
}

/**
 * default use preorder-strategy to build where condition
 */
export function dfltWalkWhere (
  input: FxOrmTypeHelpers.ItOrListOfIt<null | undefined | FxOrmQueries.WhereObjectInput | FxOrmQueries.OperatorFunction>,
  opts?: {
    source_collection?: string
    parent_conjunction_op?: FxOrmQueries.OPERATOR_TYPE_CONJUNCTION
  }
): FxHQLParser.WhereNode['condition'] {
  if (!input) return null
  else if (isOperatorFunction(input)) {
    switch (input.operator_name) {
      case 'bracketRound':
        return {
          type: 'expr_comma_list',
          exprs: [dfltWalkWhere(input().value)]
        }
      default:
        break
    }
  }

  if (typeof input !== 'object') return null

  let parsedNode = <FxOrmTypeHelpers.ReturnType<typeof dfltWalkWhere>>{};

  if (Array.isArray(input)) {
    if (!input.length) return null
    if (input.length === 1) return dfltWalkWhere(idify(input))

    const {
      // when input is array with length >= 2, 'and' is valid
      parent_conjunction_op = 'and'
    } = opts || {}

    const [pres, last] = preDestruct(input)

    return {
      type: 'operator',
      operator: parent_conjunction_op,
      op_left: dfltWalkWhere(pres),
      op_right: dfltWalkWhere(last)
    };
  }

  const inputSyms = Object.getOwnPropertySymbols(input)
  const inputKeys = Object.keys(input)
  const topAnd = inputSyms.length + inputKeys.length > 1

  if (topAnd)
    return dfltWalkWhere({
      [QueryGrammers.Ql.Operators.and]: []
                        .concat(inputSyms.map(sym => ({[sym]: input[<any>sym]})))
                        .concat(inputKeys.map(key => ({[key]: input[key]})))
    })

  inputSyms.forEach((_sym) => {
    switch (_sym) {
      case QueryGrammers.Ql.Others.bracketRound: {
        parsedNode = {
          type: 'expr_comma_list',
          exprs: [dfltWalkWhere(input[<any>_sym])]
        }
        break
      }
      case QueryGrammers.Ql.Operators.or:
      case QueryGrammers.Ql.Operators.and: {
        const [pres, last] = preDestruct(mapObjectToTupleList(input[<any>_sym]))
        const op_name = mapConjunctionOpSymbolToText(_sym)

        parsedNode = {
          type: 'operator',
          operator: op_name,
          op_left: dfltWalkWhere(pres, { ...opts, parent_conjunction_op: op_name }),
          op_right: dfltWalkWhere(last, { ...opts, parent_conjunction_op: op_name }),
        }

        break
      }
      // case QueryGrammers.Ql.Others.refTableCol: {
      //   break
      // }
    }
  })

  const { source_collection } = opts || {}

  inputKeys.forEach((fieldName: string) => {
    const v = input[fieldName]
    if (!isOperatorFunction(v)) return

    const payv = v()

    switch (payv.op_name) {
      case 'bracketRound': {
        parsedNode = {
          type: 'expr_comma_list',
          exprs: [dfltWalkWhere(payv)]
        }
        break
      }
      case 'tableColRef': {
       parsedNode = {
         type: 'column',
         table: payv.value.table,
         column: payv.value.column,
       }
       break
      }
      case 'colref': {
        parsedNode = {
          type: 'identifier',
          value: payv.value
        }
        break
      }
      /* comparision operator :start */
      case 'ne':
      case 'eq':
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
      {
        const vtype = mapVType(payv.value)
        let value = payv.value


        if (isOperatorFunction(value)) value = parseOperatorFunctionAsValue(value)

        parsedNode = {
          type: 'operator',
          operator: mapComparisonOperatorToSymbol(payv.op_name),
          op_left: !!source_collection ? {
            type: 'column',
            table: source_collection,
            name: fieldName,
          } : {
            type: 'identifier',
            value: fieldName
          },
          op_right: (() => {
            switch (vtype) {
              case 'identifier': return { type: 'identifier' as 'identifier', value: value }
              case 'decimal': return { type: 'decimal' as 'decimal', value: value }
              case 'string': return { type: 'string' as 'string', string: value }
              case 'column': return { type: 'column' as 'column', table: value.table, name: value.column }
            }
          })()
        }
        break
      }
      /* comparison operator :end */
      default:
        throw new Error(`[dfltWalkWhere::] unsupported op_name ${payv.op_name}`)
    }
  })

  return parsedNode
}

export function dfltWalkOn (
  input: FxOrmTypeHelpers.ItOrListOfIt<FxOrmQueries.WhereObjectInput>,
  opts: {
    source_collection: string,
    is_joins?: boolean
  }
): FxOrmTypeHelpers.ItOrListOfIt<FxOrmQueries.Class_QueryNormalizer['joins'][any]> {
  if (!input) return null
  else if (isOperatorFunction(input)) return null

  if (typeof input !== 'object') return null

  const { source_collection, is_joins = false } = opts || {}

  let jonNode: FxOrmQueries.Class_QueryNormalizer['joins'][any] = null

  Object.keys(input).forEach((fieldName: string) => {
    const v = input[fieldName]
    if (!isOperatorFunction(v)) return

    const payv = v()

    jonNode = {
      side: undefined,
      specific_outer: false,
      inner: false,
      columns: [{ type: 'column', table: source_collection, name: fieldName }],
      ref_right: {
        type: 'table',
        table: payv.value.table
      }
    }

    switch (payv.op_name) {
      case 'refTableCol': {
        jonNode.columns.push({ type: 'column', table: payv.value.table, name: payv.value.column })
        break
      }
      default:
        throw new Error(`[dfltWalkOn::] unsupported op_name ${payv.op_name}`)
    }
  })

  return is_joins ? [jonNode] : jonNode
}
