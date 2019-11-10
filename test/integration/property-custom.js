var helper = require('../support/spec_helper');

describe("custom types", function () {
    var db = null;

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.close();
    });

    describe("defineType", function () {
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
                var ticket = LottoTicket.New({
                    numbers: [4, 23, 6, 45, 9, 12, 3, 29]
                });
    
                ticket.$save();
    
                var items = LottoTicket.find();
                assert.equal(items.length, 1);
                assert.ok(Array.isArray(items[0].numbers));
    
                assert.deepEqual([4, 23, 6, 45, 9, 12, 3, 29], items[0].numbers);
            });
    
            xdescribe("hasMany extra properties", function () {
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
    
                        var freshPerson = Person.get(person.id);
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
                    valueToProperty: function (value, prop) {
                        return value + 7;
                    },
                    propertyToStoreValue: function (value, prop) {
                        if (value == null) {
                            return value;
                        } else {
                            return prop.$ctx.knex.raw('(? - 2)', [value])
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
                var item = WonkyTotal.New();
    
                item.name = "cabbages";
                item.total = 8;
    
                item.$save();
                assert.equal(item.total, 15);
    
                var item = WonkyTotal.get(item.id);
    
                assert.equal(item.total, 20); // (15 - 2) + 7
            });
        });
    });

    describe("when Model.define", function () {
        describe("simple", function () {
            var LottoTicket = null;
    
            before(function () {    
                LottoTicket = db.define('lotto_ticket', {
                    numbers: {
                        type: 'text',
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
                    }
                });
    
                return helper.dropSync(LottoTicket);
            });
    
            it("should create the table", function () {
                assert.ok(true);
            });
    
            it("should store data in the table", function () {
                var ticket = LottoTicket.New({
                    numbers: [4, 23, 6, 45, 9, 12, 3, 29]
                });
    
                ticket.$save();
    
                var items = LottoTicket.find();
                assert.equal(items.length, 1);
                assert.ok(Array.isArray(items[0].numbers));
    
                assert.deepEqual([4, 23, 6, 45, 9, 12, 3, 29], items[0].numbers);
            });
        });
    
        describe("complex", function () {
            var WonkyTotal = null;
    
            before(function () {    
                WonkyTotal = db.define('wonky', {
                    name: String,
                    total: {
                        type: 'integer',
                        mapsTo: 'blah_total',
                        valueToProperty: function (value, prop) {
                            return value + 7;
                        },
                        propertyToStoreValue: function (value, prop) {
                            if (value == null) {
                                return value;
                            }
                            
                            return prop.$ctx.knex.raw('(? - 2)', [value])
                        }
                    }
                });
    
                return helper.dropSync(WonkyTotal);
            });
    
            it("should store wonky total in a differently named field", function () {
                var item = WonkyTotal.New();
    
                item.name = "cabbages";
                item.total = 8;
    
                item.$save();
                assert.equal(item.total, 15);
    
                var item = WonkyTotal.get(item.id);
    
                assert.equal(item.total, 20); // (15 - 2) + 7
            });
        });
    });

});
