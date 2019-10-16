var helper = require('../support/spec_helper');
var ORM = require('../../');

odescribe("Model.walkWhere()", function () {
    var db = null;
    var Person = null;

    var setup = function () {
        Person = db.define("person", {
            name: String,
            surname: String,
            age: Number,
            male: Boolean
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

    odescribe("query ONE collection ONLY", function () {
        before(setup);

        describe("only comparator", function () {
          ;[
            [
              'eq', () => ([ ({ a: Person.OpFns.eq(1) }), `select * from ${Person.collection} where a = 1` ])
            ],
            [
              'ne', () => ([ ({ a: Person.OpFns.ne(1) }), `select * from ${Person.collection} where a <> 1` ])
            ],
            [
              'gt', () => ([ ({ a: Person.OpFns.gt(1) }), `select * from ${Person.collection} where a > 1` ])
            ],
            [
              'gte', () => ([ ({ a: Person.OpFns.gte(1) }), `select * from ${Person.collection} where a >= 1` ])
            ],
            [
              'lt', () => ([ ({ a: Person.OpFns.lt(1) }), `select * from ${Person.collection} where a < 1` ])
            ],
            [
              'lte', () => ([ ({ a: Person.OpFns.lte(1) }), `select * from ${Person.collection} where a <= 1` ]),
            ]
          ].forEach(([desc, getter]) => {
            oit(`${desc}`, function () {
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

        describe("comparator/conjunction", function () {
          ;[
            [
              '(default top as) and',
              () => ([
                ({ a: Person.OpFns.eq(1), b: Person.OpFns.eq("bar") }),
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
                  a: Person.OpFns.eq(1),
                  b: Person.OpFns.eq("bar"),
                  c: Person.OpFns.eq(-1),
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
                    a: Person.OpFns.eq(1),
                    b: Person.OpFns.eq("bar"),
                    c: Person.OpFns.eq(-1),
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
                    { a: Person.OpFns.ne(1) },
                    { b: Person.OpFns.eq(1) },
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
                    { a: Person.OpFns.ne(1) },
                    { b: Person.OpFns.eq(1) },
                    { c: Person.OpFns.gte(12) },
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
                  [Person.Op.bracket]: {
                    [Person.Op.or]: [
                      { a: Person.OpFns.gt(5) },
                      { b: Person.OpFns.lt(3) },
                    ],
                  },
                  a: Person.OpFns.lte(3)
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
                    [Person.Op.bracket]: {
                      [Person.Op.or]: [
                        { a: Person.OpFns.lte(3) },
                        { b: Person.OpFns.gte(5) },
                      ],
                    }
                  },
                  {
                    [Person.Op.bracket]: {
                      [Person.Op.or]: [
                        { a: Person.OpFns.gt(5) },
                        { b: Person.OpFns.lt(3) },
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
                      { a: Person.OpFns.lte(3) },
                      { b: Person.OpFns.gte(5) },
                    ],
                  },
                  {
                    [Person.Op.bracket]: {
                      [Person.Op.or]: [
                        { a: Person.OpFns.gt(5) },
                        { b: Person.OpFns.lt(3) },
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
                  Person.OpFns.bracket({
                    [Person.Op.and]: [
                      { a: Person.OpFns.lte(3) },
                      { b: Person.OpFns.gte(5) },
                    ],
                  }),
                  Person.OpFns.bracket({
                    [Person.Op.or]: [
                      { a: Person.OpFns.gt(5) },
                      { b: Person.OpFns.lt(3) },
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
                    a: Person.OpFns.eq(1)
                  },
                  Person.OpFns.bracket({
                    b: Person.OpFns.ne(2)
                  }),
                  Person.OpFns.bracket({
                    c: Person.OpFns.eq(1)
                  }),
                  Person.OpFns.bracket({
                    [Person.Op.or]: [
                      { foo: Person.OpFns.eq(1) },
                      { bar: Person.OpFns.eq(2) },
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
          ].filter(x => x).forEach(([desc, getter]) => {
            oit(`${desc}`, function () {
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

        xit("select all", function () {
            var people = Person.queryByHQL(`select * from ${Person.collection}`);

            // assert.isObject(people);
            // assert.propertyVal(people, "length", 5);
        });
    });
});
