var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("LazyLoad properties - callback", function() {
  var db = null;
  var Person = null;
  var PersonPhoto = new Buffer(1024); // fake photo
  var OtherPersonPhoto = new Buffer(1024); // other fake photo

  var setup = function () {
    return function (done) {
      Person = db.define("person", {
        name   : String,
        photo  : { type: "binary", lazyload: true }
      });

      ORM.singleton.clear();

      return helper.dropSync(Person, function () {
        Person.create({
          name  : "John Doe",
          photo : PersonPhoto
        }, done);
      });
    };
  };

  before(function (done) {
    helper.connect(function (connection) {
      db = connection;

      return done();
    });
  });

  after(function () {
    return db.close();
  });

  describe("when defined", function () {
    before(setup());

    it("should not be available when fetching an instance", function (done) {
      Person.find().first(function (err, John) {
        assert.equal(err, null);

        assert.isObject(John);

        assert.propertyVal(John, "name", "John Doe");
        assert.propertyVal(John, "photo", null);

        return done();
      });
    });

    it("should have apropriate accessors", function (done) {
      Person.find().first(function (err, John) {
        assert.equal(err, null);

        assert.isObject(John);

        assert.isFunction(John.getPhoto);
        assert.isFunction(John.setPhoto);
        assert.isFunction(John.removePhoto);

        return done();
      });
    });

    it("getAccessor should return property", function (done) {
      Person.find().first(function (err, John) {
        assert.equal(err, null);

        assert.isObject(John);
        
        John.getPhoto(function (err, photo) {
          assert.equal(err, null);
          assert.equal(photo.toString(), PersonPhoto.toString());

          return done();
        });
      });
    });

    it("setAccessor should change property", function (done) {
      Person.find().first(function (err, John) {
        assert.equal(err, null);
        assert.isObject(John);

        console.log('here [1]')
        John.setPhoto(OtherPersonPhoto, function (err) {
          assert.equal(err, null);
        console.log('here [2]')

          Person.find().first(function (err, John) {
            assert.equal(err, null);
            assert.isObject(John);

            John.getPhoto(function (err, photo) {
              assert.equal(err, null);
              assert.equal(photo.toString(), OtherPersonPhoto.toString());
              return done();
            });
          });
        });
      });
    });

    it("removeAccessor should change property", function (done) {
      Person.find().first(function (err, John) {
        assert.equal(err, null);
          assert.isObject(John);

          John.removePhoto(function (err) {
            assert.equal(err, null);

            Person.get(John[Person.id], function (err, John) {
              assert.equal(err, null);
              assert.isObject(John);

              John.getPhoto(function (err, photo) {
                assert.equal(err, null);
                assert.equal(photo, null);

                return done();
              });
            });
          });
        });
    });
  });
});