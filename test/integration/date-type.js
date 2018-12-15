var test = require("test");
test.setup();

var helper = require('../support/spec_helper');

describe("Date Type", function () {
    var db = null;
    var Person = null;
    var tz_offset = 0;
    var is_mysql = false;

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

        if (is_mysql = db.driver_name === 'mysql')
            tz_offset = (new Date(0)).getTimezoneOffset() * 6e4
    });

    after(function () {
        return db.closeSync();
    });

    describe("opt", function () {
        before(setup());

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

        it("find", function () {
            var who = Person.oneSync({
                birthday: is_mysql ? 
                    '1971-08-29 00:00:00'
                    :
                    '1971-08-29T00:00:00Z'
            });

            assert.equal(who.name, 'John Doe');
        });
    });
});

if (require.main === module) {
    test.run(console.DEBUG)
    process.exit()
}