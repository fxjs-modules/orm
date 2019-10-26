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

            helper.dropSync([Station, Person], function () {
                done();
            });
        };
    };

    describe("others", () => {
        const { getPageRanges } = require('../../lib/Utils/array')

        it("getPageRanges", () => {

            assert.deepEqual(
                getPageRanges(0, 0 / 5),
                [[0, 0]]
            )

            assert.deepEqual(
                getPageRanges(1, 1 / 5),
                [[0, 1]]
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
                [[0, 10]]
            )
        })
    })

    describe("model-create/dml-insert", function () {
        before(setup());

        var bare_input = 1e5;
        
        /**
         * @levels_sqlite
         *  - 500 ✅
         *  - 1e3 ✅
         *  - 2e3 ✅
         *  - 5e3 ✅
         *  - 1e4 ✅ as cache size
         *  - 1e5 28000+ms ---> ?
         *  - 1e6
         *  - 1e7
         */
        var seeds = Array(bare_input).fill(undefined)
        var infos = {
            orm: undefined,
            ormparallel: undefined,
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

        it(`insert ${seeds.length} rows by orm`, function () {
            infos.orm = helper.countTime(() => {
                Person.create(
                    seeds.map((_, idx) =>
                        ({
                            name: `Person ${idx}`,
                            surname: `surname ${idx}`
                        })
                    )
                )
            })

            console.log(
                '\t',
                require('@fibjs/chalk')`{bold.grey.inverse $$ orm >> Stat}:`, `${infos.orm.diff}ms`,
                require('@fibjs/chalk')`{bold.yellow.inverse tps}: ${tps(bare_input, infos.orm.diff)}`
            )
        });

        xit(`parallel insert ${seeds.length} rows by orm`, function () {
            infos.ormparallel = helper.countTime(() => {
                Person.create(
                    seeds.map((_, idx) =>
                        ({
                            name: `Person ${idx}`,
                            surname: `surname ${idx}`
                        })
                    ),
                    {
                        parallel: true
                    }
                )
            })

            console.log(
                '\t',
                require('@fibjs/chalk')`{bold.grey.inverse $$ orm >> Stat}:`, `${infos.ormparallel.diff}ms`,
                require('@fibjs/chalk')`{bold.yellow.inverse tps}: ${tps(bare_input, infos.ormparallel.diff)}`
            )
        });
        
        it(`insert ${seeds.length} rows by dml`, function () {
            infos.dml = helper.countTime(() => {
                Person.$dml
                    .toSingleton()
                    .useTrans(dml =>
                        seeds.map((_, idx) =>
                            dml.insert(
                                Person.collection,
                                {
                                    name: `Person ${idx}`,
                                    surname: `surname ${idx}`
                                }
                            )
                        )
                    )
                    .releaseSingleton()
            })

            console.log(
                '\t',
                require('@fibjs/chalk')`{bold.grey.inverse $$ dml >> Stat}:`, `${infos.dml.diff}ms`,
                require('@fibjs/chalk')`{bold.yellow.inverse tps}: ${tps(bare_input, infos.dml.diff)}`
            )
        });

        it(`insert ${seeds.length} rows by native, useConnection inner`, function () {
            infos.nativeInnerConnection = helper.countTime(() => {
                Person.$dml
                .toSingleton()
                .useTrans(dml =>
                    seeds.map((_, idx) =>
                        dml.useConnection(conn =>
                            dml.execSqlQuery(
                                conn,
                                `insert into \`person\` (\`name\`, \`surname\`) values ('Person ?', 'surname ?')`,
                                [idx, idx]
                            )
                        )
                    )
                )
                .releaseSingleton()
            })

            console.log(
                '\t',
                require('@fibjs/chalk')`{bold.grey.inverse $$ native-ic >> Stat}:`, `${infos.nativeInnerConnection.diff}ms`,
                require('@fibjs/chalk')`{bold.yellow.inverse tps}: ${tps(bare_input, infos.nativeInnerConnection.diff)}`
            )
        })

        it(`insert ${seeds.length} rows by native, useConnection wrapper`, function () {
            infos.nativeOuterConnection = helper.countTime(() => {
                Person.$dml
                    .toSingleton()
                    .useTrans(dml =>
                        dml.useConnection(conn =>
                            seeds.map((_, idx) =>
                                dml.execSqlQuery(
                                    conn,
                                    `insert into \`person\` (\`name\`, \`surname\`) values ('Person ?', 'surname ?')`,
                                    [idx, idx]
                                )
                            )
                        )
                    ).releaseSingleton()
            });

            console.log(
                '\t',
                require('@fibjs/chalk')`{bold.grey.inverse $$ native-oc >> Stat}:`, `${infos.nativeOuterConnection.diff}ms`,
                require('@fibjs/chalk')`{bold.yellow.inverse tps}: ${tps(bare_input, infos.nativeOuterConnection.diff)}`
            )
        });

        it(`summary`, function () {
            // console.log(require('@fibjs/chalk')`{bold.blue.inverse $$ orm/orm-parallel extra-cost-times}:`, `${infos.orm.diff / infos.ormparallel.diff} `)
            console.log(require('@fibjs/chalk')`{bold.blue.inverse $$ orm/dml extra-cost-times}:`, `${infos.orm.diff / infos.dml.diff} `)
            console.log(require('@fibjs/chalk')`{bold.blue.inverse $$ orm/native cost-times}:`, `${infos.orm.diff / infos.nativeOuterConnection.diff} `)
            console.log(require('@fibjs/chalk')`{bold.blue.inverse $$ dml/native cost-times}:`, `${infos.dml.diff / infos.nativeOuterConnection.diff} `)
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}
