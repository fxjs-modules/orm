var helper = require('../support/spec_helper');

describe("Association Hook", function () {
    var db = null;
    var Person = null;

    var setup = function ({
        hasOneHooks = {},
        hasOneReverseHooks = {},
        extendsToHooks = {},
        extendsToReverseHooks = {},
        hasManyHooks = {},
        hasManyReverseHooks = {}
    } = {}) {
        return function () {
            db.settings.set("extendsTo.throwWhenNotFound", false);

            Person = db.define("person", {
                name: String
            }, {
            });

            Person.settings.set("instance.returnAllErrors", false);

            Person.hasOne("father", Person, {
                hooks: hasOneHooks,
                
                reverse: 'children',
                reverseHooks: hasOneReverseHooks,
            })

            var PersonProfile = Person.extendsTo("profile", {
                ext_1: String,
                ext_2: String,
            }, {
                hooks: extendsToHooks,
                
                reverse: 'owner',
                reverseHooks: extendsToReverseHooks,
            })
            Person.hasMany("friends", Person, {}, {
                hooks: hasManyHooks,
                
                reverse: 'itsFriends',
                reverseHooks: hasManyReverseHooks,
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

    describe("hasOne - trigger", function () {
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

    describe("hasOne:reverse - trigger", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            hasOneReverseHooks: {
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

            const John = Person
                .createSync({
                    name: "John Doe"
                })

            John.setChildrenSync([
                Person.createSync({
                    name: "Child of John"
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

            John.setChildrenSync(
                Person.createSync({
                    name: "Child of John"
                })
            )

            assert.isNotFunction(John.removeChildrenSync)
            assert.isNotFunction(John.removeChildren)

            assert.isFalse(triggered.beforeRemove);
            assert.isFalse(triggered.afterRemove);
        });
    });

    describe("hasOne - application", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            hasOneHooks: {
                beforeSet ({ association }, next) {
                    if (association.name === 'test/beforeSet')
                        return next(false)
                        
                    if (association.name === 'test/throwError')
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

    describe("hasMany - trigger", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            hasManyHooks: {
                beforeAdd (_) {
                    triggered.beforeAdd = true
                },
                afterAdd (_) {
                    assert.isArray(_.associations)
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

    describe("hasMany:reverse - trigger", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            hasManyReverseHooks: {
                beforeAdd (_) {
                    triggered.beforeAdd = true
                },
                afterAdd (_) {
                    assert.isArray(_.associations)
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
                .addItsFriendsSync(
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
                .setItsFriendsSync([
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

            John.setItsFriendsSync(
                Person.createSync({
                    name: "Father1 of John"
                }),
                Person.createSync({
                    name: "Father2 of John"
                }),
            )

            resetTriggered();

            John.removeItsFriendsSync()

            assert.isTrue(triggered.beforeRemove);
            assert.isTrue(triggered.afterRemove);
        });
    });

    describe("hasMany - application", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            hasManyHooks: {
                beforeAdd ({ associations, $ref }) {
                    $ref.associations = associations.filter(x => x.name !== 'test/exclude')
                },
                beforeSet ({ associations }, next) {
                    if (associations[0].name === 'test/beforeSet')
                        return next(false)
                        
                    if (associations[0].name === 'test/throwError')
                        return next('error')

                    next()
                },
                beforeRemove ({ associations }, next) {
                    if (!associations.length)
                        return next(false)

                    next()
                }
            }
        }));

        it("beforeAdd", function () {
            const John = Person
                .createSync({
                    name: "John Doe"
                })

            John.addFriendsSync([
                Person.createSync({
                    name: "test/exclude"
                }),
                Person.createSync({
                    name: "Friend of John"
                })
            ])

            assert.equal(John.getFriendsSync().length, 1)
            assert.equal(John.getFriendsSync()[0].name, 'Friend of John')
        });

        it("beforeSet", function () {
            const John = Person
                .createSync({
                    name: "John Doe"
                })

            John.setFriendsSync(
                Person.createSync({
                    name: "test/beforeSet"
                }),
                Person.createSync({
                    name: "Friend of John"
                })
            )

            assert.ok(John.getFriendsSync().length === 0)

            assert.throws(() => {
                John.setFriendsSync(
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

            John.setFriendsSync([
                Person.createSync({
                    name: "Friend1 of John"
                }),
                Person.createSync({
                    name: "Friend2 of John"
                }),
            ])

            assert.ok(John.getFriendsSync().length === 2)
            // according to rules in `beforeRemove` hook, ONLY when passing specific `friends`, 'remove' action was being executed.
            John.removeFriendsSync()
            assert.ok(John.getFriendsSync().length === 2)

            John.removeFriendsSync(
                John.getFriends().where({ name: { like: '%Friend1%' } }).runSync()[0]
            )
            assert.ok(John.getFriendsSync().length === 1)
            John.removeFriendsSync()
            assert.ok(John.getFriendsSync().length === 1)
            John.removeFriendsSync(
                John.getFriends().where({ name: { like: '%Friend1%' } }).runSync()[0]
            )
            assert.ok(John.getFriendsSync().length === 1)
            John.removeFriendsSync(
                John.getFriends().where({ name: { like: '%Friend2%' } }).runSync()[0]
            )
            assert.ok(John.getFriendsSync().length === 0)
        });
    });

    describe("extendsTo - trigger", function () {
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

    describe("extendsTo:reverse - trigger", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            extendsToReverseHooks: {
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

            const John = Person
                .createSync({
                    name: "John Doe"
                })
                
            const Jane = Person
                .createSync({
                    name: "Jane Dan"
                })

            const JohnProfile = John
                .setProfileSync({
                    ext_1: 1,
                    ext_2: 1
                })

            JohnProfile.setOwnerSync(Jane)

            assert.isTrue(triggered.beforeSet);
            assert.isTrue(triggered.afterSet);

            assert.equal(John.getProfileSync(), null);
        });

        it("beforeRemove/afterRemove", function () {
            assert.isFalse(triggered.beforeRemove);
            assert.isFalse(triggered.afterRemove);

            const John = Person
                .createSync({
                    name: "John Doe"
                })

            const JohnProfile = John
                .setProfileSync({
                    ext_1: 1,
                    ext_2: 1
                })

            assert.isNotFunction(John.removeChildrenSync)

            assert.isFalse(triggered.beforeRemove);
            assert.isFalse(triggered.afterRemove);

            assert.ok(John.getProfileSync());
            assert.deepEqual(John.getProfileSync() + '', JohnProfile + '');
        });
    });

    /* operations :start */
    describe("hasOne:hook list - trigger", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            hasOneHooks: {
                beforeSet: [
                    function ({ $ref }) {
                        assert.ok($ref.instance === this)
                        triggered.beforeSet = false
                    },
                    function ({ $ref }) {
                        assert.ok($ref.instance === this)
                        triggered.beforeSet = true
                    },
                ],
                afterSet: [
                    function () {
                        triggered.afterSet = false
                    },
                    function () {
                        triggered.afterSet = true
                    },
                ],
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
    });

    describe("hasOne:hook patch - trigger", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            hasOneHooks: {
                beforeSet () {
                    delete triggered.beforeSet
                }
            }
        }));

        it("beforeSet/afterSet - overwrite", function () {
            Person.associations['father'].association.beforeSet(() => {
                triggered.beforeSet = true
            })
            Person.associations['father'].association.afterSet(() => {
                triggered.afterSet = true
            })
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

        it("beforeSet/afterSet - initial", function () {
            Person.associations['father'].association.beforeSet(() => void 0, { oldhook: 'initial' })

            Person
                .createSync({
                    name: "John Doe"
                })
                .setFatherSync(
                    Person.createSync({
                        name: "Father of John"
                    })
                )

            assert.notProperty(triggered, 'beforeSet');
            assert.propertyVal(triggered, 'afterSet', true);
        });

        it("beforeSet/afterSet - prepend", function () {
            Person.associations['father'].association.beforeSet(() => void 0, { oldhook: 'initial' })
            Person.associations['father'].association.beforeSet(() => {
                triggered.beforeSet = 'afterOldHook'
            }, { oldhook: 'prepend' })

            Person
                .createSync({
                    name: "John Doe"
                })
                .setFatherSync(
                    Person.createSync({
                        name: "Father of John"
                    })
                )

            assert.propertyVal(triggered, 'beforeSet', 'afterOldHook');
        });

        it("beforeSet/afterSet - after", function () {
            Person.associations['father'].association.beforeSet(() => void 0, { oldhook: 'initial' })
            Person.associations['father'].association.beforeSet(() => {
                triggered.beforeSet = 'beforeOldHook'
            }, { oldhook: 'append' })

            Person
                .createSync({
                    name: "John Doe"
                })
                .setFatherSync(
                    Person.createSync({
                        name: "Father of John"
                    })
                )

            assert.notProperty(triggered, 'beforeSet');
        });
    });

    describe("extendsTo - next only once, warn on after", function () {
        var triggered = null;
        const resetTriggered = () => triggered = getTrigged()
        beforeEach(() => resetTriggered())

        before(setup({
            extendsToHooks: {
                beforeSet (_, next) {
                    triggered.beforeSet = true

                    next()
                    next()
                    next()
                }
            }
        }));

        it("beforeSet next only once", function () {
            assert.isFalse(triggered.beforeSet);

            const John = Person
                .createSync({
                    name: "John Doe"
                })

            assert.doesNotThrow(() => {
                John.setProfileSync({
                    ext_1: 1,
                    ext_2: 1
                })
            })

            assert.isTrue(triggered.beforeSet);
        });
    });
    /* operations: end */
});