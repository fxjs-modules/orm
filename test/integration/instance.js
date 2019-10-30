var test = require("test");
test.setup();

var helper = require('../support/spec_helper');
var ORM = require('../../');

function assertModelInstance (instance) {
    assert.property(instance, '$changes')
}

describe("Model instance", function () {
    var db = null;
    var Person = null;

    var setup = function () {
        db.settings.set('instance.returnAllErrors', true);

        Person = db.define("person", {
            name: String,
            age: {
                type: 'integer',
                required: false
            },
            height: {
                type: 'integer',
                required: false
            },
            weight: {
                type: 'number',
                required: false,
                enumerable: true
            },
            secret: {
                type: 'text',
                required: false,
                enumerable: false
            },
            data: {
                type: 'object',
                required: false
            }
        }, {
            identityCache: false,
            // validations: {
            //     age: ORM.validators.rangeNumber(0, 150)
            // }
        });

        helper.dropSync(Person, function () {
            Person.create([{
                name: "Jeremy Doe"
            }, {
                name: "John Doe"
            }, {
                name: "Jane Doe"
            }]);
        });
    };

    before(function () {
        db = helper.connect();
        setup();
    });

    after(function () {
        return db.close();
    });

    describe("#$save", function () {
        var main_item, item;

        before(function () {
            main_item = db.define("main_item", {
                name: String
            }, {
                auteFetch: true
            });

            item = db.define("item", {
                name: String
            }, {
                identityCache: false
            });

            item.hasOne(main_item, {
                as: "main_item",
                config: {
                    reverse: "items",
                    autoFetch: true
                }
            });

            helper.dropSync([main_item, item], function () {
                var mainItem = main_item.create({
                    name: "Main Item"
                });

                var Item = item.create({
                    name: "Item"
                });

                var r = mainItem.$set('items', Item);
            });
        });

        it("should have a saving state to avoid loops", function () {
            var mainItem = main_item.one({
                name: "Main Item"
            });

            mainItem.$save({
                name: "new name"
            });
        });
    });

    describe("#$isInstance", function () {
        it("should always return true for instances", function () {
            assert.equal((Person.New(4)).$isInstance, true);

            var item = Person.one();
            assert.equal(item.$isInstance, true);
        });

        it("should be false for all other objects", function () {
            assert.notEqual({}.$isInstance, false);
            assert.notEqual([].$isInstance, false);
        });
    });

    describe("#$isPersisted", function () {
        it("should return true for persisted instances", function () {
            var item = Person.one();
            assert.equal(item.$isPersisted, true);
        });

        it("should return true for shell instances", function () {
            assert.equal(Person.New(4).$isPersisted, true);
        });

        xit("should be writable for mocking", function () {
            var person = Person.New()
            var triggered = false;
            person.$isPersisted = function () {
                triggered = true;
            };
            person.$isPersisted
            assert.isTrue(triggered);
        });
    });

    describe("#$set", function () {
        var person = null;
        var data = null;

        function clone(obj) {
            return JSON.parse(JSON.stringify(obj))
        };

        beforeEach(function () {
            data = {
                a: {
                    b: {
                        c: 3,
                        d: 4
                    }
                },
                e: 5
            };
            person = Person.create({
                name: 'Dilbert',
                data: data
            });
            assertModelInstance(person)
        });

        it("should do nothing with flat paths when setting to same value", function () {
            assert.equal(person.$saved, true);
            person.$set('name', 'Dilbert');
            assert.equal(person.name, 'Dilbert');
            assert.equal(person.$saved, true);
        });

        it("should mark as dirty with flat paths when setting to different value", function () {
            assert.equal(person.$saved, true);
            person.$set('name', 'Dogbert');
            assert.equal(person.name, 'Dogbert');
            assert.equal(person.$saved, false);
            assert.equal(person.$changedKeys.join(','), 'name');
        });

        it("should do nothing with deep paths when setting to same value", function () {
            assert.equal(person.$saved, true);
            person.$set('data.e', 5);

            var expected = clone(data);
            expected.e = 5;

            assert.equal(JSON.stringify(person.data), JSON.stringify(expected));
            assert.equal(person.$saved, true);
        });

        it("should mark as dirty with deep paths when setting to different value", function () {
            assert.equal(person.$saved, true);
            person.$set('data.e', 6);

            var expected = clone(data);
            expected.e = 6;

            assert.equal(JSON.stringify(person.data), JSON.stringify(expected));
            assert.equal(person.$saved, false);
            assert.equal(person.$changedKeys.join(','), 'data');
        });

        it("should do nothing with deeper paths when setting to same value", function () {
            assert.equal(person.$saved, true);
            person.$set('data.a.b.d', 4);

            var expected = clone(data);
            expected.a.b.d = 4;

            assert.equal(JSON.stringify(person.data), JSON.stringify(expected));
            assert.equal(person.$saved, true);
        });

        it("should mark as dirty with deeper paths when setting to different value", function () {
            assert.equal(person.$saved, true);
            person.$set('data.a.b.d', 6);

            var expected = clone(data);
            expected.a.b.d = 6;

            assert.equal(JSON.stringify(person.data), JSON.stringify(expected));
            assert.equal(person.$saved, false);
            assert.equal(person.$changedKeys.join(','), 'data');
        });

        it("should mark as dirty with array path when setting to different value", function () {
            assert.equal(person.$saved, true);
            person.$set(['data', 'a', 'b', 'd'], 6);

            var expected = clone(data);
            expected.a.b.d = 6;

            assert.equal(JSON.stringify(person.data), JSON.stringify(expected));
            assert.equal(person.$saved, false);
            assert.equal(person.$changedKeys.join(','), 'data');
        });

        it("should do nothing with invalid paths", function () {
            assert.equal(person.$saved, true);
            person.$set('data.a.b.d.y.z', 1);
            person.$set('data.y.z', 1);
            person.$set('z', 1);
            person.$set(4, 1);
            person.$set(null, 1);
            person.$set(undefined, 1);
            assert.equal(person.$saved, true);
            assert.equal(person.$changedKeys.join(','), '');
        });
    });

    describe("#$changes", function () {
        var person = null;

        beforeEach(function () {
            person = Person.create({
                name: 'John',
                age: 44,
                data: {
                    a: 1
                }
            });
        });

        it("should mark individual properties as dirty", function () {
            assert.equal(person.$saved, true);
            person.$set('name', person['name'] + '1');
            person.$set('data.a', person['data'].a + 1);
            assert.equal(person.$saved, false);
            assert.equal(person.$changedKeys.join(','), 'name,data');
        });
    });

    xdescribe("#validate", function () {
        it("should return validation errors if invalid", function () {
            var person = new Person({
                age: -1
            });

            var validationErrors = person.validateSync();
            assert.equal(Array.isArray(validationErrors), true);
        });

        it("should return false if valid", function () {
            var person = new Person({
                name: 'Janette'
            });

            var validationErrors = person.validateSync();
            assert.equal(validationErrors, false);
        });
    });

    describe("properties", function () {
        describe("Number", function () {
            it("should be saved for valid numbers, using both save & create", function () {
                var person1 = Person.New({
                    height: 190
                });

                person1.$save();

                var person2 = Person.create({
                    height: 170
                });

                var item = Person.get(person1[Person.id]);

                assert.equal(item.height, 190);

                item = Person.get(person2[Person.id]);
                assert.equal(item.height, 170);
            });
        });

        describe("Enumerable", function () {
            it("should not stringify properties marked as not enumerable", function () {
                var p = Person.create({
                    name: 'Dilbert',
                    secret: 'dogbert',
                    weight: 100,
                    data: {
                        data: 3
                    }
                });

                var result = JSON.parse(JSON.stringify(p));

                assert.notExist(result.secret);
                assert.exist(result.weight);
                assert.exist(result.data);
                assert.exist(result.name);
            });
        });
    });

    describe("$get", function () {
        it("specify id", function () {
            var person1 = Person.New({
                height: 200
            });

            person1.$save();

            var person1Copy = Person.New({
                id: person1.id
            });

            var resutls = person1Copy.$get('height');

            assert.deepEqual(
                resutls,
                {
                    height: person1.height
                }
            )

            var resutls = person1Copy.$get(['id', 'height', 'age']);

            assert.deepEqual(
                resutls,
                {
                    id: person1.id,
                    height: person1.height,
                    age: null
                }
            )
        });

        it('only invalid field-names provided', function () {
            var personWhatever = Person.New({
                height: 200
            });

            personWhatever.$save();

            var personCopy = Person.New({
                id: personWhatever.id
            });

            assert.throws(() => {
                personCopy.$get(['id1', 'id2', 'id3'])
            });
        });
    });

    describe("$fetch", function () {
        it("specify id", function () {
            var person1 = Person.New({
                height: 200
            });

            person1.$save();

            var person1Copy = Person.New({
                id: person1.id
            });

            person1Copy.$fetch();

            assert.strictEqual(person1.id, person1Copy.id);
            assert.strictEqual(person1.height, person1Copy.height);

            person1.$fetch();

            assert.deepEqual(
                person1.toJSON(),
                person1Copy.toJSON(),
            );
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}
