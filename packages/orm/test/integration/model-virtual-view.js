var helper = require('../support/spec_helper');
const { runProcAndCatch } = require('../support/_helpers');

const MOCK_DATA = {
    "classes": [
        { "no": 1, "name": "class_1" },
        { "no": 2, "name": "class_2" },
        { "no": 3, "name": "class_3" },
    ],
    "students_info": [
        { "stu_no": 1, "class_no": 1, "grade": 60, "gender": "male", "height": 156 },
        { "stu_no": 2, "class_no": 1, "grade": 70, "gender": "male", "height": 175 },
        { "stu_no": 3, "class_no": 1, "grade": 80, "gender": "female", "height": 158 },
        { "stu_no": 4, "class_no": 1, "grade": 90, "gender": "male", "height": 180 },
        { "stu_no": 5, "class_no": 1, "grade": 100, "gender": "male", "height": 159 },
        { "stu_no": 6, "class_no": 2, "grade": 60, "gender": "female", "height": 173 },
        { "stu_no": 7, "class_no": 2, "grade": 70, "gender": "male", "height": 150 },
        { "stu_no": 8, "class_no": 2, "grade": 80, "gender": "female", "height": 161 },
        { "stu_no": 9, "class_no": 2, "grade": 90, "gender": "male", "height": 164 },
        { "stu_no": 10, "class_no": 2, "grade": 100, "gender": "female", "height": 162 },
        { "stu_no": 11, "class_no": 3, "grade": 60, "gender": "female", "height": 176 },
        { "stu_no": 12, "class_no": 3, "grade": 70, "gender": "male", "height": 165 },
    ]
}

