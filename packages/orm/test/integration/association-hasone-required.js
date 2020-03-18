var ORM = require('../../');
var helper = require('../support/spec_helper');

describe("hasOne", function () {
    var db = null;
    var Person = null;

    var setup = function (required) {
        return function () {
            db.settings.set('instance.identityCache', false);
            db.settings.set('instance.returnAllErrors', true);

            Person = db.define('person', {
                name: String
            });
            Person.hasOne('parent', Person, {
                required: required,
                field: 'parentId'
            });

            helper.dropSync(Person);
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    describe("required", function () {
        before(setup(true));

        it("should not accept empty association", function () {
            var John = new Person({
                name: "John",
                parentId: null
            });
            try {
                John.saveSync();
            } catch (errors) {
                assert.equal(errors.length, 1);
                assert.equal(errors[0].type, 'validation');
                assert.equal(errors[0].msg, 'required');
                assert.equal(errors[0].property, 'parentId');
            }
        });

        it("should accept association", function () {
            var John = new Person({
                name: "John",
                parentId: 1
            });
            John.saveSync();
        });
    });

    describe("not required", function () {
        before(setup(false));

        it("should accept empty association", function () {
            var John = new Person({
                name: "John"
            });
            John.saveSync();
        });

        it("should accept null association", function () {
            var John = new Person({
                name: "John",
                parent_id: null
            });
            John.saveSync();
        });
    });
});