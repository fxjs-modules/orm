var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model.pkMapTo.find()", function () {
    var db = null;
    var Person = null;

    var setup = function () {
        return function () {

            // The fact that we've applied mapsTo to the key
            // property of the model - will break the cache.

            // Without Stuart's little bugfix, 2nd (and subsequent) calls to find()
            // will return the repeats of the first obect retrieved and placed in the cache.
            Person = db.define("person", {
                personId: {
                    type: "integer",
                    key: true,
                    mapsTo: "id"
                },
                name: String,
                surname: String,
                age: Number,
                male: Boolean
            });

            return helper.dropSync(Person, function () {
                Person.create([{
                    personId: 1001,
                    name: "John",
                    surname: "Doe",
                    age: 18,
                    male: true
                }, {
                    personId: 1002,
                    name: "Jane",
                    surname: "Doe",
                    age: 16,
                    male: false
                }, {
                    personId: 1003,
                    name: "Jeremy",
                    surname: "Dean",
                    age: 18,
                    male: true
                }, {
                    personId: 1004,
                    name: "Jack",
                    surname: "Dean",
                    age: 20,
                    male: true
                }, {
                    personId: 1005,
                    name: "Jasmine",
                    surname: "Doe",
                    age: 20,
                    male: false
                }]);
            });
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.close();
    });


    describe("Cache should work with mapped key field", function () {
        before(setup());

        it("1st find should work", function () {
            var people = Person.find({
                where: {
                    surname: "Dean"
                }
            });
            assert.isArray(people);
            assert.propertyVal(people, "length", 2);
            assert.equal(people[0].surname, "Dean");
        });

        it("2nd find should should also work", function () {
            var people = Person.find({
                where: {
                    surname: "Doe"
                }
            });
            assert.isArray(people);
            assert.propertyVal(people, "length", 3);
            assert.equal(people[0].surname, "Doe");
        });
    });
});
