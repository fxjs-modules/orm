var test = require("test");
test.setup();

var _ = require('lodash');
var helper = require('../support/spec_helper');
var common = require('../common');
var ORM = require('../../');
var coroutine = require('coroutine');
const { lowerCaseColumn } = require("../support/_helpers");

describe("Model.get()", function () {
    var db = null;
    var Person = null;
    var John;

    var setup = function (identityCache) {
        return function () {
            Person = db.define("person", {
                name: {
                    type: 'text',
                    mapsTo: 'fullname'
                }
            }, {
                    identityCache: identityCache,
                    methods: {
                        UID: function () {
                            return this[Person.id];
                        }
                    }
                });

            ORM.singleton.clear(); // clear identityCache cache

            return helper.dropSync(Person, function () {
                var people = Person.createSync([{
                    name: "John Doe"
                }, {
                    name: "Jane Doe"
                }]);
                John = people[0];
            });
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    describe("mapsTo", function () {
        before(setup(true));

        it("should create the table with a different column name than property name", function () {
            var sql;
            var dbType = common.dbType();

            switch (dbType) {
                case 'sqlite':
                    sql = "PRAGMA table_info(?)"; break;
                case 'mysql':
                    sql = "SELECT column_name FROM information_schema.columns WHERE table_name = ? AND table_schema = ?";
                    break;
                case 'postgres':
                    sql = "SELECT column_name FROM information_schema.columns WHERE table_name = ? AND table_catalog = ?";
                    break;
                default:
                    throw new Error('unsupported dbType: ' + dbType);
            }

            var data = db.driver.execQuerySync(sql, [Person.table, db.driver.config.database]);
            if (dbType === 'mysql') { // support mysql 8.0+
                data = data.map(col => lowerCaseColumn(col));
            }
            var names = _.map(data, dbType == 'sqlite' ? 'name' : 'column_name')

            assert.equal(typeof Person.properties.name, 'object');
            assert.notEqual(names.indexOf('fullname'), -1);
        });
    });

    describe("with identityCache cache", function () {
        before(setup(true));

        it("should return item with id 1", function () {
            var John1 = Person.getSync(John[Person.id]);

            assert.isObject(John1);
            assert.propertyVal(John1, Person.id[0], John[Person.id]);
            assert.propertyVal(John1, "name", "John Doe");
        });

        it("should have an UID method", function () {
            var John1 = Person.getSync(John[Person.id]);

            assert.isFunction(John1.UID);
            assert.equal(John1.UID(), John[Person.id]);
        });

        describe("changing name and getting id 1 again", function () {
            it("should return the original object with unchanged name", function () {
                var John1 = Person.getSync(John[Person.id]);

                John1.name = "James";

                var John2 = Person.getSync(John[Person.id]);

                assert.equal(John1[Person.id], John2[Person.id]);
                assert.equal(John2.name, "John Doe");
            });
        });

        describe("changing instance.identityCacheSaveCheck = false", function () {
            before(function () {
                Person.settings.set("instance.identityCacheSaveCheck", false);
            });

            it("should return the same object with the changed name", function () {
                var John1 = Person.getSync(John[Person.id]);

                John1.name = "James";

                var John2 = Person.getSync(John[Person.id]);

                assert.equal(John1[Person.id], John2[Person.id]);
                assert.equal(John2.name, "James");
            });
        });
    });

    describe("with no identityCache cache", function () {
        before(setup(false));

        describe("fetching several times", function () {
            it("should return different objects", function () {
                var John1 = Person.getSync(John[Person.id]);
                var John2 = Person.getSync(John[Person.id]);

                assert.equal(John1[Person.id], John2[Person.id]);
                assert.notEqual(John1, John2);
            });
        });
    });

    describe("with identityCache cache = 0.5 secs", function () {
        before(setup(0.5));

        describe("fetching again after 0.2 secs", function () {
            it("should return same objects", function () {
                var John1 = Person.getSync(John[Person.id]);

                coroutine.sleep(200);

                var John2 = Person.getSync(John[Person.id]);

                assert.equal(John1[Person.id], John2[Person.id]);
                assert.equal(John1, John2);
            });
        });

        describe("fetching again after 0.7 secs", function () {
            it("should return different objects", function () {
                var John1 = Person.getSync(John[Person.id]);

                coroutine.sleep(700);

                var John2 = Person.getSync(John[Person.id]);
                assert.notEqual(John1, John2);
            });
        });
    });

    describe("with empty object as options", function () {
        before(setup());

        it("should return item with id 1 like previously", function () {
            var John1 = Person.getSync(John[Person.id], {});

            assert.isObject(John1);
            assert.propertyVal(John1, Person.id[0], John[Person.id]);
            assert.propertyVal(John1, "name", "John Doe");
        });
    });

    describe("when not found", function () {
        before(setup(true));

        it("should return an error", function () {
            try {
                Person.getSync(999);
            } catch (err) {
                assert.equal(err.message, "Not found");
            }
        });
    });

    describe("if passed an Array with ids", function () {
        before(setup(true));

        it("should accept and try to fetch", function () {
            var John1 = Person.getSync([John[Person.id]]);

            assert.isObject(John1);
            assert.propertyVal(John1, Person.id[0], John[Person.id]);
            assert.propertyVal(John1, "name", "John Doe");
        });
    });

    describe("if primary key name is changed", function () {
        before(function () {
            Person = db.define("person", {
                name: String
            });

            ORM.singleton.clear();

            return helper.dropSync(Person, function () {
                Person.createSync([{
                    name: "John Doe"
                }, {
                    name: "Jane Doe"
                }]);
            });
        });

        it("should search by key name and not 'id'", function () {
            db.settings.set('properties.primary_key', 'name');

            var OtherPerson = db.define("person", {
                id: Number
            });

            var person = OtherPerson.getSync("Jane Doe");
            assert.equal(person.name, "Jane Doe");
        });
    });

    describe("with a point property type", function () {
        if (common.dbType() == 'mongodb') return;

        const point = { x: 51.5177, y: -0.0968 };
        function assertPoint(locPoint) {
            assert.property(locPoint, 'x');
            assert.equal(locPoint.x, point.x);
            assert.property(locPoint, 'y');
            assert.equal(locPoint.y, point.y);
        }
        const PersonPhoto = new Buffer(1024) // fake photo
        function assertPhoto(photoBuf) {
            assert.isTrue(Buffer.isBuffer(photoBuf));
            assert.equal(photoBuf.compare(PersonPhoto), 0);
        }

        it("should deserialize the point to { x: number; y: number }", function (done) {
            db.settings.set('properties.primary_key', 'id');

            Person = db.define("person", {
                name: String,
                location: { type: "point" },
            });

            ORM.singleton.clear();

            helper.dropSync(Person, function () {
                let err = null;
                let person = null;
                try {
                    person = Person.createSync({
                        name: "John Doe",
                        location: { ...point }
                    });
                } catch (error) {
                    err = error;
                }

                assert.equal(err, null);

                assert.isTrue(person.location instanceof Object);
                assertPoint(person.location);

                const pulledPerson = Person.getSync(person.id);
                assertPoint(pulledPerson.location);

                done();
            });
        });

        it("should deserialize the photo to Buffer", function (done) {
            db.settings.set('properties.primary_key', 'id');

            Person = db.define("person", {
                name: String,
                photo: { type: 'binary' }
            });

            ORM.singleton.clear();

            helper.dropSync(Person, function () {
                let err = null;
                let person = null;
                try {
                    person = Person.createSync({
                        name: "John Doe",
                        photo: PersonPhoto,
                    });
                } catch (error) {
                    err = error;
                }

                assert.equal(err, null);
                assertPhoto(person.photo)

                const pulledPerson = Person.getSync(person.id);
                assertPhoto(pulledPerson.photo)

                done();
            });
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}