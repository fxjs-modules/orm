var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Event", function () {
    var db = null;
    var Person = null;

    var triggeredHooks = {};

    var checkHook = function (hook) {
        triggeredHooks[hook] = false;

        return function () {
            triggeredHooks[hook] = Date.now();
        };
    };

    var setup = function (hooks) {
        return function () {
            Person = db.define("person", {
                name: {
                    type: "text",
                    required: true
                }
            });

            return helper.dropSync(Person);
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    describe("ready", function () {
        before(setup());

        it("should trigger after instance ready - pointless", function () {
            var triggered = false;
            var John = new Person({
                name: "John Doe"
            });

            var coroutine = require('coroutine');
            const evt = new coroutine.Event();
            John.on("ready", function () {
                triggered = true;
                evt.set();
            });
            assert.isFalse(triggered);

            evt.wait();
            assert.isTrue(triggered);
        });

        it("should trigger after instance ready - pointless", function () {
            var triggered = false;
            var John = new Person({
                name: "John Doe"
            });

            John.on("ready", function () {
                triggered = true;
            });
            assert.isFalse(triggered);

            process.nextTick(() => {
                assert.isTrue(triggered);
            });
        });
    });

    describe("save", function () {
        before(setup());

        it("should trigger when saving an instance", function () {
            var triggered = false;
            var John = new Person({
                name: "John Doe"
            });

            John.on("save", function () {
                triggered = true;
            });

            assert.isFalse(triggered);

            John.saveSync();
            assert.isTrue(triggered);
        });

        it("should trigger when saving an instance even if it fails", function () {
            var triggered = false;
            var John = new Person();

            John.on("save", function (err) {
                triggered = true;

                assert.isObject(err);
                assert.propertyVal(err, "msg", "required");
            });

            assert.isFalse(triggered);

            assert.throws(function () {
                John.saveSync();
            })

            assert.isTrue(triggered);
        });

        it("should be writable for mocking", function () {
            var triggered = false;
            var John = new Person();

            John.on = function (event, cb) {
                triggered = true;
            };
            assert.isFalse(triggered);

            John.on("mocked", function (err) {});
            assert.isTrue(triggered);
        });
    });
});