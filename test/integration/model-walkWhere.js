var helper = require('../support/spec_helper');
var ORM = require('../../');

odescribe("Model.walkWhere()", function () {
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

        odescribe("only comparator", function () {
          ;[
            [
              'eq', () => ([ ({ a: ORM.Opf.eq(1) }), `select * from ${Person.collection} where a = 1` ])
            ],
            [
              'ne', () => ([ ({ a: ORM.Opf.ne(1) }), `select * from ${Person.collection} where a <> 1` ])
            ],
            [
              'gt', () => ([ ({ a: ORM.Opf.gt(1) }), `select * from ${Person.collection} where a > 1` ])
            ],
            [
              'gte', () => ([ ({ a: ORM.Opf.gte(1) }), `select * from ${Person.collection} where a >= 1` ])
            ],
            [
              'lt', () => ([ ({ a: ORM.Opf.lt(1) }), `select * from ${Person.collection} where a < 1` ])
            ],
            [
              'lte', () => ([ ({ a: ORM.Opf.lte(1) }), `select * from ${Person.collection} where a <= 1` ]),
            ],
            [
              'colref x eq', () => ([ ({ a: ORM.Opf.eq(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where a = b` ])
            ],
            [
              'colref x ne', () => ([ ({ a: ORM.Opf.ne(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where a <> b` ])
            ],
            [
              'colref x gt', () => ([ ({ a: ORM.Opf.gt(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where a > b` ])
            ],
            [
              'colref x gte', () => ([ ({ a: ORM.Opf.gte(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where a >= b` ])
            ],
            [
              'colref x lt', () => ([ ({ a: ORM.Opf.lt(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where a < b` ])
            ],
            [
              'colref x lte', () => ([ ({ a: ORM.Opf.lte(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where a <= b` ])
            ],
            [
              'refTableCol x eq', () => ([ ({ a: ORM.Opf.eq( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where a = ${Person.collection}.b` ])
            ],
            [
              'refTableCol x ne', () => ([ ({ a: ORM.Opf.ne( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where a <> ${Person.collection}.b` ])
            ],
            [
              'refTableCol x gt', () => ([ ({ a: ORM.Opf.gt( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where a > ${Person.collection}.b` ])
            ],
            [
              'refTableCol x gte', () => ([ ({ a: ORM.Opf.gte( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where a >= ${Person.collection}.b` ])
            ],
            [
              'refTableCol x lt', () => ([ ({ a: ORM.Opf.lt( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where a < ${Person.collection}.b` ])
            ],
            [
              'refTableCol x lte', () => ([ ({ a: ORM.Opf.lte( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where a <= ${Person.collection}.b` ])
            ],
          ].filter(x => x).forEach(([desc, getter]) => {
            it(`just comparator: ${desc}`, function () {
              const [whereInput, hql] = getter()
              var walked = Person.walkWhere(whereInput);

              var struct = Person.queryByHQL(hql);

              assert.deepEqual(
                walked,
                struct.where.condition
              )
              // console.notice('struct', struct);
            });
          })
        });

        odescribe("table column ref", function () {
          ;[
            [
              'eq', () => ([ ({ id: ORM.Opf.eq(1) }), `select * from ${Person.collection} where ${Person.collection}.id = 1` ])
            ],
            [
              'ne', () => ([ ({ a: ORM.Opf.ne(1) }), `select * from ${Person.collection} where ${Person.collection}.a <> 1` ])
            ],
            [
              'gt', () => ([ ({ a: ORM.Opf.gt(1) }), `select * from ${Person.collection} where ${Person.collection}.a > 1` ])
            ],
            [
              'gte', () => ([ ({ a: ORM.Opf.gte(1) }), `select * from ${Person.collection} where ${Person.collection}.a >= 1` ])
            ],
            [
              'lt', () => ([ ({ a: ORM.Opf.lt(1) }), `select * from ${Person.collection} where ${Person.collection}.a < 1` ])
            ],
            [
              'lte', () => ([ ({ a: ORM.Opf.lte(1) }), `select * from ${Person.collection} where ${Person.collection}.a <= 1` ]),
            ],
            [
              'colref x eq', () => ([ ({ a: ORM.Opf.eq(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where ${Person.collection}.a = b` ])
            ],
            [
              'colref x ne', () => ([ ({ a: ORM.Opf.ne(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where ${Person.collection}.a <> b` ])
            ],
            [
              'colref x gt', () => ([ ({ a: ORM.Opf.gt(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where ${Person.collection}.a > b` ])
            ],
            [
              'colref x gte', () => ([ ({ a: ORM.Opf.gte(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where ${Person.collection}.a >= b` ])
            ],
            [
              'colref x lt', () => ([ ({ a: ORM.Opf.lt(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where ${Person.collection}.a < b` ])
            ],
            [
              'colref x lte', () => ([ ({ a: ORM.Opf.lte(ORM.Opf.colref("b")) }), `select * from ${Person.collection} where ${Person.collection}.a <= b` ])
            ],
            [
              'refTableCol x eq', () => ([ ({ a: ORM.Opf.eq( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where ${Person.collection}.a = ${Person.collection}.b` ])
            ],
            [
              'refTableCol x ne', () => ([ ({ a: ORM.Opf.ne( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where ${Person.collection}.a <> ${Person.collection}.b` ])
            ],
            [
              'refTableCol x gt', () => ([ ({ a: ORM.Opf.gt( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where ${Person.collection}.a > ${Person.collection}.b` ])
            ],
            [
              'refTableCol x gte', () => ([ ({ a: ORM.Opf.gte( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where ${Person.collection}.a >= ${Person.collection}.b` ])
            ],
            [
              'refTableCol x lt', () => ([ ({ a: ORM.Opf.lt( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where ${Person.collection}.a < ${Person.collection}.b` ])
            ],
            [
              'refTableCol x lte', () => ([ ({ a: ORM.Opf.lte( ORM.Qlfn.Others.refTableCol({ table: Person.collection, column: "b" }) ) }), `select * from ${Person.collection} where ${Person.collection}.a <= ${Person.collection}.b` ])
            ],
          ].filter(x => x).forEach(([desc, getter]) => {
            it(`${desc}`, function () {
              const [whereInput, hql] = getter()
              var walked = Person.walkWhere(whereInput, { source_collection: Person.collection });

              var struct = Person.queryByHQL(hql);

              assert.deepEqual(
                walked,
                struct.where.condition
              )
              // console.notice('struct', struct);
            });
          })
        });

        odescribe("comparator/conjunction", function () {
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

              var struct = Person.queryByHQL(hql);

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
                  where ${Person.collection}.a = 1
                `
              ])
            ],
            // [
            //   'multiple joins',
            //   () => ([
            //     ({ id: ORM.Qlfn.Others.refTableCol({ table: Pet.collection, column: 'owner_id' }) }),
            //     `\
            //       select ${Pet.collection}.name pet_name, ${Person.collection}.* from ${Person.collection}
            //       join ${Pet.collection}
            //       on ${Person.collection}.id = ${Pet.collection}.owner_id
            //       where ${Person.collection}.a = 1
            //     `
            //   ])
            // ],
          ].filter(x => x).forEach(([desc, getter]) => {
            it(`${desc}`, function () {
              const [whereInput, hql] = getter()
              var walked = Person.walkOn(whereInput);

              var struct = Person.queryByHQL(hql);

              // console.log('struct', struct.joins);

              assert.deepEqual(walked, struct.joins)
            });
          })
        });
    });
});
