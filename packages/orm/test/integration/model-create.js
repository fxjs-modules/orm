var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model.create()", function () {
    var db = null;
    var Pet = null;
    var Person = null;

    function setup() {
        Person = db.define("person", {
            name: String
        });
        Pet = db.define("pet", {
            name: {
                type: "text",
                defaultValue: "Mutt"
            }
        });
        Person.hasMany(Pet, {
            as: "pets",
            type: 'm2m'
        });

        Person.drop();
        Pet.drop();

        db.sync();
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.close();
    });

    describe("if passing an object", function () {
        before(setup);

        it("should accept it as the only item to create", function () {
            var John = Person.create({
                name: "John Doe"
            });

            assert.propertyVal(John, "name", "John Doe");
        });
    });

    describe("if passing an array", function () {
        before(setup);

        it("should accept it as a list of items to create", function () {
            var people = Person.create([{
                name: "John Doe"
            }, {
                name: "Jane Doe"
            }]);

            assert.ok(Array.isArray(people));

            assert.propertyVal(people, "length", 2);
            assert.propertyVal(people[0], "name", "John Doe");
            assert.propertyVal(people[1], "name", "Jane Doe");
        });
    });

    describe("if passing array, options object", function () {
        before(setup);

        it("should accept it as a list of items to create", function () {
            var people = Person.create([{
                name: "John Doe"
            }, {
                name: "Jane Doe"
            }]);

            assert.ok(Array.isArray(people));

            assert.propertyVal(people, "length", 2);
            people = people.sort((a, b) => a.name > b.name ? -1 : 1);

            assert.propertyVal(people[1], "name", "Jane Doe");
            assert.propertyVal(people[0], "name", "John Doe");
        });
    });

    describe("if element has an association", function () {
        before(setup);

        it("should also create it or save it", function () {
            var John = Person.create({
                name: "John Doe",
                pets: [Pet.New({
                    name: "Deco"
                })]
            });

            assert.propertyVal(John, "name", "John Doe");

            assert.ok(Array.isArray(John.pets));

            assert.propertyVal(John.pets[0], "name", "Deco");
            assert.property(John.pets[0], Pet.ids[0]);
            assert.ok(John.pets[0].$saved);
        });

        it("should also create it or save it even if it's an object and not an instance", function () {
            var John = Person.create({
                name: "John Doe",
                pets: [{
                    name: "Deco"
                }]
            });

            assert.propertyVal(John, "name", "John Doe");

            assert.ok(Array.isArray(John.pets));

            assert.propertyVal(John.pets[0], "name", "Deco");
            assert.property(John.pets[0], Pet.ids[0]);
            assert.ok(John.pets[0].$saved);
        });
    });

    describe("when not passing a property", function () {
        before(setup);

        it("should use defaultValue if defined", function () {
            var Mutt = Pet.create({});
            assert.propertyVal(Mutt, "name", "Mutt");
        });
    });
});
