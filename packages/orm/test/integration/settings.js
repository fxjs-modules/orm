var helper = require('../support/spec_helper');
var ORM = require('../../');
var Settings = ORM.Settings;

describe("Settings", function () {
    describe("changed on connection instance", function () {
        it("should not change global defaults", function () {
            var setting = 'instance.returnAllErrors';
            var defaultValue = ORM.settings.get(setting);

            var db = helper.connect();
            db.settings.set(setting, !defaultValue);
            db.closeSync();

            db = helper.connect();
            assert.equal(db.settings.get(setting), defaultValue);
            db.closeSync();
        });
    });

    describe("#get", function () {
        var settings, returned;

        beforeEach(function () {
            settings = new Settings.Container({
                a: [1, 2]
            });
            returned = null;
        });

        it("should clone everything it returns", function () {
            returned = settings.get('*');
            returned.a = 123;

            assert.deepEqual(settings.get('a'), [1, 2]);
        });

        it("should deep clone everything it returns", function () {
            returned = settings.get('*');
            returned.a.push(3);

            assert.deepEqual(settings.get('a'), [1, 2]);
        });
    });

    describe("manipulating:", function () {
        var testFunction = function testFunction() {
            return "test";
        };
        var settings = new Settings.Container({});

        describe("some.sub.object = 123.45", function () {
            before(function () {
                settings.set("some.sub.object", 123.45);
            });

            it("should be 123.45", function () {
                assert.equal(settings.get("some.sub.object"), 123.45);
            });
        });

        describe("some....object = testFunction", function () {
            before(function () {
                settings.set("some....object", testFunction);
            });

            it("should be testFunction", function () {
                assert.equal(settings.get("some....object"), testFunction);
            });
        });

        describe("not setting some.unknown.object", function () {
            it("should be undefined", function () {
                assert.equal(settings.get("some.unknown.object"), undefined);
            });
        });

        describe("unsetting some.sub.object", function () {
            before(function () {
                settings.unset("some.sub.object");
            });

            it("should be undefined", function () {
                assert.equal(settings.get("some.sub.object"), undefined);
            });
        });

        describe("unsetting some....object", function () {
            before(function () {
                settings.unset("some....object");
            });

            it("should be undefined", function () {
                assert.equal(settings.get("some....object"), undefined);
            });
        });

        describe("unsetting some.*", function () {
            before(function () {
                settings.unset("some.*");
            });

            it("should return undefined for any 'some' sub-element", function () {
                assert.equal(settings.get("some.other.stuff"), undefined);
            });
            it("should return an empty object for some.*", function () {
                assert.isObject(settings.get("some.*"));
                assert.propertyVal(Object.keys(settings.get("some.*")), 'length', 0);
            });
            it("should return an empty object for some", function () {
                assert.isObject(settings.get("some"));
                assert.propertyVal(Object.keys(settings.get("some")), 'length', 0);
            });
        });
    });

    describe("used in model", () => {
        var db = null;
        var User = null;

        before(function () {
            db = helper.connect();
        });

        after(function () {
            return db.closeSync();
        });

        var setup = function ({ useSelfSettings = false } = {}) {
            return function () {
                User = db.define("user", {
                    username: {
                        type: 'text',
                        size: 64
                    },
                    password: {
                        type: 'text',
                        size: 128
                    }
                }, {
                    id: 'username',
                    useSelfSettings
                });

                ORM.singleton.clear();

                return helper.dropSync([User]);
            };
        };

        describe(`Model instance has same "settings" with db default`, () => {
            before(setup())
            it('default', () => {
                assert.equal(User.settings, db.settings);
            });
        });

        describe(`Model instance has different "settings" with db`, () => {
            before(setup({ useSelfSettings: true }))
            it('useSelfSettings: true', () => {
                assert.notEqual(User.settings, db.settings);
            });
        });
    });
});