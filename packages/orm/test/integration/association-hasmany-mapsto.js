var helper = require('../support/spec_helper');
var common = require('../common');

if (common.protocol() == "mongodb") return ;   // Can't do mapsTo testing on mongoDB ()

describe("hasMany with mapsTo", function () {
    var db = null;
    var Person = null;
    var Pet = null;

    before(function () {
        db = helper.connect();
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
                        var people = Person.findSync({ firstName: "Jane" });
                        var pets = Pet.findSync({ petName: "Mutt" });
                        people[0].addPetsSync(pets);

                        done();
                    });
                });
            };
        };

        describe("getAccessor", function () {
            before(setup());

            it("should not auto-fetch associations", function () {
                var John = Person.find({ firstName: "John" }).firstSync();
                assert.equal(John.pets, null);
            });

            it("should allow to specify order as string", function () {
                var people = Person.findSync({ firstName: "John" });

                var pets = people[0].getPetsSync("-petName");

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 2);
                assert.equal(pets[0].model(), Pet);
                assert.equal(pets[0].petName, "Mutt");
                assert.equal(pets[1].petName, "Deco");
            });

            it("should return proper instance model", function () {
                var people = Person.findSync({ firstName: "John" });

                var pets = people[0].getPetsSync("-petName");
                assert.equal(pets[0].model(), Pet);
            });

            it("should allow to specify order as Array", function () {
                var people = Person.findSync({ firstName: "John" });

                var pets = people[0].getPetsSync(["petName", "Z"]);

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 2);
                assert.equal(pets[0].petName, "Mutt");
                assert.equal(pets[1].petName, "Deco");
            });

            it("should allow to specify a limit", function () {
                var John = Person.find({ firstName: "John" }).firstSync();

                var pets = John.getPetsSync(1);

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
            });

            it("should allow to specify conditions", function () {
                var John = Person.find({ firstName: "John" }).firstSync();

                var pets = John.getPetsSync({ petName: "Mutt" });

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
                assert.equal(pets[0].petName, "Mutt");
            });

            if (common.protocol() == "mongodb") return;

            it("should return a chain if no callback defined", function () {
                var people = Person.findSync({ firstName: "John" });

                var chain = people[0].getPets({ firstName: "Mutt" });

                assert.isObject(chain);
                assert.isFunction(chain.find);
                assert.isFunction(chain.only);
                assert.isFunction(chain.limit);
                assert.isFunction(chain.order);
            });

            it("should allow chaining count()", function () {
                var people = Person.findSync({});

                var count = people[0].getPets().countSync();
                assert.strictEqual(count, 2);

                var count = people[1].getPets().countSync();
                assert.strictEqual(count, 1);

                var count = people[2].getPets().countSync();
                assert.strictEqual(count, 0);
            });
        });

        describe("hasAccessor", function () {
            before(setup());

            it("should return true if instance has associated item", function () {
                var pets = Pet.findSync({ petName: "Mutt" });

                var Jane = Person.find({ firstName: "Jane" }).firstSync();

                var has_pets = Jane.hasPetsSync(pets[0]);
                assert.isTrue(has_pets);
            });

            it("should return true if not passing any instance and has associated items", function () {
                var Jane = Person.find({ firstName: "Jane" }).firstSync();

                var has_pets = Jane.hasPetsSync();

                assert.isTrue(has_pets);
            });

            it("should return true if all passed instances are associated", function () {
                var pets = Pet.findSync();

                var John = Person.find({ firstName: "John" }).firstSync();

                var has_pets = John.hasPetsSync(pets);
                assert.isTrue(has_pets);
            });

            it("should return false if any passed instances are not associated", function () {
                var pets = Pet.findSync();

                var Jane = Person.find({ firstName: "Jane" }).firstSync();

                var has_pets = Jane.hasPetsSync(pets);
                assert.isFalse(has_pets);
            });
        });

        describe("delAccessor", function () {
            before(setup());

            it("should accept arguments in different orders", function () {
                var pets = Pet.findSync({ petName: "Mutt" });

                var people = Person.findSync({ firstName: "John" });
                people[0].removePetsSync(pets[0]);

                var pets = people[0].getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
                assert.equal(pets[0].petName, "Deco");
            });
        });

        describe("delAccessor", function () {
            before(setup());

            it("should remove specific associations if passed", function () {
                var pets = Pet.findSync({ petName: "Mutt" });

                var people = Person.findSync({ firstName: "John" });

                people[0].removePetsSync(pets[0]);

                var pets = people[0].getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
                assert.equal(pets[0].petName, "Deco");
            });

            it("should remove all associations if none passed", function () {
                var John = Person.find({ firstName: "John" }).firstSync();

                John.removePetsSync();

                var pets = John.getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 0);
            });
        });

        describe("addAccessor", function () {
            before(setup());

            if (common.protocol() != "mongodb") {
                it("might add duplicates", function () {
                    var pets = Pet.findSync({ petName: "Mutt" });

                    var people = Person.findSync({ firstName: "Jane" });

                    people[0].addPetsSync(pets[0]);

                    var pets = people[0].getPetsSync("petName");

                    assert.ok(Array.isArray(pets));
                    assert.equal(pets.length, 2);
                    assert.equal(pets[0].petName, "Mutt");
                    assert.equal(pets[1].petName, "Mutt");
                });
            }

            it("should keep associations and add new ones", function () {
                var Deco = Pet.find({ petName: "Deco" }).firstSync();

                var Jane = Person.find({ firstName: "Jane" }).firstSync();

                var janesPets = Jane.getPetsSync();

                var petsAtStart = janesPets.length;

                Jane.addPetsSync(Deco);

                var pets = Jane.getPetsSync("petName");

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, petsAtStart + 1);
                assert.equal(pets[0].petName, "Deco");
                assert.equal(pets[1].petName, "Mutt");
            });

            it("should accept several arguments as associations", function () {
                var pets = Pet.findSync();

                var Justin = Person.find({ firstName: "Justin" }).firstSync();

                Justin.addPetsSync(pets[0], pets[1]);

                var pets = Justin.getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 2);
            });

            it("should accept array as list of associations", function () {
                var pets = Pet.createSync([{ petName: 'Ruff' }, { petName: 'Spotty' }]);

                var Justin = Person.find({ firstName: "Justin" }).firstSync();

                var justinsPets = Justin.getPetsSync();

                var petCount = justinsPets.length;

                Justin.addPetsSync(pets);

                var justinsPets = Justin.getPetsSync();

                assert.ok(Array.isArray(justinsPets));
                // Mongo doesn't like adding duplicates here, so we add new ones.
                assert.equal(justinsPets.length, petCount + 2);
            });

            it("should throw if no items passed", function () {
                var person = Person.oneSync();
                    
                assert.throws(() => {
                    person.addPets(function () { });
                });
            });
        });

        describe("setAccessor", function () {
            before(setup());

            it("should accept several arguments as associations", function () {
                var pets = Pet.findSync();

                var Justin = Person.find({ firstName: "Justin" }).firstSync();

                Justin.setPetsSync(pets[0], pets[1]);

                var pets = Justin.getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 2);
            });

            it("should accept an array of associations", function () {
                var pets = Pet.findSync();

                var Justin = Person.find({ firstName: "Justin" }).firstSync();

                Justin.setPetsSync(pets);

                var all_pets = Justin.getPetsSync();

                assert.ok(Array.isArray(all_pets));
                assert.equal(all_pets.length, pets.length);
            });

            it("should remove all associations if an empty array is passed", function () {
                var Justin = Person.find({ firstName: "Justin" }).firstSync();

                var pets = Justin.getPetsSync();

                assert.equal(pets.length, 2);

                Justin.setPetsSync([]);

                var pets = Justin.getPetsSync();
                assert.equal(pets.length, 0);
            });

            it("clears current associations", function () {
                var pets = Pet.findSync({ petName: "Deco" });

                var Deco = pets[0];

                var Jane = Person.find({ firstName: "Jane" }).firstSync();

                var pets = Jane.getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
                assert.equal(pets[0].petName, "Mutt");

                Jane.setPetsSync(Deco);

                var pets = Jane.getPetsSync();

                assert.ok(Array.isArray(pets));
                assert.equal(pets.length, 1);
                assert.equal(pets[0].petName, Deco.petName);
            });
        });

        describe("with autoFetch turned on", function () {
            before(setup({
                autoFetchPets: true
            }));

            it("should fetch associations", function () {
                var John = Person.find({ firstName: "John" }).firstSync();

                assert.property(John, "pets");
                assert.ok(Array.isArray(John.pets));
                assert.equal(John.pets.length, 2);
            });

            it("should save existing", function () {
                Person.createSync({ firstName: 'Bishan' });

                var person = Person.oneSync({ firstName: 'Bishan' });

                person.lastName = 'Dominar';
                person.saveSync();
            });

            it("should not auto save associations which were autofetched", function () {
                var pets = Pet.allSync();

                assert.equal(pets.length, 2);

                var paul = Person.createSync({ firstName: 'Paul' });

                var paul2 = Person.oneSync({ firstName: 'Paul' });

                assert.equal(paul2.pets.length, 0);

                paul.setPetsSync(pets);

                // reload paul to make sure we have 2 pets
                var paul = Person.oneSync({ firstName: 'Paul' });

                assert.equal(paul.pets.length, 2);

                // Saving paul2 should NOT auto save associations and hence delete
                // the associations we just created.
                paul2.saveSync();
                
                // let's check paul - pets should still be associated
                var paul = Person.oneSync({ firstName: 'Paul' });

                assert.equal(paul.pets.length, 2);
            });

            it("should save associations set by the user", function () {
                var john = Person.oneSync({ firstName: 'John' });

                assert.equal(john.pets.length, 2);

                john.pets = [];

                john.saveSync();

                // reload john to make sure pets were deleted
                var john = Person.oneSync({ firstName: 'John' });

                assert.equal(john.pets.length, 0);
            });
        });
    });
});