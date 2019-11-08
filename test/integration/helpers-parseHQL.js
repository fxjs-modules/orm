var helper = require("../support/spec_helper");
var common = require("../common");
var ORM = require("../../");

describe("Model parseHQL", function() {
  var db = null;
  var Person = null;
  var Pet = null;

  var queryNormalizer = null;

  var setup = function() {
    Person = db.define("person", {
      name: String
    });

    Pet = db.define("pet", {
      name: String
    });

    return helper.dropSync([Person, Pet], function() {
      Person.create([
        {
          id: 1,
          name: "John Doe"
        },
        {
          id: 2,
          name: "Jane Doe"
        },
        {
          id: 3,
          name: "John Doe"
        }
      ]);

      Pet.create([
        {
          name: "Dan"
        },
        {
          name: "Deco"
        }
      ]);
    });
  };

  before(function() {
    db = helper.connect();
  });

  after(function() {
    return db.close();
  });

  describe("ORM has static method", function() {
    before(setup);

    it("has", function() {
      assert.isFunction(ORM.parseHQL);
    });

    xit("collection is required", function() {
      assert.throws(() => {
        ORM.parseHQL();
      });
    });

    it("sql is required", function() {
      assert.throws(() => {
        ORM.parseHQL();
      });
    });
  });

  describe("query one collection only", function() {
    before(setup);

    it("select all", function() {
      queryNormalizer = ORM.parseHQL(`select * from test`);

      assert.strictEqual(queryNormalizer.isSelectAll, true);
    });

    it("select field", function() {
      queryNormalizer = ORM.parseHQL(`select a, b, c from test`);

      assert.strictEqual(queryNormalizer.isSelectAll, false);
      assert.deepEqual(
        queryNormalizer.select,
        [
            ['a'],
            ['b'],
            ['c'],
          ].map(([identifier, alias = identifier]) => {
            return {
              "name": alias,
              "expression": {
                "type": "identifier",
                "value": identifier,
              },
              "sourceColumns": [
                {
                  "type": "identifier",
                  "value": identifier,
                }
              ],
              "mappedTo": {
                "column": identifier
              }
            }
          })
        );
    });

    it("aliases", function () {
      queryNormalizer = ORM.parseHQL(`select a as af, b, c as cf from test`);

      assert.deepEqual(
        queryNormalizer.select,
        [
          ['a', 'af'],
          ['b'],
          ['c', 'cf']
        ].map(([identifier, alias]) => {
          return {
            "name": alias || identifier,
            ...alias && {
              alias,
              alias_expression: {
                "type": "identifier",
                "value": alias,
              }
            },
            "expression": {
              "type": "identifier",
              "value": identifier,
            },
            "sourceColumns": [
              {
                "type": "identifier",
                "value": identifier,
              }
            ],
            "mappedTo": {
              "column": identifier
            }
          }
        })
      );
    });

    it("where", function () {
      queryNormalizer = ORM.parseHQL(`select a from test where b = 'foo'`);

      assert.deepEqual(
        queryNormalizer.select,
        [
          ['a']
        ].map(([identifier, alias]) => {
          return {
            "name": alias || identifier,
            ...alias && {
              alias,
              alias_expression: {
                "type": "identifier",
                "value": alias,
              }
            },
            "expression": {
              "type": "identifier",
              "value": identifier,
            },
            "sourceColumns": [
              {
                "type": "identifier",
                "value": identifier,
              }
            ],
            "mappedTo": {
              "column": identifier
            }
          }
        })
      );

      assert.deepEqual(
        queryNormalizer.where,
        {
          "type": "where",
          "condition": {
            "type": "operator",
            "operator": "=",
            "op_left": {
              "type": "identifier",
              "value": "b"
            },
            "op_right": {
              "type": "string",
              "string": "foo"
            }
          }
        }
      );
    });

    it("having", function () {
      queryNormalizer = ORM.parseHQL(`select a from test having b = 'foo'`);

      assert.deepEqual(
        queryNormalizer.select,
        [
          ['a']
        ].map(([identifier, alias]) => {
          return {
            "name": alias || identifier,
            ...alias && {
              alias,
              alias_expression: {
                "type": "identifier",
                "value": alias,
              }
            },
            "expression": {
              "type": "identifier",
              "value": identifier,
            },
            "sourceColumns": [
              {
                "type": "identifier",
                "value": identifier,
              }
            ],
            "mappedTo": {
              "column": identifier
            }
          }
        })
      );

      assert.deepEqual(
        queryNormalizer.having,
        {
          "type": "having",
          "condition": {
            "type": "operator",
            "operator": "=",
            "op_left": {
              "type": "identifier",
              "value": "b"
            },
            "op_right": {
              "type": "string",
              "string": "foo"
            }
          }
        }
      );
    });

    it("group by", function () {
      queryNormalizer = ORM.parseHQL(`select a from test group by foo`);

      assert.deepEqual(
        queryNormalizer.groupBy,
        {
          "type": "group_by",
          "columns": {
            "type": "selection_columns",
            "columns": [
              {
                "type": "column_expr",
                "expression": {
                  "type": "identifier",
                  "value": "foo"
                }
              }
            ]
          }
        }
      );

      queryNormalizer = ORM.parseHQL(`select a from test group by foo, foo2 having (foo is not null) and (foo2 like "%test1%")`);

      assert.deepEqual(
        queryNormalizer.groupBy,
        {
          "type": "group_by",
          "columns": {
            "type": "selection_columns",
            "columns": [
              {
                "type": "column_expr",
                "expression": {
                  "type": "identifier",
                  "value": "foo"
                }
              },
              {
                "type": "column_expr",
                "expression": {
                  "type": "identifier",
                  "value": "foo2"
                }
              }
            ]
          }
        }
      );

      assert.deepEqual(
        queryNormalizer.having,
        {
          "type": "having",
          "condition": {
            "type": "operator",
            "operator": "and",
            "op_left": {
              "type": "expr_comma_list",
              "exprs": [
                {
                  "type": "is_null",
                  "not": true,
                  "value": {
                    "type": "identifier",
                    "value": "foo"
                  }
                }
              ]
            },
            "op_right": {
              "type": "expr_comma_list",
              "exprs": [
                {
                  "type": "like",
                  "not": false,
                  "value": {
                    "type": "identifier",
                    "value": "foo2"
                  },
                  "comparison": {
                    "type": "string",
                    "string": "%test1%"
                  }
                }
              ]
            }
          }
        }
      );
    });
  });

  describe("join twos collections", function() {
    before(setup);

    oit("select all from left and one column from right", function() {
      queryNormalizer = ORM.parseHQL(`select a.*, b.id as b_id from test a join test b on a.id = b.a_id`);

      assert.strictEqual(queryNormalizer.isSelectAll, false);
    });

    it("aliases", function () {
      queryNormalizer = ORM.parseHQL(`select a as af, b, c as cf from test`);

      assert.deepEqual(
        queryNormalizer.select,
        [
          ['a', 'af'],
          ['b'],
          ['c', 'cf']
        ].map(([identifier, alias]) => {
          return {
            "name": alias || identifier,
            ...alias && {
              alias,
              alias_expression: {
                "type": "identifier",
                "value": alias,
              }
            },
            "expression": {
              "type": "identifier",
              "value": identifier,
            },
            "sourceColumns": [
              {
                "type": "identifier",
                "value": identifier,
              }
            ],
            "mappedTo": {
              "column": identifier
            }
          }
        })
      );
    });

    describe('pratical models', function () {
      before(setup);

      it("normal usage", function () {
        queryNormalizer = ORM.parseHQL(
          `select ${Person.collection}.*, ${Pet.collection}.id as pet_id from ${Person.collection} join ${Pet.collection} on ${Person.collection}.id = ${Pet.collection}.owner_id`,
          {
            models: {
              [Person.collection]: Person,
              [Pet.collection]: Pet
            }
          }
        );

        assert.deepEqual(queryNormalizer.selectableFields, [
          "name",
          "id",
          "pet_id"
        ]);
      })

      it("allow pass unexisted field though it's not existed", function () {
        queryNormalizer = ORM.parseHQL(
          `select ${Person.collection}.*, ${Pet.collection}.id as pet_id, ${Pet.collection}.non_existed from ${Person.collection} join ${Pet.collection} on ${Person.collection}.id = ${Pet.collection}.owner_id`,
          {
            models: {
              [Person.collection]: Person,
              [Pet.collection]: Pet
            }
          }
        );

        assert.deepEqual(queryNormalizer.selectableFields, [
          "name",
          "id",
          "pet_id",
          "non_existed"
        ]);
      })
    })
  });

  xdescribe("query one collection only", function() {
    before(setup);

    it("basic", function() {
      queryNormalizer = ORM.parseHQL("person", {});

      assert.isTrue(queryNormalizer.isEmptyWhere);
      assert.isTrue(queryNormalizer.isSelectAll);
      assert.isFalse(queryNormalizer.isJoined);

      assert.ok(queryNormalizer.offset === 0);
      assert.ok(queryNormalizer.limit === -1);
    });

    it("with where condition", function() {
      queryNormalizer = ORM.parseHQL("person", {
        where: {
          a: 1
        }
      });

      assert.isFalse(queryNormalizer.isEmptyWhere);
      assert.isTrue(queryNormalizer.isSelectAll);
      assert.isFalse(queryNormalizer.isJoined);
    });

    describe("where transformer", function() {
      it("basic", function() {
        queryNormalizer = ORM.parseHQL("person", {
          where: {
            foo1: { [ORM.Op.eq]: 1 },
            foo2: { [ORM.Op.ne]: 1 }
          }
        });
      });
    });

    xit("used by model", function() {
      if (!["sqlite", "mysql"].includes(common.protocol())) return;

      // Person.useQueryNormalizer()
    });
  });
});
