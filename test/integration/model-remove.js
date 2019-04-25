var helper   = require('../support/spec_helper');

describe("Model.removeSync()", function() {
  var db = null;
  var Person = null;

  var setup = function () {
    return function (done) {
      Person = db.define("person", {
        name   : String
      });

      return helper.dropSync(Person, function () {
        Person.createSync([{
          id  : 1,
          name: "Jeremy Doe"
        }, {
          id  : 2,
          name: "John Doe"
        }, {
          id  : 3,
          name: "Jane Doe"
        }]);

        done();
      });
    };
  };

  before(function () {
    db = helper.connect();
  });

  after(function () {
    return db.close();
  });

  describe("mockable", function() {
    before(setup());

    it("remove should be writable", function() {
      var John = new Person({
        name: "John"
      });
      var removeCalled = false;
      John.removeSync = function() {
        removeCalled = true;
      };
      John.removeSync();
      assert.equal(removeCalled,true);
    });

    it("removeSync should be writable", function() {
      var John = new Person({
        name: "John"
      });
      var removeCalled = false;
      John.removeSync = function() {
        removeCalled = true;
      };
      John.remove(function (err) {
        assert.equal(err, null);
        assert.equal(removeCalled,true);
      });
    });
  });
});