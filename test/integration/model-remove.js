var helper   = require('../support/spec_helper');

describe("Model.remove()", function() {
  var db = null;
  var Person = null;

  var setup = function () {
    return function () {
      Person = db.define("person", {
        name   : String
      });

      return helper.dropSync(Person, function () {
        Person.create([{
          id  : 1,
          name: "Jeremy Doe"
        }, {
          id  : 2,
          name: "John Doe"
        }, {
          id  : 3,
          name: "Jane Doe"
        }]);
      });
    };
  };

  before(function () {
    db = helper.connect();
  });

  after(function () {
    return db.close();
  });

  describe("runnable", function () {
    beforeEach(setup());

    it('remove all', () => {
      assert.equal(Person.count(), 3);

      Person.remove();
      assert.equal(Person.count(), 0);
    });

    it('remove with conditions', () => {
      assert.equal(Person.count(), 3);

      Person.remove({
        where: {
          id: {
            [Person.Op.gt]: 1
          }
        }
      });
      assert.equal(Person.count(), 1);
      var rest_people = Person.find();

      assert.equal(rest_people.length, 1);
      assert.equal(rest_people[0].id, 1);
    });
  });

  xdescribe("mockable", function() {
    before(setup());

    it("remove should be writable", function() {
      var John = new Person({
        name: "John"
      });
      var removeCalled = false;
      John.remove = function() {
        removeCalled = true;
      };
      John.remove();
      assert.equal(removeCalled,true);
    });

    it("remove should be writable", function() {
      var John = new Person({
        name: "John"
      });
      var removeCalled = false;
      John.remove = function() {
        removeCalled = true;
      };
      John.remove(function (err) {
        assert.equal(err, null);
        assert.equal(removeCalled,true);
      });
    });
  });
});