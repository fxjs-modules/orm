var test = require("test");
test.setup();

var helper = require('../support/spec_helper');
var common = require('../common');

describe("Model.save()", function () {
    var db = null;
    var Person = null;

    var setup = function (nameDefinition, opts) {
        opts = opts || {};

        return function (done) {
            Person = db.define("person", {
                name: nameDefinition || String
            }, opts || {});

            Person.hasOne("parent", Person, opts.hasOneOpts);
            if ('saveAssociationsByDefault' in opts) {
                Person.settings.set(
                    'instance.saveAssociationsByDefault', opts.saveAssociationsByDefault
                );
            }

            return helper.dropSync(Person, done);
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    describe("if properties have default values", function () {
        before(setup({
            type: "text",
            defaultValue: "John"
        }));

        it("should use it if not defined", function () {
            var John = new Person();

            John.saveSync();
            assert.equal(John.name, "John");
        });
    });

    describe("with callback", function () {
        before(setup());

        it("should save item and return id", function () {
            var John = new Person({
                name: "John"
            });
            John.saveSync();

            assert.exist(John[Person.id]);

            var JohnCopy = Person.getSync(John[Person.id]);

            assert.equal(JohnCopy[Person.id], John[Person.id]);
            assert.equal(JohnCopy.name, John.name);
        });
    });

    describe("without callback", function () {
        before(setup());

        it("should still save item and return id", function (done) {
            var John = new Person({
                name: "John"
            });
            John.save();

            const coroutine = require('coroutine');
            const evt = new coroutine.Event();
            John.on("save", function (err) {
                assert.equal(err, null);
                assert.exist(John[Person.id]);

                Person.get(John[Person.id], function (err, JohnCopy) {
                    assert.equal(err, null);

                    assert.equal(JohnCopy[Person.id], John[Person.id]);
                    assert.equal(JohnCopy.name, John.name);

                    evt.set();
                    return done();
                });
            });
            evt.wait();
        });
    });

    describe("with properties object", function () {
        before(setup());

        it("should update properties, save item and return id", function () {
            var John = new Person({
                name: "Jane"
            });
            John.saveSync({
                name: "John"
            });

            assert.exist(John[Person.id]);
            assert.equal(John.name, "John");

            var JohnCopy = Person.getSync(John[Person.id]);

            assert.equal(JohnCopy[Person.id], John[Person.id]);
            assert.equal(JohnCopy.name, John.name);
        });
    });

    describe("with unknown argument type", function () {
        before(setup());

        it("should should throw", function () {
            var John = new Person({
                name: "Jane"
            });

            assert.throws(function () {
                John.saveSync("will-fail");
            });
        });
    });

    describe("if passed an association instance", function () {
        before(setup());

        it("should save association first and then save item and return id", function () {
            var Jane = new Person({
                name: "Jane"
            });
            var John = new Person({
                name: "John",
                parent: Jane
            });
            John.saveSync();

            assert.isTrue(John.saved());
            assert.isTrue(Jane.saved());

            assert.exist(John[Person.id]);
            assert.exist(Jane[Person.id]);
        });
    });

    describe("if passed an association object", function () {
        before(setup());

        it("should save association first and then save item and return id", function () {
            var John = new Person({
                name: "John",
                parent: {
                    name: "Jane"
                }
            });
            John.saveSync();

            assert.isTrue(John.saved());
            assert.isTrue(John.parent.saved());

            assert.exist(John[Person.id]);
            assert.exist(John.parent[Person.id]);
            assert.equal(John.parent.name, "Jane");
        });
    });

    describe("if autoSave is on", function () {
        before(setup(null, {
            autoSave: true
        }));

        it("should save the instance as soon as a property is changed", function (done) {
            var John = new Person({
                name: "Jhon"
            });
            John.save(function (err) {
                assert.equal(err, null);

                John.on("save", function () {
                    return done();
                });

                John.name = "John";
            });
        });
    });

    describe("with saveAssociations", function () {
        var afterSaveCalled = false;

        describe("default on in settings", function () {
            beforeEach(function () {
                function afterSave() {
                    afterSaveCalled = true;
                }
                var hooks = {
                    afterSave: afterSave
                };

                setup(null, {
                    hooks: hooks,
                    cache: false,
                    hasOneOpts: {
                        autoFetch: true
                    }
                })();
                var olga = Person.createSync({
                    name: 'Olga'
                });

                assert.exist(olga);
                var hagar = Person.createSync({
                    name: 'Hagar',
                    parent_id: olga.id
                });
                assert.exist(hagar);
                afterSaveCalled = false;
            });

            it("should be on", function () {
                assert.equal(Person.settings.get('instance.saveAssociationsByDefault'), true);
            });

            it("off should not save associations but save itself", function () {
                var hagar = Person.oneSync({
                    name: 'Hagar'
                });

                assert.exist(hagar.parent);

                hagar.parent.name = 'Olga2';
                hagar.saveSync({
                    name: 'Hagar2'
                }, {
                        saveAssociations: false
                    });

                assert.equal(afterSaveCalled, true);

                var olga = Person.getSync(hagar.parent.id)
                assert.equal(olga.name, 'Olga');
            });

            it("off should not save associations or itself if there are no changes", function () {
                var hagar = Person.oneSync({
                    name: 'Hagar'
                });

                hagar.saveSync({}, {
                    saveAssociations: false
                });

                assert.equal(afterSaveCalled, false);

                var olga = Person.getSync(hagar.parent.id);
                assert.equal(olga.name, 'Olga');
            });

            it("unspecified should save associations and itself", function () {
                var hagar = Person.oneSync({
                    name: 'Hagar'
                });
                assert.exist(hagar.parent);

                hagar.parent.name = 'Olga2';
                hagar.saveSync({
                    name: 'Hagar2'
                });

                var olga = Person.getSync(hagar.parent.id);
                assert.equal(olga.name, 'Olga2');

                var person = Person.getSync(hagar.id);

                assert.equal(person.name, 'Hagar2');
            });

            it("on should save associations and itself", function () {
                var hagar = Person.oneSync({
                    name: 'Hagar'
                });
                assert.exist(hagar.parent);

                hagar.parent.name = 'Olga2';
                hagar.saveSync({
                    name: 'Hagar2'
                }, {
                        saveAssociations: true
                    });

                var olga = Person.getSync(hagar.parent.id);
                assert.equal(olga.name, 'Olga2');

                var person = Person.getSync(hagar.id);
                assert.equal(person.name, 'Hagar2');
            });
        });

        describe("turned off in settings", function () {
            beforeEach(function () {
                function afterSave() {
                    afterSaveCalled = true;
                }
                var hooks = {
                    afterSave: afterSave
                };

                setup(null, {
                    hooks: hooks,
                    cache: false,
                    hasOneOpts: {
                        autoFetch: true
                    },
                    saveAssociationsByDefault: false
                })();

                var olga = Person.createSync({
                    name: 'Olga'
                });

                assert.exist(olga);
                var hagar = Person.createSync({
                    name: 'Hagar',
                    parent_id: olga.id
                });
                assert.exist(hagar);
                afterSaveCalled = false;
            });

            it("should be off", function () {
                assert.equal(Person.settings.get('instance.saveAssociationsByDefault'), false);
            });

            it("unspecified should not save associations but save itself", function () {
                var hagar = Person.oneSync({
                    name: 'Hagar'
                });

                assert.exist(hagar.parent);

                hagar.parent.name = 'Olga2';
                hagar.saveSync({
                    name: 'Hagar2'
                });

                var olga = Person.getSync(hagar.parent.id);

                assert.equal(olga.name, 'Olga');

                var person = Person.getSync(hagar.id);
                assert.equal(person.name, 'Hagar2');
            });

            it("off should not save associations but save itself", function () {
                var hagar = Person.oneSync({
                    name: 'Hagar'
                });

                assert.exist(hagar.parent);

                hagar.parent.name = 'Olga2';
                hagar.saveSync({
                    name: 'Hagar2'
                }, {
                        saveAssociations: false
                    });
                assert.equal(afterSaveCalled, true);

                var olga = Person.getSync(hagar.parent.id);
                assert.equal(olga.name, 'Olga');
            });

            it("on should save associations and itself", function () {
                var hagar = Person.oneSync({
                    name: 'Hagar'
                });

                assert.exist(hagar.parent);

                hagar.parent.name = 'Olga2';
                hagar.saveSync({
                    name: 'Hagar2'
                }, {
                        saveAssociations: true
                    });

                var olga = Person.getSync(hagar.parent.id);
                assert.equal(olga.name, 'Olga2');

                var person = Person.getSync(hagar.id);
                assert.equal(person.name, 'Hagar2');
            });
        });
    });

    describe("with a point property", function () {
        if (common.protocol() == 'sqlite' || common.protocol() == 'mongodb') return;

        it("should save the instance as a geospatial point", function (done) {
            setup({ type: "point" }, null)(function () {
                var John = new Person({
                    name: { x: 51.5177, y: -0.0968 }
                });
                John.save(function (err) {
                    assert.equal(err, null);

                    assert.isTrue(John.name instanceof Object);
                    
                    assert.property(John.name, 'x');
                    assert.equal(John.name.x, 51.5177);
                    assert.property(John.name, 'y');
                    assert.equal(John.name.y, -0.0968);

                    return done();
                });
            });
        });
    });

    describe("mockable", function () {
        before(setup());

        it("save should be writable", function (done) {
            var John = new Person({
                name: "John"
            });
            var saveCalled = false;
            John.save = function (cb) {
                saveCalled = true;
                cb(null);
            };
            John.save(function (err) {
                assert.equal(saveCalled, true);
                return done();
            });
        });

        it("saved should be writable", function (done) {
            var John = new Person({
                name: "John"
            });
            var savedCalled = false;
            John.saved = function () {
                savedCalled = true;
                return true;
            };

            John.saved()
            assert.isTrue(savedCalled);
            done();
        })
    });
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}