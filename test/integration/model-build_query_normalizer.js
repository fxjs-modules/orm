var test = require("test");
test.setup();

var _ = require("lodash");
var helper = require("../support/spec_helper");
var common = require("../common");
var ORM = require("../../");
var coroutine = require("coroutine");

xdescribe("Model.buildQueryNormalizer()", function() {
  var db = null;
  var Person = null;
  var John;

  var setup = function() {
    return function() {
      Person = db.define(
        "person",
        {
          name: {
            type: "text",
            mapsTo: "fullname"
          }
        }
      );

      return helper.dropSync(Person, function() {
        var people = Person.create([
          {
            name: "John Doe"
          },
          {
            name: "Jane Doe"
          }
        ]);
        John = people[0];
      });
    };
  };

  before(function() {
    db = helper.connect();
  });

  after(function() {
    return db.close();
  });

  describe("basic", function() {
    before(setup(true));

    it("default info", function() {
      var queryNormalizer = Person.buildQueryNormalizer();

      assert.propertyVal(queryNormalizer, 'collection', Person.collection);
      assert.propertyVal(queryNormalizer, 'offset', 0);

      assert.propertyVal(queryNormalizer, 'limit', -1);

      assert.propertyVal(queryNormalizer, 'isSelectAll', true);

      assert.deepEqual(queryNormalizer.orderBy, []);
      assert.deepEqual(queryNormalizer.groupBy, []);
    });

    it('property unchangeable', function () {
      var queryNormalizer = Person.buildQueryNormalizer();

        queryNormalizer.collection = queryNormalizer.collection + 'foo'
        assert.equal(queryNormalizer.collection, Person.collection)

        queryNormalizer.select = '123'
        assert.notEqual(queryNormalizer.select, '123')

        queryNormalizer.selectableFields = '123'
        assert.isArray(queryNormalizer.selectableFields)
    });

    it('property unaddable', function () {
      var queryNormalizer = Person.buildQueryNormalizer();

        assert.throws(() => {
            queryNormalizer.foo = 'bar'
        });
    });

    it('limit: +Infinity/-Infinity', function () {
        var queryNormalizer = Person.buildQueryNormalizer({
            limit: Infinity
        });

        assert.propertyVal(queryNormalizer, 'limit', -1);
    });

    it('limit: negative', function () {
        var queryNormalizer = Person.buildQueryNormalizer({
            limit: -100
        });

        assert.propertyVal(queryNormalizer, 'limit', -1);
    });

    it('offset: +Infinity/-Infinity', function () {
        var queryNormalizer = Person.buildQueryNormalizer({
            offset: Infinity
        });

        assert.propertyVal(queryNormalizer, 'offset', 0);
    });

    it('offset: negative', function () {
        var queryNormalizer = Person.buildQueryNormalizer({
            offset: -100
        });

        assert.propertyVal(queryNormalizer, 'offset', 0);
    });

    xit('orderBy', function () {

    });

    xit('groupBy', function () {

    });
  });
});

if (require.main === module) {
  test.run(console.DEBUG);
  process.exit();
}
