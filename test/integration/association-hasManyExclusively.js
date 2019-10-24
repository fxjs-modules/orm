var test = require("test");
test.setup();

var helper = require('../support/spec_helper');
var common = require('../common');

function assertModelInstanceWithHasMany(instance) {
    assert.property(instance, '__opts')
    assert.isObject(instance.__opts, 'one_associations')

    assert.isObject(instance.__opts, 'many_associations')
    assert.isObject(instance.__opts, 'extend_associations')

    assert.property(instance.__opts, 'association_properties')
    assert.property(instance.__opts, 'fieldToPropertyMap')

    assert.property(instance.__opts, 'associations')
}

odescribe("hasManyExclusively", function () {
    var db = null;
    var Person = null;
    var Station = null;
    var PersonStation = null;

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.close();
    });

    odescribe("normal", function () {
        var setup = function (opts) {
            opts = opts || {};

            return function (done) {
                Person = db.define('person', {
                    name: String,
                    surname: String,
                    age: Number
                });
                Station = db.define('station', {
                  uuid: {
                    type: 'text',
                    defaultValue () {
                      return Date.now()
                    }
                  },
                  name: String
                });
                PersonStation = Person.hasManyExclusively(Station, {
                    as: 'stations',
                    reverseAs: 'owner',
                });

                helper.dropSync([Station, Person], function () {
                    Station.create([{
                        name: "stataion_D1"
                    }, {
                        name: "stataion_D2"
                    }]);

                    /**
                     * @relationship
                     *
                     * John --+---> Ac_1
                     *        '---> Ac_2 <----- Jane
                     *
                     * Justin
                     */
                    Person.create([{
                        name: "Bob",
                        surname: "Smith",
                        age: 30
                    }, {
                        name: "John",
                        surname: "Doe",
                        age: 20,
                        stations: [{
                            name: "Ac_1"
                        }, {
                            name: "Ac_2"
                        }]
                    }, {
                        name: "Jane",
                        surname: "Doe",
                        age: 16
                    }, {
                        name: "Justin",
                        surname: "Dean",
                        age: 18
                    }]);

                    done();
                });
            };
        };

        odescribe("$getRef", function () {
            before(setup());

            oit("should allow to specify order as string", function () {
                var people = Person.find({
                    where: {
                      name: "John"
                    }
                });

                var stations = people[0].$getRef("stations", {
                  orderBy: ['name', 'desc']
                });

                assert.isArray(stations);
                assert.equal(stations.length, 2);
                assert.equal(stations[0].$model, PersonStation);
                assert.equal(stations[0].name, "Ac_2");
                assert.equal(stations[1].name, "Ac_1");
            });

            oit("should return proper instance model", function () {
                var people = Person.find({
                    where: {
                      name: "John"
                    }
                });

                var stations = people[0].$getRef("stations", {
                  orderBy: ['name', 'desc']
                });

                assert.equal(stations[0].$model, PersonStation);
            });

            oit("should specify order as Array", function () {
                var people = Person.find({
                    where: {
                      name: "John"
                    }
                });

                var stations = people[0].$getRef("stations", {
                  orderBy: ['name', 'desc']
                });

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, 2);
                assert.equal(stations[0].name, "Ac_2");
                assert.equal(stations[1].name, "Ac_1");
            });

            oit("should allow to specify a limit", function () {
                var John = Person.one({
                    where: {
                      name: "John"
                    }
                });

                var stations = John.$getRef("stations", {
                  orderBy: ['name', 'desc'],
                });

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, 2);

                var stations = John.$getRef("stations", {
                  orderBy: ['name', 'desc'],
                  limit: 1
                });

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, 1);
            });
        });

        odescribe("$addRef", function () {
            before(setup());

            var Jane, JaneStation
            var John
            before(() => {
                Jane = Person.one({ where: { name: "Jane" } });
                John = Person.one({ where: { name: "John" } });
            });

            it("add from raw object", function () {
                // reassign station to Jane
                JaneStations = Jane.$addRef('stations', { name: "station of Jane" });

                assert.exist(Jane, 'stations')
                assert.isArray(Jane.stations)
                assert.equal(JaneStations, Jane.stations)

                assert.equal(JaneStations[0].name, "station of Jane")
            });

            it("update for linked instance", function () {
                Jane.$addRef("stations", JaneStation)

                var stations = Jane.$getRef("stations")
                assert.isArray(stations)
                assert.equal(stations.length, 1)
            });

            it("add again", function () {
                var _JaneStations = Jane.$addRef('stations', { name: "station2 of Jane" });

                assert.equal(JaneStations.length, 1);
                assert.equal(_JaneStations.length, 2);
            });

            it("add non-linked instance", function () {
                var _JaneStations = Jane.$addRef("stations", Station.create({
                    name: "station3 of Jane"
                }));
                assert.equal(JaneStations.length, 1);
                assert.equal(_JaneStations.length, 3);
            });

            it("add other instance linked instance", function () {
                var JohnStations = John.$getRef("stations");
                assert.equal(JohnStations.length, 2);

                var _JaneStations = Jane.$addRef("stations", JohnStations[0]);

                assert.equal(John.$getRef("stations").length, 1);
                assert.equal(_JaneStations.length, 4);
            });
        });

        describe("$saveRef", function () {
          before(setup());
          var Jane, John
          var Ac_2, AC_1

          before(() => {
            Jane = Person.one({ where: { name: "Jane" } });
            John = Person.one({ where: { name: "John" } });

            Ac_1 = Station.one({ where: { name: "Ac_1" } });
            Ac_2 = Station.one({ where: { name: "Ac_2" } });
          });

          it("re assign", function () {
            // these stations are belonging to John

            assert.equal(John.$getRef('$stations').length, 2)

            // reassign station to Jane
            Jane.$saveRef('stations', Ac_2);
            assert.equal(John.$getRef('$stations').length, 1)
          });

          it("save as replacement", function () {
            assert.equal(Jane.$getRef('$stations').length, 1);
            Jane.$saveRef('stations', []);
            assert.equal(Jane.$getRef('$stations').length, 0);

            Jane.$saveRef('stations', Ac_1);
            assert.equal(John.$getRef('$stations').length, 1);

            Jane.$saveRef('stations', [Ac_1, Ac_2]);
            assert.equal(John.$getRef('$stations').length, 2);
          });

          it("save as clean", function () {
            assert.equal(Jane.$getRef('$stations').length, 1);
            Jane.$saveRef('stations', []);
            assert.equal(Jane.$getRef('$stations').length, 0);
          });
        });

        odescribe("$hasRef", function () {
            before(setup());

            oit("should return true if instance has associated item", function () {
                var stations = Station.find({ where: { name: "Ac_2" } });
                var John = Person.one({ where: { name: "John" } });

                assert.ok(John.$hasRef("stations", stations[0]));

                var Jane = Person.one({ where: { name: "Jane" } });

                assert.isFalse(Jane.$hasRef("stations", stations[0]));
            });

            it("should return true if not passing any instance and has associated items", function (done) {
                Person.find({ name: "Jane" }).first(function (err, Jane) {
                    assert.equal(err, null);

                    Jane.hasPets(function (err, has_pets) {
                        assert.equal(err, null);
                        assert.ok(has_pets);

                        return done();
                    });
                });
            });

            it("should return true if all passed instances are associated", function () {
                var stations = Station.find({
                    name: ["Ac_2", "Ac_1"]
                });
                var John = Person.find({
                    name: "John"
                }).firstSync();
                var has_pets = John.hasPetsSync(stations);
                assert.ok(has_pets);
            });

            it("should return false if any passed instances are not associated", function () {
                var stations = Station.find();
                var Jane = Person.find({
                    name: "Jane"
                }).firstSync();
                var has_pets = Jane.hasPetsSync(stations);
                assert.notOk(has_pets);
            });

            it("should return true if join table has duplicate entries", function () {
                var stations = Station.find({
                    name: ["Ac_2", "Ac_1"]
                });

                assert.equal(stations.length, 2);

                var John = Person.find({
                    name: "John"
                }).firstSync();

                var hasPets = John.hasPetsSync(stations);

                assert.equal(hasPets, true);

                db.driver.execQuerySync(
                    "INSERT INTO person_pets (person_id, pets_id) VALUES (?,?), (?,?)", [John.id, stations[0].id, John.id, stations[1].id]);

                var hasPets = John.hasPetsSync(stations);
                assert.equal(hasPets, true);
            });
        });

        xdescribe("delAccessor", function () {
            before(setup());

            it("should remove specific associations if passed", function () {
                var stations = Station.find({
                    name: "Ac_2"
                });
                var people = Person.find({
                    name: "John"
                });

                people[0].removePetsSync(stations[0]);

                var stations = people[0].getPetsSync();

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, 1);
                assert.equal(stations[0].name, "Ac_1");
            });

            it("should remove all associations if none passed", function () {
                var John = Person.find({
                    name: "John"
                }).firstSync();

                John.removePetsSync();

                var stations = John.getPetsSync();

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, 0);
            });
        });

        xdescribe("addAccessor", function () {
            before(setup());

            it("might add duplicates", function () {
                var stations = Station.find({
                    name: "Ac_2"
                });
                var people = Person.find({
                    name: "Jane"
                });

                people[0].addPetsSync(stations[0]);

                var stations = people[0].getPetsSync("name");

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, 2);
                assert.equal(stations[0].name, "Ac_2");
                assert.equal(stations[1].name, "Ac_2");
            });

            it("should keep associations and add new ones", function () {
                var Ac_1 = Station.find({
                    name: "Ac_1"
                }).firstSync();
                var Jane = Person.find({
                    name: "Jane"
                }).firstSync();

                var janesPets = Jane.getPetsSync();

                var petsAtStart = janesPets.length;

                Jane.addPetsSync(Ac_1);

                var stations = Jane.getPetsSync("name");

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, petsAtStart + 1);
                assert.equal(stations[0].name, "Ac_1");
                assert.equal(stations[1].name, "Ac_2");
            });

            it("should accept several arguments as associations", function () {
                var stations = Station.find();
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();
                Justin.addPetsSync(stations[0], stations[1]);

                var stations = Justin.getPetsSync();

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, 2);
            });

            it("should accept array as list of associations", function () {
                var stations = Station.create([{
                    name: 'Ruff'
                }, {
                    name: 'Spotty'
                }]);
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();

                var justinsPets = Justin.getPetsSync();

                var petCount = justinsPets.length;

                Justin.addPetsSync(stations);

                justinsPets = Justin.getPetsSync();

                assert.ok(Array.isArray(justinsPets));
                // Mongo doesn't like adding duplicates here, so we add new ones.
                assert.equal(justinsPets.length, petCount + 2);
            });

            it("should throw if no items passed", function () {
                var person = Person.oneSync();

                assert.throws(function () {
                    person.addPetsSync();
                });
            });
        });

        xdescribe("setAccessor", function () {
            before(setup());

            it("should accept several arguments as associations", function () {
                var stations = Station.find();
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();

                Justin.setPetsSync(stations[0], stations[1]);

                var stations = Justin.getPetsSync();

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, 2);
            });

            it("should accept an array of associations", function () {
                var stations = Station.find();
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();

                Justin.setPetsSync(stations);

                var all_pets = Justin.getPetsSync();

                assert.ok(Array.isArray(all_pets));
                assert.equal(all_pets.length, stations.length);
            });

            it("should remove all associations if an empty array is passed", function () {
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();
                var stations = Justin.getPetsSync();
                assert.equal(stations.length, 4);

                Justin.setPetsSync([]);
                var stations = Justin.getPetsSync();
                assert.equal(stations.length, 0);
            });

            it("clears current associations", function () {
                var stations = Station.find({
                    name: "Ac_1"
                });
                var Ac_1 = stations[0];

                var Jane = Person.find({
                    name: "Jane"
                }).firstSync();

                var stations = Jane.getPetsSync();

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, 1);
                assert.equal(stations[0].name, "Ac_2");

                Jane.setPetsSync(Ac_1);

                var stations = Jane.getPetsSync();

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, 1);
                assert.equal(stations[0].name, Ac_1.name);
            });
        });

        xdescribe("findBy*()", function () {
            function assertion_people_for_findby (people) {
                assert.equal(people.length, 2);

                var Jane = people.find(person => person.name === "Jane")
                var JanePets = Jane.getPetsSync("-name");

                assert.ok(Array.isArray(JanePets));
                assert.equal(JanePets.length, 1);
                assert.equal(JanePets[0].$model, Station);
                assert.equal(JanePets[0].name, "Ac_2");

                var John = people.find(person => person.name === "John")
                var JohnPets = John.getPetsSync("-name");

                assert.ok(Array.isArray(JohnPets));
                assert.equal(JohnPets.length, 2);
                assert.equal(JohnPets[0].$model, Station);
                assert.equal(JohnPets[0].name, "Ac_2");
                assert.equal(JohnPets[1].name, "Ac_1");
            }

            function assertion_pets_for_findby (stations) {
                assert.equal(stations.length, 2);

                var Ac_2 = stations.find(pet => pet.name === "Ac_2")
                var MuttOwners = Ac_2.getOwnersSync("-name");

                assert.ok(Array.isArray(MuttOwners));
                assert.equal(MuttOwners.length, 2);
                assert.equal(MuttOwners[0].$model, Person);
                assert.equal(MuttOwners[0].name, "John");
                assert.equal(MuttOwners[1].name, "Jane");

                var Ac_1 = stations.find(pet => pet.name === "Ac_1")
                var DecoOwners = Ac_1.getOwnersSync("-name");

                assert.ok(Array.isArray(DecoOwners));
                assert.equal(DecoOwners.length, 1);
                assert.equal(DecoOwners[0].$model, Person);
                assert.equal(DecoOwners[0].name, "John");
            }

            xdescribe("findBy() - A hasManyExclusively B, with reverse", function () {
                before(setup({
                    reversePets: 'owners',
                    autoFetchPets: false
                }));

                it("could find A with `findByB()`", function (done) {
                    var John = Person.findByPets({ name: "Ac_2" }, { order: 'name' }).lastSync();
                    var Jane = Person.findByPets({ name: "Ac_2" }, { order: 'name' }).firstSync();
                    assertion_people_for_findby([John, Jane]);

                    var John = Person.findByPets({ name: "Ac_2" }, {  }).firstSync();
                    var Jane = Person.findByPets({ name: "Ac_2" }, {  }).lastSync();
                    assertion_people_for_findby([John, Jane]);

                    var personCount = Person.findByPets({ name: "Ac_2" }, {  }).countSync();
                    assert.ok(personCount, 2);

                    ;[
                        'all',
                        'where',
                        'find',
                        // 'remove',
                        'run'
                    ].forEach(ichainFindKey => {
                        var people = Person.findByPets({ name: "Ac_2" })[`${ichainFindKey}Sync`]();
                        assertion_people_for_findby(people);
                    });

                    var people = Person.findByPetsSync({ name: "Ac_2" });
                    assertion_people_for_findby(people);

                    var people = Person.findBy('stations', { name: "Ac_2" }).runSync();
                    assertion_people_for_findby(people);

                    // asynchronous version
                    Person.findByPets({ name: "Ac_2" })
                        .run(function (err, people) {
                            assertion_people_for_findby(people);
                            done();
                        });
                });

                it("could find B with `findbyA()`", function (done) {
                    var Ac_2 = Station.findByOwners({ name: "John" }, {
                        Owners_find_options: { order: 'name' }
                    }).lastSync();
                    var Ac_1 = Station.findByOwners({ name: "John" }, {
                        Owners_find_options: { order: 'name' }
                    }).firstSync();
                    assertion_pets_for_findby([Ac_2, Ac_1]);

                    var Ac_2 = Station.findByOwners({ name: "John" }, {  }).firstSync();
                    var Ac_1 = Station.findByOwners({ name: "John" }, {  }).lastSync();
                    assertion_pets_for_findby([Ac_2, Ac_1]);

                    var personCount = Station.findByOwners({ name: "John" }, {  }).countSync();
                    assert.ok(personCount, 2);

                    ;[
                        'all',
                        'where',
                        'find',
                        // 'remove',
                        'run'
                    ].forEach(ichainFindKey => {
                        var people = Station.findByOwners({ name: "John" })[`${ichainFindKey}Sync`]();
                        assertion_pets_for_findby(people);
                    });

                    var stations = Station.findByOwnersSync({ name: "John" });
                    assertion_pets_for_findby(stations);

                    var stations = Station.findBy('owners', { name: "John" }).runSync();
                    assertion_pets_for_findby(stations);

                    // asynchronous version
                    Station.findByOwners({ name: "John" })
                        .run(function (err, stations) {
                            assertion_pets_for_findby(stations);
                            done();
                        });
                });

                it("could find A with `findBy([...])`", function () {
                    /**
                     * View details in @relationship above
                     */
                    var Nil = Person.findBy(
                        [
                            {
                                association_name: 'stations',
                                conditions: { name: "Ac_1" }
                            },
                            {
                                association_name: 'friends',
                                conditions: { name: "Bob" }
                            }
                        ],
                        {},
                        {
                            order: '-name'
                        }
                    ).firstSync();
                    assert.ok(!Nil);

                    var John = Person.findBy(
                        [
                            {
                                association_name: 'stations',
                                conditions: { name: "Ac_2" }
                            }
                        ],
                        {},
                        {
                            order: '-name'
                        }
                    ).firstSync();
                    var Jane = Person.findBy(
                        [
                            {
                                association_name: 'stations',
                                conditions: { name: "Ac_2" }
                            },
                            {
                                association_name: 'friends',
                                conditions: { name: "Bob" }
                            }
                        ],
                        {},
                        {
                        }
                    ).firstSync();
                    assertion_people_for_findby([John, Jane]);
                });

                it("zero count", function () {
                    var personCount = Station.findByOwners({ name: "Bob" }, {  }).countSync();
                    assert.equal(personCount, 0);
                })
            });

            xdescribe("findBy() - A hasManyExclusively B, without reverse", function () {
                before(setup({
                    autoFetchPets: false
                }));

                it("could find A with `findByB()`", function (done) {
                    var John = Person.findByPets({ name: "Ac_2" }, { order: 'name' }).lastSync();
                    var Jane = Person.findByPets({ name: "Ac_2" }, { order: 'name' }).firstSync();
                    assertion_people_for_findby([John, Jane]);

                    var John = Person.findByPets({ name: "Ac_2" }, {  }).firstSync();
                    var Jane = Person.findByPets({ name: "Ac_2" }, {  }).lastSync();
                    assertion_people_for_findby([John, Jane]);

                    var personCount = Person.findByPets({ name: "Ac_2" }, {  }).countSync();
                    assert.ok(personCount, 2);

                    ;[
                        'all',
                        'where',
                        'find',
                        // 'remove',
                        'run'
                    ].forEach(ichainFindKey => {
                        var people = Person.findByPets({ name: "Ac_2" })[`${ichainFindKey}Sync`]();
                        assertion_people_for_findby(people);
                    });

                    var people = Person.findByPetsSync({ name: "Ac_2" });
                    assertion_people_for_findby(people);

                    var people = Person.findBy('stations', { name: "Ac_2" }).runSync();
                    assertion_people_for_findby(people);

                    // asynchronous version
                    Person.findByPets({ name: "Ac_2" })
                        .run(function (err, people) {
                            assertion_people_for_findby(people);
                            done();
                        });
                });
            });
        });

        xdescribe("with autoFetch turned on", function () {
            before(setup({
                autoFetchPets: true
            }));

            it("should fetch associations", function () {
                var John = Person.find({
                    name: "John"
                }).firstSync();

                assert.property(John, "stations");
                assert.ok(Array.isArray(John.stations));
                assert.equal(John.stations.length, 2);
            });

            it("should save existing", function () {
                Person.create({
                    name: 'Bishan'
                });
                var person = Person.oneSync({
                    name: 'Bishan'
                });
                person.surname = 'Dominar';
                person.saveSync();
            });

            it("should not auto save associations which were autofetched", function () {
                var stations = Station.allSync();
                assert.equal(stations.length, 4);

                var paul = Person.create({
                    name: 'Paul'
                });

                var paul2 = Person.oneSync({
                    name: 'Paul'
                });

                assert.equal(paul2.stations.length, 0);

                paul.setPetsSync(stations);

                // reload paul to make sure we have 2 stations
                var paul = Person.oneSync({
                    name: 'Paul'
                });
                assert.equal(paul.stations.length, 4);

                // Saving paul2 should NOT auto save associations and hence delete
                // the associations we just created.
                paul2.saveSync();

                // let's check paul - stations should still be associated
                var paul = Person.oneSync({
                    name: 'Paul'
                });
                assert.equal(paul.stations.length, 4);
            });

            it("should save associations set by the user", function () {
                var john = Person.oneSync({
                    name: 'John'
                });

                assert.equal(john.stations.length, 2);

                john.stations = [];

                john.saveSync();

                // reload john to make sure stations were deleted
                var john = Person.oneSync({
                    name: 'John'
                });
                assert.equal(john.stations.length, 0);
            });

        });
    });

    describe("with non-standard keys", function () {
        var Email;
        var Station;

        var setup = function (opts) {
            Email = db.define('email', {
                text: {
                    type: 'text',
                    key: true,
                    required: true
                },
                bounced: Boolean
            });

            Station = db.define('station', {
                name: String
            });

            Station.hasManyExclusively('emails', Email, {}, {
                key: opts.key
            });

            helper.dropSync([Email, Station]);
        };

        it("should place ids in the right place", function () {
            setup({});
            var emails = Email.create([{
                bounced: true,
                text: 'a@test.com'
            }, {
                bounced: false,
                text: 'z@test.com'
            }]);

            var station = Station.create({
                name: "Stuff"
            });
            assertModelInstanceWithHasMany(station)

            station.addEmailsSync(emails[1]);

            var data = db.driver.execQuerySync("SELECT * FROM station_emails");

            assert.equal(data[0].station_id, 1);
            assert.equal(data[0].emails_text, 'z@test.com');
        });

        it("should generate correct tables", function () {
            setup({});

            var protocol = common.protocol();

            var sql;

            if (protocol == 'sqlite') {
                sql = "PRAGMA table_info(?)";
            } else {
                sql = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? AND table_schema = ? ORDER BY data_type";
            }

            var cols = db.driver.execQuerySync(sql, ['station_emails', db.driver.config.database]);

            switch (protocol) {
                case 'sqlite':
                    assert.equal(cols[0].name, 'station_id');
                    assert.equal(cols[0].type, 'INTEGER');
                    assert.equal(cols[1].name, 'emails_text');
                    assert.equal(cols[1].type, 'TEXT');
                    break
                case 'mysql':
                    assert.equal(cols[0].column_name, 'station_id');
                    assert.equal(cols[0].data_type, 'int');
                    assert.equal(cols[1].column_name, 'emails_text');
                    assert.equal(cols[1].data_type, 'varchar');
                    break
            }
        });

        it("should add a composite key to the join table if requested", function () {
            setup({
                key: true
            });

            var protocol = common.protocol();
            var sql;

            if (protocol == 'mysql') {
                var data = db.driver.execQuerySync("SHOW KEYS FROM ?? WHERE Key_name = ?", ['station_emails', 'PRIMARY']);

                assert.equal(data.length, 2);
                assert.equal(data[0].Column_name, 'station_id');
                assert.equal(data[0].Key_name, 'PRIMARY');
                assert.equal(data[1].Column_name, 'emails_text');
                assert.equal(data[1].Key_name, 'PRIMARY');
            } else if (protocol == 'sqlite') {
                var data = db.driver.execQuerySync("pragma table_info(??)", ['station_emails']);
                assert.equal(data.length, 2);
                assert.equal(data[0].name, 'station_id');
                assert.equal(data[0].pk, 1);
                assert.equal(data[1].name, 'emails_text');
                assert.equal(data[1].pk, 2);
            }
        });
    });

    describe("accessors", function () {
        var Email;
        var Station;

        var setup = function (opts) {
            Email = db.define('email', {
                text: {
                    type: 'text',
                    key: true,
                    required: true
                },
                bounced: Boolean
            });

            Station = db.define('station', {
                name: String
            });

            Station.hasManyExclusively('emails', Email, {}, {
                mergeTable: 'custom_station_emails',
                mergeId: 'custom_stationid',
                mergeAssocId: 'custom_emailid',
                key: opts.key
            });

            helper.dropSync([Email, Station]);
        };

        it('should query association model data with getAccessor', function () {
            setup({})
            var emails = Email.create([{
                bounced: true,
                text: 'a@test.com'
            }, {
                bounced: false,
                text: 'z@test.com'
            }]);

            var station = Station.create({
                name: "Stuff"
            });
            station.addEmailsSync(emails);

            var assoc = station.__opts.many_associations.find(x => x.name === 'emails')

                ;['bounced', 'text'].forEach((field) => {
                    emails.forEach((email) => {
                        assert.equal(
                            email[field],
                            station[assoc['getAccessor']]()
                                .find({ [field]: email[field] })
                                .firstSync()[field]
                        )
                    })
                });
        })
    });
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}
