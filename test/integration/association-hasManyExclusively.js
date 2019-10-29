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
                        defaultValue() {
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
                        age: 18,
                        stations: [{
                            name: "Ac_3"
                        }]
                    }]);

                    done();
                });
            };
        };

        describe("$getRef", function () {
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

        describe("$addRef", function () {
            before(setup());

            var Jane, JaneStations
            var John
            before(() => {
                Jane = Person.one({ where: { name: "Jane" } });
                John = Person.one({ where: { name: "John" } });
            });

            oit("add from raw object", function () {
                // reassign station to Jane
                JaneStations = Jane.$addRef('stations', { name: "station of Jane" });

                assert.exist(Jane, 'stations')
                assert.isArray(Jane.stations)
                assert.equal(JaneStations, Jane.stations)

                assert.equal(JaneStations[0].name, "station of Jane")
            });

            oit("update for linked instance", function () {
                Jane.$addRef("stations", JaneStations)

                var stations = Jane.$getRef("stations")
                assert.isArray(stations)
                assert.equal(stations.length, 1)
            });

            oit("add again", function () {
                var _JaneStations = Jane.$addRef('stations', { name: "station2 of Jane" });

                assert.equal(JaneStations.length, 1);
                assert.equal(_JaneStations.length, 2);
            });

            oit("add non-linked instance", function () {
                var _JaneStations = Jane.$addRef("stations", Station.create({
                    name: "station3 of Jane"
                }));
                assert.equal(JaneStations.length, 1);
                assert.equal(_JaneStations.length, 3);
            });

            oit("add other instance linked instance", function () {
                var JohnStations = John.$getRef("stations");
                assert.equal(JohnStations.length, 2);

                var _JaneStations = Jane.$addRef("stations", JohnStations[0]);

                assert.equal(John.$getRef("stations").length, 1);
                assert.equal(_JaneStations.length, 4);
            });

            describe("reset", function () {
                before(setup())
            });

            xit("might add duplicates", function () {
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

            xit("should keep associations and add new ones", function () {
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

            xit("should accept several arguments as associations", function () {
                var stations = Station.find();
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();
                Justin.addPetsSync(stations[0], stations[1]);

                var stations = Justin.getPetsSync();

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, 2);
            });

            xit("should accept array as list of associations", function () {
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

            xit("should throw if no items passed", function () {
                var person = Person.oneSync();

                assert.throws(function () {
                    person.addPetsSync();
                });
            });
        });

        describe("$saveRef", function () {
            before(setup());
            var Jane, John
            var Ac_2, Ac_1

            before(() => {
                Jane = Person.one({ where: { name: "Jane" } });
                John = Person.one({ where: { name: "John" } });

                Ac_1 = Station.one({ where: { name: "Ac_1" } });
                Ac_2 = Station.one({ where: { name: "Ac_2" } });
            });

            it("re assign", function () {
                // these stations are belonging to John

                assert.equal(John.$getRef('stations').length, 2)

                // reassign station to Jane
                Jane.$saveRef('stations', Ac_2);
                assert.equal(John.$getRef('stations').length, 1)
            });

            it("save as replacement", function () {
                assert.equal(Jane.$getRef('stations').length, 1);
                Jane.$saveRef('stations', []);
                assert.equal(Jane.$getRef('stations').length, 0);

                Jane.$saveRef('stations', Ac_1);
                assert.equal(Jane.$getRef('stations').length, 1);
                assert.equal(John.$getRef('stations').length, 0);

                Jane.$saveRef('stations', [Ac_1, Ac_2]);
                assert.equal(Jane.$getRef('stations').length, 2);
            });

            it("save as clean", function () {
                assert.equal(Jane.$getRef('stations').length, 2);
                Jane.$saveRef('stations', []);
                assert.equal(Jane.$getRef('stations').length, 0);
            });


            xit("should accept several arguments as associations", function () {
                var stations = Station.find();
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();

                Justin.setPetsSync(stations[0], stations[1]);

                var stations = Justin.getPetsSync();

                assert.ok(Array.isArray(stations));
                assert.equal(stations.length, 2);
            });

            xit("should accept an array of associations", function () {
                var stations = Station.find();
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();

                Justin.setPetsSync(stations);

                var all_pets = Justin.getPetsSync();

                assert.ok(Array.isArray(all_pets));
                assert.equal(all_pets.length, stations.length);
            });

            xit("should remove all associations if an empty array is passed", function () {
                var Justin = Person.find({
                    name: "Justin"
                }).firstSync();
                var stations = Justin.getPetsSync();
                assert.equal(stations.length, 4);

                Justin.setPetsSync([]);
                var stations = Justin.getPetsSync();
                assert.equal(stations.length, 0);
            });

            xit("clears current associations", function () {
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

        describe("$hasRef", function () {
            before(setup());
            before(() => {
                Jane = Person.one({ where: { name: "Jane" } });
                John = Person.one({ where: { name: "John" } });
            });
            var Jane, John

            oit("should return { final: true } if instance has associated item", function () {
                var station = Station.one({ where: { name: "Ac_2" } });

                assert.isTrue(John.$hasRef("stations", station).final);
                assert.isFalse(Jane.$hasRef("stations", station).final);
            });

            oit("should return { final: true } if not passing any instance and has associated items", function () {
                assert.isFalse(Jane.$hasRef("stations").final);
                assert.isTrue(John.$hasRef("stations").final);
            });

            oit("should return { final: true } if all passed instances are associated", function () {
                var stations = Station.find({ where: { name: ["Ac_2", "Ac_1"] } });

                assert.deepEqual(
                    John.$hasRef("stations", stations),
                    {
                        final: true,
                        ids: {
                            [stations[0].id]: true,
                            [stations[1].id]: true
                        }
                    }
                );
            });

            oit("should return { final: false } if any passed instances are not associated", function () {
                var stations = Station.find();

                assert.deepEqual(
                    Jane.$hasRef("stations", stations),
                    {
                        final: false,
                        ids: (() => {
                            const kvs = {}
                            stations.forEach(station => kvs[station.id] = false)
                            return kvs;
                        })()
                    }
                )

                var JohnStations = John.$getRef("stations");

                assert.deepEqual(
                    John.$hasRef("stations", stations),
                    {
                        final: false,
                        ids: (() => {
                            const kvs = {}
                            stations.forEach(station =>
                                kvs[station.id] = !!JohnStations.find(JohnS =>
                                    JohnS.id === station.id
                                )
                            )
                            return kvs;
                        })()
                    }
                )
            });
        });

        describe("$unlinkRef", function () {
            before(setup());

            var John, Ac_2
            before(() => {
                John = Person.one({ where: { name: "John" } });
                Ac_2 = Station.one({ where: { name: "Ac_2" } });
            });

            oit("should unlink specific associations if passed", function () {
                John.$unlinkRef("stations", Ac_2);

                var pstations = John.$getRef("stations");

                assert.ok(Array.isArray(pstations));
                assert.equal(pstations.length, 1);
                assert.equal(pstations[0].name, "Ac_1");
            });

            oit("should unlink all associations if none passed", function () {
                John.$addRef("stations", Ac_2);
                assert.equal(John.$getRef("stations").length, 2);
                John.$unlinkRef("stations");

                var pstations = John.$getRef("stations");
                assert.ok(Array.isArray(pstations));
                assert.equal(pstations.length, 0);
            });
        });

        describe("findByRef", function () {
            odescribe("findByRef() - A hasManyExclusively B", function () {
                before(setup({}));
                var xJohn, Justin
                before(() => {
                  xJohn = Person.one({ where: { name: "John" } });
                  Justin = Person.one({ where: { name: "Justin" } });
                });

                oit("could find A with `findByB()`", function () {
                    var _John = Person.findByRef(
                        'stations',
                        { [Station.propIdentifier('name')]: Person.Opf.eq("Ac_2") },
                        {
                            orderBy: Station.propIdentifier('name'),
                            limit: 1
                        },
                    )[0];
                    assert.equal(_John.id, xJohn.id)

                    var _Justin = Person.findByRef(
                        'stations',
                        { [Station.propIdentifier('name')]: Person.Opf.eq("Ac_3") },
                        {
                            limit: 1
                        },
                    )[0];

                    assert.equal(_Justin.id, Justin.id)

                    var _John = Person.findByRef(
                        'stations',
                        { [Station.propIdentifier('name')]: Person.Opf.in(["Ac_1", "Ac_2"]) },
                        {
                            orderBy: Station.propIdentifier('name'),
                        },
                    )[0];
                    assert.equal(_John.id, xJohn.id)
                });
            });
        });

        xdescribe("with autoFetch turned on", function () {
            before(setup({
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
