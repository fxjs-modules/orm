var helper = require('../support/spec_helper');

describe("hasMany hooks - callback", function() {
  var db     = null;
  var Person = null;
  var Pet    = null;

  var setup = function (props, opts) {
    return function (done) {
      db.settings.set('instance.identityCache', false);

      Person = db.define('person', {
        name    : String,
      });
      Pet = db.define('pet', {
        name    : String
      });
      Person.hasMany('pets', Pet, props || {}, opts || {});

      return helper.dropSync([ Person, Pet ], done);
    };
  };

  before(function(done) {
    helper.connect(function (connection) {
      db = connection;
      done();
    });
  });

  describe("beforeSave", function () {
    var had_extra = false;

    before(setup({
      born : Date
    }, {
      hooks : {
        beforeSave: function (extra, next) {
          had_extra = (typeof extra == "object");
          return next();
        }
      }
    }));

    it("should pass extra data to hook if extra defined", function (done) {
      Person.create({
        name    : "John"
      }, function (err, John) {
        Pet.create({
          name : "Deco"
        }, function (err, Deco) {
          John.addPets(Deco, function (err) {
            assert.notExist(err);

            assert.isTrue(had_extra);

            return done();
          });
        });
      });
    });
  });

  describe("beforeSave", function () {
    before(setup({}, {
      hooks : {
        beforeSave: function (next) {
          assert.isFunction(next);
          return next();
        }
      }
    }));

    it("should not pass extra data to hook if extra defined", function (done) {
      Person.create({
        name    : "John"
      }, function (err, John) {
        Pet.create({
          name : "Deco"
        }, function (err, Deco) {
          John.addPets(Deco, function (err) {
            assert.notExist(err);

            return done();
          });
        });
      });
    });
  });

  describe("beforeSave", function () {
    before(setup({}, {
      hooks : {
        beforeSave: function (next) {
          setTimeout(function () {
            return next(new Error('blocked'));
          }, 100);
        }
      }
    }));

    it("should block if error returned", function (done) {
      Person.create({
        name    : "John"
      }, function (err, John) {
        Pet.create({
          name : "Deco"
        }, function (err, Deco) {
          John.addPets(Deco, function (err) {
            assert.exist(err);
            assert.equal(err.message, 'blocked');

            return done();
          });
        });
      });
    });
  });

  describe("beforeSaveAsync", function () {
    var had_extra = false;

    before(setup({
      born : Date
    }, {
      hooks : {
        beforeSave: function (extra) {
          return new Promise(function (resolve) {
            setTimeout(function () {
              had_extra = (typeof extra == "object");
              resolve()
            }, 100);
          });
        }
      }
    }));

    it("should pass extra data to hook if extra defined", function () {
      var John = Person.createSync({
        name    : "John"
      });

      var Deco = Pet.createSync({
        name : "Deco"
      });

      John.addPetsSync(Deco);

      assert.equal(had_extra, true);
    });
  });

  describe("beforeSaveAsync", function () {
    before(setup({}, {
      hooks : {
        beforeSave: function () {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              return reject(new Error('blocked'));
            }, 100);
          });
        }
      }
    }));

    it("should block if error returned", function () {
      var John = Person.createSync({
        name    : "John"
      });
      var Deco = Pet.createSync({
        name : "Deco"
      });

      try {
        John.addPetsSync(Deco);
      } catch (err) {
        assert.exist(err);
        assert.equal(err.message, 'blocked');
      }
    });
  });
});