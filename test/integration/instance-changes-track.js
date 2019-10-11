var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Instance Changes Track", function () {
    var db = null;
    var Pet = null;
    var Person = null;
    var PersonPets = null

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
        PersonPets = Person.o2m("pets", { model: Pet });

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

    describe("change properties", function () {
        before(setup);

        it('`$save === true` when instance created', function () {
            var Jack = Person.New("Jack")
            assert.propertyVal(Jack, '$saved', true)
        });

        it('#$changes', function () {
            var Jack = Person.New({ name: "Jack" })
            assert.equal(Jack.$changedFieldsCount, 0)

            Jack.name = "Jack"
            assert.equal(Jack.$changedFieldsCount, 0)
            assert.notExist(Jack.$changes['name'])

            Jack.name = "Jack1"
            assert.equal(Jack.$changedFieldsCount, 1)
            assert.equal(Jack.$changes['name'].count, 1)

            Jack.name = "Jack"
            assert.equal(Jack.$changedFieldsCount, 1)
            assert.equal(Jack.$changes['name'].count, 2)
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

            assert.equal(people[0].$changedFieldsCount, 0);
            assert.notExist(people[0].$changes['name'], 0);
            assert.equal(people[1].$changedFieldsCount, 0);
            assert.notExist(people[1].$changes['name'], 0);
        });
    });

    describe("if element has an association model", function () {
        before(setup);

        it("should also create it or save it", function () {
            var John = Person.create({
                name: "John Doe",
                pets: [
                    Pet.New({
                        name: "Deco"
                    })
                ]
            });

            assert.equal(John.$changedFieldsCount, 0)
            assert.equal(John.pets[0].$changedFieldsCount, 0)
            
            assert.ok(John.pets[0].$saved);
        });

        it("should also create it or save it even if it's an object and not an instance", function () {
            var John = Person.create({
                name: "John Doe",
                pets: [
                    {
                        name: "Deco"
                    }
                ]
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
            assert.notProperty(Mutt.$changes, "name");
        });
    });

    // TODO: add changes-track test case when change occured in merged model's instance
});