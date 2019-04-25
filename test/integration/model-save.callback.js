var helper   = require('../support/spec_helper');
var common   = require('../common');

describe("Model.save() - callback", function() {
  var db = null;
  var Person = null;

  var setup = function (nameDefinition, opts) {
    opts = opts || {};

    return function (done) {
      Person = db.define("person", {
        name   : nameDefinition || String
      }, opts || {});

      Person.hasOne("parent", Person, opts.hasOneOpts);
      if ('saveAssociationsByDefault' in opts) {
        Person.settings.set(
          'instance.saveAssociationsByDefault', opts.saveAssociationsByDefault
        );
      }

      return helper.dropSync(Person, done);
    };
  };

  before(function (done) {
    helper.connect(function (connection) {
      db = connection;

      return done();
    });
  });

  after(function () {
    return db.close();
  });

  describe("if properties have default values", function () {
    before(setup({ type: "text", defaultValue: "John" }));

    it("should use it if not defined", function (done) {
      var John = new Person();

      John.save(function (err) {
        assert.equal(err, null);
        assert.equal(John.name, "John");

        return done();
      });
    });
  });

  describe("with callback", function () {
    before(setup());

    it("should save item and return id", function (done) {
      var John = new Person({
        name: "John"
      });
      John.save(function (err) {
        assert.equal(err, null);
        assert.exist(John[Person.id]);

        Person.get(John[Person.id], function (err, JohnCopy) {
          assert.equal(err, null);

          assert.equal(JohnCopy[Person.id], John[Person.id]);
          assert.equal(JohnCopy.name, John.name);

          return done();
        });
      });
    });
  });

  describe("without callback", function () {
    before(setup());

    it("should still save item and return id", function (done) {
      var John = new Person({
        name: "John"
      });
      John.save();
      John.on("save", function (err) {
        assert.equal(err, null);
        assert.exist(John[Person.id]);

        Person.get(John[Person.id], function (err, JohnCopy) {
          assert.equal(err, null);

          assert.equal(JohnCopy[Person.id], John[Person.id]);
          assert.equal(JohnCopy.name, John.name);

          return done();
        });
      });
    });
  });

  describe("with properties object", function () {
    before(setup());

    it("should update properties, save item and return id", function (done) {
      var John = new Person({
        name: "Jane"
      });
      John.save({ name: "John" }, function (err) {
        assert.equal(err, null);
        assert.exist(John[Person.id]);
        assert.equal(John.name, "John");

        Person.get(John[Person.id], function (err, JohnCopy) {
          assert.equal(err, null);

          assert.equal(JohnCopy[Person.id], John[Person.id]);
          assert.equal(JohnCopy.name, John.name);

          return done();
        });
      });
    });
  });

  describe("with unknown argument type", function () {
    before(setup());

    it("should should throw", function (done) {
      var John = new Person({
        name: "Jane"
      });
      assert.throws(() => {
        John.save("will-fail");
      })

      return done();
    });
  });

  describe("if passed an association instance", function () {
    before(setup());

    it("should save association first and then save item and return id", function (done) {
      var Jane = new Person({
        name  : "Jane"
      });
      var John = new Person({
        name  : "John",
        parent: Jane
      });
      John.save(function (err) {
        assert.equal(err, null);
        assert.isTrue(John.saved());
        assert.isTrue(Jane.saved());

        assert.exist(John[Person.id]);
        assert.exist(Jane[Person.id]);

        return done();
      });
    });
  });

  describe("if passed an association object", function () {
    before(setup());

    it("should save association first and then save item and return id", function (done) {
      var John = new Person({
        name  : "John",
        parent: {
          name  : "Jane"
        }
      });
      John.save(function (err) {
        assert.equal(err, null);
        assert.isTrue(John.saved());
        assert.isTrue(John.parent.saved());

        assert.exist(John[Person.id]);
        assert.exist(John.parent[Person.id]);
        assert.equal(John.parent.name, "Jane");

        return done();
      });
    });
  });

  describe("if autoSave is on", function () {
    before(setup(null, { autoSave: true }));

    it("should save the instance as soon as a property is changed", function (done) {
      var John = new Person({
        name : "Jhon"
      });
      John.save(function (err) {
        assert.equal(err, null);

        John.on("save", function () {
          return done();
        });

        John.name = "John";
      });
    });
  });

  describe("with saveAssociations", function () {
    var afterSaveCalled = false;

    if (common.protocol() == 'mongodb') return;

    describe("default on in settings", function () {
      beforeEach(function (done) {
        function afterSave () {
          afterSaveCalled = true;
        }
        var hooks = { afterSave: afterSave };

        setup(null, { hooks: hooks, cache: false, hasOneOpts: { autoFetch: true } })(function (err) {
          assert.notExist(err);

          Person.create({ name: 'Olga' }, function (err, olga) {
            assert.notExist(err);

            assert.exist(olga);
            Person.create({ name: 'Hagar', parent_id: olga.id }, function (err, hagar) {
              assert.notExist(err);
              assert.exist(hagar);
              afterSaveCalled = false;
              done();
            });
          });
        });
      });

      it("should be on", function () {
        assert.equal(Person.settings.get('instance.saveAssociationsByDefault'), true);
      });

      it("off should not save associations but save itself", function (done) {
        Person.one({ name: 'Hagar' }, function (err, hagar) {
          assert.notExist(err);
          assert.exist(hagar.parent);

          hagar.parent.name = 'Olga2';
          hagar.save({name: 'Hagar2'}, { saveAssociations: false }, function (err) {
            assert.notExist(err);
            assert.equal(afterSaveCalled, true);

            Person.get(hagar.parent.id, function (err, olga) {
              assert.notExist(err);
              assert.equal(olga.name, 'Olga');
              done();
            });
          });
        });
      });

      it("off should not save associations or itself if there are no changes", function (done) {
        Person.one({ name: 'Hagar' }, function (err, hagar) {
          assert.notExist(err);

          hagar.save({}, { saveAssociations: false }, function (err) {
            assert.notExist(err);
            assert.equal(afterSaveCalled, false);

            Person.get(hagar.parent.id, function (err, olga) {
              assert.notExist(err);
              assert.equal(olga.name, 'Olga');
              done();
            });
          });
        });
      });

      it("unspecified should save associations and itself", function (done) {
        Person.one({ name: 'Hagar' }, function (err, hagar) {
          assert.notExist(err);
          assert.exist(hagar.parent);

          hagar.parent.name = 'Olga2';
          hagar.save({name: 'Hagar2'}, function (err) {
            assert.notExist(err);

            Person.get(hagar.parent.id, function (err, olga) {
              assert.notExist(err);
              assert.equal(olga.name, 'Olga2');

              Person.get(hagar.id, function (err, person) {
                assert.notExist(err);
                assert.equal(person.name, 'Hagar2');

                done();
              });
            });
          });
        });
      });

      it("on should save associations and itself", function (done) {
        Person.one({ name: 'Hagar' }, function (err, hagar) {
          assert.notExist(err);
          assert.exist(hagar.parent);

          hagar.parent.name = 'Olga2';
          hagar.save({name: 'Hagar2'}, { saveAssociations: true }, function (err) {
            assert.notExist(err);

            Person.get(hagar.parent.id, function (err, olga) {
              assert.notExist(err);
              assert.equal(olga.name, 'Olga2');

              Person.get(hagar.id, function (err, person) {
                assert.notExist(err);
                assert.equal(person.name, 'Hagar2');

                done();
              });
            });
          });
        });
      });
    });

    describe("turned off in settings", function () {
      beforeEach(function (done) {
        function afterSave () {
          afterSaveCalled = true;
        }
        var hooks = { afterSave: afterSave };

        setup(null, {
          hooks: hooks, cache: false, hasOneOpts: { autoFetch: true },
          saveAssociationsByDefault: false
        })(function (err) {
          assert.notExist(err);

          Person.create({ name: 'Olga' }, function (err, olga) {
            assert.notExist(err);

            assert.exist(olga);
            Person.create({ name: 'Hagar', parent_id: olga.id }, function (err, hagar) {
              assert.notExist(err);
              assert.exist(hagar);
              afterSaveCalled = false;
              done();
            });
          });
        });
      });

      it("should be off", function () {
        assert.equal(Person.settings.get('instance.saveAssociationsByDefault'), false);
      });

      it("unspecified should not save associations but save itself", function (done) {
        Person.one({ name: 'Hagar' }, function (err, hagar) {
          assert.notExist(err);
          assert.exist(hagar.parent);

          hagar.parent.name = 'Olga2';
          hagar.save({ name: 'Hagar2' }, function (err) {
            assert.notExist(err);

            Person.get(hagar.parent.id, function (err, olga) {
              assert.notExist(err);
              assert.equal(olga.name, 'Olga');

              Person.get(hagar.id, function (err, person) {
                assert.notExist(err);
                assert.equal(person.name, 'Hagar2');

                done();
              });
            });
          });
        });
      });

      it("off should not save associations but save itself", function (done) {
        Person.one({ name: 'Hagar' }, function (err, hagar) {
          assert.notExist(err);
          assert.exist(hagar.parent);

          hagar.parent.name = 'Olga2';
          hagar.save({ name: 'Hagar2' }, { saveAssociations: false }, function (err) {
            assert.notExist(err);
            assert.equal(afterSaveCalled, true);

            Person.get(hagar.parent.id, function (err, olga) {
              assert.notExist(err);
              assert.equal(olga.name, 'Olga');
              done();
            });
          });
        });
      });

      it("on should save associations and itself", function (done) {
        Person.one({ name: 'Hagar' }, function (err, hagar) {
          assert.notExist(err);
          assert.exist(hagar.parent);

          hagar.parent.name = 'Olga2';
          hagar.save({ name: 'Hagar2' }, { saveAssociations: true }, function (err) {
            assert.notExist(err);

            Person.get(hagar.parent.id, function (err, olga) {
              assert.notExist(err);
              assert.equal(olga.name, 'Olga2');

              Person.get(hagar.id, function (err, person) {
                assert.notExist(err);
                assert.equal(person.name, 'Hagar2');

                done();
              });
            });
          });
        });
      });
    });
  });

  describe("with a point property", function () {
    if (common.protocol() == 'sqlite' || common.protocol() == 'mongodb') return;

    it("should save the instance as a geospatial point", function (done) {
      setup({ type: "point" }, null)(function () {
        var John = new Person({
          name: { x: 51.5177, y: -0.0968 }
        });
        John.save(function (err) {
          assert.equal(err, null);

          assert.ok(John.name instanceof Object);
          assert.propertyVal(John.name, 'x', 51.5177);
          assert.propertyVal(John.name, 'y', -0.0968);
          return done();
        });
      });
    });
  });

  describe("mockable", function() {
    before(setup());

    it("save should be writable", function(done) {
      var John = new Person({
        name: "John"
      });
      var saveCalled = false;
      John.save = function(cb) {
        saveCalled = true;
        cb(null);
      };
      John.save(function(err) {
        assert.equal(saveCalled,true);
        return done();
      });
    });

    it("saved should be writable", function(done) {
      var John = new Person({
        name: "John"
      });
      var savedCalled = false;
      John.saved = function() {
        savedCalled = true;
        return true;
      };

      John.saved()
      assert.isTrue(savedCalled);
      done();
    })
  });
});