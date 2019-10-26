var test = require("test");
test.setup();

var helper = require('../support/spec_helper');
var common = require('../common');

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

    describe("model-create/dml-insert", function () {
        before(setup());
        
        /**
         * @levels_sqlite
         *  - 500 ✅
         *  - 1e3 ✅
         *  - 2e3 ✅
         *  - 5e3 ✅
         *  - 1e4 ✅
         *  - 1e5 28000+ms ---> ?
         *  - 1e6
         *  - 1e7
         */
        var seeds = Array(1e5).fill(undefined)
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

        oit(`insert ${seeds.length} rows by orm`, function () {
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

            console.log(require('@fibjs/chalk')`{bold.grey.inverse \t$$ orm >> diff}:`, `${infos.orm.diff}ms`)
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

            console.log(require('@fibjs/chalk')`{bold.grey.inverse \t$$ orm >> diff}:`, `${infos.ormparallel.diff}ms`)
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

            console.log(require('@fibjs/chalk')`{bold.grey.inverse \t$$ dml >> diff}:`, `${infos.dml.diff}ms`)
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

            console.log(require('@fibjs/chalk')`{bold.grey.inverse \t$$ native-ic >> diff}:`, `${infos.nativeInnerConnection.diff}ms`)
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

            console.log(require('@fibjs/chalk')`{bold.grey.inverse \t$$ native-oc >> diff}:`, `${infos.nativeOuterConnection.diff}ms`)
        });

        it(`summary`, function () {
            // console.log(require('@fibjs/chalk')`{bold.blue.inverse \t$$ orm/orm-parallel extra-cost-times}:`, `${infos.orm.diff / infos.ormparallel.diff} `)
            console.log(require('@fibjs/chalk')`{bold.blue.inverse \t$$ orm/dml extra-cost-times}:`, `${infos.orm.diff / infos.dml.diff} `)
            console.log(require('@fibjs/chalk')`{bold.blue.inverse \t$$ orm/native cost-times}:`, `${infos.orm.diff / infos.nativeOuterConnection.diff} `)
            console.log(require('@fibjs/chalk')`{bold.blue.inverse \t$$ dml/native cost-times}:`, `${infos.dml.diff / infos.nativeOuterConnection.diff} `)
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}
