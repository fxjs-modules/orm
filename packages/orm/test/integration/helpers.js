var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Hook", function () {
    var db = null;
    var Person = null;

    var setup = function (hooks, opts) {
        return function () {
            Person = db.define("person", {
                name: String
            }, {
                autoFetch: opts.autoFetch,
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
    
    describe('hooks internal effect', () => {
        var instanceWhen = {};

        var hook_count = {
            afterLoad: 0,
            afterAutoFetch: 0,
        };

        before(
            setup({
                afterLoad: function () {
                    hook_count['afterLoad']++;
                    instanceWhen['afterLoad'] = this;
                },
                afterAutoFetch: function () {
                    hook_count['afterAutoFetch']++;
                    instanceWhen['afterAutoFetch'] = this;
                },
            }, {
                autoFetch: false
            })
        );

        beforeEach(() => {
            Object.keys(hook_count).forEach(k => hook_count[k] = 0)
            Object.keys(instanceWhen).forEach(k => {
                delete instanceWhen[k]
            })
        })

        function assert_instance (person, assert_count = 1) {
            assert.ok(instanceWhen['afterLoad'] === person)

            assert.isObject(instanceWhen['afterLoad'])
            assert.property(instanceWhen['afterLoad'], 'model')
            assert.isFunction(instanceWhen['afterLoad'].model)
            assert.ok(instanceWhen['afterLoad'].model() === Person)
            assert.equal(hook_count['afterLoad'], assert_count)

            assert.isObject(instanceWhen['afterAutoFetch'])
            assert.property(instanceWhen['afterAutoFetch'], 'model')
            assert.isFunction(instanceWhen['afterAutoFetch'].model)
            assert.ok(instanceWhen['afterAutoFetch'] === person)
            assert.equal(hook_count['afterAutoFetch'], assert_count)
        }

        it('integrated effect in patch -- afterLoad', () => {
            var Joy = new Person({
                name: 'Joy'
            });
            assert_instance(Joy, 1);
            assert.ok(Joy.name === 'Joy')

            var Tom = new Person({
                name: 'Tom'
            });
            assert.ok(Tom.name === 'Tom')
            assert_instance(Tom, 2);
        });

        it('integrated effect in patch -- afterAutoFetch', () => {
            var Amy = new Person({
                name: 'Amy'
            });
            assert.equal(hook_count['afterLoad'], 1)
            assert.equal(hook_count['afterAutoFetch'], 1)

            assert_instance(Amy, 1);
        });
    });

    describe('hook helper', () => {
        before(
            setup({
            }, {
                autoFetch: false
            })
        );

        var triggered = false;
        afterEach(() => {
            triggered = false;
        })

        function assert_instance (inst) {
            assert.isObject(inst)
            assert.property(inst, 'id')
            assert.property(inst, 'saveSync')

            assert.equal(triggered, true)
        }

        describe('use Sync although user override the hook', () => {
            it('afterLoad', function () {
                Person.afterLoad(function () {
                    triggered = true;
                    assert_instance(this)
                });
                new Person();
                triggered = false;

                Person.afterLoad(false);
                Person.afterLoad(function () {
                    triggered = true;
                    assert_instance(this)
                });
                new Person();
                triggered = false;
            });

            it('afterAutoFetch', function () {
                Person.afterAutoFetch(function () {
                    triggered = true;
                    assert_instance(this)
                });
                new Person();
                triggered = false;

                Person.afterAutoFetch(false);
                Person.afterAutoFetch(function () {
                    triggered = true;
                    assert_instance(this)
                });
                new Person();
                triggered = false;
            });

            it('beforeValidation, beforeCreate/afterCreate, beforeSave/afterSave, beforeRemove/afterRemove', function () {
                var Tompson = null;
                var triggeredHash = {};

                Person.beforeValidation(function () {
                    triggered = true;
                    assert_instance(this)
                    triggeredHash['beforeValidation'] = true;
                });

                /* create about :end */
                Person.beforeCreate(function () {
                    triggered = true;
                    assert_instance(this)
                    triggeredHash['beforeCreate'] = true;
                });
                
                Person.afterCreate(function () {
                    assert_instance(this)
                    triggeredHash['afterCreate'] = true;
                });

                Tompson = Person.createSync({
                    name: 'Tompson'
                });
                assert_instance(Tompson);
                assert.ok(triggeredHash['beforeCreate'] === true);
                assert.ok(triggeredHash['afterCreate'] === true);
                triggered = false;
                /* create about :end */

                /* save about :start */
                Person.beforeSave(function () {
                    triggered = true;
                    assert_instance(this)
                    assert.equal(this.name, 'Tompson2')

                    triggeredHash['beforeSave'] = true;
                });

                Person.afterSave(function () {
                    triggered = true;
                    assert_instance(this)
                    assert.equal(this.name, 'Tompson2')

                    triggeredHash['afterSave'] = true;
                });

                Tompson.saveSync({
                    name: 'Tompson2'
                });

                assert.ok(triggeredHash['beforeSave'] === true);
                assert.ok(triggeredHash['afterSave'] === true);
                /* save about :end */

                /* remove about :end */
                Person.beforeRemove(function () {
                    triggered = true;
                    assert_instance(this)

                    triggeredHash['beforeRemove'] = true;
                });

                Person.afterRemove(function () {
                    triggered = true;
                    assert_instance(this)
                    assert.equal(this.name, 'Tompson2')

                    triggeredHash['afterRemove'] = true;
                });

                Tompson.removeSync();

                assert.ok(triggeredHash['beforeRemove'] === true);
                assert.ok(triggeredHash['afterRemove'] === true);
                /* remove about :end */

                assert.ok(triggeredHash['beforeValidation'] === true);
            });
        });
    });
});