var helper   = require('../support/spec_helper');

describe("Model.create()", function() {
  var db = null;
  var Pet = null;
  var Person = null;

  var setup = function () {
    return function (done) {
      Person = db.define("person", {
        name   : String
      });
      Pet = db.define("pet", {
        name   : { type: "text", defaultValue: "Mutt" }
      });
      Person.hasMany("pets", Pet);

      return helper.dropSync([ Person, Pet ], done);
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

  describe("if passing an object", function () {
    before(setup());

    it("should accept it as the only item to create", function (done) {
      Person.create({
        name : "John Doe"
      }, function (err, John) {
        assert.equal(err, null);
        assert.propertyVal(John, "name", "John Doe");

        return done();
      });
    });
  });

  describe("if passing an array", function () {
    before(setup());

    it("should accept it as a list of items to create", function (done) {
      Person.create([{
        name : "John Doe"
      }, {
        name : "Jane Doe"
      }], function (err, people) {
        assert.equal(err, null);
        assert.ok(Array.isArray(people));

        assert.propertyVal(people, "length", 2);
        assert.propertyVal(people[0], "name", "John Doe");
        assert.propertyVal(people[1], "name", "Jane Doe");

        return done();
      });
    });
  });

  describe("if element has an association", function () {
    before(setup());

    it("should also create it or save it", function (done) {
      Person.create({
        name : "John Doe",
        pets : [ new Pet({ name: "Deco" }) ]
      }, function (err, John) {
        assert.equal(err, null);

        assert.propertyVal(John, "name", "John Doe");

        assert.ok(Array.isArray(John.pets));

        assert.propertyVal(John.pets[0], "name", "Deco");
        assert.property(John.pets[0], Pet.id[0]);
        assert.isTrue(John.pets[0].saved());

        return done();
      });
    });

    it("should also create it or save it even if it's an object and not an instance", function (done) {
      Person.create({
        name : "John Doe",
        pets : [ { name: "Deco" } ]
      }, function (err, John) {
        assert.equal(err, null);

        assert.propertyVal(John, "name", "John Doe");

        assert.ok(Array.isArray(John.pets));

        assert.propertyVal(John.pets[0], "name", "Deco");
        assert.property(John.pets[0], Pet.id[0]);
        assert.isTrue(John.pets[0].saved());

        return done();
      });
    });
  });

  describe("when not passing a property", function () {
    before(setup());

    it("should use defaultValue if defined", function (done) {
      Pet.create({}, function (err, Mutt) {
        assert.equal(err, null);

        assert.propertyVal(Mutt, "name", "Mutt");

        return done();
      });
    });
  });
});