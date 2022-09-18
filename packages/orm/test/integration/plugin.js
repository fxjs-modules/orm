var test = require("test");
test.setup();

var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("ORM.definePlugin", function () {
    var db = null;
    var Person = null;
    var John;

    var pluginsHookChecked = {
        beforeDefine: false,
        define: false,
        beforeHasOne: false,
        beforeHasMany: false,
        beforeExtendsTo: false,
    };
    var pluginModel = ORM.definePlugin((orm, options) => {
        return {
            beforeDefine: (name, properties, options) => {
                pluginsHookChecked.beforeDefine = true;
            },
            define: (model, orm) => {
                assert.equal(orm.models[model.name], model);
                pluginsHookChecked.define = true;
            },
        }
    });
    var pluginAssocs = ORM.definePlugin((orm, options) => {
        return {
            beforeHasOne: (model, hasOneOpts) => {
                pluginsHookChecked.beforeHasOne = true;
            },
            beforeHasMany: (model, hasManyOpts) => {
                pluginsHookChecked.beforeHasMany = true;
            },
            beforeExtendsTo: (model, extendsToOpts) => {
                pluginsHookChecked.beforeExtendsTo = true;
            },
        }
    });

    var setup = function () {
        return function () {
            Person = db.define("person", {
                pid: { type: "serial", key: true },
                name: {
                    type: 'text',
                    mapsTo: 'fullname',
                }
            });

            var Pet = db.define('pet', {
                name : String
            });
            Person.hasOne('pet', Pet);
            Person.hasMany('friend', Person);
            var PersonAddress = Person.extendsTo("address", {
                street: String,
                number: Number
            });

            return helper.dropSync([Person, Pet, PersonAddress], function () {
                var people = Person.createSync([{
                    name: "John Doe"
                }, {
                    name: "Jane Doe"
                }]);
                John = people[0];
            });
        };
    };

    before(function () {
        db = helper.connect();
        db.use(pluginModel);
        db.use(pluginAssocs);
        db.use(pluginTimestamp);

        setup()();
    });

    after(function () {
        return db.closeSync();
    });

    describe("hook#hook detected", function () {
        Object.keys(pluginsHookChecked).forEach((hookName) => {
            it(`${hookName} should be called`, () => {
                assert.isTrue(pluginsHookChecked[hookName]);
            });
        });
    });

    var pluginTimestamp = ORM.definePlugin((orm, options) => {
        return {
            define: (model, orm) => {
                model.addProperty({
                    type: 'date',
                    time: true,
                    name: 'created_at',
                    mapsTo: 'created_at',
                });
                model.addProperty({
                    type: 'date',
                    time: true,
                    name: 'updated_at',
                    mapsTo: 'updated_at',
                });
                model.beforeCreate(function () {
                    this.updated_at = this.created_at = new Date();
                });

                model.beforeSave(function () {
                    this.updated_at = new Date()
                });
            }
        }
    });

    it("hook#define: pre-process model instance on model's hooks", () => {
        assert.property(db.models.person.properties, 'created_at');
        assert.equal(db.models.person.properties.created_at.mapsTo, 'created_at');
        assert.equal(db.models.person.properties.created_at.type, 'date');

        assert.property(db.models.person.properties, 'updated_at');
        assert.equal(db.models.person.properties.updated_at.mapsTo, 'updated_at');
        assert.equal(db.models.person.properties.updated_at.type, 'date');
    });
});