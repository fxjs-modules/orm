var _ = require('lodash');
var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Validations", function () {
    var db = null;
    var Person = null;
    var Person2 = null;

    var setup = function (returnAll, required) {
        return function () {
            db.settings.set('properties.required', required);
            db.settings.set('instance.returnAllErrors', returnAll);

            Person = db.define("person", {
                name: {
                    type: 'text'
                },
                height: {
                    type: 'number'
                },
            }, {
                validations: {
                    name: ORM.validators.rangeLength(3, 30),
                    height: ORM.validators.rangeNumber(0.1, 3.0)
                }
            });

            helper.dropSync(Person);
        };
    };

    var notNull = function (val, next, data) {
        if (val != null) {
            return next('notnull');
        }
        return next();
    };
    var setupAlwaysValidate = function () {
        return function () {
            Person2 = db.define("person2", {
                name: {
                    type: 'text'
                },
                mustbenull: {
                    type: 'text',
                    required: false,
                    alwaysValidate: true
                },
                canbenull: {
                    type: 'text',
                    required: false
                }
            }, {
                validations: {
                    name: ORM.validators.rangeLength(3, 30),
                    mustbenull: notNull,
                    canbenull: notNull
                }
            });
            helper.dropSync(Person2);
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.closeSync();
    });

    describe("alwaysValidate", function () {
        before(setupAlwaysValidate());

        it("I want to see it fail first (the absence of evidence)", function () {
            var rachel = new Person2({
                name: 'rachel',
                canbenull: null,
                mustbenull: null
            });
            rachel.saveSync();
        });

        it("then it should work", function () {
            var tom = new Person2({
                name: 'tom',
                canbenull: null,
                mustbenull: 'notnull'
            });
            try {
                tom.saveSync();
            } catch (err) {
                assert.equal(typeof err, "object");
                assert.equal(err.property, "mustbenull");
                assert.equal(err.msg, "notnull");
                assert.equal(err.type, "validation");
            }

            assert.equal(tom.id, null);
        });
    });

    describe("predefined", function () {
        before(setup(false, false));

        it("should work", function () {
            var john = new Person({
                name: 'fdhdjendfjkdfhshdfhakdfjajhfdjhbfgk'
            });

            try {
                john.saveSync();
            } catch (err) {
                assert.equal(typeof err, "object");
                assert.equal(err.property, "name");
                assert.equal(err.value, "fdhdjendfjkdfhshdfhakdfjajhfdjhbfgk");
                assert.equal(err.msg, "out-of-range-length");
                assert.equal(err.type, "validation");
            }

            assert.equal(john.id, null);
        });

        describe("unique", function () {
            var Product = null,
                Supplier = null;

            var setupUnique = function (ignoreCase, scope, msg) {
                return function () {
                    Supplier = db.define("supplier", {
                        name: String
                    }, {
                        cache: false
                    });
                    helper.dropSync(Supplier, function () {
                        Product = db.define("productUnique", {
                            instock: {
                                type: 'boolean',
                                required: true,
                                defaultValue: false
                            },
                            name: String,
                            category: String
                        }, {
                            cache: false,
                            validations: {
                                name: ORM.validators.unique({
                                    ignoreCase: ignoreCase,
                                    scope: scope
                                }, msg),
                                instock: ORM.validators.required(),
                                productId: ORM.validators.unique() // this must be straight after a required & validated row.
                            }
                        });
                        Product.hasOne('supplier', Supplier, {
                            field: 'supplierId'
                        });

                        return helper.dropSync(Product);
                    });
                };
            };

            describe("simple", function () {
                before(setupUnique(false, false));

                it("should return validation error for duplicate name", function () {
                    var product = Product.createSync({
                        name: 'fork'
                    });

                    assert.throws(function () {
                        product = Product.createSync({
                            name: 'fork'
                        });
                    })
                });

                it("should pass with different names", function () {
                    Product.createSync({
                        name: 'spatula'
                    });
                    Product.createSync({
                        name: 'plate'
                    });
                });

                // Technically this is covered by the tests above, but I'm putting it here for clarity's sake. 3 HOURS WASTED *sigh.
                it("should not leak required state from previous validation for association properties [regression test]", function () {
                    Product.createSync({
                        name: 'pencil',
                        productId: null
                    });
                    Product.createSync({
                        name: 'pencilcase',
                        productId: null
                    });
                });
            });

            describe("scope", function () {
                describe("to other property", function () {

                    before(setupUnique(true, ['category']));

                    it("should return validation error if other property also matches", function () {
                        Product.createSync({
                            name: 'red',
                            category: 'chair'
                        });

                        assert.throws(function () {
                            Product.createSync({
                                name: 'red',
                                category: 'chair'
                            });
                        });
                    });

                    it("should pass if other property is different", function () {
                        Product.createSync({
                            name: 'blue',
                            category: 'chair'
                        });
                        Product.createSync({
                            name: 'blue',
                            category: 'pen'
                        });
                    });

                    // In SQL unique index land, NULL values are not considered equal.
                    it("should pass if other property is null", function () {
                        Product.createSync({
                            name: 'blue',
                            category: null
                        });
                        Product.createSync({
                            name: 'blue',
                            category: null
                        });
                    });
                });

                describe("to hasOne property", function () {
                    var firstId = null;
                    var secondId = null;

                    // before(function() {
                    //     setupUnique(true, ['supplierId'])(function(err) {
                    //         assert.notExists(err);
                    //         Supplier.create({ name: 'first' }, function(err, supplier) {
                    //             assert.notExist(err);

                    //             firstId = supplier.id;

                    //             Supplier.create({ name: 'second' }, function(err, supplier) {
                    //                 assert.notExist(err);

                    //                 secondId = supplier.id;
                    //                 done();
                    //             });
                    //         });
                    //     });
                    // });

                    it("should return validation error if hasOne property also matches", function () {
                        Product.createSync({
                            name: 'red',
                            supplierId: firstId
                        });
                        try {
                            Product.createSync({
                                name: 'red',
                                supplierId: firstId
                            });
                        } catch (err) {
                            assert.exist(err);
                            assert.equal(err.msg, 'not-unique');
                        }
                    });

                    it("should pass if hasOne property is different", function () {
                        Product.createSync({
                            name: 'blue',
                            supplierId: firstId
                        });
                        Product.createSync({
                            name: 'blue',
                            supplierId: secondId
                        });
                    });

                    // In SQL unique index land, NULL values are not considered equal.
                    it("should pass if other property is null", function () {
                        Product.createSync({
                            name: 'blue',
                            category: null
                        });
                        Product.createSync({
                            name: 'blue',
                            category: null
                        });
                    });
                });
            });

            describe("ignoreCase", function () {
                it("true should do a case insensitive comparison", function () {
                    setupUnique(true, false)();
                    Product.createSync({
                        name: 'stapler'
                    });
                    try {
                        Product.createSync({
                            name: 'staplER'
                        });
                    } catch (err) {
                        assert.equal(err.msg, 'not-unique');
                    }
                });

                it("true should do a case insensitive comparison on scoped properties too", function () {
                    setupUnique(true, ['category'], "name already taken for this category")();
                    Product.createSync({
                        name: 'black',
                        category: 'pen'
                    });

                    try {
                        Product.createSync({
                            name: 'Black',
                            category: 'Pen'
                        });
                    } catch (err) {
                        assert.equal(err.msg, "name already taken for this category");
                    }

                });
            });
        });
    });

    describe("instance.returnAllErrors = false", function () {
        describe("properties.required = false", function () {
            before(setup(false, false));

            it("should save when properties are null", function () {
                var john = new Person();

                john.saveSync();

                assert.exist(john[Person.id]);
            });

            it("shouldn't save when a property is invalid", function () {
                var john = new Person({
                    height: 4
                });

                try {
                    john.saveSync();
                } catch (err) {
                    assert.equal(err.property, 'height');
                    assert.equal(err.value, 4);
                    assert.equal(err.msg, 'out-of-range-number');
                    assert.equal(err.type, 'validation');
                }

                assert.equal(john.id, null);
            });
        });

        describe("properties.required = true", function () {
            before(setup(false, true));

            it("should not save when properties are null", function () {
                var john = new Person();

                assert.throws(function () {
                    john.saveSync();
                });

                assert.equal(john.id, null);
            });

            it("should return a required error when the first property is blank", function () {
                var john = new Person({
                    height: 4
                });

                try {
                    john.saveSync();
                } catch (err) {
                    assert.equal(err.property, 'name');
                    assert.equal(err.value, null);
                    assert.equal(err.msg, 'required');
                    assert.equal(err.type, 'validation');
                }

                assert.equal(john.id, null);
            });
        });
    });

    describe("instance.returnAllErrors = true", function () {
        describe("properties.required = false", function () {
            before(setup(true, false));

            it("should return all errors when a property is invalid", function () {
                var john = new Person({
                    name: 'n',
                    height: 4
                });

                try {
                    john.saveSync();
                } catch (err) {
                    assert.ok(Array.isArray(err));
                    assert.equal(err.length, 2);

                    assert.deepEqual(err[0], _.extend(new Error('out-of-range-length'), {
                        property: 'name',
                        value: 'n',
                        msg: 'out-of-range-length',
                        type: 'validation'
                    }));

                    assert.deepEqual(err[1], _.extend(new Error('out-of-range-number'), {
                        property: 'height',
                        value: 4,
                        msg: 'out-of-range-number',
                        type: 'validation'
                    }));

                    assert.equal(john.id, null);
                }
            });
        });

        describe("properties.required = true", function () {
            before(setup(true, true));

            it("should return required and user specified validation errors", function () {
                var john = new Person({
                    height: 4
                });

                try {
                    john.saveSync();
                } catch (err) {
                    assert.ok(Array.isArray(err));
                    assert.equal(err.length, 3);

                    assert.deepEqual(err[0], _.extend(new Error('required'), {
                        property: 'name',
                        value: null,
                        msg: 'required',
                        type: 'validation'
                    }));

                    assert.deepEqual(err[1], _.extend(new Error('undefined'), {
                        property: 'name',
                        value: null,
                        msg: 'undefined',
                        type: 'validation'
                    }));

                    assert.deepEqual(err[2], _.extend(new Error('out-of-range-number'), {
                        property: 'height',
                        value: 4,
                        msg: 'out-of-range-number',
                        type: 'validation'
                    }));

                    assert.equal(john.id, null);
                }
            });
        });
    });

});