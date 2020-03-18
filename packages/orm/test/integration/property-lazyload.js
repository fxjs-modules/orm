var helper = require('../support/spec_helper');
var ORM = require('../../');

describe("LazyLoad properties", function () {
    var db = null;
    var Person = null;
    var PersonPhoto = new Buffer(1024); // fake photo
    var OtherPersonPhoto = new Buffer(1024); // other fake photo

    var setup = function () {
        return function () {
            Person = db.define("person", {
                name: String,
                photo: {
                    type: "binary",
                    lazyload: true
                }
            });

            ORM.singleton.clear();

            helper.dropSync(Person, function () {
                Person.createSync({
                    name: "John Doe",
                    photo: PersonPhoto
                });
            });
        };
    };

    before(function () {
        db = helper.connect();
    });

    after(function () {
        return db.closeSync();
    });

    describe("when defined", function () {
        before(setup());

        it("should not be available when fetching an instance", function () {
            var John = Person.find().firstSync();

            assert.isObject(John);

            assert.propertyVal(John, "name", "John Doe");
            assert.propertyVal(John, "photo", null);
        });

        it("should have apropriate accessors", function () {
            var John = Person.find().firstSync();

            assert.isObject(John);
            assert.isFunction(John.getPhoto);
            assert.isFunction(John.setPhoto);
            assert.isFunction(John.removePhoto);
        });

        it("getAccessor should return property", function () {
            var John = Person.find().firstSync();

            assert.isObject(John);

            var photo = John.getPhotoSync();

            assert.equal(photo.toString(), PersonPhoto.toString());
        });

        it("setAccessor should change property", function () {
            var John = Person.find().firstSync();

            assert.isObject(John);

            John.setPhotoSync(OtherPersonPhoto);


            var John = Person.find().firstSync();

            assert.isObject(John);

            var photo = John.getPhotoSync();
            assert.equal(photo.toString(), OtherPersonPhoto.toString());
        });

        it("removeAccessor should change property", function () {
            var John = Person.find().firstSync();

            assert.isObject(John);

            John.removePhotoSync();

            var John = Person.getSync(John[Person.id]);

            assert.isObject(John);

            var photo = John.getPhotoSync();
            assert.equal(photo, null);
        });
    });
});