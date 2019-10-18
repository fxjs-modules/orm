import {
  OperatorFuncWrapper
} from './Operator'

export const Ql: FxOrmQueries.Class_QueryBuilder['Ql'] = {
  Operators: {
    and: Symbol('OPERATOR#and'),
    or: Symbol('OPERATOR#or'),
    gt: Symbol('OPERATOR#gt'),
    gte: Symbol('OPERATOR#gte'),
    lt: Symbol('OPERATOR#lt'),
    lte: Symbol('OPERATOR#lte'),
    ne: Symbol('OPERATOR#ne'),
    eq: Symbol('OPERATOR#eq'),
    is: Symbol('OPERATOR#is'),
    not: Symbol('OPERATOR#not'),
    between: Symbol('OPERATOR#between'),
    notBetween: Symbol('OPERATOR#notBetween'),
    in: Symbol('OPERATOR#in'),
    notIn: Symbol('OPERATOR#notIn'),
    like: Symbol('OPERATOR#like'),
    notLike: Symbol('OPERATOR#notLike'),

    // LIKE 'hat%'
    startsWith: Symbol('OPERATOR#startsWith'),
    // LIKE '%hat'
    endsWith: Symbol('OPERATOR#endsWith'),
    // LIKE '%hat%'
    substring: Symbol('OPERATOR#substring'),

    colref: Symbol('OPERATOR#colref'),
  },
  Others: {
    bracketRound: Symbol('OPERATOR#bracketRound'),
    bracketSquare: Symbol('OPERATOR#bracketSquare'),
    bracketBrace: Symbol('OPERATOR#bracketBrace'),
    quoteSingle: Symbol('OPERATOR#quoteSingle'),
    quoteDouble: Symbol('OPERATOR#quoteDouble'),
    quoteBack: Symbol('OPERATOR#quoteBack'),
  }
}

export const Qlfn: FxOrmQueries.Class_QueryBuilder['Qlfn'] = {
  Operators: {
    and: OperatorFuncWrapper('and'),
    or: OperatorFuncWrapper('or'),
    gt: OperatorFuncWrapper('gt'),
    gte: OperatorFuncWrapper('gte'),
    lt: OperatorFuncWrapper('lt'),
    lte: OperatorFuncWrapper('lte'),
    ne: OperatorFuncWrapper('ne'),
    eq: OperatorFuncWrapper('eq'),
    is: OperatorFuncWrapper('is'),
    not: OperatorFuncWrapper('not'),
    between: OperatorFuncWrapper('between'),
    notBetween: OperatorFuncWrapper('notBetween'),
    in: OperatorFuncWrapper('in'),
    notIn: OperatorFuncWrapper('notIn'),
    like: OperatorFuncWrapper('like'),
    notLike: OperatorFuncWrapper('notLike'),
    startsWith: OperatorFuncWrapper('startsWith'),
    endsWith: OperatorFuncWrapper('endsWith'),
    substring: OperatorFuncWrapper('substring'),

    colref: OperatorFuncWrapper('colref'),
  },
  Others: {
    bracketRound: OperatorFuncWrapper('bracketRound'),
    bracketSquare: OperatorFuncWrapper('bracketSquare'),
    bracketBrace: OperatorFuncWrapper('bracketBrace'),
    quoteSingle: OperatorFuncWrapper('quoteSingle'),
    quoteDouble: OperatorFuncWrapper('quoteDouble'),
    quoteBack: OperatorFuncWrapper('quoteBack'),

    refTableCol: OperatorFuncWrapper('refTableCol'),
  }
}
