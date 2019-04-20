var helper = require('../support/spec_helper');

describe("hasOne - callback", function() {
  var db     = null;
  var Person = null;

  var setup = function (required) {
    return function (done) {
      db.settings.set('instance.identityCache', false);
      db.settings.set('instance.returnAllErrors', true);

      Person = db.define('person', {
        name     : String
      });
      Person.hasOne('parent', Person, {
        required : required,
        field    : 'parentId'
      });

      return helper.dropSync(Person, done);
    };
  };

  before(function(done) {
    helper.connect(function (connection) {
      db = connection;
      done();
    });
  });

  describe("required", function () {
    before(setup(true));

    it("should not accept empty association", function (done) {
      var John = new Person({
        name     : "John",
        parentId : null
      });
      John.save(function (errors) {
        assert.exist(errors);
        assert.equal(errors.length, 1);
        assert.equal(errors[0].type,     'validation');
        assert.equal(errors[0].msg,      'required');
        assert.equal(errors[0].property, 'parentId');
        return done();
      });
    });

    it("should accept association", function (done) {
      var John = new Person({
        name     : "John",
        parentId : 1
      });
      John.save(function (err) {
        assert.notExist(err);
        return done();
      });
    });
  });

  describe("not required", function () {
    before(setup(false));

    it("should accept empty association", function (done) {
      var John = new Person({
        name : "John"
      });
      John.save(function (err) {
        assert.notExist(err);
        return done();
      });
    });

    it("should accept null association", function (done) {
      var John = new Person({
        name      : "John",
        parent_id : null
      });
      John.save(function (err) {
        assert.notExist(err);
        return done();
      });
    });
  });
});