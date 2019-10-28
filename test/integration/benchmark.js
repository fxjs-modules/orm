var test = require("test");
test.setup();

var helper = require('../support/spec_helper');
var common = require('../common');

function tps (count, ms) {
    const r = (count / ms * 1000)
    return Math.floor(r)
}

odescribe("benchmark", function () {
    var db = null;
    var Person = null;
    var Station = null;
    var PersonStation = null;

    before(function () {
        db = helper.connect();
    });

    after(function () {
        db.close();
    });

    var setup = function (opts) {
        opts = opts || {};

        return function (done) {
            Person = db.define('person', {
                name: String,
                surname: String,
                age: Number
            });
            Station = db.define('station', {
                uuid: {
                    type: 'text',
                    defaultValue() {
                        return Date.now()
                    }
                },
                name: String
            });
            PersonStation = Person.hasManyExclusively(Station, {
                as: 'stations',
                reverseAs: 'owner',
            });

            helper.dropSync([Station, Person, PersonStation], function () {
                done();
            });
        };
    };

    describe("others", () => {
        const { getPageRanges } = require('../../lib/Utils/array')

        it("getPageRanges", () => {
            assert.deepEqual(
                getPageRanges(0, 0 / 5),
                [[0, -1]]
            )

            assert.deepEqual(
                getPageRanges(1, 1e4),
                [[0, 0]]
            )

            assert.deepEqual(
                getPageRanges(1, 1 / 5),
                [[0, 0]]
            )

            assert.deepEqual(
                getPageRanges(1e2, 1e2 / 5),
                [
                    [ 0, 19 ],
                    [ 20, 39 ],
                    [ 40, 59 ],
                    [ 60, 79 ],
                    [ 80, 99 ]
                ]
            )

            assert.deepEqual(
                getPageRanges(1e2 - 2, 1e2 / 5),
                [
                    [ 0, 19 ],
                    [ 20, 39 ],
                    [ 40, 59 ],
                    [ 60, 79 ],
                    [ 80, 98 ]
                ]
            )

            assert.deepEqual(
                getPageRanges(1e2 + 2, 1e2 / 5),
                [
                    [ 0, 19 ],
                    [ 20, 39 ],
                    [ 40, 59 ],
                    [ 60, 79 ],
                    [ 80, 99 ],
                    [ 100, 102 ]
                ]
            )

            assert.deepEqual(
                getPageRanges(10, 1e4),
                [[0, 9]]
            )
        })
    })

    describe("model-create/dml-insert", function () {
        before(setup());

        var c_bare_input = 1e5;

        /**
         * @levels_sqlite_orm
         *  - 500 ✅
         *  - 1e3 ✅
         *  - 2e3 ✅
         *  - 5e3 ✅
         *  - 1e4 single: ✅(≈440ms) batch ✅ | ---> page size
         *  - 1e5 single: 28000+ms; batch ✅️(≈5500ms)
         *  - 1e6 single: -; batch (≈52500ms)
         *  - 1e7 single: -; batch ?
         *
         * @temp
         * native / dml / orm: 1 / (2 ~ 3) / (5 ~ 6)
         *
         */
        var seeds = Array(c_bare_input).fill(undefined)
        var infos = {
            orm: undefined,
            orm_batch_outer: undefined,
            native: undefined,
            nativeInnerConnection: undefined,
            dml: undefined,
        }

        before(() => {
            Person.clear()
            Station.clear()
        })

        beforeEach(() => {
            Person.clear()
        })

        it(`[trans]insert ${seeds.length} rows by native, useConnection inner`, function () {
            infos.nativeInnerConnection = helper.countTime(() => {
                db.driver.useTrans(conn => {
                    seeds.forEach((_, idx) =>
                        db.$dml.execSqlQuery(
                            conn,
                            `insert into \`person\` (\`name\`, \`surname\`) values ('Person ?', 'surname ?')`,
                            [idx, idx]
                        )
                    )
                })
            })

            assert.equal(Person.count(), c_bare_input)
            console.log(
                '\t',
                require('@fibjs/chalk')`{bold.grey.inverse $$ native-ic >> Stat}:`, `${infos.nativeInnerConnection.diff}ms`,
                require('@fibjs/chalk')`{bold.yellow.inverse tps}: ${tps(c_bare_input, infos.nativeInnerConnection.diff)}`
            )
        })

        it(`[trans]insert ${seeds.length} rows by native, useConnection wrapper`, function () {
            infos.nativeOuterConnection = helper.countTime(() => {
                db.driver.useTrans(conn => {
                    seeds.forEach((_, idx) =>
                        db.$dml.execSqlQuery(
                            conn,
                            `insert into \`person\` (\`name\`, \`surname\`) values ('Person ?', 'surname ?')`,
                            [idx, idx]
                        )
                    )
                })
            });

            console.log(
                '\t',
                require('@fibjs/chalk')`{bold.grey.inverse $$ native-oc >> Stat}:`, `${infos.nativeOuterConnection.diff}ms`,
                require('@fibjs/chalk')`{bold.yellow.inverse tps}: ${tps(c_bare_input, infos.nativeOuterConnection.diff)}`
            )
        });

        it(`[trans]insert ${seeds.length} rows by dml`, function () {
            infos.dml = helper.countTime(() => {
                db.driver.useTrans(conn => {
                    seeds.forEach((_, idx) =>
                        db.$dml.insert(
                            Person.collection,
                            {
                                name: `Person ${idx}`,
                                surname: `surname ${idx}`
                            },
                            {
                                connection: conn,
                            }
                        )
                    )
                })
            })

            assert.equal(Person.count(), c_bare_input)
            console.log(
                '\t',
                require('@fibjs/chalk')`{bold.grey.inverse $$ dml >> Stat}:`, `${infos.dml.diff}ms`,
                require('@fibjs/chalk')`{bold.yellow.inverse tps}: ${tps(c_bare_input, infos.dml.diff)}`
            )
        });

        c_bare_input < 1e4 && it(`insert ${seeds.length} rows by orm`, function () {
            infos.orm = helper.countTime(() => {
                seeds.forEach((_, idx) =>
                    Person.create(
                        ({
                            name: `Person ${idx}`,
                            surname: `surname ${idx}`
                        })
                    )
                )
            })

            assert.equal(Person.count(), c_bare_input)
            console.log(
                '\t',
                require('@fibjs/chalk')`{bold.grey.inverse $$ orm >> Stat}:`, `${infos.orm.diff}ms`,
                require('@fibjs/chalk')`{bold.yellow.inverse tps}: ${tps(c_bare_input, infos.orm.diff)}`
            )
        });

        it(`[trans] insert ${seeds.length} rows by orm`, function () {
            infos.orm_batch_outer = helper.countTime(() => {
                db.useTrans(db => {
                    db.models.person.create(
                        seeds.map((_, idx) =>
                            ({
                                name: `Person ${idx}`,
                                surname: `surname ${idx}`
                            })
                        )
                    )

                    assert.equal(db.models.person.count(), c_bare_input)
                })
            })

            console.log(
                '\t',
                require('@fibjs/chalk')`{bold.grey.inverse $$ orm batch >> Stat}:`, `${infos.orm_batch_outer.diff}ms`,
                require('@fibjs/chalk')`{bold.yellow.inverse tps}: ${tps(c_bare_input, infos.orm_batch_outer.diff)}`
            )
        });

        it(`summary`, function () {
            if (infos.orm && infos.dml)
                console.log(
                    '\t',
                    require('@fibjs/chalk')`{bold.blue.inverse $$ orm/dml extra-cost-times}:`, `${infos.orm.diff / infos.dml.diff} `
                )
            if (infos.orm && infos.nativeOuterConnection)
                console.log(
                    '\t',
                    require('@fibjs/chalk')`{bold.blue.inverse $$ orm/native cost-times}:`, `${infos.orm.diff / infos.nativeOuterConnection.diff} `
                )

            if (infos.orm_batch_outer && infos.dml)
                console.log(
                    '\t',
                    require('@fibjs/chalk')`{bold.blue.inverse $$ orm_batch_outer/dml extra-cost-times}:`, `${infos.orm_batch_outer.diff / infos.dml.diff} `
                )
            if (infos.orm_batch_outer && infos.nativeOuterConnection)
                console.log(
                    '\t',
                    require('@fibjs/chalk')`{bold.blue.inverse $$ orm_batch_outer/native cost-times}:`, `${infos.orm_batch_outer.diff / infos.nativeOuterConnection.diff} `
                )

            if (infos.dml && infos.nativeOuterConnection)
                console.log(
                    '\t',
                    require('@fibjs/chalk')`{bold.blue.inverse $$ dml/native cost-times}:`, `${infos.dml.diff / infos.nativeOuterConnection.diff} `
                )
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}
