var helper = require('../support/spec_helper');

describe("Association Hook", function () {
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

            const person = Person
                .createSync({
                    name: "John Doe"
                })

            person.setFatherSync(
                Person.createSync({
                    name: "Father of John"
                })
            )

            person.removeFatherSync()

            assert.isTrue(triggered.beforeRemove);
            assert.isTrue(triggered.afterRemove);
        });
    });

    describe("hasMany", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            hasManyHooks: {
                beforeAdd () {
                    triggered.beforeAdd = true
                },
                afterAdd () {
                    triggered.afterAdd = true
                },
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

            const person = Person
                .createSync({
                    name: "John Doe"
                })

            person.setFriendsSync(
                Person.createSync({
                    name: "Father1 of John"
                }),
                Person.createSync({
                    name: "Father2 of John"
                }),
            )

            resetTriggered();

            person.removeFriendsSync()

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

            const person = Person
                .createSync({
                    name: "John Doe"
                })

            person
                .setProfileSync({
                    ext_1: 1,
                    ext_2: 1
                })

            resetTriggered();

            person.removeProfileSync()

            assert.isTrue(triggered.beforeRemove);
            assert.isTrue(triggered.afterRemove);
        });
    });
});