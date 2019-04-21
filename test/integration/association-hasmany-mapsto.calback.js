var helper = require('../support/spec_helper');
var common = require('../common');

if (common.protocol() == "mongodb") return ;   // Can't do mapsTo testing on mongoDB ()

describe("hasMany with mapsTo - callback", function () {
    var db = null;
    var Person = null;
    var Pet = null;

    before(function (done) {
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
                    id: { type: "serial", size: "8", mapsTo: "personID", key: true },
                    firstName: { type: "text", size: "255", mapsTo: "name" },
                    lastName: { type: "text", size: "255", mapsTo: "surname" },
                    ageYears: { type: "number", size: "8", mapsTo: "age" }
                });

                Pet = db.define('pet', {
                    id: { type: "serial", size: "8", mapsTo: "petID", key: true },
                    petName: { type: "text", size: "255", mapsTo: "name" }
                });

                Person.hasMany('pets', Pet, {},
                    {
                        autoFetch: opts.autoFetchPets,
                        mergeTable: 'person_pet',
                        mergeId: 'person_id',
                        mergeAssocId: 'pet_id'
                    });

                helper.dropSync([Person, Pet], function (err) {
                    if (err) return done(err);
                    //
                    // John --+---> Deco
                    //        '---> Mutt <----- Jane
                    //
                    // Justin
                    //
                    Person.create([{
                        firstName: "John",
                        lastName: "Doe",
                        ageYears: 20,
                        pets: [{
                            petName: "Deco"
                        }, {
                            petName: "Mutt"
                        }]
                    }, {
                        firstName: "Jane",
                        lastName: "Doe",
                        ageYears: 16
                    }, {
                        firstName: "Justin",
                        lastName: "Dean",
                        ageYears: 18
                    }], function (err) {
                        Person.find({ firstName: "Jane" }, function (err, people) {
                            Pet.find({ petName: "Mutt" }, function (err, pets) {
                                people[0].addPets(pets, done);
                            });
                        });
                    });
                });
            };
        };

        describe("getAccessor", function () {
            before(setup());

            it("should not auto-fetch associations", function (done) {
                Person.find({ firstName: "John" }).first(function (err, John) {
                    assert.equal(err, null);

                    assert.equal(John.pets, null);
                    return done();
                });
            });

            it("should allow to specify order as string", function (done) {
                Person.find({ firstName: "John" }, function (err, people) {
                    assert.equal(err, null);

                    people[0].getPets("-petName", function (err, pets) {
                        assert.equal(err, null);

                        assert.ok(Array.isArray(pets));
                        assert.equal(pets.length, 2);
                        assert.equal(pets[0].model(), Pet);
                        assert.equal(pets[0].petName, "Mutt");
                        assert.equal(pets[1].petName, "Deco");

                        return done();
                    });
                });
            });

            it("should return proper instance model", function (done) {
                Person.find({ firstName: "John" }, function (err, people) {
                    people[0].getPets("-petName", function (err, pets) {
                        assert.equal(pets[0].model(), Pet);
                        return done();
                    });
                });
            });

            it("should allow to specify order as Array", function (done) {
                Person.find({ firstName: "John" }, function (err, people) {
                    assert.equal(err, null);

                    people[0].getPets(["petName", "Z"], function (err, pets) {
                        assert.equal(err, null);

                        assert.ok(Array.isArray(pets));
                        assert.equal(pets.length, 2);
                        assert.equal(pets[0].petName, "Mutt");
                        assert.equal(pets[1].petName, "Deco");

                        return done();
                    });
                });
            });

            it("should allow to specify a limit", function (done) {
                Person.find({ firstName: "John" }).first(function (err, John) {
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
                Person.find({ firstName: "John" }).first(function (err, John) {
                    assert.equal(err, null);

                    John.getPets({ petName: "Mutt" }, function (err, pets) {
                        assert.equal(err, null);

                        assert.ok(Array.isArray(pets));
                        assert.equal(pets.length, 1);
                        assert.equal(pets[0].petName, "Mutt");

                        return done();
                    });
                });
            });

            if (common.protocol() == "mongodb") return;

            it("should return a chain if no callback defined", function (done) {
                Person.find({ firstName: "John" }, function (err, people) {
                    assert.equal(err, null);

                    var chain = people[0].getPets({ firstName: "Mutt" });

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

                    people[0].getPets().count(function (err, count) {
                        assert.notExist(err);

                        assert.strictEqual(count, 2);

                        people[1].getPets().count(function (err, count) {
                            assert.notExist(err);

                            assert.strictEqual(count, 1);

                            people[2].getPets().count(function (err, count) {
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
                Pet.find({ petName: "Mutt" }, function (err, pets) {
                    assert.equal(err, null);

                    Person.find({ firstName: "Jane" }).first(function (err, Jane) {
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
                Person.find({ firstName: "Jane" }).first(function (err, Jane) {
                    assert.equal(err, null);

                    Jane.hasPets(function (err, has_pets) {
                        assert.equal(err, null);
                        assert.isTrue(has_pets);

                        return done();
                    });
                });
            });

            it("should return true if all passed instances are associated", function (done) {
                Pet.find(function (err, pets) {
                    Person.find({ firstName: "John" }).first(function (err, John) {
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
                    Person.find({ firstName: "Jane" }).first(function (err, Jane) {
                        assert.equal(err, null);

                        Jane.hasPets(pets, function (err, has_pets) {
                            assert.equal(err, null);
                            assert.isFalse(has_pets);

                            return done();
                        });
                    });
                });
            });
        });

        describe("delAccessor", function () {
            before(setup());

            it("should accept arguments in different orders", function (done) {
                Pet.find({ petName: "Mutt" }, function (err, pets) {
                    Person.find({ firstName: "John" }, function (err, people) {
                        assert.equal(err, null);

                        people[0].removePets(function (err) {
                            assert.equal(err, null);

                            people[0].getPets(function (err, pets) {
                                assert.equal(err, null);

                                assert.ok(Array.isArray(pets));
                                assert.equal(pets.length, 1);
                                assert.equal(pets[0].petName, "Deco");

                                return done();
                            });
                        }, pets[0]);
                    });
                });
            });
        });

        describe("delAccessor", function () {
            before(setup());

            it("should remove specific associations if passed", function (done) {
                Pet.find({ petName: "Mutt" }, function (err, pets) {
                    Person.find({ firstName: "John" }, function (err, people) {
                        assert.equal(err, null);

                        people[0].removePets(pets[0], function (err) {
                            assert.equal(err, null);

                            people[0].getPets(function (err, pets) {
                                assert.equal(err, null);

                                assert.ok(Array.isArray(pets));
                                assert.equal(pets.length, 1);
                                assert.equal(pets[0].petName, "Deco");

                                return done();
                            });
                        });
                    });
                });
            });

            it("should remove all associations if none passed", function (done) {
                Person.find({ firstName: "John" }).first(function (err, John) {
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
                    Pet.find({ petName: "Mutt" }, function (err, pets) {
                        Person.find({ firstName: "Jane" }, function (err, people) {
                            assert.equal(err, null);

                            people[0].addPets(pets[0], function (err) {
                                assert.equal(err, null);

                                people[0].getPets("petName", function (err, pets) {
                                    assert.equal(err, null);

                                    assert.ok(Array.isArray(pets));
                                    assert.equal(pets.length, 2);
                                    assert.equal(pets[0].petName, "Mutt");
                                    assert.equal(pets[1].petName, "Mutt");

                                    return done();
                                });
                            });
                        });
                    });
                });
            }

            it("should keep associations and add new ones", function (done) {
                Pet.find({ petName: "Deco" }).first(function (err, Deco) {
                    Person.find({ firstName: "Jane" }).first(function (err, Jane) {
                        assert.equal(err, null);

                        Jane.getPets(function (err, janesPets) {
                            assert.notExist(err);

                            var petsAtStart = janesPets.length;

                            Jane.addPets(Deco, function (err) {
                                assert.equal(err, null);

                                Jane.getPets("petName", function (err, pets) {
                                    assert.equal(err, null);

                                    assert.ok(Array.isArray(pets));
                                    assert.equal(pets.length, petsAtStart + 1);
                                    assert.equal(pets[0].petName, "Deco");
                                    assert.equal(pets[1].petName, "Mutt");

                                    return done();
                                });
                            });
                        });
                    });
                });
            });

            it("should accept several arguments as associations", function (done) {
                Pet.find(function (err, pets) {
                    Person.find({ firstName: "Justin" }).first(function (err, Justin) {
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
                Pet.create([{ petName: 'Ruff' }, { petName: 'Spotty' }], function (err, pets) {
                    Person.find({ firstName: "Justin" }).first(function (err, Justin) {
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
                        person.addPets(function () { });
                    });

                    return done();
                });
            });
        });

        describe("setAccessor", function () {
            before(setup());

            it("should accept several arguments as associations", function (done) {
                Pet.find(function (err, pets) {
                    Person.find({ firstName: "Justin" }).first(function (err, Justin) {
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
                    Person.find({ firstName: "Justin" }).first(function (err, Justin) {
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
                Person.find({ firstName: "Justin" }).first(function (err, Justin) {
                    assert.equal(err, null);
                    Justin.getPets(function (err, pets) {
                        assert.equal(err, null);
                        assert.equal(pets.length, 2);

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
                Pet.find({ petName: "Deco" }, function (err, pets) {
                    var Deco = pets[0];

                    Person.find({ firstName: "Jane" }).first(function (err, Jane) {
                        assert.equal(err, null);

                        Jane.getPets(function (err, pets) {
                            assert.equal(err, null);

                            assert.ok(Array.isArray(pets));
                            assert.equal(pets.length, 1);
                            assert.equal(pets[0].petName, "Mutt");

                            Jane.setPets(Deco, function (err) {
                                assert.equal(err, null);

                                Jane.getPets(function (err, pets) {
                                    assert.equal(err, null);

                                    assert.ok(Array.isArray(pets));
                                    assert.equal(pets.length, 1);
                                    assert.equal(pets[0].petName, Deco.petName);

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
                autoFetchPets: true
            }));

            it("should fetch associations", function (done) {
                Person.find({ firstName: "John" }).first(function (err, John) {
                    assert.equal(err, null);

                    assert.property(John, "pets");
                    assert.ok(Array.isArray(John.pets));
                    assert.equal(John.pets.length, 2);

                    return done();
                });
            });

            it("should save existing", function (done) {
                Person.create({ firstName: 'Bishan' }, function (err) {
                    assert.notExist(err);

                    Person.one({ firstName: 'Bishan' }, function (err, person) {
                        assert.notExist(err);

                        person.lastName = 'Dominar';

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
                    assert.equal(pets.length, 2);

                    Person.create({ firstName: 'Paul' }, function (err, paul) {
                        assert.notExist(err);

                        Person.one({ firstName: 'Paul' }, function (err, paul2) {
                            assert.notExist(err);
                            assert.equal(paul2.pets.length, 0);

                            paul.setPets(pets, function (err) {
                                assert.notExist(err);

                                // reload paul to make sure we have 2 pets
                                Person.one({ firstName: 'Paul' }, function (err, paul) {
                                    assert.notExist(err);
                                    assert.equal(paul.pets.length, 2);

                                    // Saving paul2 should NOT auto save associations and hence delete
                                    // the associations we just created.
                                    paul2.save(function (err) {
                                        assert.notExist(err);

                                        // let's check paul - pets should still be associated
                                        Person.one({ firstName: 'Paul' }, function (err, paul) {
                                            assert.notExist(err);
                                            assert.equal(paul.pets.length, 2);

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
                Person.one({ firstName: 'John' }, function (err, john) {
                    assert.notExist(err);
                    assert.equal(john.pets.length, 2);

                    john.pets = [];

                    john.save(function (err) {
                        assert.notExist(err);

                        // reload john to make sure pets were deleted
                        Person.one({ firstName: 'John' }, function (err, john) {
                            assert.notExist(err);
                            assert.equal(john.pets.length, 0);

                            done();
                        });
                    });
                });
            });
        });
    });
});