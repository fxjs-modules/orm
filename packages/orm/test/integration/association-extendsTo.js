var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model.extendsTo()", function () {
    var db = null;
    var Person = null;
    var PersonAddress = null;

    var John, JohnAddress;

    var setup = function () {
        return function () {
            Person = db.define("person", {
                name: String
            });
            PersonAddress = Person.extendsTo({
                street: String,
                number: Number
            }, {
                as: "address"
            });

            helper.dropSync([Person, PersonAddress], function () {
                John = Person.create({
                    name: "John Doe"
                });
                John.$saveRef("address", PersonAddress.New({
                    street: "Liberty",
                    number: 123
                }));

                JohnAddress = John.address;
            });
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.close();
    });

    describe("#$hasRef", function () {
        before(setup());

        it("should return true if found", function () {
            var _John = Person.one({ where: { name: Person.Opf.startsWith("John") } });
            assert.equal(_John.$hasRef("address").final, true);
        });

        it("should return false if not found", function () {
            var _John = Person.one({ where: { name: Person.Opf.startsWith("John") } });

            _John.$unlinkRef('address');
            assert.equal(_John.$hasRef("address").final, false);
        });

        it("should return false if instance not with an ID", function () {
            var Jane = Person.New({
                name: "Jane"
            });

            assert.equal(Jane.$hasRef("address").final, false);
        });
    });

    describe("#$getRef", function () {
        before(setup());

        it("should return extension if found", function () {
            var John = Person.one({ where: { name: Person.Opf.startsWith("John") } });
            var _JohnAddress = John.$getRef("address");
            assert.isObject(_JohnAddress);
            assert.propertyVal(_JohnAddress, "street", "Liberty");

            assert.equal(_JohnAddress.id, JohnAddress.id);
        });

        it("should return false if not found", function () {
            var John = Person.one({ where: { name: Person.Opf.startsWith("John") } });

            John.$unlinkRef('address');
            assert.equal(John.$hasRef("address").final, false);
        });

        it("should return error if instance not with an ID", function () {
            var Jane = Person.New({
                name: "Jane"
            });

            assert.throws(() => {
                Jane.$unlinkRef('address');
            })
        });
    });

    describe("#$setRef", function () {
        before(setup());

        it("should remove any previous extension", function () {
            var John = Person.one({ where: { name: Person.Opf.startsWith("John") } });

            var c = PersonAddress.count({ where: { number: 123 } });

            assert.equal(c, 1);

            var newAddr = PersonAddress.New({
                street: "4th Ave",
                number: 4
            });
            John.$saveRef("address", newAddr);

            var Address = John.$getRef("address");

            assert.isObject(Address);
            assert.propertyVal(Address, "street", newAddr.street);

            var c = PersonAddress.count({ where: { number: 123 } });

            assert.equal(c, 0);
        });
    });

    describe("#$unlinkRef", function () {
        before(setup());

        it("should remove any extension", function () {
            var John = Person.one({ where: { name: Person.Opf.startsWith("John") } });

            var c = PersonAddress.count({
                where: { number: 123 }
            });
            assert.equal(c, 1);

            John.$unlinkRef('address');

            var c = PersonAddress.count({
                where: { number: 123 }
            });
            assert.equal(c, 0);
        });

        it("should return error if instance not with an ID", function () {
            var Jane = Person.New({
                name: "Jane"
            });
            
            assert.throws(() => {
                Jane.$unlinkRef('address');
            });
        });
    });

    describe("findByRef()", function () {
        before(setup());

        it("should throw if no conditions passed", function () {
            assert.throws(() => {
                Person.findByRef("address");
            });
        });

        it("should lookup in Model based on associated model properties", function () {
            var people = Person.findByRef("address", {
                number: 123,
            });
            assert.ok(Array.isArray(people));
            assert.ok(people.length == 1);
            assert.equal(people[0].address.street, 'Liberty');
            
            var people = Person.findByRef("address", {
                number: Person.Opf.eq(123),
            });
            
            assert.ok(Array.isArray(people));
            assert.ok(people.length == 1);
            assert.equal(people[0].address.street, 'Liberty');
            
            var people = Person.findByRef("address", {
                number: Person.Opf.ne(123),
            });
            
            assert.ok(Array.isArray(people));
            assert.ok(people.length == 0);
        });
    });
});