var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("Model keys option", function () {
    var db = null;

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.close();
    });

    xdescribe("if model id is a property", function () {
        var Person = null;

        before(function () {
            Person = db.define("person", {
                uid: String,
                name: String,
                surname: String
            }, {
                id: "uid"
            });

            return helper.dropSync(Person);
        });

        it("should not auto increment IDs", function () {
            var JohnDoe = Person.create({
                uid: "john-doe",
                name: "John",
                surname: "Doe"
            });

            assert.equal(JohnDoe.uid, "john-doe");
            assert.notProperty(JohnDoe, "id");
        });
    });

    xdescribe("if model defines several keys", function () {
        var DoorAccessHistory = null;

        before(function () {
            DoorAccessHistory = db.define("door_access_history", {
                year: {
                    type: 'integer'
                },
                month: {
                    type: 'integer'
                },
                day: {
                    type: 'integer'
                },
                user: String,
                action: ["in", "out"]
            }, {
                id: ["year", "month", "day"]
            });

            return helper.dropSync(DoorAccessHistory, function () {
                DoorAccessHistory.create([{
                        year: 2013,
                        month: 7,
                        day: 11,
                        user: "dresende",
                        action: "in"
                    },
                    {
                        year: 2013,
                        month: 7,
                        day: 12,
                        user: "dresende",
                        action: "out"
                    }
                ]);
            });
        });

        it("should make possible to get instances based on all keys", function () {
            var HistoryItem = DoorAccessHistory.get(2013, 7, 11);

            assert.equal(HistoryItem.year, 2013);
            assert.equal(HistoryItem.month, 7);
            assert.equal(HistoryItem.day, 11);
            assert.equal(HistoryItem.user, "dresende");
            assert.equal(HistoryItem.action, "in");
        });

        it("should make possible to remove instances based on all keys", function () {
            var HistoryItem = DoorAccessHistory.get(2013, 7, 12);

            HistoryItem.removeSync();

            var exists = DoorAccessHistory.exists(2013, 7, 12);
            assert.isFalse(exists);
        });
    });
});