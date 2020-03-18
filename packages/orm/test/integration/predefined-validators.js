var helper = require('../support/spec_helper');
var validators = require('../../').validators;
var undef = undefined;

function checkValidation(expected) {
    return function (returned) {
        assert.equal(returned, expected);
    };
}

describe("Predefined Validators", function () {

    describe("equalToProperty('name')", function () {
        it("should pass if equal", function () {
            validators.equalToProperty('name').call({
                name: "John Doe"
            }, 'John Doe', checkValidation());
        });
        it("should not pass if not equal", function () {
            validators.equalToProperty('name').call({
                name: "John"
            }, 'John Doe', checkValidation('not-equal-to-property'));
        });
        it("should not pass even if equal to other property", function () {
            validators.equalToProperty('name').call({
                surname: "John Doe"
            }, 'John Doe', checkValidation('not-equal-to-property'));
        });
    });

    describe("unique()", function () {
        var db = null;
        var Person = null;

        var setup = function () {
            return function () {
                Person = db.define("person", {
                    name: String,
                    surname: String
                }, {
                    validations: {
                        surname: validators.unique()
                    }
                });

                Person.settings.set("instance.returnAllErrors", false);

                return helper.dropSync(Person, function () {
                    Person.createSync([{
                        name: "John",
                        surname: "Doe"
                    }]);
                });
            };
        };

        before(function () {
            db = helper.connect();
            setup()();
        });

        after(function () {
            return db.closeSync();
        });

        it("should not pass if more elements with that property exist", function () {
            var janeDoe = new Person({
                name: "Jane",
                surname: "Doe" // <-- in table already!
            });
            try {
                janeDoe.saveSync();
            } catch (err) {
                assert.propertyVal(err, "property", "surname");
                assert.propertyVal(err, "value", "Doe");
                assert.propertyVal(err, "msg", "not-unique");
            }
        });

        it("should pass if no more elements with that property exist", function () {
            var janeDean = new Person({
                name: "Jane",
                surname: "Dean" // <-- not in table
            });
            janeDean.saveSync();
        });

        it("should pass if resaving the same instance", function () {
            var Johns = Person.findSync({
                name: "John",
                surname: "Doe"
            });
            assert.propertyVal(Johns, "length", 1);
            Johns[0].surname = "Doe"; // forcing resave
            Johns[0].saveSync();
        });
    });

});