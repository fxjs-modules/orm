import { isOperatorFunction } from './Operator'
import * as QG from './QueryGrammar'
import { idify, preDestruct } from '../../Utils/array'

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
    case QG.QueryLanguage.Operators.and: return 'and'
    case QG.QueryLanguage.Operators.or: return 'or'
    // case QG.QueryLanguage.Operators.xor: return 'xor'
  }
}

function mapVType (value: any): FxHQLParser.ValueTypeRawNode['type'] | 'identifier' {
  switch (typeof value) {
    default:
      if (isOperatorFunction(value) && value.operator_name === 'colref') return 'identifier'
    case 'string':
      return 'string'
    case 'number':
      return 'decimal'
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

  let flattenedWhere = <FxOrmTypeHelpers.ReturnType<typeof dfltWalkWhere>>{};

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
      [QG.QueryLanguage.Operators.and]: []
                        .concat(inputSyms.map(sym => ({[sym]: input[<any>sym]})))
                        .concat(inputKeys.map(key => ({[key]: input[key]})))
    })

  inputSyms.forEach((_sym) => {
    switch (_sym) {
      case QG.QueryLanguage.Others.bracketRound: {
        flattenedWhere = {
          type: 'expr_comma_list',
          exprs: [dfltWalkWhere(input[<any>_sym])]
        }
        break
      }
      case QG.QueryLanguage.Operators.or:
      case QG.QueryLanguage.Operators.and: {
        const [pres, last] = preDestruct(mapObjectToTupleList(input[<any>_sym]))
        const op_name = mapConjunctionOpSymbolToText(_sym)

        flattenedWhere = {
          type: 'operator',
          operator: op_name,
          op_left: dfltWalkWhere(pres, { parent_conjunction_op: op_name }),
          op_right: dfltWalkWhere(last, { parent_conjunction_op: op_name }),
        }

        break
      }
    }
  })

  inputKeys.forEach((fieldName: string) => {
    const v = input[fieldName]
    if (!isOperatorFunction(v)) return

    const payv = v()

    switch (payv.op_name) {
      case 'bracketRound': {
        flattenedWhere = {
          type: 'expr_comma_list',
          exprs: [dfltWalkWhere(payv)]
        }
        break
      }
      case 'colref': {
        flattenedWhere = {
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
        if (isOperatorFunction(value)) value = value().value

        flattenedWhere = {
          type: 'operator',
          operator: mapComparisonOperatorToSymbol(payv.op_name),
          op_left: {
            type: 'identifier',
            value: fieldName,
          },
          op_right: (() => {
            switch (vtype) {
              case 'identifier': return { type: 'identifier' as 'identifier', value: value }
              case 'decimal': return { type: 'decimal' as 'decimal', value: value }
              case 'string': return { type: 'string' as 'string', string: value }
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

  return flattenedWhere
}
