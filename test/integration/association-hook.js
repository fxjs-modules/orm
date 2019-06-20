var helper = require('../support/spec_helper');

odescribe("Association Hook", function () {
    var db = null;
    var Person = null;

    var setup = function ({
        hasOneHooks = {},
        extendsToHooks = {},
        hasManyHooks = {}
    } = {}) {
        return function () {
            Person = db.define("person", {
                name: String
            }, {
            });

            Person.settings.set("instance.returnAllErrors", false);

            Person.hasOne("father", Person, {
                hooks: hasOneHooks
            })
            var PersonProfile = Person.extendsTo("profile", {
                ext_1: String,
                ext_2: String,
            }, {
                hooks: extendsToHooks
            })
            Person.hasMany("friends", Person, {}, {
                hooks: hasManyHooks
            })

            return helper.dropSync([Person, PersonProfile]);
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    // there are a lot of timeouts in this suite and Travis or other test runners can
    // have hickups that could force this suite to timeout to the default value (2 secs)
    function getTrigged () {
        return {
            beforeSet: false,
            afterSet: false,
            beforeRemove: false,
            afterRemove: false,

            beforeAdd: false,
            afterAdd: false,
        };
    }

    describe("hasOne", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            hasOneHooks: {
                beforeSet () {
                    triggered.beforeSet = true
                },
                afterSet () {
                    triggered.afterSet = true
                },
                beforeRemove () {
                    triggered.beforeRemove = true
                },
                afterRemove () {
                    triggered.afterRemove = true
                },
            }
        }));

        it("beforeSet/afterSet", function () {
            assert.isFalse(triggered.beforeSet);
            assert.isFalse(triggered.afterSet);

            Person
                .createSync({
                    name: "John Doe"
                })
                .setFatherSync(
                    Person.createSync({
                        name: "Father of John"
                    })
                )

            assert.isTrue(triggered.beforeSet);
            assert.isTrue(triggered.afterSet);
        });

        it("beforeRemove/afterRemove", function () {
            assert.isFalse(triggered.beforeRemove);
            assert.isFalse(triggered.afterRemove);

            const John = Person
                .createSync({
                    name: "John Doe"
                })

            John.setFatherSync(
                Person.createSync({
                    name: "Father of John"
                })
            )

            John.removeFatherSync()

            assert.isTrue(triggered.beforeRemove);
            assert.isTrue(triggered.afterRemove);
        });
    });

    describe("hasOne - stopped", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            hasOneHooks: {
                beforeSet ({ associations }, next) {
                    if (associations[0].name === 'test/beforeSet')
                        return next(false)
                        
                    if (associations[0].name === 'test/throwError')
                        return next('error')

                    next()
                },
                beforeRemove (_, next) {
                    next(false)
                }
            }
        }));

        it("beforeSet", function () {
            const John = Person
                .createSync({
                    name: "John Doe"
                })

            John.setFatherSync(
                Person.createSync({
                    name: "test/beforeSet"
                })
            )

            assert.ok(John.getFather() === undefined)

            assert.throws(() => {
                John.setFatherSync(
                    Person.createSync({
                        name: "test/throwError"
                    })
                )
            })
        });

        it("beforeRemove", function () {
            const John = Person
                .createSync({
                    name: "John Doe"
                })

            John.setFatherSync(
                Person.createSync({
                    name: "Father of John"
                })
            )

            assert.ok(John.getFatherSync().name === 'Father of John')
            John.removeFatherSync()
            assert.ok(John.getFatherSync().name === 'Father of John')
        });
    });

    describe("hasMany", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            hasManyHooks: {
                beforeAdd (_) {
                    triggered.beforeAdd = true
                },
                afterAdd (_) {
                    triggered.afterAdd = true
                },
                beforeSet (_) {
                    triggered.beforeSet = true
                },
                afterSet (_) {
                    triggered.afterSet = true
                },
                beforeRemove (_) {
                    triggered.beforeRemove = true
                },
                afterRemove (_) {
                    triggered.afterRemove = true
                },
            }
        }));

        it("beforeAdd/afterAdd", function () {
            assert.isFalse(triggered.beforeAdd);
            assert.isFalse(triggered.afterAdd);

            Person
                .createSync({
                    name: "John Doe"
                })
                .addFriendsSync(
                    Person.createSync({
                        name: "Friend of John"
                    })
                )

            assert.isTrue(triggered.beforeAdd);
            assert.isTrue(triggered.afterAdd);
        });

        it("beforeSet/afterSet", function () {
            assert.isFalse(triggered.beforeSet);
            assert.isFalse(triggered.afterSet);

            Person
                .createSync({
                    name: "John Doe"
                })
                .setFriendsSync([
                    Person.createSync({
                        name: "Friend of John"
                    })
                ])

            assert.isTrue(triggered.beforeSet);
            assert.isTrue(triggered.afterSet);
        });

        it("beforeRemove/afterRemove", function () {
            assert.isFalse(triggered.beforeRemove);
            assert.isFalse(triggered.afterRemove);

            const John = Person
                .createSync({
                    name: "John Doe"
                })

            John.setFriendsSync(
                Person.createSync({
                    name: "Father1 of John"
                }),
                Person.createSync({
                    name: "Father2 of John"
                }),
            )

            resetTriggered();

            John.removeFriendsSync()

            assert.isTrue(triggered.beforeRemove);
            assert.isTrue(triggered.afterRemove);
        });
    });

    describe("extendsTo", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            extendsToHooks: {
                beforeSet () {
                    triggered.beforeSet = true
                },
                afterSet () {
                    triggered.afterSet = true
                },
                beforeRemove () {
                    triggered.beforeRemove = true
                },
                afterRemove () {
                    triggered.afterRemove = true
                },
            }
        }));

        it("beforeSet/afterSet", function () {
            assert.isFalse(triggered.beforeSet);
            assert.isFalse(triggered.afterSet);

            Person
                .createSync({
                    name: "John Doe"
                })
                .setProfileSync({
                    ext_1: 1,
                    ext_2: 1
                })

            assert.isTrue(triggered.beforeSet);
            assert.isTrue(triggered.afterSet);
        });

        it("beforeRemove/afterRemove", function () {
            assert.isFalse(triggered.beforeRemove);
            assert.isFalse(triggered.afterRemove);

            const John = Person
                .createSync({
                    name: "John Doe"
                })

            John
                .setProfileSync({
                    ext_1: 1,
                    ext_2: 1
                })

            resetTriggered();

            John.removeProfileSync()

            assert.isTrue(triggered.beforeRemove);
            assert.isTrue(triggered.afterRemove);
        });
    });
});