var helper = require('../support/spec_helper');
var async = require('async');
var common = require('../common');

describe("hasOne - callback", function () {
  var db = null;
  var Person = null;
  var Pet = null;

  var setup = function () {
    return function (done) {
      Person = db.define('person', {
        name: String
      });
      Pet = db.define('pet', {
        name: String
      });
      Person.hasOne('pet', Pet, {
        reverse: 'owners',
        field: 'pet_id'
      });

      return helper.dropSync([Person, Pet], function () {
        // Running in series because in-memory sqlite encounters problems
        async.series([
          Person.create.bind(Person, { name: "John Doe" }),
          Person.create.bind(Person, { name: "Jane Doe" }),
          Pet.create.bind(Pet, { name: "Deco"  }),
          Pet.create.bind(Pet, { name: "Fido"  })
        ], done);
      });
    };
  };

  before(function (done) {
    helper.connect(function (connection) {
      db = connection;
      done();
    });
  });

  describe("reverse", function () {
    removeHookRun = false;

    before(setup({
      hooks: {
        beforeRemove: function () {
          removeHookRun = true;
        }
      }
    }));

    it("should create methods in both models", function (done) {
      var person = Person(1);
      var pet = Pet(1);

      assert.isFunction(person.getPet);
      assert.isFunction(person.setPet);
      assert.isFunction(person.removePet);
      assert.isFunction(person.hasPet);

      assert.isFunction(pet.getOwners);
      assert.isFunction(pet.setOwners);
      assert.isFunction(pet.hasOwners);

      return done();
    });

    describe(".getAccessor()", function () {
      it("should work", function (done) {
        Person.find({ name: "John Doe" }).first(function (err, John) {
          Pet.find({ name: "Deco" }).first(function (err, Deco) {
            Deco.hasOwners(function (err, has_owner) {
              assert.notExist(err);
              assert.isFalse(has_owner);

              Deco.setOwners(John, function (err) {
                assert.notExist(err);

                Deco.getOwners(function (err, JohnCopy) {
                  assert.notExist(err);
                  assert.ok(Array.isArray(JohnCopy));
                  assert.deepEqual(John, JohnCopy[0]);

                  return done();
                });
              });
            });
          });
        });
      });
      

      describe("Chain", function () {
        before(function (done) {
          var petParams = [
            { name: "Hippo" },
            { name: "Finch", owners: [{ name: "Harold" }, { name: "Hagar" }] },
            { name: "Fox",   owners: [{ name: "Nelly"  }, { name: "Narnia" }] }
          ];

          Pet.create(petParams, function (err, pets) {
            assert.notExist(err);
            assert.equal(pets.length, 3);

            Person.find({ name: ["Harold", "Hagar", "Nelly", "Narnia"] }, function (err, people) {
              assert.notExist(err);
              assert.exist(people);
              assert.equal(people.length, 4);

              done();
            });
          });
        });

        it("should be returned if no callback is passed", function (done) {
          Pet.one(function (err, pet) {
            assert.notExist(err);
            assert.exist(pet);

            var chain = pet.getOwners();

            assert.equal(typeof chain,     'object');
            assert.equal(typeof chain.run, 'function');

            done()
          });
        });

        it(".remove() should not call hooks", function (done) {
          Pet.one({ name: "Finch" }, function (err, pet) {
            assert.notExist(err);
            assert.exist(pet);

            assert.equal(removeHookRun, false);
            pet.getOwners().remove(function (err) {
              assert.notExist(err);
              assert.equal(removeHookRun, false);

              Person.find({ name: "Harold" }, function (err, items) {
                assert.notExist(err);
                assert.equal(items.length, 0);
                done();
              });
            });
          });
        });

      });
    });

    it("should be able to set an array of people as the owner", function (done) {
      Person.find({ name: ["John Doe", "Jane Doe"] }, function (err, owners) {
        assert.notExist(err);

        Pet.find({ name: "Fido" }).first(function (err, Fido) {
          assert.notExist(err);

          Fido.hasOwners(function (err, has_owner) {
            assert.notExist(err);
            assert.isFalse(has_owner);
            
            Fido.setOwners(owners, function (err) {
              assert.notExist(err);

              Fido.getOwners(function (err, ownersCopy) {
                assert.notExist(err);
                assert.ok(Array.isArray(owners));
                assert.equal(owners.length, 2);

                // Don't know which order they'll be in.
                var idProp = common.protocol() == 'mongodb' ? '_id' : 'id'

                if (owners[0][idProp] == ownersCopy[0][idProp]) {
                  assert.deepEqual(owners[0], ownersCopy[0]);
                  assert.deepEqual(owners[1], ownersCopy[1]);
                } else {
                  assert.deepEqual(owners[0], ownersCopy[1]);
                  assert.deepEqual(owners[1], ownersCopy[0]);
                }

                return done();
              });
            });
          });
        });
      });
    });
    
    // broken in mongo
    if (common.protocol() != "mongodb") {
      describe("findBy()", function () {
        before(setup());

        before(function (done) {
          Person.one({ name: "Jane Doe" }, function (err, jane) {
            Pet.one({ name: "Deco" }, function (err, deco) {
              deco.setOwners(jane, function (err) {
                assert.notExist(err);
                done();
              });
            });
          });
        });

        it("should throw if no conditions passed", function (done) {
            assert.throws(() => {
                Pet.findByOwners(function () {});
            });
            return done();
        });

        it("should lookup reverse Model based on associated model properties", function (done) {
          Pet.findByOwners({
            name: "Jane Doe"
          }, function (err, pets) {
            assert.notExist(err);
            assert.equal(Array.isArray(pets), true);

            // This often fails for sqlite on travis
            if (common.isTravis() && common.protocol() != 'sqlite') {
              assert.equal(pets.length, 1);
              assert.equal(pets[0].name, 'Deco');
            }

            return done();
          });
        });

        it("should return a ChainFind if no callback passed", function (done) {
          var ChainFind = Pet.findByOwners({
            name: "John Doe"
          });
          assert.isFunction(ChainFind.run);

          return done();
        });
      });
    }
  });

  describe("reverse find", function () {
    it("should be able to find given an association id", function (done) {
      common.retry(setup(), function (done) {
        Person.find({ name: "John Doe" }).first(function (err, John) {
          assert.notExist(err);
          assert.exist(John);
          Pet.find({ name: "Deco" }).first(function (err, Deco) {
            assert.notExist(err);
            assert.exist(Deco);
            Deco.hasOwners(function (err, has_owner) {
              assert.notExist(err);
              assert.isFalse(has_owner);

              Deco.setOwners(John, function (err) {
                assert.notExist(err);

                Person.find({ pet_id: Deco[Pet.id[0]] }).first(function (err, owner) {
                  assert.notExist(err);
                  assert.exist(owner);
                  assert.equal(owner.name, John.name);
                  done();
                });

              });
            });
          });
        });
      }, 3, done);
    });

    it("should be able to find given an association instance", function (done) {
      common.retry(setup(), function (done) {
        Person.find({ name: "John Doe" }).first(function (err, John) {
          assert.notExist(err);
          assert.exist(John);
          Pet.find({ name: "Deco" }).first(function (err, Deco) {
            assert.notExist(err);
            assert.exist(Deco);
            Deco.hasOwners(function (err, has_owner) {
              assert.notExist(err);
              assert.isFalse(has_owner);

              Deco.setOwners(John, function (err) {
                assert.notExist(err);

                Person.find({ pet: Deco }).first(function (err, owner) {
                  assert.notExist(err);
                  assert.exist(owner);
                  assert.equal(owner.name, John.name);
                  done();
                });

              });
            });
          });
        });
      }, 3, done);
    });

    it("should be able to find given a number of association instances with a single primary key", function (done) {
      common.retry(setup(), function (done) {
        Person.find({ name: "John Doe" }).first(function (err, John) {
          assert.notExist(err);
          assert.exist(John);
          Pet.all(function (err, pets) {
            assert.notExist(err);
            assert.exist(pets);
            assert.equal(pets.length, 2);

            pets[0].hasOwners(function (err, has_owner) {
              assert.notExist(err);
              assert.isFalse(has_owner);

              pets[0].setOwners(John, function (err) {
                assert.notExist(err);

                Person.find({ pet: pets }, function (err, owners) {
                  assert.notExist(err);
                  assert.exist(owners);
                  assert.equal(assert.length, 1);

                  assert.equal(owners[0].name, John.name);
                  done();
                });
              });
            });
          });
        });
      }, 3, done);
    });
  });
});