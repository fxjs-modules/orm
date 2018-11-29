var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model.find() chaining", function () {
    var db = null;
    var Person = null;
    var Dog = null;

    var setup = function (extraOpts) {
        if (!extraOpts) extraOpts = {};

        return function () {
            Person = db.define("person", {
                name: String,
                surname: String,
                age: Number
            }, extraOpts);
            Person.hasMany("parents");
            Person.hasOne("friend");

            ORM.singleton.clear(); // clear identityCache cache

            return helper.dropSync(Person, function () {
                Person.createSync([{
                    name: "John",
                    surname: "Doe",
                    age: 18,
                    friend_id: 1
                }, {
                    name: "Jane",
                    surname: "Doe",
                    age: 20,
                    friend_id: 1
                }, {
                    name: "Jane",
                    surname: "Dean",
                    age: 18,
                    friend_id: 1
                }]);
            });
        };
    };

    var setup2 = function () {
        return function () {
            Dog = db.define("dog", {
                name: String,
            });
            Dog.hasMany("friends");
            Dog.hasMany("family");

            ORM.singleton.clear(); // clear identityCache cache

            return helper.dropSync(Dog, function () {
                Dog.createSync([{
                    name: "Fido",
                    friends: [{
                        name: "Gunner"
                    }, {
                        name: "Chainsaw"
                    }],
                    family: [{
                        name: "Chester"
                    }]
                }, {
                    name: "Thumper",
                    friends: [{
                        name: "Bambi"
                    }],
                    family: [{
                        name: "Princess"
                    }, {
                        name: "Butch"
                    }]
                }]);
            });
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    describe(".limit(N)", function () {
        before(setup());

        it("should limit results to N items", function () {
            var instances = Person.find().limit(2).runSync();
            assert.propertyVal(instances, "length", 2);
        });
    });

    describe(".skip(N)", function () {
        before(setup());

        it("should skip the first N results", function () {
            var instances = Person.find().skip(2).order("age").runSync();

            assert.propertyVal(instances, "length", 1);
            assert.equal(instances[0].age, 20);
        });
    });

    describe(".offset(N)", function () {
        before(setup());

        it("should skip the first N results", function () {
            var instances = Person.find().offset(2).order("age").runSync();

            assert.propertyVal(instances, "length", 1);
            assert.equal(instances[0].age, 20);
        });
    });

    describe("order", function () {
        before(setup());

        it("('property') should order by that property ascending", function () {
            var instances = Person.find().order("age").runSync();
            assert.propertyVal(instances, "length", 3);
            assert.equal(instances[0].age, 18);
            assert.equal(instances[2].age, 20);
        });

        it("('-property') should order by that property descending", function () {
            var instances = Person.find().order("-age").runSync();
            assert.propertyVal(instances, "length", 3);
            assert.equal(instances[0].age, 20);
            assert.equal(instances[2].age, 18);
        });

        it("('property', 'Z') should order by that property descending", function () {
            var instances = Person.find().order("age", "Z").runSync();
            assert.propertyVal(instances, "length", 3);
            assert.equal(instances[0].age, 20);
            assert.equal(instances[2].age, 18);
        });
    });

    describe("orderRaw", function () {
        before(setup());

        it("should allow ordering by SQL", function () {
            var instances = Person.find().orderRaw("age DESC").runSync();
            assert.propertyVal(instances, "length", 3);
            assert.equal(instances[0].age, 20);
            assert.equal(instances[2].age, 18);
        });

        it("should allow ordering by SQL with escaping", function () {
            var instances = Person.find().orderRaw("?? DESC", ['age']).runSync();
            assert.propertyVal(instances, "length", 3);
            assert.equal(instances[0].age, 20);
            assert.equal(instances[2].age, 18);
        });
    });

    describe("only", function () {
        before(setup());

        it("('property', ...) should return only those properties, others null", function () {
            var instances = Person.find().only("age", "surname").order("-age").runSync();
            assert.propertyVal(instances, "length", 3);
            assert.property(instances[0], "age");
            assert.propertyVal(instances[0], "surname", "Doe");
            assert.propertyVal(instances[0], "name", null);
        });
    });

    describe("omit", function () {
        before(setup());

        it("('property', ...) should not get these properties", function () {
            var instances = Person.find().omit("age", "surname").order("-age").runSync();
            assert.propertyVal(instances, "length", 3);
            assert.property(instances[0], 'id');
            assert.property(instances[0], 'friend_id');
            assert.propertyVal(instances[0], "age", null);
            assert.propertyVal(instances[0], "surname", null);
            assert.propertyVal(instances[0], "name", "Jane");
        });

        it("(['property', ...]) should not get these properties", function () {
            var instances = Person.find().omit(["age", "surname"]).order("-age").runSync();
            assert.propertyVal(instances, "length", 3);
            assert.propertyVal(instances[0], "age", null);
            assert.propertyVal(instances[0], "surname", null);
            assert.propertyVal(instances[0], "name", "Jane");
        });
    });

    describe(".count()", function () {
        before(setup());

        it("should return only the total number of results", function () {
            var count = Person.find().countSync();
            assert.equal(count, 3);
        });
    });

    describe(".first()", function () {
        before(setup());

        it("should return only the first element", function () {
            var JaneDoe = Person.find().order("-age").firstSync();
            assert.equal(JaneDoe.name, "Jane");
            assert.equal(JaneDoe.surname, "Doe");
            assert.equal(JaneDoe.age, 20);
        });

        it("should return null if not found", function () {
            var Jack = Person.find({
                name: "Jack"
            }).firstSync();
            assert.equal(Jack, null);
        });
    });

    describe(".last()", function () {
        before(setup());

        it("should return only the last element", function () {
            var JaneDoe = Person.find().order("age").lastSync();
            assert.equal(JaneDoe.name, "Jane");
            assert.equal(JaneDoe.surname, "Doe");
            assert.equal(JaneDoe.age, 20);
        });

        it("should return null if not found", function () {
            var Jack = Person.find({
                name: "Jack"
            }).lastSync();
            assert.equal(Jack, null);
        });
    });

    describe(".find()", function () {
        before(setup());

        it("should not change find if no arguments", function () {
            var count = Person.find().find().countSync();
            assert.equal(count, 3);
        });

        it("should restrict conditions if passed", function () {
            var count = Person.find().find({
                age: 18
            }).countSync();
            assert.equal(count, 2);
        });
    });

    it("should restrict conditions if passed and also be chainable", function () {
        var count = Person.find().find({
            age: 18
        }).find({
            name: "Jane"
        }).countSync();
        assert.equal(count, 1);
    });

    it("should return results if passed a callback as second argument", function () {
        var instances = Person.find().findSync({
            age: 18
        });
        assert.propertyVal(instances, "length", 2);
    });

    it("should allow sql where conditions", function () {
        var items = Person.find({
            age: 18
        }).where("LOWER(surname) LIKE 'dea%'").allSync();
        assert.equal(items.length, 1);
    });

    it("should allow sql where conditions with auto escaping", function () {
        var items = Person.find({
            age: 18
        }).where("LOWER(surname) LIKE ?", ['dea%']).allSync();
        assert.equal(items.length, 1);
    });

    it("should append sql where conditions", function () {
        var items = Person.find().where("LOWER(surname) LIKE ?", ['do%']).allSync();
        assert.equal(items.length, 2);

        items = Person.find().where("LOWER(name) LIKE ?", ['jane']).allSync();
        assert.equal(items.length, 2);

        items = Person.find().where("LOWER(surname) LIKE ?", ['do%']).where("LOWER(name) LIKE ?", ['jane']).allSync();
        assert.equal(items.length, 1);
    });

    describe("finders should be chainable & interchangeable including", function () {
        before(setup());

        before(function () {
            Person.createSync([{
                    name: "Mel",
                    surname: "Gabbs",
                    age: 12
                },
                {
                    name: "Mel",
                    surname: "Gibbs",
                    age: 22
                },
                {
                    name: "Mel",
                    surname: "Gobbs",
                    age: 32
                }
            ]);
        });

        ['find', 'where', 'all'].forEach(function (func) {
            it("." + func + "()", function () {
                var items = Person[func]({
                    name: "Mel"
                })[func]({
                    age: ORM.gt(20)
                })[func + 'Sync']();

                assert.equal(items.length, 2);

                assert.equal(items[0].surname, "Gibbs");
                assert.equal(items[1].surname, "Gobbs");
            });
        });

        it("a mix", function () {
            var items = Person.all({
                name: "Mel"
            }).where({
                age: ORM.gt(20)
            }).findSync();

            assert.equal(items.length, 2);

            assert.equal(items[0].surname, "Gibbs");
            assert.equal(items[1].surname, "Gobbs");
        });
    });

    describe(".each()", function () {
        before(setup());

        it("should return a ChainInstance", function () {
            var chain = Person.find().each();

            assert.isFunction(chain.filter);
            assert.isFunction(chain.sort);
            assert.isFunction(chain.count);
        });
    });

    describe(".remove()", function () {
        var hookFired = false;

        before(setup({
            hooks: {
                beforeRemove: function () {
                    hookFired = true;
                }
            }
        }));

        it("should have no problems if no results found", function () {
            Person.find({
                age: 22
            }).removeSync();
            var count = Person.find().countSync();
            assert.equal(count, 3);
        });

        it("should remove results without calling hooks", function () {
            Person.find({
                age: 20
            }).removeSync();
            assert.equal(hookFired, false);

            var count = Person.find().countSync();
            assert.equal(count, 2);
        });

    });

    describe(".each()", function () {
        var hookFired = false;

        before(setup({
            hooks: {
                beforeRemove: function () {
                    hookFired = true;
                }
            }
        }));

        it("should return a ChainFind", function () {
            var chain = Person.find({
                age: 22
            }).each();

            assert.isObject(chain);
            assert.isFunction(chain.filter);
            assert.isFunction(chain.sort);
            assert.isFunction(chain.count);
            assert.isFunction(chain.get);
            assert.isFunction(chain.save);
        });
        
        describe(".count()", function () {
            it("should return the total filtered items", function (done) {
                Person.find().each().filter(function (person) {
                    return (person.age > 18);
                }).count(function (count) {
                    assert.equal(count, 1);

                    return done();
                });
            });
        });

        describe(".sort()", function () {
            it("should return the items sorted using the sorted function", function (done) {
                Person.find().each().sort(function (first, second) {
                    return (first.age < second.age);
                }).get(function (people) {
                    assert.ok(Array.isArray(people));

                    assert.equal(people.length, 3);
                    assert.equal(people[0].age, 20);
                    assert.equal(people[2].age, 18);

                    return done();
                });
            });
        });

        describe(".save()", function () {
            it("should save items after changes", function (done) {
                Person.find({
                    surname: "Dean"
                }).each(function (person) {
                    assert.notEqual(person.age, 45);
                    person.age = 45;
                }).save(function () {
                    Person.find({
                        surname: "Dean"
                    }, function (err, people) {
                        assert.ok(Array.isArray(people));

                        assert.equal(people.length, 1);
                        assert.equal(people[0].age, 45);

                        return done();
                    });
                });
            });
        });

        describe("if passing a callback", function () {
            it("should use it to .forEach()", function (done) {
                Person.find({
                    surname: "Dean"
                }).each(function (person) {
                    person.fullName = person.name + " " + person.surname;
                }).get(function (people) {
                    assert.ok(Array.isArray(people));

                    assert.equal(people.length, 1);
                    people[0].fullName = "Jane Dean";

                    return done();
                });
            });
        });

        // TODO: Implement
        xit(".remove() should call hooks", function () {
            Person.find().each().remove(function (err) {
                should.not.exist(err);
                assert.equal(hookFired, true);
            });
        });

        describe(".hasAccessor() for hasOne associations", function () {
            it("should be chainable", function () {
                var John = Person.findSync({
                    name: "John"
                });

                var Justin = new Person({
                    name: "Justin",
                    age: 45
                });

                John[0].setParentsSync([Justin]);

                var people = Person.find().hasParents(Justin).allSync();

                assert.ok(Array.isArray(people));

                assert.equal(people.length, 1);
                assert.equal(people[0].name, "John");
            });
        });
    });

    describe(".eager()", function () {
        before(setup2());

        it("should fetch all listed associations in a single query", function () {
            var dogs = Dog.find({
                name: ["Fido", "Thumper"]
            }).eager("friends").allSync();
            assert.ok(Array.isArray(dogs));

            assert.equal(dogs.length, 2);

            assert.equal(dogs[0].friends.length, 2);
            assert.equal(dogs[1].friends.length, 1);
        });

        it("should be able to handle multiple associations", function () {
            var dogs = Dog.find({
                name: ["Fido", "Thumper"]
            }).eager("friends", "family").allSync();
            assert.ok(Array.isArray(dogs));

            assert.equal(dogs.length, 2);

            assert.equal(dogs[0].friends.length, 2);
            assert.equal(dogs[0].family.length, 1);
            assert.equal(dogs[1].friends.length, 1);
            assert.equal(dogs[1].family.length, 2);
        });

        it("should work with array parameters too", function () {
            var dogs = Dog.find({
                name: ["Fido", "Thumper"]
            }).eager(["friends", "family"]).allSync();
            assert.ok(Array.isArray(dogs));

            assert.equal(dogs.length, 2);

            assert.equal(dogs[0].friends.length, 2);
            assert.equal(dogs[0].family.length, 1);
            assert.equal(dogs[1].friends.length, 1);
            assert.equal(dogs[1].family.length, 2);
        });
    });
});