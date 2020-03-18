var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model -- walkConditions", function () {
    var db = null;
    var Person = null;
    var Pet = null;

    var setup = function () {
        Person = db.define("person", {
            name: String,
            surname: String,
            age: Number,
            male: Boolean
        });

        Pet = db.define("pet", {
            name: String,
            age: Number,
        });

        return helper.dropSync(Person, function () {
            Person.create([{
                name: "John",
                surname: "Doe",
                age: 18,
                male: true
            }, {
                name: "Jane",
                surname: "Doe",
                age: 16,
                male: false
            }, {
                name: "Jeremy",
                surname: "Dean",
                age: 18,
                male: true
            }, {
                name: "Jack",
                surname: "Dean",
                age: 20,
                male: true
            }, {
                name: "Jasmine",
                surname: "Doe",
                age: 20,
                male: false
            }]);
        });
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.close();
    });

    describe("[where] query ONE collection ONLY", function () {
        before(setup);

        describe("only comparator", function () {
          // TODO: add more edge case, especially using malicious SQL injection
          const testors = [
            [
              'eq(default)', ({source_collection: sc}) => ([ ({ a: 1 }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a = 1` ])
            ],
            [
              'eq', ({source_collection: sc}) => ([ ({ a: ORM.Opf.eq(1) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a = 1` ])
            ],
            [
              'ne', ({source_collection: sc}) => ([ ({ a: ORM.Opf.ne(1) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a <> 1` ])
            ],
            [
              'gt', ({source_collection: sc}) => ([ ({ a: ORM.Opf.gt(1) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a > 1` ])
            ],
            [
              'gte', ({source_collection: sc}) => ([ ({ a: ORM.Opf.gte(1) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a >= 1` ])
            ],
            [
              'lt', ({source_collection: sc}) => ([ ({ a: ORM.Opf.lt(1) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a < 1` ])
            ],
            [
              'lte', ({source_collection: sc}) => ([ ({ a: ORM.Opf.lte(1) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a <= 1` ]),
            ],
            [
              'like', ({source_collection: sc}) => ([ ({ a: ORM.Opf.like('%Jack') }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a like '%Jack'` ]),
            ],
            [
              'notLike', ({source_collection: sc}) => ([ ({ a: ORM.Opf.notLike('%Jack') }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a not like '%Jack'` ]),
            ],
            [
              'between', ({source_collection: sc}) => ([ ({ a: ORM.Opf.between([1, 9]) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a between 1 and 9` ]),
            ],
            [
              'notBetween', ({source_collection: sc}) => ([ ({ a: ORM.Opf.notBetween({ lower: 1, higher: 9 }) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a not between 1 and 9` ]),
            ],
            [
              'in', ({source_collection: sc}) => ([ ({ a: ORM.Opf.in(1) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a in (1)` ]),
            ],
            [
              'in', ({source_collection: sc}) => ([ ({ a: ORM.Opf.in([1, 'foo', 3]) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a in (1, 'foo', 3)` ]),
            ],
            [
              'notIn', ({source_collection: sc}) => ([ ({ a: ORM.Opf.notIn(1) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a not in (1)` ]),
            ],
            /**
             * @notice no support for comparator-operator not, just use `ne`
             */
            /**
             * @notice no support for comparator-operator is, just use `eq`
             */
            [
              'colref [default] x eq', ({source_collection: sc}) => ([ ({ a: ORM.Opf.colref("b") }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a = b` ])
            ],
            [
              'colref x eq', ({source_collection: sc}) => ([ ({ a: ORM.Opf.eq(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a = b` ])
            ],
            [
              'colref x ne', ({source_collection: sc}) => ([ ({ a: ORM.Opf.ne(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a <> b` ])
            ],
            [
              'colref x gt', ({source_collection: sc}) => ([ ({ a: ORM.Opf.gt(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a > b` ])
            ],
            [
              'colref x gte', ({source_collection: sc}) => ([ ({ a: ORM.Opf.gte(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a >= b` ])
            ],
            [
              'colref x lt', ({source_collection: sc}) => ([ ({ a: ORM.Opf.lt(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a < b` ])
            ],
            [
              'colref x lte', ({source_collection: sc}) => ([ ({ a: ORM.Opf.lte(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a <= b` ])
            ],
            [
              'refTableCol [default] x eq', ({source_collection: sc}) => ([ ({ a: ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a = ${Person.collection}.b` ])
            ],
            [
              'refTableCol x eq', ({source_collection: sc}) => ([ ({ a: ORM.Opf.eq( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a = ${Person.collection}.b` ])
            ],
            [
              'refTableCol x ne', ({source_collection: sc}) => ([ ({ a: ORM.Opf.ne( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a <> ${Person.collection}.b` ])
            ],
            [
              'refTableCol x gt', ({source_collection: sc}) => ([ ({ a: ORM.Opf.gt( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a > ${Person.collection}.b` ])
            ],
            [
              'refTableCol x gte', ({source_collection: sc}) => ([ ({ a: ORM.Opf.gte( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a >= ${Person.collection}.b` ])
            ],
            [
              'refTableCol x lt', ({source_collection: sc}) => ([ ({ a: ORM.Opf.lt( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a < ${Person.collection}.b` ])
            ],
            [
              'refTableCol x lte', ({source_collection: sc}) => ([ ({ a: ORM.Opf.lte( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where ${sc ? `${sc}.` : ''}a <= ${Person.collection}.b` ])
            ],
            /**
             * @todo add test about opf.is
             * @todo add test about opf.not
             */
            /**
             * @isitvalie refTableCol(as var) x like?
             * @isitvalie refTableCol(as var) x between?
             */
          ].filter(x => x)

          testors.forEach(([desc, getter]) => {
            it(`just comparator: ${desc}`, function () {
              const [whereInput, hql] = getter({})
              var walked = Person.walkWhere(whereInput);

              var struct = Person.parseHQL(hql);

              assert.deepEqual(
                walked,
                struct.where.condition
              )
            });
          })

          testors.forEach(([desc, getter]) => {
            it(`provide source collection: ${desc}`, function () {
              const [whereInput, hql] = getter({ source_collection: Person.collection })
              var walked = Person.walkWhere(whereInput, { source_collection: Person.collection });

              var struct = Person.parseHQL(hql);

              assert.deepEqual(
                walked,
                struct.where.condition
              )
            })
          })
        });

        describe("comparator/conjunction", function () {
          ;[
            [
              '(default top as) and',
              () => ([
                ({ a: ORM.Opf.eq(1), b: ORM.Opf.eq("bar") }),
                `\
                  select * from ${Person.collection}
                  where a = 1 and b = "bar"
                `
              ])
            ],
            [
              'multiple and',
              () => ([
                ({
                  a: ORM.Opf.eq(1),
                  b: ORM.Opf.eq("bar"),
                  c: ORM.Opf.eq(-1),
                }),
                `\
                  select * from ${Person.collection}
                  where a = 1 and b = "bar" and c=-1
                `
              ])
            ],
            [
              'specific and',
              () => ([
                ({
                  [Person.Op.and]: {
                    a: ORM.Opf.eq(1),
                    b: ORM.Opf.eq("bar"),
                    c: ORM.Opf.eq(-1),
                  }
                }),
                `\
                  select * from ${Person.collection}
                  where a = 1 and b = "bar" and c=-1
                `
              ])
            ],
            [
              'or',
              () => ([
                ({
                  [Person.Op.or]: [
                    { a: ORM.Opf.ne(1) },
                    { b: ORM.Opf.eq(1) },
                  ]
                }),
                `\
                  select * from ${Person.collection}
                  where a <> 1 or b = 1
                `
              ])
            ],
            [
              'multiple or',
              () => ([
                ({
                  [Person.Op.or]: [
                    { a: ORM.Opf.ne(1) },
                    { b: ORM.Opf.eq(1) },
                    { c: ORM.Opf.gte(12) },
                  ]
                }),
                `\
                  select * from ${Person.collection}
                  where a <> 1 or b = 1 or c >= 12
                `
              ])
            ],
            [
              'mixed 2',
              () => ([
                ({
                  [Person.Ql.Others.bracketRound]: {
                    [Person.Op.or]: [
                      { a: ORM.Opf.gt(5) },
                      { b: ORM.Opf.lt(3) },
                    ],
                  },
                  a: ORM.Opf.lte(3)
                }),
                `\
                  select * from ${Person.collection}
                  where (a > 5 or b < 3) and a <= 3
                `
              ])
            ],
            [
              'mixed 3',
              () => ([
                ([
                  {
                    [Person.Ql.Others.bracketRound]: {
                      [Person.Op.or]: [
                        { a: ORM.Opf.lte(3) },
                        { b: ORM.Opf.gte(5) },
                      ],
                    }
                  },
                  {
                    [Person.Ql.Others.bracketRound]: {
                      [Person.Op.or]: [
                        { a: ORM.Opf.gt(5) },
                        { b: ORM.Opf.lt(3) },
                      ]
                    }
                  }
                ]),
                `\
                  select * from ${Person.collection}
                  where (
                    a <= 3 or b >= 5
                  ) and (
                    a > 5 or b < 3
                  )
                `
              ])
            ],
            [
              'mixed 4',
              () => ([
                ([
                  {
                    [Person.Op.and]: [
                      { a: ORM.Opf.lte(3) },
                      { b: ORM.Opf.gte(5) },
                    ],
                  },
                  {
                    [Person.Ql.Others.bracketRound]: {
                      [Person.Op.or]: [
                        { a: ORM.Opf.gt(5) },
                        { b: ORM.Opf.lt(3) },
                      ]
                    }
                  }
                ]),
                `\
                  select * from ${Person.collection}
                  where a <= 3 and b >= 5 and (
                    a > 5 or b < 3
                  )
                `
              ])
            ],
            [
              'mixed 5',
              () => ([
                ([
                  ORM.Qlfn.Others.bracketRound({
                    [Person.Op.and]: [
                      { a: ORM.Opf.lte(3) },
                      { b: ORM.Opf.gte(5) },
                    ],
                  }),
                  ORM.Qlfn.Others.bracketRound({
                    [Person.Op.or]: [
                      { a: ORM.Opf.gt(5) },
                      { b: ORM.Opf.lt(3) },
                    ]
                  })
                ]),
                `\
                  select * from ${Person.collection}
                  where (a <= 3 and b >= 5) and (
                    a > 5 or b < 3
                  )
                `
              ])
            ],
            [
              'mixed 6',
              () => ([
                ([
                  {
                    a: ORM.Opf.eq(1)
                  },
                  ORM.Qlfn.Others.bracketRound({
                    b: ORM.Opf.ne(2)
                  }),
                  ORM.Qlfn.Others.bracketRound({
                    c: ORM.Opf.eq(1)
                  }),
                  ORM.Qlfn.Others.bracketRound({
                    [Person.Op.or]: [
                      { foo: ORM.Opf.eq(1) },
                      { bar: ORM.Opf.eq(2) },
                    ],
                  })
                ]),
                `\
                  select * from ${Person.collection}
                  where
                    a = 1
                    and (b <> 2)
                    and (c = 1)
                    and (
                      foo = 1
                      or bar = 2
                    )
                `
              ])
            ],
            [
              'mixed 7',
              () => ([
                ([
                  ORM.Qlfn.Others.bracketRound({
                    [Person.Op.and]: [
                      { a: ORM.Opf.lte(ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: 'c' })) },
                      { b: ORM.Opf.gte(5) },
                    ],
                  }),
                  ORM.Qlfn.Others.bracketRound({
                    [Person.Op.or]: [
                      { a: ORM.Opf.gt(5) },
                      { b: ORM.Opf.lt(3) },
                    ]
                  })
                ]),
                `\
                  select * from ${Person.collection}
                  where (a <= ${Person.collection}.c and b >= 5) and (
                    a > 5 or b < 3
                  )
                `
              ])
            ],
          ].filter(x => x).forEach(([desc, getter]) => {
            it(`${desc}`, function () {
              const [whereInput, hql] = getter()
              var walked = Person.walkWhere(whereInput);

              var struct = Person.parseHQL(hql);

              assert.deepEqual(
                walked,
                struct.where.condition
              )
            });
          })
        });
    });

    describe("[on] join two collections", function () {
        before(setup);

        describe("outer join", function () {
          ;[
            [
              'default [outer] join',
              () => ([
                ({
                  id: ORM.Qlfn.Others.refTableCol({ table: Pet.collection, column: 'owner_id' })
                }),
                `\
                  select ${Pet.collection}.name pet_name, ${Person.collection}.* from ${Person.collection}
                  join ${Pet.collection}
                  on ${Person.collection}.id = ${Pet.collection}.owner_id
                  where ${Person.collection}.a = 1`
              ])
            ],
            [
              'full outer join',
              () => ([
                ([
                  ORM.Qlfn.Selects.fullOuterJoin({
                    collection: Pet.collection,
                    on: {
                      id: ORM.Qlfn.Others.refTableCol({ table: Pet.collection, column: 'owner_id' }),
                    }
                  })
                ]),
                `\
                  select ${Pet.collection}.name pet_name, ${Person.collection}.* from ${Person.collection}
                  full outer join ${Pet.collection}
                  on ${Person.collection}.id = ${Pet.collection}.owner_id
                  where ${Person.collection}.a = 1`
              ])
            ],
            [
              'full outer join x multiple conditions',
              () => ([
                ([
                  ORM.Qlfn.Selects.fullOuterJoin({
                    collection: Pet.collection,
                    on: {
                      id1: ORM.Qlfn.Others.refTableCol({ table: Pet.collection, column: 'owner_id1' }),
                      id2: ORM.Qlfn.Others.refTableCol({ table: Pet.collection, column: 'owner_id2' }),
                    }
                  })
                ]),
                `\
                  select ${Pet.collection}.name pet_name, ${Person.collection}.* from ${Person.collection}
                  full outer join ${Pet.collection}
                    on ${Person.collection}.id1 = ${Pet.collection}.owner_id1 and
                      ${Person.collection}.id2 = ${Pet.collection}.owner_id2
                  where ${Person.collection}.a = 1`
              ])
            ],
            [
              'left join',
              () => ([
                ([
                  ORM.Qlfn.Selects.leftJoin({
                    collection: Pet.collection,
                    on: {
                      id: ORM.Qlfn.Others.refTableCol({ table: Pet.collection, column: 'owner_id' }),
                    }
                  })
                ]),
                `\
                  select ${Pet.collection}.name pet_name, ${Person.collection}.* from ${Person.collection}
                  left join ${Pet.collection}
                  on ${Person.collection}.id = ${Pet.collection}.owner_id
                  where ${Person.collection}.a = 1`
              ])
            ],
            [
              'left outer join x multiple conditions',
              () => ([
                ([
                  ORM.Qlfn.Selects.leftOuterJoin({
                    collection: Pet.collection,
                    on: {
                      id1: ORM.Qlfn.Others.refTableCol({ table: Pet.collection, column: 'owner_id1' }),
                      id2: ORM.Qlfn.Others.refTableCol({ table: Pet.collection, column: 'owner_id2' }),
                    }
                  })
                ]),
                `\
                  select ${Pet.collection}.name pet_name, ${Person.collection}.* from ${Person.collection}
                  left outer join ${Pet.collection}
                    on ${Person.collection}.id1 = ${Pet.collection}.owner_id1 and
                      ${Person.collection}.id2 = ${Pet.collection}.owner_id2
                  where ${Person.collection}.a = 1`
              ])
            ],
            [
              'right join',
              () => ([
                ([
                  ORM.Qlfn.Selects.rightJoin({
                    collection: Pet.collection,
                    on: {
                      id: ORM.Qlfn.Others.refTableCol({ table: Pet.collection, column: 'owner_id' }),
                    }
                  })
                ]),
                `\
                  select ${Pet.collection}.name pet_name, ${Person.collection}.* from ${Person.collection}
                  right join ${Pet.collection}
                  on ${Person.collection}.id = ${Pet.collection}.owner_id
                  where ${Person.collection}.a = 1`
              ])
            ],
            [
              'right outer join x multiple conditions',
              () => ([
                ([
                  ORM.Qlfn.Selects.rightOuterJoin({
                    collection: Pet.collection,
                    on: {
                      id1: ORM.Qlfn.Others.refTableCol({ table: Pet.collection, column: 'owner_id1' }),
                      id2: ORM.Qlfn.Others.refTableCol({ table: Pet.collection, column: 'owner_id2' }),
                    }
                  })
                ]),
                `\
                  select ${Pet.collection}.name pet_name, ${Person.collection}.* from ${Person.collection}
                  right outer join ${Pet.collection}
                    on ${Person.collection}.id1 = ${Pet.collection}.owner_id1 and
                      ${Person.collection}.id2 = ${Pet.collection}.owner_id2
                  where ${Person.collection}.a = 1`
              ])
            ],
            [
              'inner join',
              () => ([
                ([
                  ORM.Qlfn.Selects.innerJoin({
                    collection: Pet.collection,
                    on: {
                      id: ORM.Qlfn.Others.refTableCol({ table: Pet.collection, column: 'owner_id' }),
                    }
                  })
                ]),
                `\
                  select ${Pet.collection}.name pet_name, ${Person.collection}.* from ${Person.collection}
                  inner join ${Pet.collection}
                  on ${Person.collection}.id = ${Pet.collection}.owner_id
                  where ${Person.collection}.a = 1`
              ])
            ],
          ].filter(x => x).forEach(([desc, getter]) => {
            it(`${desc}`, function () {
              const [inputConds, hql] = getter()
              var walked = Person.walkJoinOn(inputConds);

              var struct = Person.parseHQL(hql);

              // console.notice('struct.joins', struct.joins)
              assert.deepEqual(walked, struct.joins)
            });
          })
        });
    });
});
