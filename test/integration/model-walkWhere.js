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

    describe("query ONE collection ONLY", function () {
        before(setup);

        describe("only comparator", function () {
          ;[
            [
              'eq', () => ([ ({ a: Person.Opf.eq(1) }), `select * from ${Person.collection} where a = 1` ])
            ],
            [
              'ne', () => ([ ({ a: Person.Opf.ne(1) }), `select * from ${Person.collection} where a <> 1` ])
            ],
            [
              'gt', () => ([ ({ a: Person.Opf.gt(1) }), `select * from ${Person.collection} where a > 1` ])
            ],
            [
              'gte', () => ([ ({ a: Person.Opf.gte(1) }), `select * from ${Person.collection} where a >= 1` ])
            ],
            [
              'lt', () => ([ ({ a: Person.Opf.lt(1) }), `select * from ${Person.collection} where a < 1` ])
            ],
            [
              'lte', () => ([ ({ a: Person.Opf.lte(1) }), `select * from ${Person.collection} where a <= 1` ]),
            ],
            [
              'colref x eq', () => ([ ({ a: Person.Opf.eq(Person.Opf.colref("b")) }), `select * from ${Person.collection} where a = b` ])
            ],
            [
              'colref x ne', () => ([ ({ a: Person.Opf.ne(Person.Opf.colref("b")) }), `select * from ${Person.collection} where a <> b` ])
            ],
            [
              'colref x gt', () => ([ ({ a: Person.Opf.gt(Person.Opf.colref("b")) }), `select * from ${Person.collection} where a > b` ])
            ],
            [
              'colref x gte', () => ([ ({ a: Person.Opf.gte(Person.Opf.colref("b")) }), `select * from ${Person.collection} where a >= b` ])
            ],
            [
              'colref x lt', () => ([ ({ a: Person.Opf.lt(Person.Opf.colref("b")) }), `select * from ${Person.collection} where a < b` ])
            ],
            [
              'colref x lte', () => ([ ({ a: Person.Opf.lte(Person.Opf.colref("b")) }), `select * from ${Person.collection} where a <= b` ])
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
              // console.notice('struct', struct);
            });
          })
        });

        describe("comparator/conjunction", function () {
          ;[
            [
              '(default top as) and',
              () => ([
                ({ a: Person.Opf.eq(1), b: Person.Opf.eq("bar") }),
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
                  a: Person.Opf.eq(1),
                  b: Person.Opf.eq("bar"),
                  c: Person.Opf.eq(-1),
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
                    a: Person.Opf.eq(1),
                    b: Person.Opf.eq("bar"),
                    c: Person.Opf.eq(-1),
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
                    { a: Person.Opf.ne(1) },
                    { b: Person.Opf.eq(1) },
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
                    { a: Person.Opf.ne(1) },
                    { b: Person.Opf.eq(1) },
                    { c: Person.Opf.gte(12) },
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
                  [Person.QueryLanguage.Others.bracketRound]: {
                    [Person.Op.or]: [
                      { a: Person.Opf.gt(5) },
                      { b: Person.Opf.lt(3) },
                    ],
                  },
                  a: Person.Opf.lte(3)
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
                    [Person.QueryLanguage.Others.bracketRound]: {
                      [Person.Op.or]: [
                        { a: Person.Opf.lte(3) },
                        { b: Person.Opf.gte(5) },
                      ],
                    }
                  },
                  {
                    [Person.QueryLanguage.Others.bracketRound]: {
                      [Person.Op.or]: [
                        { a: Person.Opf.gt(5) },
                        { b: Person.Opf.lt(3) },
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
                      { a: Person.Opf.lte(3) },
                      { b: Person.Opf.gte(5) },
                    ],
                  },
                  {
                    [Person.QueryLanguage.Others.bracketRound]: {
                      [Person.Op.or]: [
                        { a: Person.Opf.gt(5) },
                        { b: Person.Opf.lt(3) },
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
                  Person.QueryLanguageFuncs.Others.bracketRound({
                    [Person.Op.and]: [
                      { a: Person.Opf.lte(3) },
                      { b: Person.Opf.gte(5) },
                    ],
                  }),
                  Person.QueryLanguageFuncs.Others.bracketRound({
                    [Person.Op.or]: [
                      { a: Person.Opf.gt(5) },
                      { b: Person.Opf.lt(3) },
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
                    a: Person.Opf.eq(1)
                  },
                  Person.QueryLanguageFuncs.Others.bracketRound({
                    b: Person.Opf.ne(2)
                  }),
                  Person.QueryLanguageFuncs.Others.bracketRound({
                    c: Person.Opf.eq(1)
                  }),
                  Person.QueryLanguageFuncs.Others.bracketRound({
                    [Person.Op.or]: [
                      { foo: Person.Opf.eq(1) },
                      { bar: Person.Opf.eq(2) },
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
    });
});