describe("Model - virtual view & property", function () {
    /** @type {import('../../').ORM} */
    var db = null;
    var Class = null;
    var StudentInfo = null;
    var StudentInfoStatics2 = null;
    
    function assertStatics(statics) {
        assert.isObject(statics);

        assert.notExist(statics.id);

        assert.isNumber(statics.class_no);
        assert.isNumber(statics.students_count);
        assert.isNumber(statics.male_count);
        assert.isNumber(statics.avg_grade);
        assert.isNumber(statics.avg_height);
    }

    var setup = function () {
        const knex = db.driver.knex;

        Class = db.define("class", {
            no: Number,
            name: String
        }, {
        });

        StudentInfo = db.define("students_info", {
            stu_no: Number,
            class_no: Number,
            gender: ['male', 'female'],
            grade: Number,
            height: Number,
        }, {
        });

        StudentInfoStatics2 = db.define("class_students_statics", {
            class_no: { type: 'integer', mapsTo: 's_class_no' },
            students_count: { type: 'integer' },
            male_count: { type: 'integer' },
            avg_grade: { type: 'number' },
            avg_height: { type: 'number' },
        }, {
            virtualView: db.driver.sqlDriver.type === 'sqlite' ? "(select `class_no` as `s_class_no`, count(stu_no) as `students_count`, count(gender) as `male_count`, avg(grade) as `avg_grade`, avg(height) as `avg_height` from `students_info` group by `class_no`)"
            : db.driver.sqlDriver.type === 'mysql' ? "(select `class_no` as `s_class_no`, count(stu_no) as `students_count`, count(gender) as `male_count`, avg(grade) as `avg_grade`, avg(height) as `avg_height` from `students_info` group by `class_no`)"
            : db.driver.sqlDriver.type === 'psql' ? `(select "class_no" as "s_class_no", count(stu_no) as "students_count", count(gender) as "male_count", avg(grade) as "avg_grade", avg(height) as "avg_height" from "students_info" group by "class_no")`
            : null,

            // // elegant way to define virtual view, uncomment it to test with it
            // virtualView: knex.table('students_info').select(
            //              'class_no as s_class_no',
            //              knex.raw('count(stu_no) as ??', ['students_count']),
            //              knex.raw('count(gender) as ??', ['male_count']),
            //              knex.raw('avg(grade) as ??', ['avg_grade']),
            //              knex.raw('avg(height) as ??', ['avg_height']),
            //          ).groupBy(['class_no'])
        });

        return helper.dropSync([
            Class,
            StudentInfo,
            StudentInfoStatics2
        ], function () {
            MOCK_DATA.classes.forEach(classInfo => {
                Class.createSync(classInfo);
            });
            MOCK_DATA.students_info.forEach(classInfo => {
                StudentInfo.createSync(classInfo);
            });
        });
    };

    before(function () {
        db = helper.connect();

        // cleanup
        const dirtyTables = [
            'class_students_statics',
        ];

        dirtyTables.forEach((table) => {
            if (db.driver.ddlSync.hasCollectionSync(db.driver.sqlDriver, table)) {
                db.driver.ddlSync.dropCollectionSync(db.driver.sqlDriver, table);
            }
        });
    });

    after(function () {
        return db.closeSync();
    });

    describe("model with all virtual properties will not trigger sync", function () {
        before(setup);

        it('table not exists', () => {
            const tableExisted = db.driver.ddlSync.hasCollectionSync(db.driver.sqlDriver, 'class_students_statics');

            assert.equal(tableExisted, false);
        })
    });

    describe("virtual view statics", function () {
        before(setup);

        const staticsResult = [
            null,
            {
                "class_no": 1,
                "students_count": 5,
                "male_count": 5,
                "avg_grade": 80,
                "avg_height": 165.6
            },
            {
                "class_no": 2,
                "students_count": 5,
                "male_count": 5,
                "avg_grade": 80,
                "avg_height": 162
            },
            {
                "class_no": 3,
                "students_count": 2,
                "male_count": 2,
                "avg_grade": 65,
                "avg_height": 170.5
            },
        ];

        it('get all statics', () => {
            const class_statics = StudentInfoStatics2.findSync();

            assert.isArray(class_statics);
            assert.greaterThan(class_statics.lenght, 0);
            assert.equal(class_statics.length, 3);

            class_statics.forEach((statics_item) => {
                assertStatics(statics_item);
            });
        });

        it('support where conditions', () => {
            const class_statics = StudentInfoStatics2.findSync({
                class_no: 3
            });

            assert.isArray(class_statics);
            assert.greaterThan(class_statics.lenght, 1);
            assertStatics(class_statics[0]);

            assert.deepEqual(class_statics[0], staticsResult[3]);
        });

        describe('support order', () => {
            it('order by avg_height asc', () => {
                const class_statics = StudentInfoStatics2.findSync({}, { order: 'avg_height' });

                assert.isArray(class_statics);
                assert.equal(class_statics.length, 3);

                assert.deepEqual(class_statics[0], staticsResult[2]);
            });
            it('order by avg_height desc', () => {
                const class_statics = StudentInfoStatics2.findSync({}, { order: '-avg_height' });

                assert.isArray(class_statics);
                assert.equal(class_statics.length, 3);

                assert.deepEqual(class_statics[0], staticsResult[3]);
            });
        });
        
        describe('support limit/offset', () => {
            it('offset = 0, limit = 1', () => {
                const class_statics = StudentInfoStatics2.findSync({}, {
                    offset: 0,
                    limit: 1,
                    order: 'class_no'
                });

                assert.isArray(class_statics);
                assert.equal(class_statics.length, 1);

                assert.deepEqual(class_statics[0], staticsResult[1]);
            });

            it('offset = 1, limit = 1', () => {
                const class_statics = StudentInfoStatics2.findSync({}, {
                    offset: 1,
                    limit: 1,
                    order: 'class_no'
                });

                assert.isArray(class_statics);
                assert.equal(class_statics.length, 1);

                assert.deepEqual(class_statics[0], staticsResult[2]);
            });
        });
    });

    describe("virtual view model doesn't support some opearations", function () {
        before(setup);

        it('cannot sync/drop', () => {
            // no effect, there would be no table created
            StudentInfoStatics2.syncSync({});
            
            var tableExisted = db.driver.ddlSync.hasCollectionSync(db.driver.sqlDriver, 'class_students_statics');
            assert.equal(tableExisted, false);

            var { errMsg } = runProcAndCatch(() => {
                StudentInfoStatics2.dropSync(1);
            });
            assert.deepEqual(errMsg, '');
        });

        // TODO: maybe support virtual model with key properties
        it('cannot get', () => {
            var { errMsg } = runProcAndCatch(() => {
                StudentInfoStatics2.getSync(1);
            });

            assert.equal(errMsg, `operation 'model.get' not supported for virtual model`);
        });

        it('cannot create', () => {
            var { errMsg } = runProcAndCatch(() => {
                StudentInfoStatics2.createSync({});
            });

            assert.equal(errMsg, `operation 'model.create' not supported for virtual model`);
        });

        it('cannot remove', () => {
            var { errMsg } = runProcAndCatch(() => {
                StudentInfoStatics2.where().removeSync({});
            });

            assert.equal(errMsg, `operation 'modelChain.remove' not supported for virtual model`);
        });

        it('cannot clear', () => {
            var { errMsg } = runProcAndCatch(() => {
                StudentInfoStatics2.clearSync({});
            });

            assert.equal(errMsg, `operation 'model.clear' not supported for virtual model`);

            var { errMsg } = runProcAndCatch(() => {
                StudentInfoStatics2.clear(() => {});
            });

            assert.equal(errMsg, `operation 'model.clear' not supported for virtual model`);
        });

        it('cannot .hasOne(...)', () => {
            var { errMsg } = runProcAndCatch(() => {
                StudentInfoStatics2.hasOne('assoc', Class);
            });

            assert.equal(errMsg, `operation 'model.hasOne' not supported for virtual model`);
            
            var { errMsg } = runProcAndCatch(() => {
                Class.hasOne('assoc', StudentInfoStatics2);
            });

            assert.equal(errMsg, `operation 'associated by model.hasOne' not supported for virtual model`);
        });

        it('cannot .hasMany(...)', () => {
            var { errMsg } = runProcAndCatch(() => {
                StudentInfoStatics2.hasMany('assoc', Class);
            });

            assert.equal(errMsg, `operation 'model.hasMany' not supported for virtual model`);
            
            var { errMsg } = runProcAndCatch(() => {
                Class.hasMany('assoc', StudentInfoStatics2);
            });

            assert.equal(errMsg, `operation 'associated by model.hasMany' not supported for virtual model`);
        });

        it('cannot .extendsTo(...)', () => {
            var { errMsg } = runProcAndCatch(() => {
                StudentInfoStatics2.extendsTo('assoc', Class);
            });

            assert.equal(errMsg, `operation 'model.extendsTo' not supported for virtual model`);
        });

        it('instance cannot save', () => {
            var class_statics_item = new StudentInfoStatics2();
            
            var { errMsg } = runProcAndCatch(() => {
                class_statics_item.saveSync();
            });

            assert.equal(errMsg, `operation 'instance.save' not supported for virtual model`);
        });

        it('instance cannot validate', () => {
            var class_statics_item = new StudentInfoStatics2();
            
            var { errMsg } = runProcAndCatch(() => {
                class_statics_item.validateSync();
            });

            assert.equal(errMsg, `operation 'instance.validate' not supported for virtual model`);
        });

        it('instance cannot remove', () => {
            var class_statics = StudentInfoStatics2.findSync({
                class_no: 1
            });

            var class_statics_item = class_statics[0];
            
            var { errMsg } = runProcAndCatch(() => {
                class_statics_item.removeSync();
            });

            assert.equal(errMsg, `operation 'instance.remove' not supported for virtual model`);
        });
    });
});