import { Operators, isOperatorFunction, isConjunctionOperator, isComparisonOperator } from './Operator'
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
    case Operators.and: return 'and'
    case Operators.or: return 'or'
    // case Operators.xor: return 'xor'
  }
}

function mapVType (value: any): FxHQLParser.ValueTypeRawNode['type'] | 'identifier' {
  switch (typeof value) {
    default:
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
    return {
      type: 'expr_comma_list',
      exprs: [dfltWalkWhere(input().value)]
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
      [Operators.and]: []
                        .concat(inputSyms.map(sym => ({[sym]: input[<any>sym]})))
                        .concat(inputKeys.map(key => ({[key]: input[key]})))
    })

  inputSyms.forEach((_sym) => {
    switch (_sym) {
      case Operators.bracket: {
        flattenedWhere = {
          type: 'expr_comma_list',
          exprs: [dfltWalkWhere(input[<any>_sym])]
        }
        break
      }
      case Operators.or:
      case Operators.and: {
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
      case 'bracket': {
        flattenedWhere = {
          type: 'expr_comma_list',
          exprs: [dfltWalkWhere(payv)]
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

        flattenedWhere = {
          type: 'operator',
          operator: mapComparisonOperatorToSymbol(payv.op_name),
          op_left: {
            type: 'identifier',
            value: fieldName,
          },
          op_right: vtype === 'decimal' ? {
            type: 'decimal',
            value: payv.value,
          } : {
            type: <any>vtype,
            string: payv.value,
          }
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

// export default class Class_WhereWalker implements FxOrmQueries.Class_WhereWalker {
//   where: FxOrmQueries.Class_WhereWalker['where'] = {};
//   walker: any = dfltWalkWhere;

//   constructor (input: any) {
//     dfltWalkWhere(input)
//   }
// }
