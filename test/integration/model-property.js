var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model Property", function () {
    var db = null;
    var Pet = null;
    var Person = null;
    var PersonPets = null;

    var models = {};

    function resync () {
        Object.values(models).forEach(m => m.drop());
        Person.drop();
        Pet.drop();

        db.sync();
    }

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

        PersonPets = Person.hasMany(Pet, { as: "pets" });

        models["type_test"] = db.define("type_test", {
            String: String,
            Number: Number,
            Date: Date,
            Boolean: Boolean,
            Buffer: Buffer,
            'uuid': 'uuid',
            'serial': 'serial',
            arraylist: ['foo', 'bar']
        });
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.close();
    });

    describe("Model Property", function () {
        before(setup);

        describe('[String]', () => {
            it('model has default id property if not defined', function () {
                /**
                 * @NOTICE vary for difference remote endpoints,
                 * not all dbs or remote use string/number id
                 */
                assert.property(Person.properties, 'id')

                assert.propertyVal(Person.properties.id, 'name', 'id')
                assert.propertyVal(Person.properties.id, 'type', 'serial')
                assert.propertyVal(Person.properties.id, 'key', true)
                assert.propertyVal(Person.properties.id, 'mapsTo', 'id')
                assert.propertyVal(Person.properties.id, 'unique', true)
                assert.propertyVal(Person.properties.id, 'index', false)
                assert.propertyVal(Person.properties.id, 'serial', true)
                assert.propertyVal(Person.properties.id, 'unsigned', true)
                assert.propertyVal(Person.properties.id, 'primary', true)
                assert.propertyVal(Person.properties.id, 'required', true)
                assert.propertyVal(Person.properties.id, 'defaultValue', undefined)
                // maybe there should not be 4, just upgrade @fxjs/sql-ddl-sync to make it better
                assert.propertyVal(Person.properties.id, 'size', 4)
                assert.propertyVal(Person.properties.id, 'rational', false)
                assert.propertyVal(Person.properties.id, 'time', false)
                assert.propertyVal(Person.properties.id, 'big', false)
                assert.propertyVal(Person.properties.id, 'values', null)
                assert.propertyVal(Person.properties.id, 'lazyload', false)
                assert.propertyVal(Person.properties.id, 'lazyname', 'id')
                assert.propertyVal(Person.properties.id, 'enumerable', true)
            });

            it('model has its own property', function () {
                assert.property(Person.properties, 'name')

                assert.propertyVal(Person.properties.name, 'name', 'name')
                assert.propertyVal(Person.properties.name, 'type', 'text')
                assert.propertyVal(Person.properties.name, 'key', false)
                assert.propertyVal(Person.properties.name, 'mapsTo', 'name')
                assert.propertyVal(Person.properties.name, 'unique', false)
                assert.propertyVal(Person.properties.name, 'index', false)
                assert.propertyVal(Person.properties.name, 'serial', false)
                assert.propertyVal(Person.properties.name, 'unsigned', false)
                assert.propertyVal(Person.properties.name, 'primary', false)
                assert.propertyVal(Person.properties.name, 'required', false)
                assert.propertyVal(Person.properties.name, 'defaultValue', undefined)
                // TODO: check here, should property in any endpoints should be like this?
                assert.propertyVal(Person.properties.name, 'size', 0)
                assert.propertyVal(Person.properties.name, 'rational', false)
                assert.propertyVal(Person.properties.name, 'time', false)
                assert.propertyVal(Person.properties.name, 'big', false)
                assert.propertyVal(Person.properties.name, 'values', null)
                assert.propertyVal(Person.properties.name, 'lazyload', false)
                assert.propertyVal(Person.properties.name, 'lazyname', 'name')
                assert.propertyVal(Person.properties.name, 'enumerable', true)
            });

            it('#toJSON', function () {
                assert.deepEqual(Person.properties.name.toJSON(), {
                    "key": false,
                    "index": false,
                    "rational": false,
                    "time": false,
                    "big": false,
                    "values": null,
                    "lazyload": false,
                    "name": "name",
                    "type": "text",
                    "size": 0,
                    "required": false,
                    "defaultValue": undefined,
                    "lazyname": "name",
                    "enumerable": true,
                    "mapsTo": "name",
                    "primary": false,
                    "unsigned": false,
                    "unique": false,
                    "joinNode": {
                      "refColumn": ""
                    },
                    "serial": false
                })
            });
        });

        describe('[Boolean]', () => {
            it('transform', function () {
                assert.property(models["type_test"].properties, 'Boolean')

                assert.propertyVal(models["type_test"].properties.Boolean, 'name', 'Boolean')
                assert.propertyVal(models["type_test"].properties.Boolean, 'type', 'boolean')
                assert.propertyVal(models["type_test"].properties.Boolean, 'key', false)
                assert.propertyVal(models["type_test"].properties.Boolean, 'mapsTo', 'Boolean')
                assert.propertyVal(models["type_test"].properties.Boolean, 'unique', false)
                assert.propertyVal(models["type_test"].properties.Boolean, 'index', false)
                assert.propertyVal(models["type_test"].properties.Boolean, 'serial', false)
                assert.propertyVal(models["type_test"].properties.Boolean, 'unsigned', false)
                assert.propertyVal(models["type_test"].properties.Boolean, 'primary', false)
                assert.propertyVal(models["type_test"].properties.Boolean, 'required', false)
                assert.propertyVal(models["type_test"].properties.Boolean, 'defaultValue', false)
                // maybe there should not be 4, just upgrade @fxjs/sql-ddl-sync to make it better
                assert.propertyVal(models["type_test"].properties.Boolean, 'size', 0)
                assert.propertyVal(models["type_test"].properties.Boolean, 'rational', false)
                assert.propertyVal(models["type_test"].properties.Boolean, 'time', false)
                assert.propertyVal(models["type_test"].properties.Boolean, 'big', false)
                assert.propertyVal(models["type_test"].properties.Boolean, 'values', null)
                assert.propertyVal(models["type_test"].properties.Boolean, 'lazyload', false)
                assert.propertyVal(models["type_test"].properties.Boolean, 'lazyname', 'Boolean')
                assert.propertyVal(models["type_test"].properties.Boolean, 'enumerable', true)
            });

            it('#toJSON', function () {
                assert.deepEqual(models["type_test"].properties.Boolean.toJSON(), {
                    "key": false,
                    "index": false,
                    "rational": false,
                    "time": false,
                    "big": false,
                    "values": null,
                    "lazyload": false,
                    "name": "Boolean",
                    "type": "boolean",
                    "size": 0,
                    "required": false,
                    "defaultValue": false,
                    "lazyname": "Boolean",
                    "enumerable": true,
                    "mapsTo": "Boolean",
                    "primary": false,
                    "unsigned": false,
                    "unique": false,
                    "joinNode": {
                      "refColumn": ""
                    },
                    "serial": false
                })
            });
        });

        describe('[Number]', () => {
            it('transform', function () {
                assert.property(models["type_test"].properties, 'Number')

                assert.propertyVal(models["type_test"].properties.Number, 'name', 'Number')
                assert.propertyVal(models["type_test"].properties.Number, 'type', 'integer')
                assert.propertyVal(models["type_test"].properties.Number, 'key', false)
                assert.propertyVal(models["type_test"].properties.Number, 'mapsTo', 'Number')
                assert.propertyVal(models["type_test"].properties.Number, 'unique', false)
                assert.propertyVal(models["type_test"].properties.Number, 'index', false)
                assert.propertyVal(models["type_test"].properties.Number, 'serial', false)
                assert.propertyVal(models["type_test"].properties.Number, 'unsigned', false)
                assert.propertyVal(models["type_test"].properties.Number, 'primary', false)
                assert.propertyVal(models["type_test"].properties.Number, 'required', false)
                assert.propertyVal(models["type_test"].properties.Number, 'defaultValue', undefined)
                // maybe there should not be 4, just upgrade @fxjs/sql-ddl-sync to make it better
                assert.propertyVal(models["type_test"].properties.Number, 'size', 4)
                assert.propertyVal(models["type_test"].properties.Number, 'rational', false)
                assert.propertyVal(models["type_test"].properties.Number, 'time', false)
                assert.propertyVal(models["type_test"].properties.Number, 'big', false)
                assert.propertyVal(models["type_test"].properties.Number, 'values', null)
                assert.propertyVal(models["type_test"].properties.Number, 'lazyload', false)
                assert.propertyVal(models["type_test"].properties.Number, 'lazyname', 'Number')
                assert.propertyVal(models["type_test"].properties.Number, 'enumerable', true)
            });

            it('#toJSON', function () {
                assert.deepEqual(models["type_test"].properties.Number.toJSON(), {
                    "key": false,
                    "index": false,
                    "rational": false,
                    "time": false,
                    "big": false,
                    "values": null,
                    "lazyload": false,
                    "name": "Number",
                    "type": "integer",
                    "size": 4,
                    "required": false,
                    "defaultValue": undefined,
                    "lazyname": "Number",
                    "enumerable": true,
                    "mapsTo": "Number",
                    "primary": false,
                    "unsigned": false,
                    "unique": false,
                    "joinNode": {
                      "refColumn": ""
                    },
                    "serial": false
                })
            });
        });

        describe('[Date]', () => {
            it('transform', function () {
                assert.property(models["type_test"].properties, 'Date')

                assert.propertyVal(models["type_test"].properties.Date, 'name', 'Date')
                assert.propertyVal(models["type_test"].properties.Date, 'type', 'date')
                assert.propertyVal(models["type_test"].properties.Date, 'key', false)
                assert.propertyVal(models["type_test"].properties.Date, 'mapsTo', 'Date')
                assert.propertyVal(models["type_test"].properties.Date, 'unique', false)
                assert.propertyVal(models["type_test"].properties.Date, 'index', false)
                assert.propertyVal(models["type_test"].properties.Date, 'serial', false)
                assert.propertyVal(models["type_test"].properties.Date, 'unsigned', false)
                assert.propertyVal(models["type_test"].properties.Date, 'primary', false)
                assert.propertyVal(models["type_test"].properties.Date, 'required', false)
                assert.propertyVal(models["type_test"].properties.Date, 'defaultValue', undefined)
                // maybe there should not be 4, just upgrade @fxjs/sql-ddl-sync to make it better
                assert.propertyVal(models["type_test"].properties.Date, 'size', 0)
                assert.propertyVal(models["type_test"].properties.Date, 'rational', false)
                assert.propertyVal(models["type_test"].properties.Date, 'time', true)
                assert.propertyVal(models["type_test"].properties.Date, 'big', false)
                assert.propertyVal(models["type_test"].properties.Date, 'values', null)
                assert.propertyVal(models["type_test"].properties.Date, 'lazyload', false)
                assert.propertyVal(models["type_test"].properties.Date, 'lazyname', 'Date')
                assert.propertyVal(models["type_test"].properties.Date, 'enumerable', true)
            });

            it('#toJSON', function () {
                assert.deepEqual(models["type_test"].properties.Date.toJSON(), {
                    "key": false,
                    "index": false,
                    "rational": false,
                    "time": true,
                    "big": false,
                    "values": null,
                    "lazyload": false,
                    "name": "Date",
                    "type": "date",
                    "size": 0,
                    "required": false,
                    "defaultValue": undefined,
                    "lazyname": "Date",
                    "enumerable": true,
                    "mapsTo": "Date",
                    "primary": false,
                    "unsigned": false,
                    "unique": false,
                    "joinNode": {
                      "refColumn": ""
                    },
                    "serial": false
                })
            });
        });

        describe('[Buffer]', () => {
            it('transform', function () {
                assert.property(models["type_test"].properties, 'Buffer')

                assert.propertyVal(models["type_test"].properties.Buffer, 'name', 'Buffer')
                assert.propertyVal(models["type_test"].properties.Buffer, 'type', 'binary')
                assert.propertyVal(models["type_test"].properties.Buffer, 'key', false)
                assert.propertyVal(models["type_test"].properties.Buffer, 'mapsTo', 'Buffer')
                assert.propertyVal(models["type_test"].properties.Buffer, 'unique', false)
                assert.propertyVal(models["type_test"].properties.Buffer, 'index', false)
                assert.propertyVal(models["type_test"].properties.Buffer, 'serial', false)
                assert.propertyVal(models["type_test"].properties.Buffer, 'unsigned', false)
                assert.propertyVal(models["type_test"].properties.Buffer, 'primary', false)
                assert.propertyVal(models["type_test"].properties.Buffer, 'required', false)
                assert.propertyVal(models["type_test"].properties.Buffer, 'defaultValue', undefined)
                // maybe there should not be 4, just upgrade @fxjs/sql-ddl-sync to make it better
                assert.propertyVal(models["type_test"].properties.Buffer, 'size', 0)
                assert.propertyVal(models["type_test"].properties.Buffer, 'rational', false)
                assert.propertyVal(models["type_test"].properties.Buffer, 'time', false)
                assert.propertyVal(models["type_test"].properties.Buffer, 'big', false)
                assert.propertyVal(models["type_test"].properties.Buffer, 'values', null)
                assert.propertyVal(models["type_test"].properties.Buffer, 'lazyload', true)
                assert.propertyVal(models["type_test"].properties.Buffer, 'lazyname', 'Buffer')
                assert.propertyVal(models["type_test"].properties.Buffer, 'enumerable', true)
            });

            it('#toJSON', function () {
                assert.deepEqual(models["type_test"].properties.Buffer.toJSON(), {
                    "key": false,
                    "index": false,
                    "rational": false,
                    "time": false,
                    "big": false,
                    "values": null,
                    "lazyload": true,
                    "name": "Buffer",
                    "type": "binary",
                    "size": 0,
                    "required": false,
                    "defaultValue": undefined,
                    "lazyname": "Buffer",
                    "enumerable": true,
                    "mapsTo": "Buffer",
                    "primary": false,
                    "unsigned": false,
                    "unique": false,
                    "joinNode": {
                      "refColumn": ""
                    },
                    "serial": false
                })
            });
        });

        describe(`['serial']`, () => {
            it('transform', function () {
                assert.property(models["type_test"].properties, 'serial')

                assert.propertyVal(models["type_test"].properties.serial, 'name', 'serial')
                assert.propertyVal(models["type_test"].properties.serial, 'type', 'serial')
                assert.propertyVal(models["type_test"].properties.serial, 'key', false)
                assert.propertyVal(models["type_test"].properties.serial, 'mapsTo', 'serial')
                assert.propertyVal(models["type_test"].properties.serial, 'unique', true)
                assert.propertyVal(models["type_test"].properties.serial, 'index', false)
                assert.propertyVal(models["type_test"].properties.serial, 'serial', true)
                assert.propertyVal(models["type_test"].properties.serial, 'unsigned', true)
                assert.propertyVal(models["type_test"].properties.serial, 'primary', true)
                assert.propertyVal(models["type_test"].properties.serial, 'required', true)
                assert.propertyVal(models["type_test"].properties.serial, 'defaultValue', undefined)
                // maybe there should not be 4, just upgrade @fxjs/sql-ddl-sync to make it better
                assert.propertyVal(models["type_test"].properties.serial, 'size', 4)
                assert.propertyVal(models["type_test"].properties.serial, 'rational', false)
                assert.propertyVal(models["type_test"].properties.serial, 'time', false)
                assert.propertyVal(models["type_test"].properties.serial, 'big', false)
                assert.propertyVal(models["type_test"].properties.serial, 'values', null)
                assert.propertyVal(models["type_test"].properties.serial, 'lazyload', false)
                assert.propertyVal(models["type_test"].properties.serial, 'lazyname', 'serial')
                assert.propertyVal(models["type_test"].properties.serial, 'enumerable', true)
            });

            it('#toJSON', function () {
                assert.deepEqual(models["type_test"].properties.serial.toJSON(), {
                    "key": false,
                    "index": false,
                    "rational": false,
                    "time": false,
                    "big": false,
                    "values": null,
                    "lazyload": false,
                    "name": "serial",
                    "type": "serial",
                    "size": 4,
                    "required": true,
                    "defaultValue": undefined,
                    "lazyname": "serial",
                    "enumerable": true,
                    "mapsTo": "serial",
                    "primary": true,
                    "unsigned": true,
                    "unique": true,
                    "joinNode": {
                      "refColumn": ""
                    },
                    "serial": true
                })
            });
        });

        describe(`['uuid']`, () => {
            it('transform', function () {
                assert.property(models["type_test"].properties, 'uuid')

                assert.propertyVal(models["type_test"].properties.uuid, 'name', 'uuid')
                assert.propertyVal(models["type_test"].properties.uuid, 'type', 'text')
                assert.propertyVal(models["type_test"].properties.uuid, 'key', false)
                assert.propertyVal(models["type_test"].properties.uuid, 'mapsTo', 'uuid')
                assert.propertyVal(models["type_test"].properties.uuid, 'unique', true)
                assert.propertyVal(models["type_test"].properties.uuid, 'index', false)
                assert.propertyVal(models["type_test"].properties.uuid, 'serial', false)
                assert.propertyVal(models["type_test"].properties.uuid, 'unsigned', false)
                assert.propertyVal(models["type_test"].properties.uuid, 'primary', false)
                assert.propertyVal(models["type_test"].properties.uuid, 'required', false)
                assert.propertyVal(models["type_test"].properties.uuid, 'defaultValue', undefined)
                // maybe there should not be 4, just upgrade @fxjs/sql-ddl-sync to make it better
                assert.propertyVal(models["type_test"].properties.uuid, 'size', 0)
                assert.propertyVal(models["type_test"].properties.uuid, 'rational', false)
                assert.propertyVal(models["type_test"].properties.uuid, 'time', false)
                assert.propertyVal(models["type_test"].properties.uuid, 'big', false)
                assert.propertyVal(models["type_test"].properties.uuid, 'values', null)
                assert.propertyVal(models["type_test"].properties.uuid, 'lazyload', false)
                assert.propertyVal(models["type_test"].properties.uuid, 'lazyname', 'uuid')
                assert.propertyVal(models["type_test"].properties.uuid, 'enumerable', true)
            });

            it('#toJSON', function () {
                assert.deepEqual(models["type_test"].properties.uuid.toJSON(), {
                    "key": false,
                    "index": false,
                    "rational": false,
                    "time": false,
                    "big": false,
                    "values": null,
                    "lazyload": false,
                    "name": "uuid",
                    "type": "text",
                    "size": 0,
                    "required": false,
                    "defaultValue": undefined,
                    "lazyname": "uuid",
                    "enumerable": true,
                    "mapsTo": "uuid",
                    "primary": false,
                    "unsigned": false,
                    "unique": true,
                    "joinNode": {
                      "refColumn": ""
                    },
                    "serial": false
                })
            });
        });

        describe('[Array]', () => {
            it('transform', function () {
                assert.property(models["type_test"].properties, 'arraylist')

                assert.propertyVal(models["type_test"].properties.arraylist, 'name', 'arraylist')
                assert.propertyVal(models["type_test"].properties.arraylist, 'type', 'enum')
                assert.propertyVal(models["type_test"].properties.arraylist, 'key', false)
                assert.propertyVal(models["type_test"].properties.arraylist, 'mapsTo', 'arraylist')
                assert.propertyVal(models["type_test"].properties.arraylist, 'unique', false)
                assert.propertyVal(models["type_test"].properties.arraylist, 'index', false)
                assert.propertyVal(models["type_test"].properties.arraylist, 'serial', false)
                assert.propertyVal(models["type_test"].properties.arraylist, 'unsigned', false)
                assert.propertyVal(models["type_test"].properties.arraylist, 'primary', false)
                assert.propertyVal(models["type_test"].properties.arraylist, 'required', false)
                assert.propertyVal(models["type_test"].properties.arraylist, 'defaultValue', 'foo')
                // maybe there should not be 4, just upgrade @fxjs/sql-ddl-sync to make it better
                assert.propertyVal(models["type_test"].properties.arraylist, 'size', 0)
                assert.propertyVal(models["type_test"].properties.arraylist, 'rational', false)
                assert.propertyVal(models["type_test"].properties.arraylist, 'time', false)
                assert.propertyVal(models["type_test"].properties.arraylist, 'big', false)
                assert.deepEqual(models["type_test"].properties.arraylist.values, ['foo', 'bar'])
                assert.propertyVal(models["type_test"].properties.arraylist, 'lazyload', false)
                assert.propertyVal(models["type_test"].properties.arraylist, 'lazyname', 'arraylist')
                assert.propertyVal(models["type_test"].properties.arraylist, 'enumerable', true)
            });

            it('#toJSON', function () {
                assert.deepEqual(models["type_test"].properties.arraylist.toJSON(), {
                    "key": false,
                    "index": false,
                    "rational": false,
                    "time": false,
                    "big": false,
                    "values": ['foo', 'bar'],
                    "lazyload": false,
                    "name": "arraylist",
                    "type": "enum",
                    "size": 0,
                    "required": false,
                    "defaultValue": 'foo',
                    "lazyname": "arraylist",
                    "enumerable": true,
                    "mapsTo": "arraylist",
                    "primary": false,
                    "unsigned": false,
                    "unique": false,
                    "joinNode": {
                      "refColumn": ""
                    },
                    "serial": false
                })
            });
        });

        describe(`[{type: 'text'}]`, () => {
            it('model has default id property if not defined', function () {
                assert.property(Pet.properties, 'id')

                assert.propertyVal(Pet.properties.id, 'name', 'id')
                assert.propertyVal(Pet.properties.id, 'type', 'serial')
                assert.propertyVal(Pet.properties.id, 'key', true)
                assert.propertyVal(Pet.properties.id, 'mapsTo', 'id')
                assert.propertyVal(Pet.properties.id, 'unique', true)
                assert.propertyVal(Pet.properties.id, 'index', false)
                assert.propertyVal(Pet.properties.id, 'serial', true)
                assert.propertyVal(Pet.properties.id, 'unsigned', true)
                assert.propertyVal(Pet.properties.id, 'primary', true)
                assert.propertyVal(Pet.properties.id, 'required', true)
                assert.propertyVal(Pet.properties.id, 'defaultValue', undefined)
                assert.propertyVal(Pet.properties.id, 'size', 4)
                assert.propertyVal(Pet.properties.id, 'rational', false)
                assert.propertyVal(Pet.properties.id, 'time', false)
                assert.propertyVal(Pet.properties.id, 'big', false)
                assert.propertyVal(Pet.properties.id, 'values', null)
                assert.propertyVal(Pet.properties.id, 'lazyload', false)
                assert.propertyVal(Pet.properties.id, 'lazyname', 'id')
                assert.propertyVal(Pet.properties.id, 'enumerable', true)
            });

            it('model has its own property', function () {
                assert.property(Pet.properties, 'name')

                assert.propertyVal(Pet.properties.name, 'name', 'name')
                assert.propertyVal(Pet.properties.name, 'type', 'text')
                assert.propertyVal(Pet.properties.name, 'key', false)
                assert.propertyVal(Pet.properties.name, 'mapsTo', 'name')
                assert.propertyVal(Pet.properties.name, 'unique', false)
                assert.propertyVal(Pet.properties.name, 'index', false)
                assert.propertyVal(Pet.properties.name, 'serial', false)
                assert.propertyVal(Pet.properties.name, 'unsigned', false)
                assert.propertyVal(Pet.properties.name, 'primary', false)
                assert.propertyVal(Pet.properties.name, 'required', false)
                assert.propertyVal(Pet.properties.name, 'defaultValue', 'Mutt')
                assert.propertyVal(Pet.properties.name, 'size', 0)
                assert.propertyVal(Pet.properties.name, 'rational', false)
                assert.propertyVal(Pet.properties.name, 'time', false)
                assert.propertyVal(Pet.properties.name, 'big', false)
                assert.propertyVal(Pet.properties.name, 'values', null)
                assert.propertyVal(Pet.properties.name, 'lazyload', false)
                assert.propertyVal(Pet.properties.name, 'lazyname', 'name')
                assert.propertyVal(Pet.properties.name, 'enumerable', true)
            });

            it('#toJSON()', function () {
                assert.deepEqual(Pet.properties.name.toJSON(), {
                    "key": false,
                    "index": false,
                    "rational": false,
                    "time": false,
                    "big": false,
                    "values": null,
                    "lazyload": false,
                    "name": "name",
                    "type": "text",
                    "size": 0,
                    "required": false,
                    "defaultValue": "Mutt",
                    "lazyname": "name",
                    "enumerable": true,
                    "mapsTo": "name",
                    "primary": false,
                    "unsigned": false,
                    "unique": false,
                    "joinNode": {
                      "refColumn": ""
                    },
                    "serial": false
                });
            });
        });

        describe('For Id key', () => {
            it('#deKey', () => {
                assert.deepEqual(Person.properties.id.deKeys(), {
                    "key": false,
                    "index": false,
                    "rational": false,
                    "time": false,
                    "big": false,
                    "values": null,
                    "lazyload": false,
                    "name": "id",
                    "type": "integer",
                    "size": 4,
                    "required": true,
                    "defaultValue": undefined,
                    "lazyname": "id",
                    "enumerable": true,
                    "mapsTo": "id",
                    "primary": false,
                    "unsigned": true,
                    "unique": false,
                    "joinNode": {
                      "refColumn": ""
                    },
                    "serial": false
                })
            });
        })
    })

    odescribe("Property Specs", function () {
        before(setup);

        describe(`#useAsJoinColumn`, () => {
            it("column is required", function () {
              assert.throws(() => {
                Person.properties['id'].useAsJoinColumn({})
              });
            });

            it("column", function () {
              assert.deepEqual(
                Person.properties['id'].useAsJoinColumn({ column: 'person_id' }),
                {
                  "key": true,
                  "index": false,
                  "rational": false,
                  "time": false,
                  "big": false,
                  "values": null,
                  "lazyload": false,
                  "name": "id",
                  "type": "serial",
                  "size": 4,
                  "required": false,
                  "defaultValue": undefined,
                  "lazyname": "id",
                  "enumerable": true,
                  "mapsTo": "id",
                  "primary": true,
                  "unsigned": true,
                  "unique": true,
                  "joinNode": {
                    "refColumn": "person_id",
                    "refCollection": undefined
                  },
                  "serial": true
                }
              )
            });

            it("column, collection", function () {
              assert.deepEqual(
                Person.properties['id'].useAsJoinColumn({ column: 'person_id', collection: 'other' }),
                {
                  "key": true,
                  "index": false,
                  "rational": false,
                  "time": false,
                  "big": false,
                  "values": null,
                  "lazyload": false,
                  "name": "id",
                  "type": "serial",
                  "size": 4,
                  "required": false,
                  "defaultValue": undefined,
                  "lazyname": "id",
                  "enumerable": true,
                  "mapsTo": "id",
                  "primary": true,
                  "unsigned": true,
                  "unique": true,
                  "joinNode": {
                    "refColumn": "person_id",
                    "refCollection": "other"
                  },
                  "serial": true
                }
              )
            });
        })
    });
});
