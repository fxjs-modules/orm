var helper = require('../support/spec_helper');

describe("Hook Ref On Instance", function () {
    var db = null;
    var Person = null;

    var setup = function ({
        hooks = {},
    } = {}) {
        return function () {
            db.settings.set("extendsTo.throwWhenNotFound", false);

            Person = db.define("person", {
                name: String
            }, {
                hooks
            });

            return helper.dropSync([Person]);
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    function getTrigged () {
        return {
            beforeCreate: false,
            afterCreate: false,
            beforeSave: false,
            afterSave: false,
            beforeRemove: false,
            afterRemove: false,

            onChannelCreate: false,
            onChannelSave: false,
            no__onChannelSave: false,
            onChannelRemove: false,
        };
    }

    describe("hasOne - trigger", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        var saveRecordsTuple = []

        before(setup({
            hooks: {
                beforeCreate () {
                    triggered.beforeCreate = true

                    assert.exist(this.$hookRef)
                    assert.exist(this.$hookRef.create)
                    assert.ok(this.$hookRef.create.instance === this)
                    assert.isFunction(this.$hookRef.create.useChannel)

                    this.$hookRef.create.useChannel(() => {
                        triggered.onChannelCreate = true
                    })
                },
                afterCreate () {
                    triggered.afterCreate = true

                    assert.exist(this.$hookRef)
                    assert.exist(this.$hookRef.create)
                    assert.ok(this.$hookRef.create.instance === this)
                    assert.isFunction(this.$hookRef.create.useChannel)

                    this.$hookRef.create.useChannel().run()
                },
                beforeSave () {
                    triggered.beforeSave = true

                    assert.exist(this.$hookRef)
                    assert.exist(this.$hookRef.save)
                    assert.ok(this.$hookRef.save.instance === this)
                    assert.isFunction(this.$hookRef.save.useChannel)

                    this.$hookRef.save.useChannel('ofSave', () => {
                        triggered.onChannelSave = true
                    })
                    this.$hookRef.save.useChannel('notTriggered', () => {
                        triggered.no__onChannelSave = true
                    })
                    saveRecordsTuple.push(this.$hookRef.save)
                },
                afterSave () {
                    triggered.afterSave = true

                    assert.exist(this.$hookRef)
                    assert.exist(this.$hookRef.save)
                    assert.ok(this.$hookRef.save.instance === this)
                    assert.isFunction(this.$hookRef.save.useChannel)

                    this.$hookRef.save.useChannel('ofSave').run()
                },
                beforeRemove () {
                    triggered.beforeRemove = true

                    assert.exist(this.$hookRef)
                    assert.exist(this.$hookRef.remove)
                    assert.ok(this.$hookRef.remove.instance === this)
                    assert.isFunction(this.$hookRef.remove.useChannel)

                    this.$hookRef.remove.useChannel('???', () => {
                        triggered.onChannelRemove = true
                    })
                },
                afterRemove () {
                    triggered.afterRemove = true

                    assert.exist(this.$hookRef)
                    assert.exist(this.$hookRef.remove)
                    assert.ok(this.$hookRef.remove.instance === this)
                    assert.isFunction(this.$hookRef.remove.useChannel)

                    this.$hookRef.remove.useChannel('???').run()
                },
            }
        }));

        it("beforeCreate/afterCreate", function () {
            assert.isFalse(triggered.beforeCreate);
            assert.isFalse(triggered.afterCreate);
            assert.isFalse(triggered.onChannelCreate);

            Person
                .createSync({
                    name: "John Doe"
                })

            assert.isTrue(triggered.beforeCreate);
            assert.isTrue(triggered.afterCreate);
            assert.isTrue(triggered.onChannelCreate);
        });

        it("beforeSave/afterSave", function () {
            assert.isFalse(triggered.beforeSave);
            assert.isFalse(triggered.afterSave);
            assert.isFalse(triggered.onChannelSave);

            assert.isFalse(triggered.no__onChannelSave);

            const John = Person
                .createSync({
                    name: "John Doe"
                })

            assert.isTrue(triggered.beforeSave);
            assert.isTrue(triggered.afterSave);
            assert.isTrue(triggered.onChannelSave);

            assert.isFalse(triggered.no__onChannelSave);

            // hook ref only valid once
            John.name = "John Doe2"
            John.saveSync()
            assert.exist(saveRecordsTuple[0])
            assert.exist(saveRecordsTuple[1])
            assert.ok(saveRecordsTuple[0] !== saveRecordsTuple[1])

            John.name = "John Doe1"
            John.saveSync()
            assert.exist(saveRecordsTuple[2])
            assert.ok(saveRecordsTuple[0] !== saveRecordsTuple[1])
            assert.ok(saveRecordsTuple[0] !== saveRecordsTuple[2])
            assert.ok(saveRecordsTuple[1] !== saveRecordsTuple[2])
        });

        it("beforeRemove/afterRemove", function () {
            assert.isFalse(triggered.beforeRemove);
            assert.isFalse(triggered.afterRemove);
            assert.isFalse(triggered.onChannelRemove);

            const John = Person
                .createSync({
                    name: "John Doe"
                })

            John.removeSync()

            assert.isTrue(triggered.beforeRemove);
            assert.isTrue(triggered.afterRemove);
            assert.isTrue(triggered.onChannelRemove);
        });
    });
});