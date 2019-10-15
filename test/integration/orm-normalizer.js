var helper = require("../support/spec_helper");
var common = require("../common");
var ORM = require("../../");

odescribe("ORM Normalizer", function() {
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
      assert.isFunction(ORM.normalizeQuery);
    });

    xit("collection is required", function() {
      assert.throws(() => {
        ORM.normalizeQuery();
      });
    });

    it("sql is required", function() {
      assert.throws(() => {
        ORM.normalizeQuery();
      });
    });
  });

  describe("query one collection only", function() {
    before(setup);

    it("select all", function() {
      queryNormalizer = ORM.normalizeQuery(`select * from test`);

      assert.strictEqual(queryNormalizer.isSelectAll, true);
    });

    it("select field", function() {
      queryNormalizer = ORM.normalizeQuery(`select a, b, c from test`);

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
      queryNormalizer = ORM.normalizeQuery(`select a as af, b, c as cf from test`);

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
  });

  odescribe("join twos collections", function() {
    before(setup);

    oit("select all from left and one column from right", function() {
      queryNormalizer = ORM.normalizeQuery(`select a.*, b.id as b_id from test a join test b on a.id = b.a_id`);

      assert.strictEqual(queryNormalizer.isSelectAll, false);
    });

    it("aliases", function () {
      queryNormalizer = ORM.normalizeQuery(`select a as af, b, c as cf from test`);

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

    odescribe('pratical models', function () {
      before(setup);

      it("normal usage", function () {
        queryNormalizer = ORM.normalizeQuery(
          `select ${Person.collection}.*, ${Pet.collection}.id as pet_id from ${Person.collection} join ${Pet.collection} on ${Person.collection}.id = ${Person.collection}.owner_id`,
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
        queryNormalizer = ORM.normalizeQuery(
          `select ${Person.collection}.*, ${Pet.collection}.id as pet_id, ${Pet.collection}.non_existed from ${Person.collection} join ${Pet.collection} on ${Person.collection}.id = ${Person.collection}.owner_id`,
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
      queryNormalizer = ORM.normalizeQuery("person", {});

      assert.isTrue(queryNormalizer.isEmptyWhere);
      assert.isTrue(queryNormalizer.isSelectAll);
      assert.isFalse(queryNormalizer.isJoined);

      assert.ok(queryNormalizer.offset === 0);
      assert.ok(queryNormalizer.limit === -1);
    });

    it("with where condition", function() {
      queryNormalizer = ORM.normalizeQuery("person", {
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
        queryNormalizer = ORM.normalizeQuery("person", {
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
