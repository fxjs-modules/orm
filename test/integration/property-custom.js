var helper = require('../support/spec_helper');
var ORM = require('../../');

xdescribe("custom types", function () {
    var db = null;

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.closeSync();
    });

    describe("simple", function () {
        var LottoTicket = null;

        before(function () {
            db.defineType('numberArray', {
                datastoreType: function (prop) {
                    return 'TEXT'
                },
                valueToProperty: function (value, prop) {
                    if (Array.isArray(value)) {
                        return value;
                    } else {
                        if (Buffer.isBuffer(value))
                            value = value.toString();
                        return value.split(',').map(function (v) {
                            return Number(v);
                        });
                    }
                },
                propertyToStoreValue: function (value, prop) {
                    return value.join(',')
                }
            });

            LottoTicket = db.define('lotto_ticket', {
                numbers: {
                    type: 'numberArray'
                }
            });

            return helper.dropSync(LottoTicket);
        });

        it("should create the table", function () {
            assert.ok(true);
        });

        it("should store data in the table", function () {
            var ticket = new LottoTicket({
                numbers: [4, 23, 6, 45, 9, 12, 3, 29]
            });

            ticket.saveSync();

            var items = LottoTicket.find().allSync();
            assert.equal(items.length, 1);
            assert.ok(Array.isArray(items[0].numbers));

            assert.deepEqual([4, 23, 6, 45, 9, 12, 3, 29], items[0].numbers);
        });

        describe("hasMany extra properties", function () {
            it("should work", function () {
                db.defineType('customDate', {
                    datastoreType: function (prop) {
                        return 'TEXT';
                    }
                });
                var Person = db.define('person', {
                    name: String,
                    surname: String,
                    age: Number
                });
                var Pet = db.define('pet', {
                    name: String
                });
                Person.hasMany('pets', Pet, {
                    date: {
                        type: 'customDate'
                    }
                }, {
                    autoFetch: true
                });

                return helper.dropSync([Person, Pet], function () {
                    var person = Person.createSync({
                        name: "John",
                        surname: "Doe",
                        age: 20
                    });

                    var pet = Pet.createSync({
                        name: 'Fido'
                    });

                    person.addPetsSync(pet, {
                        date: '2014-05-20'
                    });

                    var freshPerson = Person.getSync(person.id);
                    assert.equal(freshPerson.pets.length, 1);
                    assert.equal(freshPerson.pets[0].extra.date, '2014-05-20');
                });
            });
        });
    });

    describe("complex", function () {
        var WonkyTotal = null;

        before(function () {
            db.defineType('wonkyNumber', {
                datastoreType: function (prop) {
                    return 'INTEGER';
                },
                datastoreGet: function (prop, helper) {
                    return helper.escape('?? - 1', [prop.mapsTo]);
                },
                valueToProperty: function (value, prop) {
                    return value + 7;
                },
                propertyToStoreValue: function (value, prop) {
                    if (value == null) {
                        return value;
                    } else {
                        return function (helper) {
                            return helper.escape('(? - 2)', [value]);
                        };
                    }
                }
            });

            WonkyTotal = db.define('wonky', {
                name: String,
                total: {
                    type: 'wonkyNumber',
                    mapsTo: 'blah_total'
                }
            });

            return helper.dropSync(WonkyTotal);
        });

        it("should store wonky total in a differently named field", function () {
            var item = new WonkyTotal();

            item.name = "cabbages";
            item.total = 8;

            item.saveSync();
            assert.equal(item.total, 15);

            var item = WonkyTotal.getSync(item.id);

            assert.equal(item.total, 19); // (15 - 2) - 1 + 7
        });
    });

});
