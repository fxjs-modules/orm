var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model.findSync()", function () {
    var db = null;
    var Person = null;

    var setup = function () {
        Person = db.define("person", {
            name: String,
            surname: String,
            age: Number,
            male: Boolean
        });

        return helper.dropSync(Person, function () {
            Person.createSync([{
                name: "John",
                surname: "Doe",
                age: 18,
                male: true
            }, {
                name: "Jane",
                surname: "Doe",
                age: 16,
                male: false
            }, {
                name: "Jeremy",
                surname: "Dean",
                age: 18,
                male: true
            }, {
                name: "Jack",
                surname: "Dean",
                age: 20,
                male: true
            }, {
                name: "Jasmine",
                surname: "Doe",
                age: 20,
                male: false
            }]);
        });
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    describe("without arguments", function () {
        before(setup);

        it("should return all items", function () {
            var people = Person.findSync();

            assert.isObject(people);
            assert.propertyVal(people, "length", 5);
        });
    });

    describe("with a number as argument", function () {
        before(setup);

        it("should use it as limit", function () {
            var people = Person.findSync(2);

            assert.isObject(people);
            assert.propertyVal(people, "length", 2);
        });
    });

    describe("with a string argument", function () {
        before(setup);

        it("should use it as property ascending order", function () {
            var people = Person.findSync("age");

            assert.isObject(people);
            assert.propertyVal(people, "length", 5);
            assert.equal(people[0].age, 16);
            assert.equal(people[4].age, 20);
        });

        it("should use it as property descending order if starting with '-'", function () {
            var people = Person.findSync("-age");

            assert.isObject(people);
            assert.propertyVal(people, "length", 5);
            assert.equal(people[0].age, 20);
            assert.equal(people[4].age, 16);
        });
    });

    describe("with an Array as argument", function () {
        before(setup);

        it("should use it as property ascending order", function () {
            var people = Person.findSync(["age"]);

            assert.isObject(people);
            assert.propertyVal(people, "length", 5);
            assert.equal(people[0].age, 16);
            assert.equal(people[4].age, 20);
        });

        it("should use it as property descending order if starting with '-'", function () {
            var people = Person.findSync(["-age"]);

            assert.isObject(people);
            assert.propertyVal(people, "length", 5);
            assert.equal(people[0].age, 20);
            assert.equal(people[4].age, 16);
        });

        it("should use it as property descending order if element is 'Z'", function () {
            var people = Person.findSync(["age", "Z"]);

            assert.isObject(people);
            assert.propertyVal(people, "length", 5);
            assert.equal(people[0].age, 20);
            assert.equal(people[4].age, 16);
        });

        it("should accept multiple ordering", function () {
            var people = Person.findSync(["age", "name", "Z"]);

            assert.isObject(people);
            assert.propertyVal(people, "length", 5);
            assert.equal(people[0].age, 16);
            assert.equal(people[4].age, 20);
        });

        it("should accept multiple ordering using '-' instead of 'Z'", function () {
            var people = Person.findSync(["age", "-name"]);

            assert.isObject(people);
            assert.propertyVal(people, "length", 5);
            assert.equal(people[0].age, 16);
            assert.equal(people[4].age, 20);
        });
    });

    describe("with an Object as argument", function () {
        before(setup);

        it("should use it as conditions", function () {
            var people = Person.findSync({
                age: 16
            });

            assert.isObject(people);
            assert.propertyVal(people, "length", 1);
            assert.equal(people[0].age, 16);
        });

        it("should accept comparison objects", function () {
            var people = Person.findSync({
                age: ORM.gt(18)
            });

            assert.isObject(people);
            assert.propertyVal(people, "length", 2);
            assert.equal(people[0].age, 20);
            assert.equal(people[1].age, 20);
        });

        describe("with another Object as argument", function () {
            before(setup);

            it("should use it as options", function () {
                var people = Person.findSync({
                    age: 18
                }, 1, {
                    cache: false
                });
                assert.isObject(people);
                assert.propertyVal(people, "length", 1);
                assert.equal(people[0].age, 18);
            });

            describe("if a limit is passed", function () {
                before(setup);

                it("should use it", function () {
                    var people = Person.findSync({
                        age: 18
                    }, {
                        limit: 1
                    });

                    assert.isObject(people);
                    assert.propertyVal(people, "length", 1);
                    assert.equal(people[0].age, 18);
                });
            });

            describe("if an offset is passed", function () {
                before(setup);

                it("should use it", function () {
                    var people = Person.findSync({}, {
                        offset: 1
                    }, "age");

                    assert.isObject(people);
                    assert.propertyVal(people, "length", 4);
                    assert.equal(people[0].age, 18);
                });
            });

            describe("if an order is passed", function () {
                before(setup);

                it("should use it", function () {
                    var people = Person.findSync({
                        surname: "Doe"
                    }, {
                        order: "age"
                    });

                    assert.isObject(people);
                    assert.propertyVal(people, "length", 3);
                    assert.equal(people[0].age, 16);
                });

                it("should use it and ignore previously defined order", function () {
                    var people = Person.findSync({
                        surname: "Doe"
                    }, "-age", {
                        order: "age"
                    });

                    assert.isObject(people);
                    assert.propertyVal(people, "length", 3);
                    assert.equal(people[0].age, 16);
                });
            });
        });
    });

    describe("if defined static methods", function () {
        before(setup);

        it("should be rechainable", function () {
            Person.over18 = function () {
                return this.find({
                    age: ORM.gt(18)
                });
            };
            Person.family = function (family) {
                return this.find({
                    surname: family
                });
            };

            var people = Person.over18().family("Doe").runSync();

            assert.isObject(people);
            assert.propertyVal(people, "length", 1);
            assert.equal(people[0].name, "Jasmine");
            assert.equal(people[0].surname, "Doe");
        });
    });

    describe("with identityCache disabled", function () {
        before(setup);

        it("should not return singletons", function () {
            var people = Person.findSync({
                name: "Jasmine"
            }, {
                identityCache: false
            });

            assert.isObject(people);
            assert.propertyVal(people, "length", 1);
            assert.equal(people[0].name, "Jasmine");
            assert.equal(people[0].surname, "Doe");

            people[0].surname = "Dux";

            people = Person.findSync({
                name: "Jasmine"
            }, {
                identityCache: false
            });

            assert.isObject(people);
            assert.propertyVal(people, "length", 1);
            assert.equal(people[0].name, "Jasmine");
            assert.equal(people[0].surname, "Doe");
        });
    });

    describe("when using Model.all()", function () {
        before(setup);

        it("should work exactly the same", function () {
            var people = Person.allSync({
                surname: "Doe"
            }, "-age", 1);

            assert.isObject(people);
            assert.propertyVal(people, "length", 1);
            assert.equal(people[0].name, "Jasmine");
            assert.equal(people[0].surname, "Doe");
        });
    });

    describe("when using Model.where()", function () {
        before(setup);

        it("should work exactly the same", function () {
            var people = Person.whereSync({
                surname: "Doe"
            }, "-age", 1);

            assert.isObject(people);
            assert.propertyVal(people, "length", 1);
            assert.equal(people[0].name, "Jasmine");
            assert.equal(people[0].surname, "Doe");
        });
    });
});