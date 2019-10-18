const OPERATOR_FUN_SYMBOL = Symbol('OPERATOR#FUNC')

export function OperatorFuncWrapper<T> (
  operator_name: T extends (
    keyof FxOrmQueries.Class_QueryBuilder['Qlfn']['Operators']
    | keyof FxOrmQueries.Class_QueryBuilder['Qlfn']['Others']
  ) ? T : string
) {
  const wrapper = (function(value: any) {
    const fun = <FxOrmQueries.OperatorFunction<typeof operator_name>>(function () {
      let op_left, op_right
      if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
          op_left = value[0]
          op_right = value[1]
        } else {
          op_left = value.op_left
          op_right = value.op_right
        }
      }

      return {
        op_name: fun.operator_name,
        value: value,
        op_left,
        op_right,
      }
    })

    fun.operator_name = operator_name
    Object.defineProperty(fun, 'op_symbol', { value: OPERATOR_FUN_SYMBOL, enumerable: false, configurable: false, writable: false })

    return fun
  })

  return wrapper
}

export function isOperatorFunction (input: any): input is FxOrmQueries.OperatorFunction {
  return typeof input === 'function' && input['op_symbol'] === OPERATOR_FUN_SYMBOL
}

export function isConjunctionOperator (op_name: string): op_name is FxOrmQueries.OPERATOR_TYPE_CONJUNCTION {
  return (
    'and' === op_name
    || 'or' === op_name
    || 'xor' === op_name
  )
}

export function isAssertOperator (op_name: string): op_name is FxOrmQueries.OPERATOR_TYPE_ASSERT {
  return (
    'is' === op_name
    || 'not' === op_name
  )
}

export function isPredicateOperator (op_name: string): op_name is FxOrmQueries.OPERATOR_TYPE_PREDICATE {
  return (
    'beween' === op_name
  )
}

export function isComparisonOperator (op_name: string): op_name is FxOrmQueries.OPERATOR_TYPE_COMPARISON {
  return (
    'eq' === op_name
    || 'ne' === op_name
    || 'gt' === op_name
    || 'gte' === op_name
    || 'lt' === op_name
    || 'lte' === op_name
    || 'like' === op_name
  )
}

// export const SpecOperators = {
//   // REGEXP/~ '^[h|a|t]' (MySQL/PG only)
//   regexp: Symbol('OPERATOR#regexp'),
//   // NOT REGEXP/!~ '^[h|a|t]' (MySQL/PG only)
//   notRegexp: Symbol('OPERATOR#notRegexp'),
// }

// export const PgOperators = {
//   ...Operators,
//   iLike: Symbol('OPERATOR#iLike'),
//   notILike: Symbol('OPERATOR#notILike'),

//   contains: Symbol('OPERATOR#contains'),
//   contained: Symbol('OPERATOR#contained'),
//   overlap: Symbol('OPERATOR#overlap'),
//   adjacent: Symbol('OPERATOR#adjacent'),
//   strictLeft: Symbol('OPERATOR#strictLeft'),
//   strictRight: Symbol('OPERATOR#strictRight'),
//   noExtendRight: Symbol('OPERATOR#noExtendRight'),
//   noExtendLeft: Symbol('OPERATOR#noExtendLeft'),

//   // ~* '^[h|a|t]' (PG only)
//   iRegexp: Symbol('OPERATOR#iRegexp'),
//   // !~* '^[h|a|t]' (PG only)
//   notIRegexp: Symbol('OPERATOR#notIRegexp'),
// }
