var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model.extendsTo()", function () {
    var db = null;
    var Person = null;
    var PersonAddress = null;

    var setup = function () {
        return function (done) {
            Person = db.define("person", {
                name: String
            });
            PersonAddress = Person.extendsTo("address", {
                street: String,
                number: Number
            });

            ORM.singleton.clear();

            return helper.dropSync([Person, PersonAddress], function () {
                Person.create({
                    name: "John Doe"
                }, function (err, person) {
                    assert.notExist(err);

                    return person.setAddress(new PersonAddress({
                        street: "Liberty",
                        number: 123
                    }), done);
                });
            });
        };
    };

    before(function (done) {
        helper.connect(function (connection) {
            db = connection;

            return done();
        });
    });

    after(function () {
        return db.close();
    });

    describe("when calling hasAccessor", function () {
        before(setup());

        it("should return true if found", function (done) {
            Person.find().first(function (err, John) {
                assert.equal(err, null);

                John.hasAddress(function (err, hasAddress) {
                    assert.equal(err, null);
                    assert.equal(hasAddress, true);

                    return done();
                });
            });
        });

        it("should return false if not found", function (done) {
            Person.find().first(function (err, John) {
                assert.equal(err, null);

                John.removeAddress(function () {
                    John.hasAddress(function (err, hasAddress) {
                        assert.isObject(err);
                        assert.equal(hasAddress, false);

                        return done();
                    });
                });
            });
        });

        it("should return error if instance not with an ID", function (done) {
            var Jane = new Person({
                name: "Jane"
            });
            Jane.hasAddress(function (err, hasAddress) {
                assert.isObject(err);
                assert.propertyVal(err, "code", ORM.ErrorCodes.NOT_DEFINED);

                return done();
            });
        });
    });

    describe("when calling getAccessor", function () {
        before(setup());

        it("should return extension if found", function (done) {
            Person.find().first(function (err, John) {
                assert.equal(err, null);

                John.getAddress(function (err, Address) {
                    assert.equal(err, null);
                    assert.isObject(Address);
                    assert.propertyVal(Address, "street", "Liberty");

                    return done();
                });
            });
        });

        it("should return error if not found", function (done) {
            Person.find().first(function (err, John) {
                assert.equal(err, null);

                John.removeAddress(function () {
                    John.getAddress(function (err, Address) {
                        assert.isObject(err);
                        assert.propertyVal(err, "code", ORM.ErrorCodes.NOT_FOUND);

                        return done();
                    });
                });
            });
        });

        it("should return error if instance not with an ID", function (done) {
            var Jane = new Person({
                name: "Jane"
            });
            Jane.getAddress(function (err, Address) {
                assert.isObject(err);
                assert.propertyVal(err, "code", ORM.ErrorCodes.NOT_DEFINED);

                return done();
            });
        });
    });

    describe("when calling setAccessor", function () {
        before(setup());

        it("should remove any previous extension", function (done) {
            Person.find().first(function (err, John) {
                assert.equal(err, null);

                PersonAddress.find({ number: 123 }).count(function (err, c) {
                    assert.equal(err, null);
                    assert.equal(c, 1);

                    var addr = new PersonAddress({
                        street: "4th Ave",
                        number: 4
                    });

                    John.setAddress(addr, function (err) {
                        assert.equal(err, null);

                        John.getAddress(function (err, Address) {
                            assert.equal(err, null);
                            assert.isObject(Address);
                            assert.propertyVal(Address, "street", addr.street);

                            PersonAddress.find({ number: 123 }).count(function (err, c) {
                                assert.equal(err, null);
                                assert.equal(c, 0);

                                return done();
                            });
                        });
                    });
                });
            });
        });
    });

    describe("when calling delAccessor", function () {
        before(setup());

        it("should remove any extension", function (done) {
            Person.find().first(function (err, John) {
                assert.equal(err, null);

                PersonAddress.find({ number: 123 }).count(function (err, c) {
                    assert.equal(err, null);
                    assert.equal(c, 1);

                    var addr = new PersonAddress({
                        street: "4th Ave",
                        number: 4
                    });

                    John.removeAddress(function (err) {
                        assert.equal(err, null);

                        PersonAddress.find({ number: 123 }).count(function (err, c) {
                            assert.equal(err, null);
                            assert.equal(c, 0);

                            return done();
                        });
                    });
                });
            });
        });

        it("should return error if instance not with an ID", function (done) {
            var Jane = new Person({
                name: "Jane"
            });
            Jane.removeAddress(function (err) {
                assert.isObject(err);
                assert.propertyVal(err, "code", ORM.ErrorCodes.NOT_DEFINED);

                return done();
            });
        });
    });

    describe("findBy()", function () { // TODO: make async after Models method include async support
        before(setup());

        it("should throw if no conditions passed", function (done) {
            assert.throws(() => {
                Person.findByAddress(function () { });
            })

            return done();
        });

        it("should lookup in Model based on associated model properties", function (done) {
            Person.findByAddress({
                number: 123
            }, function (err, people) {
                assert.equal(err, null);
                assert.ok(Array.isArray(people));
                assert.ok(people.length == 1);

                return done();
            });
        });

        it("should return a ChainFind if no callback passed", function (done) {
            var ChainFind = Person.findByAddress({
                number: 123
            });
            assert.isFunction(ChainFind.run);

            return done();
        });
    });
});