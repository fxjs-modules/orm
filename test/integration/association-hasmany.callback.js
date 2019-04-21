var helper   = require('../support/spec_helper');
var common   = require('../common');
var protocol = common.protocol();

describe("hasMany - callback", function () {
  var db     = null;
  var Person = null;
  var Pet    = null;

  before(function(done) {
    helper.connect(function (connection) {
      db = connection;
      done();
    });
  });

  describe("normal", function () {

    var setup = function (opts) {
      opts = opts || {};

      return function (done) {
        db.settings.set('instance.identityCache', false);

        Person = db.define('person', {
          name    : String,
          surname : String,
          age     : Number
        });
        Pet = db.define('pet', {
          name    : String
        });
        Person.hasMany('pets', Pet, {}, { autoFetch: opts.autoFetchPets });

        helper.dropSync([ Person, Pet], function (err) {
          assert.notExist(err);

          Pet.create([{ name: "Cat" }, { name: "Dog" }], function (err) {
            assert.notExist(err);

            /**
             * John --+---> Deco
             *        '---> Mutt <----- Jane
             *
             * Justin
             */
            Person.create([
              {
                name    : "Bob",
                surname : "Smith",
                age     : 30
              },
              {
                name    : "John",
                surname : "Doe",
                age     : 20,
                pets    : [{
                  name    : "Deco"
                }, {
                  name    : "Mutt"
                }]
              }, {
                name    : "Jane",
                surname : "Doe",
                age     : 16
              }, {
                name    : "Justin",
                surname : "Dean",
                age     : 18
              }
            ], function (err) {
              assert.notExist(err);

              Person.find({ name: "Jane" }, function (err, people) {
                assert.notExist(err);

                Pet.find({ name: "Mutt" }, function (err, pets) {
                  assert.notExist(err);

                  people[0].addPets(pets, done);
                });
              });
            });
          });
        });
      };
    };

    describe("getAccessor", function () {
      before(setup());

      it("should allow to specify order as string", function (done) {
        Person.find({ name: "John" }, function (err, people) {
          assert.equal(err, null);

          people[0].getPets("-name", function (err, pets) {
            assert.equal(err, null);

            assert.ok(Array.isArray(pets));
            assert.equal(pets.length, 2);
            assert.equal(pets[0].model(), Pet);
            assert.equal(pets[0].name, "Mutt");
            assert.equal(pets[1].name, "Deco");

            return done();
          });
        });
      });

       it ("should return proper instance model", function(done){
         Person.find({ name: "John" }, function (err, people) {
          people[0].getPets("-name", function (err, pets) {
            assert.equal(pets[0].model(), Pet);
            return done();
          });
        });
       });

      it("should allow to specify order as Array", function (done) {
        Person.find({ name: "John" }, function (err, people) {
          assert.equal(err, null);

          people[0].getPets([ "name", "Z" ], function (err, pets) {
            assert.equal(err, null);

            assert.ok(Array.isArray(pets));
            assert.equal(pets.length, 2);
            assert.equal(pets[0].name, "Mutt");
            assert.equal(pets[1].name, "Deco");

            return done();
          });
        });
      });

      it("should allow to specify a limit", function (done) {
        Person.find({ name: "John" }).first(function (err, John) {
          assert.equal(err, null);

          John.getPets(1, function (err, pets) {
            assert.equal(err, null);

            assert.ok(Array.isArray(pets));
            assert.equal(pets.length, 1);

            return done();
          });
        });
      });

      it("should allow to specify conditions", function (done) {
        Person.find({ name: "John" }).first(function (err, John) {
          assert.equal(err, null);

          John.getPets({ name: "Mutt" }, function (err, pets) {
            assert.equal(err, null);

            assert.ok(Array.isArray(pets));
            assert.equal(pets.length, 1);
            assert.equal(pets[0].name, "Mutt");

            return done();
          });
        });
      });

      if (common.protocol() == "mongodb") return;

      it("should return a chain if no callback defined", function (done) {
        Person.find({ name: "John" }, function (err, people) {
          assert.equal(err, null);

          var chain = people[0].getPets({ name: "Mutt" });

          assert.isObject(chain);
          assert.isFunction(chain.find);
          assert.isFunction(chain.only);
          assert.isFunction(chain.limit);
          assert.isFunction(chain.order);

          return done();
        });
      });

      it("should allow chaining count()", function (done) {
        Person.find({}, function (err, people) {
          assert.equal(err, null);

          people[1].getPets().count(function (err, count) {
            assert.notExist(err);

            assert.strictEqual(count, 2);

            people[2].getPets().count(function (err, count) {
              assert.notExist(err);

              assert.strictEqual(count, 1);

              people[3].getPets().count(function (err, count) {
                assert.notExist(err);

                assert.strictEqual(count, 0);

                return done();
              });
            });
          });
        });
      });
    });

    describe("hasAccessor", function () {
      before(setup());

      it("should return true if instance has associated item", function (done) {
        Pet.find({ name: "Mutt" }, function (err, pets) {
          assert.equal(err, null);

          Person.find({ name: "Jane" }).first(function (err, Jane) {
            assert.equal(err, null);

            Jane.hasPets(pets[0], function (err, has_pets) {
              assert.equal(err, null);
              assert.isTrue(has_pets);

              return done();
            });
          });
        });
      });

      it("should return true if not passing any instance and has associated items", function (done) {
        Person.find({ name: "Jane" }).first(function (err, Jane) {
          assert.equal(err, null);

          Jane.hasPets(function (err, has_pets) {
            assert.equal(err, null);
            assert.isTrue(has_pets);

            return done();
          });
        });
      });

      it("should return true if all passed instances are associated", function (done) {
        Pet.find({ or: [{ name: 'Deco'}, { name: 'Mutt'}]}, function (err, pets) {
          Person.find({ name: "John" }).first(function (err, John) {
            assert.equal(err, null);

            John.hasPets(pets, function (err, has_pets) {
              assert.equal(err, null);
              assert.isTrue(has_pets);

              return done();
            });
          });
        });
      });

      it("should return false if any passed instances are not associated", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "Jane" }).first(function (err, Jane) {
            assert.equal(err, null);

            Jane.hasPets(pets, function (err, has_pets) {
              assert.equal(err, null);
              assert.isFalse(has_pets);

              return done();
            });
          });
        });
      });

      if (common.protocol() != "mongodb") {
        it("should return true if join table has duplicate entries", function (done) {
          Pet.find({ name: ["Mutt", "Deco"] }, function (err, pets) {
            assert.notExist(err);
            assert.equal(pets.length, 2);

            Person.find({ name: "John" }).first(function (err, John) {
              assert.notExist(err);

              John.hasPets(pets, function (err, hasPets) {
                assert.equal(err, null);
                assert.equal(hasPets, true);

                db.driver.execQuery(
                  "INSERT INTO person_pets (person_id, pets_id) VALUES (?,?), (?,?)",
                  [John.id, pets[0].id, John.id, pets[1].id],
                  function (err) {
                    assert.notExist(err);

                    John.hasPets(pets, function (err, hasPets) {
                      assert.equal(err, null);
                      assert.equal(hasPets, true);

                      done()
                    });
                  }
                );
              });
            });
          });
        });
        it("should return true if join table has duplicate entries (promise-based)", function (done) {
          Pet.find({ name: ["Mutt", "Deco"] }, function (err, pets) {
            assert.notExist(err);
            assert.equal(pets.length, 2);

            Person.find({ name: "John" }).first(function (err, John) {
                assert.notExist(err);

                var hasPets = John.hasPetsSync(pets)
                assert.equal(hasPets, true);

                db.driver.execQuerySync(
                    "INSERT INTO person_pets (person_id, pets_id) VALUES (?,?), (?,?)",
                    [John.id, pets[0].id, John.id, pets[1].id]
                );

                var hasPets = John.hasPetsSync(pets)
                assert.equal(hasPets, true);

                done();
            });
          });
        });
      }
    });

    describe("delAccessor", function () {
      before(setup());

      it("should accept arguments in different orders", function (done) {
        Pet.find({ name: "Mutt" }, function (err, pets) {
          Person.find({ name: "John" }, function (err, people) {
            assert.equal(err, null);

            people[0].removePets(function (err) {
              assert.equal(err, null);

              people[0].getPets(function (err, pets) {
                assert.equal(err, null);

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
                assert.equal(pets[0].name, "Deco");

                return done();
              });
            }, pets[0]);
          });
        });
      });

      it("should remove specific associations if passed", function (done) {
        Pet.find({ name: "Mutt" }, function (err, pets) {
          Person.find({ name: "John" }, function (err, people) {
            assert.equal(err, null);

            people[0].removePets(pets[0], function (err) {
              assert.equal(err, null);

              people[0].getPets(function (err, pets) {
                assert.equal(err, null);

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
                assert.equal(pets[0].name, "Deco");

                return done();
              });
            });
          });
        });
      });

      it("should remove all associations if none passed", function (done) {
        Person.find({ name: "John" }).first(function (err, John) {
          assert.equal(err, null);

          John.removePets(function (err) {
            assert.equal(err, null);

            John.getPets(function (err, pets) {
              assert.equal(err, null);

              assert.ok(Array.isArray(pets));
              assert.equal(pets.length, 0);

              return done();
            });
          });
        });
      });
    });

    describe("addAccessor", function () {
      before(setup());

      if (common.protocol() != "mongodb") {
        it("might add duplicates", function (done) {
          Pet.find({ name: "Mutt" }, function (err, pets) {
            Person.find({ name: "Jane" }, function (err, people) {
              assert.equal(err, null);

              people[0].addPets(pets[0], function (err) {
                assert.equal(err, null);

                people[0].getPets("name", function (err, pets) {
                  assert.equal(err, null);

                  assert.ok(Array.isArray(pets));
                  assert.equal(pets.length, 2);
                  assert.equal(pets[0].name, "Mutt");
                  assert.equal(pets[1].name, "Mutt");

                  return done();
                });
              });
            });
          });
        });
      }

      it("should keep associations and add new ones", function (done) {
        Pet.find({ name: "Deco" }).first(function (err, Deco) {
          Person.find({ name: "Jane" }).first(function (err, Jane) {
            assert.equal(err, null);

            Jane.getPets(function (err, janesPets) {
              assert.notExist(err);

              var petsAtStart = janesPets.length;

              Jane.addPets(Deco, function (err) {
                assert.equal(err, null);

                Jane.getPets("name", function (err, pets) {
                  assert.equal(err, null);

                  assert.ok(Array.isArray(pets));
                  assert.equal(pets.length, petsAtStart + 1);
                  assert.equal(pets[0].name, "Deco");
                  assert.equal(pets[1].name, "Mutt");

                  return done();
                });
              });
            });
          });
        });
      });

      it("should accept several arguments as associations", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "Justin" }).first(function (err, Justin) {
            assert.equal(err, null);

            Justin.addPets(pets[0], pets[1], function (err) {
              assert.equal(err, null);

              Justin.getPets(function (err, pets) {
                assert.equal(err, null);

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 2);

                return done();
              });
            });
          });
        });
      });

      it("should accept array as list of associations", function (done) {
        Pet.create([{ name: 'Ruff' }, { name: 'Spotty' }],function (err, pets) {
          Person.find({ name: "Justin" }).first(function (err, Justin) {
            assert.equal(err, null);

            Justin.getPets(function (err, justinsPets) {
              assert.equal(err, null);

              var petCount = justinsPets.length;

              Justin.addPets(pets, function (err) {
                assert.equal(err, null);

                Justin.getPets(function (err, justinsPets) {
                  assert.equal(err, null);

                  assert.ok(Array.isArray(justinsPets));
                  // Mongo doesn't like adding duplicates here, so we add new ones.
                  assert.equal(justinsPets.length, petCount + 2);

                  return done();
                });
              });
            });
          });
        });
      });

      it("should throw if no items passed", function (done) {
        Person.one(function (err, person) {
          assert.equal(err, null);

          assert.throws(() => {
            person.addPets(function () {});
          });

          return done();
        });
      });
    });

    describe("setAccessor", function () {
      before(setup());

      it("should accept several arguments as associations", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "Justin" }).first(function (err, Justin) {
            assert.equal(err, null);

            Justin.setPets(pets[0], pets[1], function (err) {
              assert.equal(err, null);

              Justin.getPets(function (err, pets) {
                assert.equal(err, null);

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 2);

                return done();
              });
            });
          });
        });
      });

      it("should accept an array of associations", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "Justin" }).first(function (err, Justin) {
            assert.equal(err, null);

            Justin.setPets(pets, function (err) {
              assert.equal(err, null);

              Justin.getPets(function (err, all_pets) {
                assert.equal(err, null);

                assert.ok(Array.isArray(all_pets));
                assert.equal(all_pets.length, pets.length);

                return done();
              });
            });
          });
        });
      });

      it("should remove all associations if an empty array is passed", function (done) {
        Person.find({ name: "Justin" }).first(function (err, Justin) {
          assert.equal(err, null);
          Justin.getPets(function (err, pets) {
            assert.equal(err, null);
            assert.equal(pets.length, 4);

            Justin.setPets([], function (err) {
              assert.equal(err, null);

              Justin.getPets(function (err, pets) {
                assert.equal(err, null);
                assert.equal(pets.length, 0);

                return done();
              });
            });
          });
        });
      });

      it("clears current associations", function (done) {
        Pet.find({ name: "Deco" }, function (err, pets) {
          var Deco = pets[0];

          Person.find({ name: "Jane" }).first(function (err, Jane) {
            assert.equal(err, null);

            Jane.getPets(function (err, pets) {
              assert.equal(err, null);

              assert.ok(Array.isArray(pets));
              assert.equal(pets.length, 1);
              assert.equal(pets[0].name, "Mutt");

              Jane.setPets(Deco, function (err) {
                assert.equal(err, null);

                Jane.getPets(function (err, pets) {
                  assert.equal(err, null);

                  assert.ok(Array.isArray(pets));
                  assert.equal(pets.length, 1);
                  assert.equal(pets[0].name, Deco.name);

                  return done();
                });
              });
            });
          });
        });
      });
    });

    describe("with autoFetch turned on", function () {
      before(setup({
        autoFetchPets : true
      }));

      it("should fetch associations", function (done) {
        Person.find({ name: "John" }).first(function (err, John) {
          assert.equal(err, null);

          assert.property(John, "pets");
          assert.ok(Array.isArray(John.pets));
          assert.equal(John.pets.length, 2);

          return done();
        });
      });

      it("should save existing", function (done) {
        Person.create({ name: 'Bishan' }, function (err) {
          assert.notExist(err);

          Person.one({ name: 'Bishan' }, function (err, person) {
            assert.notExist(err);

            person.surname = 'Dominar';

            person.save(function (err) {
              assert.notExist(err);

              done();
            });
          });
        });
      });

      it("should not auto save associations which were autofetched", function (done) {
        Pet.all(function (err, pets) {
          assert.notExist(err);
          assert.equal(pets.length, 4);

          Person.create({ name: 'Paul' }, function (err, paul) {
            assert.notExist(err);

            Person.one({ name: 'Paul' }, function (err, paul2) {
              assert.notExist(err);
              assert.equal(paul2.pets.length, 0);

              paul.setPets(pets, function (err) {
                assert.notExist(err);

                // reload paul to make sure we have 2 pets
                Person.one({ name: 'Paul' }, function (err, paul) {
                  assert.notExist(err);
                  assert.equal(paul.pets.length, 4);

                  // Saving paul2 should NOT auto save associations and hence delete
                  // the associations we just created.
                  paul2.save(function (err) {
                    assert.notExist(err);

                    // let's check paul - pets should still be associated
                    Person.one({ name: 'Paul' }, function (err, paul) {
                      assert.notExist(err);
                      assert.equal(paul.pets.length, 4);

                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });

      it("should save associations set by the user", function (done) {
        Person.one({ name: 'John' }, function (err, john) {
          assert.notExist(err);
          assert.equal(john.pets.length, 2);

          john.pets = [];

          john.save(function (err) {
            assert.notExist(err);

            // reload john to make sure pets were deleted
            Person.one({ name: 'John' }, function (err, john) {
              assert.notExist(err);
              assert.equal(john.pets.length, 0);

              done();
            });
          });
        });
      });

    });
  });

  if (protocol == "mongodb") return;

  describe("with non-standard keys", function () {
    var Email;
    var Account;

    setup = function (opts, done) {
      Email = db.define('email', {
        text         : { type: 'text', key: true, required: true },
        bounced      : Boolean
      });

      Account = db.define('account', {
        name: String
      });

      Account.hasMany('emails', Email, {}, { key: opts.key });

      helper.dropSync([ Email, Account ], function (err) {
        assert.notExist(err);
        done()
      });
    };

    it("should place ids in the right place", function (done) {
      setup({}, function (err) {
        assert.notExist(err);

        Email.create([{bounced: true, text: 'a@test.com'}, {bounced: false, text: 'z@test.com'}], function (err, emails) {
          assert.notExist(err);

          Account.create({ name: "Stuff" }, function (err, account) {
            assert.notExist(err);

            account.addEmails(emails[1], function (err) {
              assert.notExist(err);

              db.driver.execQuery("SELECT * FROM account_emails", function (err, data) {
                assert.notExist(err);

                assert.equal(data[0].account_id, 1);
                assert.equal(data[0].emails_text, 'z@test.com');

                done();
              });
            });
          });
        });
      });
    });

    it("should generate correct tables", function (done) {
      setup({}, function (err) {
        assert.notExist(err);

        var sql;

        if (protocol == 'sqlite') {
          sql = "PRAGMA table_info(?)";
        } else {
          sql = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? ORDER BY data_type";
        }

        db.driver.execQuery(sql, ['account_emails'], function (err, cols) {
          assert.notExist(err);

          if (protocol == 'sqlite') {
            assert.equal(cols[0].name, 'account_id');
            assert.equal(cols[0].type, 'INTEGER');
            assert.equal(cols[1].name, 'emails_text');
            assert.equal(cols[1].type, 'TEXT');
          } else if (protocol == 'mysql') {
            assert.equal(cols[0].column_name, 'account_id');
            assert.equal(cols[0].data_type,   'int');
            assert.equal(cols[1].column_name, 'emails_text');
            assert.equal(cols[1].data_type,    'varchar');
          } else if (protocol == 'postgres') {
            assert.equal(cols[0].column_name, 'account_id');
            assert.equal(cols[0].data_type,   'integer');
            assert.equal(cols[1].column_name, 'emails_text');
            assert.equal(cols[1].data_type,   'text');
          }

          done();
        });
      });
    });

    it("should add a composite key to the join table if requested", function (done) {
      setup({ key: true }, function (err) {
        assert.notExist(err);
        var sql;

        if (protocol == 'postgres' || protocol === 'redshift') {
          sql = "" +
            "SELECT c.column_name, c.data_type " +
            "FROM  information_schema.table_constraints tc " +
            "JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name) " +
            "JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema AND tc.table_name = c.table_name AND ccu.column_name = c.column_name " +
            "WHERE constraint_type = ? AND tc.table_name = ? " +
            "ORDER BY column_name";

          db.driver.execQuery(sql, ['PRIMARY KEY', 'account_emails'], function (err, data) {
            assert.notExist(err);

            assert.equal(data.length, 2);
            assert.equal(data[0].column_name, 'account_id');
            assert.equal(data[1].column_name, 'emails_text');

            done()
          });
        } else if (protocol == 'mysql') {
          db.driver.execQuery("SHOW KEYS FROM ?? WHERE Key_name = ?", ['account_emails', 'PRIMARY'], function (err, data) {
            assert.notExist(err);

            assert.equal(data.length, 2);
            assert.equal(data[0].Column_name, 'account_id');
            assert.equal(data[0].Key_name, 'PRIMARY');
            assert.equal(data[1].Column_name, 'emails_text');
            assert.equal(data[1].Key_name, 'PRIMARY');

            done();
          });
        } else if (protocol == 'sqlite') {
          db.driver.execQuery("pragma table_info(??)", ['account_emails'], function (err, data) {
            assert.notExist(err);

            assert.equal(data.length, 2);
            assert.equal(data[0].name, 'account_id');
            assert.equal(data[0].pk, 1);
            assert.equal(data[1].name, 'emails_text');
            assert.equal(data[1].pk, 2);

            done();
          });
        }
      });
    });
  });
});