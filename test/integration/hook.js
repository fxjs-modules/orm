var helper = require('../support/spec_helper');
var ORM = require('../../');

var coroutine = require('coroutine');

describe("Hook", function () {
    var db = null;
    var Person = null;
    var triggeredHooks = {};
    var getTimestamp; // Calling it 'getTime' causes strangeness.

    getTimestamp = function () {
        return Date.now();
    };
    // this next lines are failing...
    // if (process.hrtime) {
    // 	getTimestamp = function () { return parseFloat(process.hrtime().join('.')); };
    // } else {
    // 	getTimestamp = function () { return Date.now(); };
    // }

    var checkHook = function (hook) {
        triggeredHooks[hook] = false;

        return function () {
            triggeredHooks[hook] = getTimestamp();
        };
    };

    var setup = function (hooks) {
        if (typeof hooks == "undefined") {
            hooks = {
                afterCreate: checkHook("afterCreate"),
                beforeCreate: checkHook("beforeCreate"),
                afterSave: checkHook("afterSave"),
                beforeSave: checkHook("beforeSave"),
                beforeValidation: checkHook("beforeValidation"),
                beforeRemove: checkHook("beforeRemove"),
                afterRemove: checkHook("afterRemove")
            };
        }

        return function () {
            Person = db.define("person", {
                name: String
            }, {
                hooks: hooks
            });

            Person.settings.set("instance.returnAllErrors", false);

            return helper.dropSync(Person);
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

    describe("after Model creation", function () {
        before(setup({}));

        it("can be changed", function () {
            var triggered = false;

            Person.afterCreate(function () {
                triggered = true;
            });
            Person.createSync([{
                name: "John Doe"
            }]);
            assert.isTrue(triggered);
        });

        it("can be removed", function () {
            var triggered = false;

            Person.afterCreate(function () {
                triggered = true;
            });
            Person.createSync([{
                name: "John Doe"
            }]);
            assert.isTrue(triggered);

            triggered = false;

            Person.afterCreate(); // clears hook

            Person.createSync([{
                name: "Jane Doe"
            }]);
            assert.isFalse(triggered);
        });
    });

    describe("beforeCreate", function () {
        before(setup());

        it("should trigger before creating instance", function () {
            Person.createSync([{
                name: "John Doe"
            }]);
            assert.isNumber(triggeredHooks.afterCreate);
            assert.isNumber(triggeredHooks.beforeCreate);
            assert.notGreaterThan(triggeredHooks.beforeCreate, triggeredHooks.afterCreate);
        });

        it("should allow modification of instance", function () {
            Person.beforeCreate(function (next) {
                this.name = "Hook Worked";
                next();
            });

            var people = Person.createSync([{}]);
            assert.exist(people);
            assert.equal(people.length, 1);
            assert.equal(people[0].name, "Hook Worked");

            // garantee it was correctly saved on database
            var person = Person.oneSync({
                name: "Hook Worked"
            });
            assert.exist(person);
        });

        describe("when setting properties", function () {
            before(setup({
                beforeCreate: function () {
                    this.name = "Jane Doe";
                }
            }));

            it("should not be discarded", function () {
                var items = Person.createSync([{}]);

                assert.isObject(items);
                assert.propertyVal(items, "length", 1);
                assert.equal(items[0].name, "Jane Doe");

                // ensure it was really saved
                var people = Person.findSync({
                    name: "Hook Worked"
                }, {
                    identityCache: false
                }, 1);
                assert.ok(Array.isArray(people));
            });
        });

        describe("if hook method has 1 argument", function () {
            var beforeCreate = false;

            before(setup({
                beforeCreate: function (next) {
                    setTimeout(function () {
                        beforeCreate = true;

                        return next();
                    }.bind(this), 200);
                }
            }));

            it("should wait for hook to finish", function () {
                Person.createSync([{
                    name: "John Doe"
                }]);
                assert.isTrue(beforeCreate);
            });

            describe("if hook triggers error", function () {
                before(setup({
                    beforeCreate: function (next) {
                        setTimeout(function () {
                            return next(new Error('beforeCreate-error'));
                        }, 200);
                    }
                }));

                it("should trigger error", function () {
                    try {
                        Person.createSync([{
                            name: "John Doe"
                        }]);
                    } catch (err) {
                        assert.isObject(err);
                        assert.equal(err.message, "beforeCreate-error");
                    }
                });

                it("should catch error", function () {
                    let error
                    try {
                        Person.createSync([{
                            name: "John Doe"
                        }]);
                    } catch (err) {
                        error = err;
                    }

                    assert.isObject(error);
                    assert.equal(error.message, "beforeCreate-error");
                });
            });
        });
    });

    describe("afterCreate", function () {
        before(setup());

        it("should trigger after creating instance", function () {
            Person.createSync([{
                name: "John Doe"
            }]);
            assert.isNumber(triggeredHooks.afterCreate);
            assert.isNumber(triggeredHooks.beforeCreate);
            assert.notLessThan(triggeredHooks.afterCreate, triggeredHooks.beforeCreate);
        });
    });

    describe("beforeSave", function () {
        before(setup());

        it("should trigger before saving an instance", function () {
            Person.createSync([{
                name: "John Doe"
            }]);
            assert.isNumber(triggeredHooks.afterSave);
            assert.isNumber(triggeredHooks.beforeSave);
            assert.notGreaterThan(triggeredHooks.beforeSave, triggeredHooks.afterSave);
        });

        it("should allow modification of instance", function () {
            Person.beforeSave(function () {
                this.name = "Hook Worked";
            });

            var people = Person.createSync([{
                name: "John Doe"
            }]);
            assert.exist(people);
            assert.equal(people.length, 1);
            assert.equal(people[0].name, "Hook Worked");

            // garantee it was correctly saved on database
            var people = Person.findSync({
                name: "Hook Worked"
            }, {
                identityCache: false
            }, 1);
            assert.ok(Array.isArray(people));
        });

        describe("when setting properties", function () {
            before(setup({
                beforeSave: function () {
                    this.name = "Jane Doe";
                }
            }));

            it("should not be discarded", function () {
                var items = Person.createSync([{}]);

                assert.isObject(items);
                assert.propertyVal(items, "length", 1);
                assert.equal(items[0].name, "Jane Doe");

                // ensure it was really saved
                var Item = Person.getSync(items[0][Person.id]);
                assert.equal(Item.name, "Jane Doe");
            });
        });

        describe("if hook method has 1 argument", function () {
            var beforeSave = false;

            before(setup({
                beforeSave: function (next) {
                    setTimeout(function () {
                        beforeSave = true;

                        return next();
                    }.bind(this), 200);
                }
            }));

            it("should wait for hook to finish", function () {
                Person.createSync([{
                    name: "John Doe"
                }]);
                assert.isTrue(beforeSave);
            });

            describe("if hook triggers error", function () {
                before(setup({
                    beforeSave: function (next) {
                        if (this.name == "John Doe") {
                            return next();
                        }
                        setTimeout(function () {
                            return next(new Error('beforeSave-error'));
                        }, 200);
                    }
                }));

                it("should trigger error when creating", function () {
                    try {
                        Person.createSync([{
                            name: "Jane Doe"
                        }]);
                    } catch (err) {
                        assert.isObject(err);
                        assert.equal(err.message, "beforeSave-error");
                    }
                });

                it("should trigger error when saving", function () {
                    var John = Person.createSync([{
                        name: "John Doe"
                    }]);

                    John[0].name = "Jane Doe";
                    try {
                        John[0].saveSync();
                    } catch (err) {
                        assert.isObject(err);
                        assert.equal(err.message, "beforeSave-error");
                    }
                });
            });
        });
    });

    describe("afterSave", function () {
        beforeEach(setup());

        it("should trigger after creating an instance", function () {
            var john = Person.createSync({
                name: "John Doe"
            });
            assert.isNumber(triggeredHooks.afterSave);
            assert.isNumber(triggeredHooks.beforeSave);
            assert.notLessThan(triggeredHooks.afterSave, triggeredHooks.beforeSave);
        });

        it("should trigger after saving an instance", function () {
            var john = Person.createSync({
                name: "John Doe"
            });
            john.name = "John Doe 2";

            triggeredHooks = {};
            john.saveSync();
            assert.isNumber(triggeredHooks.afterSave);
            assert.isNumber(triggeredHooks.beforeSave);
            assert.notLessThan(triggeredHooks.afterSave, triggeredHooks.beforeSave);
        });

        it("should not trigger after saving an unchanged instance", function () {
            var edger = Person.createSync({
                name: "Edger"
            });
            triggeredHooks = {};
            edger.saveSync()
            assert.notExist(triggeredHooks.afterSave);
        });
    });

    describe("beforeValidation", function () {
        before(setup());

        it("should trigger before instance validation", function () {
            Person.createSync([{
                name: "John Doe"
            }]);
            assert.isNumber(triggeredHooks.beforeValidation);
            assert.isNumber(triggeredHooks.beforeCreate);
            assert.isNumber(triggeredHooks.beforeSave);
            assert.notGreaterThan(triggeredHooks.beforeValidation, triggeredHooks.beforeCreate);
            assert.notGreaterThan(triggeredHooks.beforeValidation, triggeredHooks.beforeSave);
        });

        it("should allow modification of instance", function () {
            Person.beforeValidation(function () {
                this.name = "Hook Worked";
            });

            var people = Person.createSync([{
                name: "John Doe"
            }]);
            assert.exist(people);
            assert.equal(people.length, 1);
            assert.equal(people[0].name, "Hook Worked");
        });

        describe("if hook method has 1 argument", function () {
            var beforeValidation = false;

            before(setup({
                beforeValidation: function (next) {
                    setTimeout(function () {
                        beforeValidation = true;

                        if (!this.name) return next(new String("Name is missing"));

                        return next();
                    }.bind(this), 200);
                }
            }));

            beforeEach(function () {
                beforeValidation = false;
            });

            it("should wait for hook to finish", function () {
                Person.createSync([{
                    name: "John Doe"
                }]);
                assert.isTrue(beforeValidation);
            });

            it("should trigger error if hook passes an error", function () {
                try {
                    Person.createSync([{
                        name: ""
                    }]);
                } catch (err) {
                    assert.equal(err, "Name is missing");
                }
                assert.isTrue(beforeValidation);
            });

            it("should trigger when calling #validate", function () {
                var person = new Person();

                person.validateSync();
                assert.isTrue(beforeValidation);
            });
        });
    });

    describe("afterLoad", function () {
        var afterLoad = false;

        before(setup({
            afterLoad: function () {
                afterLoad = true;
            }
        }));

        it("should trigger when defining a model", function () {
            var John = new Person({
                name: "John"
            });
            assert.isTrue(afterLoad);
        });

        describe("if hook method has 1 argument", function () {
            var afterLoad = false;

            before(setup({
                afterLoad: function (next) {
                    setTimeout(function () {
                        afterLoad = true;

                        return next();
                    }.bind(this), 200);
                }
            }));

            it("should wait for hook to finish", function () {
                Person.createSync([{
                    name: "John Doe"
                }]);
                assert.isTrue(afterLoad);
            });

            describe("if hook returns an error", function () {
                before(setup({
                    afterLoad: function (next) {
                        return next(new Error("AFTERLOAD_FAIL"));
                    }
                }));

                it("should return error", function () {
                    try {
                        Person.createSync([{
                            name: "John Doe"
                        }]);
                    } catch (err) {
                        assert.exist(err);
                        assert.equal(err.message, "AFTERLOAD_FAIL");
                    }
                });
            });
        });
    });

    describe("afterAutoFetch", function () {
        var afterAutoFetch = false;

        before(setup({
            afterAutoFetch: function () {
                afterAutoFetch = true;
            }
        }));

        it("should trigger when defining a model", function () {
            var John = new Person({
                name: "John"
            });
            assert.isTrue(afterAutoFetch);
        });

        describe("if hook method has 1 argument", function () {
            var afterAutoFetch = false;

            before(setup({
                afterAutoFetch: function (next) {
                    setTimeout(function () {
                        afterAutoFetch = true;

                        return next();
                    }.bind(this), 200);
                }
            }));

            it("should wait for hook to finish", function () {
                Person.createSync([{
                    name: "John Doe"
                }]);
                assert.isTrue(afterAutoFetch);
            });

            describe("if hook returns an error", function () {
                before(setup({
                    afterAutoFetch: function (next) {
                        return next(new Error("AFTERAUTOFETCH_FAIL"));
                    }
                }));

                it("should return error", function () {
                    try {
                        Person.createSync([{
                            name: "John Doe"
                        }]);
                    } catch (err) {
                        assert.exist(err);
                        assert.equal(err.message, "AFTERAUTOFETCH_FAIL");
                    }
                });
            });
        });
    });

    describe("beforeRemove", function () {
        before(setup());

        it("should trigger before removing an instance", function () {
            var items = Person.createSync([{
                name: "John Doe"
            }]);
            items[0].removeSync();
            assert.isNumber(triggeredHooks.afterRemove);
            assert.isNumber(triggeredHooks.beforeRemove);
            assert.notGreaterThan(triggeredHooks.beforeRemove, triggeredHooks.afterRemove);
        });

        describe("if hook method has 1 argument", function () {
            var beforeRemove = false;

            before(setup({
                beforeRemove: function (next) {
                    setTimeout(function () {
                        beforeRemove = true;

                        return next();
                    }.bind(this), 200);
                }
            }));

            it("should wait for hook to finish", function () {
                var items = Person.createSync([{
                    name: "John Doe"
                }]);
                items[0].removeSync();
                assert.isTrue(beforeRemove);
            });

            describe("if hook triggers error", function () {
                before(setup({
                    beforeRemove: function (next) {
                        setTimeout(function () {
                            return next(new Error('beforeRemove-error'));
                        }, 200);
                    }
                }));

                it("should trigger error", function () {
                    var items = Person.createSync([{
                        name: "John Doe"
                    }]);
                    try {
                        items[0].removeSync();
                    } catch (err) {
                        assert.isObject(err);
                        assert.equal(err.message, "beforeRemove-error");
                    }
                });
            });
        });
    });

    describe("afterRemove", function () {
        before(setup());

        it("should trigger after removing an instance", function () {
            var items = Person.createSync([{
                name: "John Doe"
            }]);
            items[0].removeSync();
            assert.isNumber(triggeredHooks.afterRemove);
            assert.isNumber(triggeredHooks.beforeRemove);
            assert.notLessThan(triggeredHooks.afterRemove, triggeredHooks.beforeRemove);
        });
    });

    describe("if model has autoSave", function () {
        before(function () {
            Person = db.define("person", {
                name: String,
                surname: String
            }, {
                autoSave: true,
                hooks: {
                    afterSave: checkHook("afterSave")
                }
            });

            Person.settings.set("instance.returnAllErrors", false);

            return helper.dropSync(Person);
        });

        it("should trigger for single property changes", function () {
            var John = Person.createSync({
                name: "John",
                surname: "Doe"
            });
            assert.isNumber(triggeredHooks.afterSave);
            triggeredHooks.afterSave = false;

            John.surname = "Dean";

            coroutine.sleep(200);
            assert.isNumber(triggeredHooks.afterSave);
        });
    });

    describe("instance modifications", function () {
        before(setup({
            beforeValidation: function () {
                assert.equal(this.name, "John Doe");
                this.name = "beforeValidation";
            },
            beforeCreate: function () {
                assert.equal(this.name, "beforeValidation");
                this.name = "beforeCreate";
            },
            beforeSave: function () {
                assert.equal(this.name, "beforeCreate");
                this.name = "beforeSave";
            }
        }));

        it("should propagate down hooks", function () {
            var people = Person.createSync([{
                name: "John Doe"
            }]);
            assert.exist(people);
            assert.equal(people.length, 1);
            assert.equal(people[0].name, "beforeSave");
        });
    });
});