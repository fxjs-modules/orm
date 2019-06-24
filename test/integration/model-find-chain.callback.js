var test = require("test");
test.setup();

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

        it("should limit results to N items", function (done) {
            Person.find().limit(2).run((err, instances) => {
                assert.propertyVal(instances, "length", 2);
                done();
            });
            
        });
    });

    describe(".skip(N)", function () {
        before(setup());

        it("should skip the first N results", function (done) {
            Person.find().skip(2).order("age").run((err, instances) => {
                assert.propertyVal(instances, "length", 1);
                assert.equal(instances[0].age, 20);
                done();
            });
        });
    });

    describe(".offset(N)", function () {
        before(setup());

        it("should skip the first N results", function (done) {
            Person.find().offset(2).order("age").run((err, instances) => {
                assert.propertyVal(instances, "length", 1);
                assert.equal(instances[0].age, 20);
                done();
            });
        });
    });

    describe("order", function () {
        before(setup());

        it("('property') should order by that property ascending", function (done) {
            Person.find().order("age").run((err, instances) => {
                assert.propertyVal(instances, "length", 3);
                assert.equal(instances[0].age, 18);
                assert.equal(instances[2].age, 20);
                done();
            });
        });

        it("('-property') should order by that property descending", function (done) {
            Person.find().order("-age").run((err, instances) => {
                assert.propertyVal(instances, "length", 3);
                assert.equal(instances[0].age, 20);
                assert.equal(instances[2].age, 18);
                done();
            });
        });

        it("('property', 'Z') should order by that property descending", function (done) {
            Person.find().order("age", "Z").run((err, instances) => {
                assert.propertyVal(instances, "length", 3);
                assert.equal(instances[0].age, 20);
                assert.equal(instances[2].age, 18);
                done();
            });
        });
    });

    describe("orderRaw", function () {
        before(setup());

        it("should allow ordering by SQL", function (done) {
            Person.find().orderRaw("age DESC").run((err, instances) => {
                assert.propertyVal(instances, "length", 3);
                assert.equal(instances[0].age, 20);
                assert.equal(instances[2].age, 18);
                done();
            });
        });

        it("should allow ordering by SQL with escaping", function (done) {
            Person.find().orderRaw("?? DESC", ['age']).run((err, instances) => {
                assert.propertyVal(instances, "length", 3);
                assert.equal(instances[0].age, 20);
                assert.equal(instances[2].age, 18);
                done();
            });
        });
    });

    describe("only", function () {
        before(setup());

        it("('property', ...) should return only those properties, others null", function (done) {
            Person.find().only("age", "surname").order("-age").run((err, instances) => {
                assert.propertyVal(instances, "length", 3);
                assert.property(instances[0], "age");
                assert.propertyVal(instances[0], "surname", "Doe");
                assert.propertyVal(instances[0], "name", null);
                done();
            });
        });
    });

    describe("omit", function () {
        before(setup());

        it("('property', ...) should not get these properties", function (done) {
            Person.find().omit("age", "surname").order("-age").run((err, instances) => {
                assert.propertyVal(instances, "length", 3);
                assert.property(instances[0], 'id');
                assert.property(instances[0], 'friend_id');
                assert.propertyVal(instances[0], "age", null);
                assert.propertyVal(instances[0], "surname", null);
                assert.propertyVal(instances[0], "name", "Jane");
                done();
            });
        });

        it("(['property', ...]) should not get these properties", function (done) {
            Person.find().omit(["age", "surname"]).order("-age").run((err, instances) => {
                assert.propertyVal(instances, "length", 3);
                assert.propertyVal(instances[0], "age", null);
                assert.propertyVal(instances[0], "surname", null);
                assert.propertyVal(instances[0], "name", "Jane");
                done();
            });
        });
    });

    describe(".count()", function () {
        before(setup());

        it("should return only the total number of results", function (done) {
            Person.find().count((err, count) => {
                assert.equal(count, 3);
                done();
            });
        });
    });

    describe(".first()", function () {
        before(setup());

        it("should return only the first element", function (done) {
            Person.find().order("-age").first((err, JaneDoe) => {
                assert.equal(JaneDoe.name, "Jane");
                assert.equal(JaneDoe.surname, "Doe");
                assert.equal(JaneDoe.age, 20);
                done();
            });
        });

        it("should return null if not found", function (done) {
            var Jack = Person.find({
                name: "Jack"
            }).first((err, Jack) => {
                assert.equal(Jack, null);
                done();
            });
        });
    });

    describe(".last()", function () {
        before(setup());

        it("should return only the last element", function (done) {
            var JaneDoe = Person.find().order("age").last((err, JaneDoe) => {
                assert.equal(JaneDoe.name, "Jane");
                assert.equal(JaneDoe.surname, "Doe");
                assert.equal(JaneDoe.age, 20); 
                done();
            });
        });

        it("should return null if not found", function (done) {
            var Jack = Person.find({
                name: "Jack"
            }).last((err, Jack) => {
                assert.equal(Jack, null);
                done();
            });
        });
    });

    describe(".find()", function () {
        before(setup());

        it("should not change find if no arguments", function (done) {
            Person.find().find().count((err, count) => {
                assert.equal(count, 3);
                done();
            });
            
        });

        it("should restrict conditions if passed", function (done) {
            Person.find().find({
                age: 18
            }).count((err, count) => {
                assert.equal(count, 2);
                done();
            });
        });
    });

    it("should restrict conditions if passed and also be chainable", function (done) {
        Person.find().find({
            age: 18
        }).find({
            name: "Jane"
        }).count((err, count) => {
            assert.equal(count, 1);
            done();
        });
        
    });

    it("should return results if passed a callback as second argument", function (done) {
        Person.find().find({
            age: 18
        }, (err, instances) => {
            assert.propertyVal(instances, "length", 2);
            done();
        });
    });

    it("should allow sql where conditions", function (done) {
        Person.find({
            age: 18
        }).where("LOWER(surname) LIKE 'dea%'").all((err, items) => {
            assert.equal(items.length, 1);
            done();
        });
    });

    it("should allow sql where conditions with auto escaping", function (done) {
        Person.find({
            age: 18
        }).where("LOWER(surname) LIKE ?", ['dea%']).all((err, items) => {
            assert.equal(items.length, 1);
            done();
        });
    });

    it("should append sql where conditions", function (done) {
        Person.find().where("LOWER(surname) LIKE ?", ['do%']).all((err, items) => {
            assert.equal(items.length, 2);
        });

        items = Person.find().where("LOWER(name) LIKE ?", ['jane']).all((err, items) => {
            assert.equal(items.length, 2);
        });

        items = Person.find().where("LOWER(surname) LIKE ?", ['do%']).where("LOWER(name) LIKE ?", ['jane']).all((err, items) => {
            assert.equal(items.length, 1);
            done();
        });
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
            it("." + func + "()", function (done) {
                Person[func]({
                    name: "Mel"
                })[func]({
                    age: ORM.gt(20)
                })[func]((err, items) => {
                    assert.equal(items.length, 2);

                    assert.equal(items[0].surname, "Gibbs");
                    assert.equal(items[1].surname, "Gobbs");
                    done();
                });
            });
        });

        it("a mix", function (done) {
            Person.all({
                name: "Mel"
            }).where({
                age: ORM.gt(20)
            }).find((err, items) => {
                assert.equal(items.length, 2);

                assert.equal(items[0].surname, "Gibbs");
                assert.equal(items[1].surname, "Gobbs");
                done();
            });
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

        it("should have no problems if no results found", function (done) {
            Person.find({
                age: 22
            }).remove(() => {
                Person.find().count((err, count) => {
                    assert.equal(count, 3);
                    done();
                });
            });
        });

        it("should remove results without calling hooks", function (done) {
            Person.find({
                age: 20
            }).remove((err) => {
                assert.equal(hookFired, false);

                Person.find().count((err, count) => {
                    assert.equal(count, 2);
                    done();
                });
            });
        });
    });

    describe(".eager()", function () {
        before(setup2());

        it("should fetch all listed associations in a single query", function (done) {
            Dog.find({
                name: ["Fido", "Thumper"]
            })
            .eager("friends")
            .all((err, dogs) => {
                assert.ok(Array.isArray(dogs));

                assert.equal(dogs.length, 2);

                assert.equal(dogs[0].friends.length, 2);
                assert.equal(dogs[1].friends.length, 1);
                done();
            });
        });

        it("should be able to handle multiple associations", function (done) {
            Dog.find({
                name: ["Fido", "Thumper"]
            })
            .eager("friends", "family")
            .all((err, dogs) => {
                assert.ok(Array.isArray(dogs));

                assert.equal(dogs.length, 2);

                assert.equal(dogs[0].friends.length, 2);
                assert.equal(dogs[0].family.length, 1);
                assert.equal(dogs[1].friends.length, 1);
                assert.equal(dogs[1].family.length, 2);
                done();
            });
        });

        it("should work with array parameters too", function (done) {
            Dog.find({
                name: ["Fido", "Thumper"]
            })
            .eager(["friends", "family"])
            .all((err, dogs) => {
                assert.ok(Array.isArray(dogs));

                assert.equal(dogs.length, 2);

                assert.equal(dogs[0].friends.length, 2);
                assert.equal(dogs[0].family.length, 1);
                assert.equal(dogs[1].friends.length, 1);
                assert.equal(dogs[1].family.length, 2);
                done();
            });
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}