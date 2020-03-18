var test = require("test");
test.setup();

var common = require('../common');
var helper = require('../support/spec_helper');

describe("Date Type", function () {
    var db = null;
    var Person = null;
    var tz_offset = 0;
    var is_mysql = common.protocol() === 'mysql';

    var setup = function (hooks) {
        return function () {
            Person = db.define("person", {
                name: {
                    type: "text",
                    required: true
                },
                birthday: Date
            });

            return helper.dropSync(Person);
        };
    };

    before(function () {
        db = helper.connect();

        if (is_mysql)
            tz_offset = (new Date(0)).getTimezoneOffset() * 6e4
    });

    after(function () {
        return db.closeSync();
    });

    describe("opt", function () {
        before(setup());

        var birthday_input_for_find = is_mysql ? '1971-08-29 00:00:00' : '1971-08-29T00:00:00Z'
        var birthday_input_between_from = is_mysql ? '1970-08-29 00:00:00' : '1970-08-29T00:00:00Z'
        var birthday_input_between_to = is_mysql ? '2000-08-29 00:00:00' : '2000-08-29T00:00:00Z'

        it("insert", function () {
            var John = Person.createSync({
                name: "John Doe",
                birthday: '1971-08-28T00:00:00Z'
            });

            var who = Person.oneSync({
                name: "John Doe"
            });

            assert.equal(
                who.birthday.getTime() - tz_offset,
                new Date('1971-08-28T00:00:00Z').getTime()
            );
        });

        it("update", function () {
            var John = Person.oneSync({
                name: "John Doe"
            });

            John.birthday = '1971-08-29T00:00:00Z';
            John.saveSync();

            var who = Person.oneSync({
                name: "John Doe"
            });

            assert.equal(
                who.birthday.getTime() - tz_offset,
                new Date('1971-08-29T00:00:00Z').getTime()
            );
        });

        xit('update - where', function () {

        });

        xit('remove - where', function () {

        });

        function assert_found(who) {
            assert.equal(who.name, 'John Doe');
            assert.equal(who.birthday.getTime(), new Date(birthday_input_for_find).getTime());
        }

        it("find", function () {
            var who = Person.oneSync({
                birthday: birthday_input_for_find
            });

            assert_found(who);
        });

        it("find - comps", function () {
            var who = Person.oneSync({
                birthday: db.tools.lte(birthday_input_for_find)
            });
            assert_found(who);

            var who = Person.oneSync({
                birthday: db.tools.gte(birthday_input_for_find)
            });
            assert_found(who);

            var who = Person.oneSync({
                birthday: db.tools.ne(birthday_input_for_find)
            });
            assert.notExist(who);

            var who = Person.oneSync({
                birthday: db.tools.lt(birthday_input_for_find)
            });
            assert.notExist(who);

            var who = Person.oneSync({
                birthday: db.tools.gt(birthday_input_for_find)
            });
            assert.notExist(who);

            var who = Person.oneSync({
                or: [
                    {
                        birthday: db.tools.lt(birthday_input_for_find)
                    },
                    {
                        birthday: db.tools.gt(birthday_input_for_find)
                    }
                ]
            });
            assert.notExist(who);

            var who = Person.oneSync({
                and: [
                    {
                        birthday: db.tools.lt(birthday_input_for_find)
                    },
                    {
                        birthday: db.tools.gt(birthday_input_for_find)
                    }
                ]
            });
            assert.notExist(who);

            var who = Person.oneSync({
                and: [
                    {
                        birthday: db.tools.gt(birthday_input_between_from)
                    },
                    {
                        birthday: db.tools.lt(birthday_input_between_to)
                    }
                ]
            });
            assert_found(who);

            var who = Person.oneSync({
                birthday: db.tools.between(birthday_input_for_find, birthday_input_between_to)
            });
            assert_found(who);
        });

        it("count", function () {
            var count = Person.countSync({
                birthday: birthday_input_for_find
            });

            assert.equal(count, 1);

            var count = Person.countSync({
                birthday: db.tools.ne(birthday_input_for_find)
            });

            assert.equal(count, 0);
        });

        it("aggregate", function () {
            var selects = [ 'id', 'birthday' ];
            
            var rows = Person.aggregate(selects, {
                birthday: birthday_input_for_find
            }).count('id').groupBy(...selects).getSync();

            assert.strictEqual(rows[0].count_id, 1);

            var rows = Person
                .aggregate({
                    birthday: birthday_input_for_find
                })
                .count('id').as('count_$id')
                .groupBy(...selects)
                .min('id').as('min_$id')
                .max('id').as('max_$id')
                .getSync();

            assert.strictEqual(rows[0].count_$id, 1);
            assert.strictEqual(rows[0].min_$id, 1);
            assert.strictEqual(rows[0].max_$id, 1);

            var rows = Person.aggregate(selects, {
                birthday: db.tools.gt(birthday_input_for_find)
            }).count('id').groupBy(...selects).getSync();

            assert.strictEqual(rows.length, 0);

            var [count, min, max] = Person
                .aggregate({
                    birthday: db.tools.gt(birthday_input_for_find)
                })
                .count('id')
                .groupBy(...selects)
                .min('id')
                .max('id')
                .getSync();
            
            assert.strictEqual(rows.length, 0);
        });

        xit('findBy', function () {

        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}