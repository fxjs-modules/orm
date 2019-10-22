import {
  OperatorFuncWrapper
} from './Operator'

export const Ql: FxOrmQueries.Class_QueryBuilder['Ql'] = {
  Operators: {
    and: Symbol('QL#and'),
    or: Symbol('QL#or'),
    gt: Symbol('QL#gt'),
    gte: Symbol('QL#gte'),
    lt: Symbol('QL#lt'),
    lte: Symbol('QL#lte'),
    ne: Symbol('QL#ne'),
    eq: Symbol('QL#eq'),
    is: Symbol('QL#is'),
    not: Symbol('QL#not'),
    between: Symbol('QL#between'),
    notBetween: Symbol('QL#notBetween'),
    in: Symbol('QL#in'),
    notIn: Symbol('QL#notIn'),
    like: Symbol('QL#like'),
    notLike: Symbol('QL#notLike'),

    // LIKE 'hat%'
    startsWith: Symbol('QL#startsWith'),
    // LIKE '%hat'
    endsWith: Symbol('QL#endsWith'),
    // LIKE '%hat%'
    substring: Symbol('QL#substring'),

    colref: Symbol('QL#colref'),
  },
  Others: {
    bracketRound: Symbol('QL#bracketRound'),
    bracketSquare: Symbol('QL#bracketSquare'),
    bracketBrace: Symbol('QL#bracketBrace'),
    quoteSingle: Symbol('QL#quoteSingle'),
    quoteDouble: Symbol('QL#quoteDouble'),
    quoteBack: Symbol('QL#quoteBack'),
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
  Selects: {
    join: OperatorFuncWrapper('join'),
    leftJoin: OperatorFuncWrapper('leftJoin'),
    leftOuterJoin: OperatorFuncWrapper('leftOuterJoin'),
    rightJoin: OperatorFuncWrapper('rightJoin'),
    rightOuterJoin: OperatorFuncWrapper('rightOuterJoin'),
    innerJoin: OperatorFuncWrapper('innerJoin'),
    fullOuterJoin: OperatorFuncWrapper('fullOuterJoin'),
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
