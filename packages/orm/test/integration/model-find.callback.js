var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model.find() - callback", function() {
  var db = null;
  var Person = null;

  var setup = function () {
    return function (done) {
      Person = db.define("person", {
        name    : String,
        surname : String,
        age     : Number,
        male    : Boolean
      });

      return helper.dropSync(Person, function () {
        Person.create([{
          name    : "John",
          surname : "Doe",
          age     : 18,
          male    : true
        }, {
          name    : "Jane",
          surname : "Doe",
          age     : 16,
          male    : false
        }, {
          name    : "Jeremy",
          surname : "Dean",
          age     : 18,
          male    : true
        }, {
          name    : "Jack",
          surname : "Dean",
          age     : 20,
          male    : true
        }, {
          name    : "Jasmine",
          surname : "Doe",
          age     : 20,
          male    : false
        }], done);
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

  describe("without arguments", function () {
    before(setup());

    it("should return all items", function (done) {
      Person.find(function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 5);

        return done();
      });
    });
  });

  describe("with a number as argument", function () {
    before(setup());

    it("should use it as limit", function (done) {
      Person.find(2, function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 2);

        return done();
      });
    });
  });

  describe("with a string argument", function () {
    before(setup());

    it("should use it as property ascending order", function (done) {
      Person.find("age", function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 5);
        assert.equal(people[0].age, 16);
        assert.equal(people[4].age, 20);

        return done();
      });
    });

    it("should use it as property descending order if starting with '-'", function (done) {
      Person.find("-age", function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 5);
        assert.equal(people[0].age, 20);
        assert.equal(people[4].age, 16);

        return done();
      });
    });
  });

  describe("with an Array as argument", function () {
    before(setup());

    it("should use it as property ascending order", function (done) {
      Person.find([ "age" ], function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 5);
        assert.equal(people[0].age, 16);
        assert.equal(people[4].age, 20);

        return done();
      });
    });

    it("should use it as property descending order if starting with '-'", function (done) {
      Person.find([ "-age" ], function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 5);
        assert.equal(people[0].age, 20);
        assert.equal(people[4].age, 16);

        return done();
      });
    });

    it("should use it as property descending order if element is 'Z'", function (done) {
      Person.find([ "age", "Z" ], function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 5);
        assert.equal(people[0].age, 20);
        assert.equal(people[4].age, 16);

        return done();
      });
    });

    it("should accept multiple ordering", function (done) {
      Person.find([ "age", "name", "Z" ], function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 5);
        assert.equal(people[0].age, 16);
        assert.equal(people[4].age, 20);

        return done();
      });
    });

    it("should accept multiple ordering using '-' instead of 'Z'", function (done) {
      Person.find([ "age", "-name" ], function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 5);
        assert.equal(people[0].age, 16);
        assert.equal(people[4].age, 20);

        return done();
      });
    });
  });

  describe("with an Object as argument", function () {
    before(setup());

    it("should use it as conditions", function (done) {
      Person.find({ age: 16 }, function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 1);
        assert.equal(people[0].age, 16);

        return done();
      });
    });

    it("should accept comparison objects", function (done) {
      Person.find({ age: ORM.gt(18) }, function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 2);
        assert.equal(people[0].age, 20);
        assert.equal(people[1].age, 20);

        return done();
      });
    });

    describe("with another Object as argument", function () {
      before(setup());

      it("should use it as options", function (done) {
        Person.find({ age: 18 }, 1, { cache: false }, function (err, people) {
          assert.notExist(err);
          assert.isObject(people);
          assert.propertyVal(people, "length", 1);
          assert.equal(people[0].age, 18);

          return done();
        });
      });

      describe("if a limit is passed", function () {
        before(setup());

        it("should use it", function (done) {
          Person.find({ age: 18 }, { limit: 1 }, function (err, people) {
            assert.notExist(err);
            assert.isObject(people);
            assert.propertyVal(people, "length", 1);
            assert.equal(people[0].age, 18);

            return done();
          });
        });
      });

      describe("if an offset is passed", function () {
        before(setup());

        it("should use it", function (done) {
          Person.find({}, { offset: 1 }, "age", function (err, people) {
            assert.notExist(err);
            assert.isObject(people);
            assert.propertyVal(people, "length", 4);
            assert.equal(people[0].age, 18);

            return done();
          });
        });
      });

      describe("if an order is passed", function () {
        before(setup());

        it("should use it", function (done) {
          Person.find({ surname: "Doe" }, { order: "age" }, function (err, people) {
            assert.notExist(err);
            assert.isObject(people);
            assert.propertyVal(people, "length", 3);
            assert.equal(people[0].age, 16);

            return done();
          });
        });

        it("should use it and ignore previously defined order", function (done) {
          Person.find({ surname: "Doe" }, "-age", { order: "age" }, function (err, people) {
            assert.notExist(err);
            assert.isObject(people);
            assert.propertyVal(people, "length", 3);
            assert.equal(people[0].age, 16);

            return done();
          });
        });
      });
    });
  });

  describe("if defined static methods", function () {
    before(setup());

    it("should be rechainable", function (done) {
      Person.over18 = function () {
        return this.find({ age: ORM.gt(18) });
      };
      Person.family = function (family) {
        return this.find({ surname: family });
      };

      Person.over18().family("Doe").run(function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 1);
        assert.equal(people[0].name, "Jasmine");
        assert.equal(people[0].surname, "Doe");

        return done();
      });
    });
  });

  describe("with identityCache disabled", function () {
    before(setup);

    it("should not return singletons", function (done) {
      Person.find({ name: "Jasmine" }, { identityCache: false }, function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 1);
        assert.equal(people[0].name, "Jasmine");
        assert.equal(people[0].surname, "Doe");

        people[0].surname = "Dux";

        Person.find({ name: "Jasmine" }, { identityCache: false }, function (err, people) {
          assert.notExist(err);
          assert.isObject(people);
          assert.propertyVal(people, "length", 1);
          assert.equal(people[0].name, "Jasmine");
          assert.equal(people[0].surname, "Doe");

          return done();
        });
      });
    });
  });

  describe("when using Model.all()", function () {
    before(setup);

    it("should work exactly the same", function (done) {
      Person.all({ surname: "Doe" }, "-age", 1, function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 1);
        assert.equal(people[0].name, "Jasmine");
        assert.equal(people[0].surname, "Doe");

        return done();
      });
    });
  });

  describe("when using Model.where()", function () {
    before(setup);

    it("should work exactly the same", function (done) {
      Person.where({ surname: "Doe" }, "-age", 1, function (err, people) {
        assert.notExist(err);
        assert.isObject(people);
        assert.propertyVal(people, "length", 1);
        assert.equal(people[0].name, "Jasmine");
        assert.equal(people[0].surname, "Doe");

        return done();
      });
    });
  });
});