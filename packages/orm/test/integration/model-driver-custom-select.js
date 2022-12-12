var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model - custom select with `generateSqlSelect`", function () {
    useRunner({ mode: 'function' })
});

describe("Model - custom select with `customSelect` - by knex", function () {
    useRunner({ mode: 'rawQuery:knex' })
});

describe("Model - custom select with `customSelect` - wrapped subquery", function () {
    useRunner({ mode: 'rawQuery:rawSQL' })
});

function useRunner (options) {
    /** @type {import('../../').ORM} */
    var db = null;
    var Person = null;

    function assertPerson(person) {
        assert.isObject(person);

        assert.property(person, "same_age_count");

        assert.isString(person.name);
        assert.isString(person.surname);
        assert.isNumber(person.age);
        if (db && db.driver.sqlDriver.type !== 'psql')
            assert.isBoolean(person.male);

        assert.isNumber(person._age);
        assert.isNumber(person.same_age_count);
    }

    var setup = function () {
        const knex = db.driver.knex;

        Person = db.define("person", {
            name: String,
            surname: String,
            same_age_count: {
                virtual: true,
                type: 'integer',
                mapsTo: 'same_age_count'
            },
            _age: {
                virtual: true,
                type: 'integer',
                mapsTo: '_age'
            },
            age: Number,
            male: Boolean
        }, {
            ...options.mode === 'rawQuery:rawSQL' ? {
                customSelect: (db.driver.sqlDriver.type === 'sqlite' || db.driver.sqlDriver.type === 'mysql') ? {
                    from: [
                        'person',
                        "(select `age` as `_age`, count(*) as `same_age_count` from `person` group by `age`) as `same_ages`"
                    ],
                    wheres: { 'person.age': db.comparators.eq('same_ages._age', { asIdentifier: true }) },
                } : db.driver.sqlDriver.type === 'psql' ? {
                    from: [
                        `"person" as "person"`,
                        `(select "age" as "_age", count(*) as "same_age_count" from "person" group by "age") as "same_ages"`
                    ],
                    wheres: { 'person.age': db.comparators.eq('same_ages._age', { asIdentifier: true }) },
                } : {
                    from: `Unknown SQL driver type: ${db.driver.sqlDriver.type}`,
                },
            } : options.mode === 'rawQuery:knex' ? {
                customSelect: {
                    from: [
                        'person',
                        // from subquery, which presents by knex query builder
                        [knex.table('person').select(
                            'age as _age',
                            knex.raw('count(*) as ??', ['same_age_count']),
                        ).groupBy('age'), 'same_ages'],
                    ],
                    wheres: { 'person.age': db.comparators.eq('same_ages._age', { asIdentifier: true }) },
                },
            } : {
                generateSqlSelect: function(ctx, querySelect) {
                    const subquery = this.knex.table('person');

                    switch (this.sqlDriver.type) {
                        case 'mysql':
                        case 'psql': {
                            // for mysql, specify all non-grouped fields to avoid conflict with
                            // `ONLY_FULL_GROUP_BY` mode, similar reason for postgres
                            subquery.select(
                                'age as _age', // alias to avoid conflict with `age` column
                                knex.raw('count(*) as ??', ['same_age_count']),
                            ).groupBy(['_age'])
                            break;
                        }
                        case 'sqlite': {
                            // for sqlite, it's free in some degree, but still need to specify
                            subquery.select(
                                'id as _id',
                                'age as _age', // alias to avoid conflict with `age` column
                                knex.raw('count(*) as ??', ['same_age_count']),
                            ).groupBy('age')
                            break;
                        }
                    }
                    querySelect
                        .from(`person as person`)
                        .select(ctx.selectFields) // select all model defined fields, but `same_age_count` due to it's virtual
                        .from([subquery, 'same_ages'])
                        .select(['same_age_count', '_age'])
                        .where({
                            'person.age': knex.ref('same_ages._age')
                        });

                    if (this.sqlDriver.type === 'sqlite') {
                        // pointless here, just for SQL test
                        querySelect.groupBy('person.id')
                    }

                    return querySelect;
                }
            }
        });

        return helper.dropSync(Person, function () {
            Person.createSync([{
                name: "John",
                surname: "Doe",
                age: 18,
                male: true
            }, {
                name: "Jane",
                surname: "Doe",
                age: 16,
                male: false
            }, {
                name: "Jeremy",
                surname: "Dean",
                age: 18,
                male: true
            }, {
                name: "Jack",
                surname: "Dean",
                age: 20,
                male: true
            }, {
                name: "Jasmine",
                surname: "Doe",
                age: 20,
                male: false
            }, {
                name: "Joy",
                surname: "Dowell",
                age: 18,
                male: false
            }]);
        });
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    describe("with a string argument", function () {
        before(setup);

        it("should use it as property ascending order", function () {
            var people = Person.findSync("same_age_count");

            assert.isObject(people);
            assert.propertyVal(people, "length", 6);
            assert.equal(people[0].age, 16);
            assert.equal(people[0].same_age_count, 1);
            assert.equal(people[4].age, 18);
            assert.equal(people[4].same_age_count, 3);
        });

        it("should use it as property descending order if starting with '-'", function () {
            var people = Person.findSync("-same_age_count");

            assert.isObject(people);
            assert.propertyVal(people, "length", 6);
            assert.equal(people[0].age, 18);
            assert.equal(people[0].same_age_count, 3);
            assert.equal(people[5].age, 16);
            assert.equal(people[5].same_age_count, 1);
        });

        it("virtual property also work on getSync", function () {
            var person = Person.getSync(1);

            assertPerson(person);
            assert.equal(person.age, 18);
            assert.equal(person.same_age_count, 3);
        });
    });

    describe("with an Array as argument", function () {
        before(setup);

        it("should use it as property ascending order", function () {
            var people = Person.findSync(["age"]);

            assert.isArray(people);
            assert.propertyVal(people, "length", 6);
            assert.equal(people[0].age, 16);
            assert.equal(people[4].age, 20);
        });

        it("should use it as virtual property ascending order", function () {
            var people = Person.findSync(['same_age_count', 'age']);

            assert.isArray(people);
            assert.propertyVal(people, "length", 6);
            assert.equal(people[0].age, 16);
            assert.equal(people[0].same_age_count, 1);
            
            assert.equal(people[4].age, 18);
            assert.equal(people[4].same_age_count, 3);
        });

        it("should use it as property descending order if starting with '-'", function () {
            var people = Person.findSync(["-age"]);

            assert.isArray(people);
            assert.propertyVal(people, "length", 6);
            assert.equal(people[0].age, 20);
            assert.equal(people[5].age, 16);
        });

        it("should use it as virtual property descending order if starting with '-'", function () {
            var people = Person.findSync(['-same_age_count', "-age"]);

            assert.isArray(people);
            assert.propertyVal(people, "length", 6);
            assert.equal(people[0].age, 18);
            assert.equal(people[0].same_age_count, 3);

            assert.equal(people[5].age, 16);
            assert.equal(people[5].same_age_count, 1);
        });

        it("should use it as property descending order if element is 'Z'", function () {
            var people = Person.findSync(["age", "Z"]);

            assert.isArray(people);
            assert.propertyVal(people, "length", 6);
            assert.equal(people[0].age, 20);
            assert.equal(people[5].age, 16);
        });

        it("should use it as virtual property descending order if element is 'Z'", function () {
            var people = Person.findSync(['same_age_count', 'Z', "age", "Z"]);

            assert.isArray(people);
            assert.propertyVal(people, "length", 6);
            assert.equal(people[0].age, 18);
            assert.equal(people[0].same_age_count, 3);

            assert.equal(people[5].age, 16);
            assert.equal(people[5].same_age_count, 1);
        });
    });

    describe("with an Object as argument", function () {
        before(setup);

        it("should use it as conditions", function () {
            var people = Person.findSync({
                age: 16
            });

            assert.isObject(people);
            assert.propertyVal(people, "length", 1);
            assert.equal(people[0].age, 16);
            assert.equal(people[0].same_age_count, 1);
        });

        it("should accept comparison objects", function () {
            var people = Person.findSync({
                same_age_count: ORM.gt(1)
            });

            assert.isObject(people);
            assert.propertyVal(people, "length", 5);
            assert.equal(people[0].age, 18);
            assert.equal(people[0].same_age_count, 3);
            assert.equal(people[1].age, 18);
            assert.equal(people[1].same_age_count, 3);
        });

        describe("with another Object as argument", function () {
            before(setup);

            it("should use it as options", function () {
                var people = Person.findSync({
                    same_age_count: 3
                }, 1, {
                    cache: false
                });
                assert.isObject(people);
                assert.propertyVal(people, "length", 1);
                assert.equal(people[0].age, 18);
            });

            describe("if a limit is passed", function () {
                before(setup);

                it("should use it", function () {
                    var people = Person.findSync({
                        same_age_count: 3
                    }, {
                        limit: 1
                    });

                    assert.isObject(people);
                    assert.propertyVal(people, "length", 1);
                    assert.equal(people[0].age, 18);
                });
            });

            describe("if an offset is passed", function () {
                before(setup);

                it("should use it", function () {
                    var people = Person.findSync({}, {
                        offset: 1
                    }, "same_age_count");

                    assert.isObject(people);
                    assert.propertyVal(people, "length", 5);
                    assert.equal(people[0].age, 20);
                    assert.equal(people[0].same_age_count, 2);
                });
            });

            describe("if an order is passed", function () {
                before(setup);

                it("should use it", function () {
                    var people = Person.findSync({
                        surname: "Doe"
                    }, {
                        order: "-same_age_count"
                    });

                    assert.isObject(people);
                    assert.propertyVal(people, "length", 3);
                    assert.equal(people[0].age, 18);
                    assert.equal(people[0].same_age_count, 3);
                });

                it("should use it and ignore previously defined order", function () {
                    var people = Person.findSync({
                        surname: "Doe"
                    }, "same_age_count", {
                        order: "-same_age_count"
                    });

                    assert.isObject(people);
                    assert.propertyVal(people, "length", 3);
                    assert.equal(people[0].age, 18);
                    assert.equal(people[0].same_age_count, 3);
                });
            });
        });
    });

    describe("with identityCache disabled", function () {
        before(setup);

        it("should not return singletons", function () {
            var people = Person.findSync({
                name: "Jasmine"
            }, {
                identityCache: false
            });

            assert.isObject(people);
            assert.propertyVal(people, "length", 1);
            assert.equal(people[0].name, "Jasmine");
            assert.equal(people[0].surname, "Doe");

            people[0].surname = "Dux";

            people = Person.findSync({
                name: "Jasmine"
            }, {
                identityCache: false
            });

            assert.isObject(people);
            assert.propertyVal(people, "length", 1);
            assert.equal(people[0].name, "Jasmine");
            assert.equal(people[0].surname, "Doe");
        });
    });

    describe("when using Model.all()", function () {
        before(setup);

        it("should work exactly the same", function () {
            var people = Person.allSync({
                surname: "Doe"
            }, "-age", 1);

            assert.isObject(people);
            assert.propertyVal(people, "length", 1);
            assert.equal(people[0].name, "Jasmine");
            assert.equal(people[0].surname, "Doe");
        });
    });

    describe("when using Model.where()", function () {
        before(setup);

        it("should work exactly the same", function () {
            var people = Person.whereSync({
                surname: "Doe"
            }, "-age", 1);

            assert.isObject(people);
            assert.propertyVal(people, "length", 1);
            assert.equal(people[0].name, "Jasmine");
            assert.equal(people[0].surname, "Doe");
        });
    });
}