var helper = require('../support/spec_helper');
var ORM = require('../../');

odescribe("Model Property", function () {
    var db = null;
    var Pet = null;
    var Person = null;
    var PersonPets = null

    function resync () {
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
        PersonPets = Person.o2m("pets", { model: Pet });
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
                assert.propertyVal(Person.properties.id, 'primary', false)
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
                assert.propertyVal(Pet.properties.id, 'primary', false)
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
                    "serial": false
                })
            });
        })

        // TODO: add test about it
        xdescribe('For dsefined Id Key', () => {

        });
    })
    
    describe("MergeModel Property --- [o2m]", function () {
        before(setup);

        it(`never effect sourceModel and targetModel's properties`, () => {
            assert.equal(PersonPets.sourceModel.properties, Person.properties)
            assert.equal(PersonPets.targetModel.properties, Pet.properties)
        })

        describe('merge model has all properties of targetModel', function () {
            it('yep', function () {
                assert.property(PersonPets.properties, 'id')
                assert.property(PersonPets.properties, 'name')
            });

            it(`dekey targetModel's id properties`, function () {
                assert.propertyVal(PersonPets.properties.id, 'name', 'id')
                assert.propertyVal(PersonPets.properties.id, 'type', 'integer')
                assert.propertyVal(PersonPets.properties.id, 'key', false)
                assert.propertyVal(PersonPets.properties.id, 'mapsTo', 'id')
                assert.propertyVal(PersonPets.properties.id, 'unique', false)
                assert.propertyVal(PersonPets.properties.id, 'index', false)
                assert.propertyVal(PersonPets.properties.id, 'serial', false)
                assert.propertyVal(PersonPets.properties.id, 'unsigned', true)
                assert.propertyVal(PersonPets.properties.id, 'primary', false)
                // coerce associated [property].required = true in merge model
                assert.propertyVal(PersonPets.properties.id, 'required', true)
                assert.propertyVal(PersonPets.properties.id, 'defaultValue', undefined)
                assert.propertyVal(PersonPets.properties.id, 'size', 4)
                assert.propertyVal(PersonPets.properties.id, 'rational', false)
                assert.propertyVal(PersonPets.properties.id, 'time', false)
                assert.propertyVal(PersonPets.properties.id, 'big', false)
                assert.propertyVal(PersonPets.properties.id, 'values', null)
                assert.propertyVal(PersonPets.properties.id, 'lazyload', false)
                assert.propertyVal(PersonPets.properties.id, 'lazyname', 'id')
                assert.propertyVal(PersonPets.properties.id, 'enumerable', true)
            });
        });

        it('merge model has corresponding property with associated model', function () {
            assert.property(PersonPets.properties, 'person_id')

            assert.propertyVal(PersonPets.properties.person_id, 'name', 'person_id')
            assert.propertyVal(PersonPets.properties.person_id, 'type', 'integer')
            assert.propertyVal(PersonPets.properties.person_id, 'key', false)
            assert.propertyVal(PersonPets.properties.person_id, 'mapsTo', 'person_id')
            assert.propertyVal(PersonPets.properties.person_id, 'unique', false)
            assert.propertyVal(PersonPets.properties.person_id, 'index', false)
            assert.propertyVal(PersonPets.properties.person_id, 'serial', false)
            assert.propertyVal(PersonPets.properties.person_id, 'unsigned', true)
            assert.propertyVal(PersonPets.properties.person_id, 'primary', false)
            // coerce associated [property].required = true in merge model
            assert.propertyVal(PersonPets.properties.person_id, 'required', true)
            assert.propertyVal(PersonPets.properties.person_id, 'defaultValue', undefined)
            assert.propertyVal(PersonPets.properties.person_id, 'size', 4)
            assert.propertyVal(PersonPets.properties.person_id, 'rational', false)
            assert.propertyVal(PersonPets.properties.person_id, 'time', false)
            assert.propertyVal(PersonPets.properties.person_id, 'big', false)
            assert.propertyVal(PersonPets.properties.person_id, 'values', null)
            assert.propertyVal(PersonPets.properties.person_id, 'lazyload', false)
            assert.propertyVal(PersonPets.properties.person_id, 'lazyname', 'person_id')
            assert.propertyVal(PersonPets.properties.person_id, 'enumerable', true)
        });
    });
});