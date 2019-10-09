export const Operators = {
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
    
    col: Symbol('OPERATOR#col'),
}

export const SpecOperators = {
    // REGEXP/~ '^[h|a|t]' (MySQL/PG only)
    regexp: Symbol('OPERATOR#regexp'),
    // NOT REGEXP/!~ '^[h|a|t]' (MySQL/PG only)
    notRegexp: Symbol('OPERATOR#notRegexp'),
}

export const PgOperators = {
    ...Operators,
    iLike: Symbol('OPERATOR#iLike'),
    notILike: Symbol('OPERATOR#notILike'),

    contains: Symbol('OPERATOR#contains'),
    contained: Symbol('OPERATOR#contained'),
    overlap: Symbol('OPERATOR#overlap'),
    adjacent: Symbol('OPERATOR#adjacent'),
    strictLeft: Symbol('OPERATOR#strictLeft'),
    strictRight: Symbol('OPERATOR#strictRight'),
    noExtendRight: Symbol('OPERATOR#noExtendRight'),
    noExtendLeft: Symbol('OPERATOR#noExtendLeft'),
    
    // ~* '^[h|a|t]' (PG only)
    iRegexp: Symbol('OPERATOR#iRegexp'),
    // !~* '^[h|a|t]' (PG only)
    notIRegexp: Symbol('OPERATOR#notIRegexp'),
}