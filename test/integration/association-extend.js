var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model.extendsTo()", function () {
    var db = null;
    var Person = null;
    var PersonAddress = null;

    var setup = function () {
        return function () {
            Person = db.define("person", {
                name: String
            });
            PersonAddress = Person.extendsTo("address", {
                street: String,
                number: Number
            });

            ORM.singleton.clear();

            helper.dropSync([Person, PersonAddress], function () {
                var person = Person.createSync({
                    name: "John Doe"
                });
                person.setAddressSync(new PersonAddress({
                    street: "Liberty",
                    number: 123
                }));
            });
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    describe("when calling hasAccessor", function () {
        before(setup());

        it("should return true if found", function () {
            var John = Person.find().firstSync();
            var hasAddress = John.hasAddressSync();
            assert.equal(hasAddress, true);
        });

        it("should return false if not found", function () {
            var John = Person.find().firstSync();

            John.removeAddressSync();
            assert.throws(function () {
                John.hasAddressSync();
            })
        });

        it("should return error if instance not with an ID", function () {
            var Jane = new Person({
                name: "Jane"
            });

            try {
                Jane.hasAddressSync();
            } catch (err) {
                assert.propertyVal(err, "code", ORM.ErrorCodes.NOT_DEFINED);
            }
        });
    });

    describe("when calling getAccessor", function () {
        before(setup());

        it("should return extension if found", function () {
            var John = Person.find().firstSync();
            var Address = John.getAddressSync();
            assert.isObject(Address);
            assert.propertyVal(Address, "street", "Liberty");
        });

        it("should return error if not found", function () {
            var John = Person.find().firstSync();

            John.removeAddressSync();

            try {
                John.getAddressSync();
            } catch (err) {
                assert.propertyVal(err, "code", ORM.ErrorCodes.NOT_FOUND);
            }
        });

        it("should return error if instance not with an ID", function () {
            var Jane = new Person({
                name: "Jane"
            });

            try {
                Jane.getAddressSync();
            } catch (err) {
                assert.propertyVal(err, "code", ORM.ErrorCodes.NOT_DEFINED);
            }
        });
    });

    describe("when calling setAccessor", function () {
        before(setup());

        it("should remove any previous extension", function () {
            var John = Person.find().firstSync();

            var c = PersonAddress.find({
                number: 123
            }).countSync();

            assert.equal(c, 1);

            var addr = new PersonAddress({
                street: "4th Ave",
                number: 4
            });

            John.setAddressSync(addr);

            var Address = John.getAddressSync();

            assert.isObject(Address);
            assert.propertyVal(Address, "street", addr.street);

            var c = PersonAddress.find({
                number: 123
            }).countSync();

            assert.equal(c, 0);
        });
    });

    describe("when calling delAccessor", function () {
        before(setup());

        it("should remove any extension", function () {
            var John = Person.find().firstSync();

            var c = PersonAddress.find({
                number: 123
            }).countSync();
            assert.equal(c, 1);

            var addr = new PersonAddress({
                street: "4th Ave",
                number: 4
            });

            John.removeAddressSync();

            var c = PersonAddress.find({
                number: 123
            }).countSync();
            assert.equal(c, 0);
        });

        it("should return error if instance not with an ID", function () {
            var Jane = new Person({
                name: "Jane"
            });
            try {
                Jane.removeAddressSync();
            } catch (err) {
                assert.propertyVal(err, "code", ORM.ErrorCodes.NOT_DEFINED);
            }
        });
    });

    describe("findBy*()", function () {
        before(setup());

        it("should throw if no conditions passed", function () {
            assert.throws(function () {
                Person.findByAddressSync();
            });
        });

        it("should lookup in Model based on associated model properties", function () {
            var people = Person.findByAddressSync({
                number: 123,
            }, {
                autoFetch: true
            });
            assert.ok(Array.isArray(people));
            assert.ok(people.length == 1);
            assert.equal(people[0].address.street, 'Liberty');
            
            var people = Person.findBy('address', {
                number: 123,
            }, {
                autoFetch: true
            }).runSync();
            
            assert.ok(Array.isArray(people));
            assert.ok(people.length == 1);
            assert.equal(people[0].address.street, 'Liberty');
            
            var people = Person.findBy('address', {
                number: ORM.ne(123),
            }, {
                autoFetch: true
            }).runSync();
            
            assert.ok(Array.isArray(people));
            assert.ok(people.length == 0);
        });

        it("should return a ChainFind if no callback passed", function () {
            var ChainFind = Person.findByAddress({
                number: 123
            });
            assert.isFunction(ChainFind.run);
        });
    });
});