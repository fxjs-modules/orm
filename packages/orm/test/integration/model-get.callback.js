var _ = require('lodash')
var helper = require('../support/spec_helper')
var common = require('../common')
var ORM = require('../../')
const { lowerCaseColumn } = require('../support/_helpers')
var dbType = common.dbType()

describe('Model.get() - callback', function () {
  var db = null
  var Person = null
  var John

  var setup = function (identityCache) {
    return function (done) {
      Person = db.define('person', {
        name: { type: 'text', mapsTo: 'fullname' }
      }, {
        identityCache: identityCache,
        methods: {
          UID: function () {
            return this[Person.id]
          }
        }
      })

      ORM.singleton.clear() // clear identityCache cache

      return helper.dropSync(Person, function () {
        Person.create([{
          name: 'John Doe'
        }, {
          name: 'Jane Doe'
        }], function (err, people) {
          John = people[0]

          return done()
        })
      })
    }
  }

  before(function (done) {
    helper.connect(function (connection) {
      db = connection

      return done()
    })
  })

  after(function () {
    return db.close()
  })

  describe('mapsTo', function () {
    if (dbType == 'mongodb') return

    before(setup(true))

    it('should create the table with a different column name than property name', function (done) {
      var sql

      if (dbType == 'sqlite') {
        sql = 'PRAGMA table_info(?)'
      } else {
        sql = 'SELECT column_name FROM information_schema.columns WHERE table_name = ?'
      }

      db.driver.execQuery(sql, [Person.table], function (err, data) {
        assert.notExist(err)

        if (dbType === 'mysql') { // support mysql 8.0+
          data = data.map(col => lowerCaseColumn(col));
        }
        var names = _.map(data, dbType == 'sqlite' ? 'name' : 'column_name')

        assert.equal(typeof Person.properties.name, 'object')
        assert.notEqual(names.indexOf('fullname'), -1)

        done()
      })
    })
  })

  describe('with identityCache cache', function () {
    before(setup(true))

    it('should return item with id 1', function (done) {
      Person.get(John[Person.id], function (err, John) {
        assert.equal(err, null)

        assert.isObject(John)
        assert.propertyVal(John, Person.id[0], John[Person.id])
        assert.propertyVal(John, 'name', 'John Doe')

        return done()
      })
    })

    it('should have an UID method', function (done) {
      Person.get(John[Person.id], function (err, John) {
        assert.equal(err, null)

        assert.isFunction(John.UID)
        assert.equal(John.UID(), John[Person.id])

        return done()
      })
    })

    describe('changing name and getting id 1 again', function () {
      it('should return the original object with unchanged name', function (done) {
        Person.get(John[Person.id], function (err, John1) {
          assert.equal(err, null)

          John1.name = 'James'

          Person.get(John[Person.id], function (err, John2) {
            assert.equal(err, null)

            assert.equal(John1[Person.id], John2[Person.id])
            assert.equal(John2.name, 'John Doe')

            return done()
          })
        })
      })
    })

    describe('changing instance.identityCacheSaveCheck = false', function () {
      before(function () {
        Person.settings.set('instance.identityCacheSaveCheck', false)
      })

      it('should return the same object with the changed name', function (done) {
        Person.get(John[Person.id], function (err, John1) {
          assert.equal(err, null)

          John1.name = 'James'

          Person.get(John[Person.id], function (err, John2) {
            assert.equal(err, null)

            assert.equal(John1[Person.id], John2[Person.id])
            assert.equal(John2.name, 'James')

            return done()
          })
        })
      })
    })
  })

  describe('with no identityCache cache', function () {
    before(setup(false))

    describe('fetching several times', function () {
      it('should return different objects', function (done) {
        Person.get(John[Person.id], function (err, John1) {
          assert.equal(err, null)
          Person.get(John[Person.id], function (err, John2) {
            assert.equal(err, null)

            assert.equal(John1[Person.id], John2[Person.id])
            assert.notEqual(John1, John2)

            return done()
          })
        })
      })
    })
  })

  describe('with identityCache cache = 0.5 secs', function () {
    before(setup(0.5))

    describe('fetching again after 0.2 secs', function () {
      it('should return same objects', function (done) {
        Person.get(John[Person.id], function (err, John1) {
          assert.equal(err, null)

          setTimeout(function () {
            Person.get(John[Person.id], function (err, John2) {
              assert.equal(err, null)

              assert.equal(John1[Person.id], John2[Person.id])
              assert.equal(John1, John2)

              return done()
            })
          }, 200)
        })
      })
    })

    describe('fetching again after 0.7 secs', function () {
      it('should return different objects', function (done) {
        Person.get(John[Person.id], function (err, John1) {
          assert.equal(err, null)

          setTimeout(function () {
            Person.get(John[Person.id], function (err, John2) {
              assert.equal(err, null)

              assert.notEqual(John1, John2)

              return done()
            })
          }, 700)
        })
      })
    })
  })

  describe('with empty object as options', function () {
    before(setup())

    it('should return item with id 1 like previously', function (done) {
      Person.get(John[Person.id], {}, function (err, John) {
        assert.equal(err, null)

        assert.isObject(John)
        assert.propertyVal(John, Person.id[0], John[Person.id])
        assert.propertyVal(John, 'name', 'John Doe')

        return done()
      })
    })
  })

  describe('without callback', function () {
    before(setup(true))

    it('should throw', function (done) {
      assert.throws(() => {
        Person.get(John[Person.id])
      })

      return done()
    })
  })

  describe('when not found', function () {
    before(setup(true))

    it('should return an error', function (done) {
      Person.get(999, function (err) {
        assert.isObject(err)
        assert.equal(err.message, 'Not found')

        return done()
      })
    })
  })

  describe('if passed an Array with ids', function () {
    before(setup(true))

    it('should accept and try to fetch', function (done) {
      Person.get([ John[Person.id]], function (err, John) {
        assert.equal(err, null)

        assert.isObject(John)
        assert.propertyVal(John, Person.id[0], John[Person.id])
        assert.propertyVal(John, 'name', 'John Doe')

        return done()
      })
    })
  })

  describe('if passed a wrong number of ids', function () {
    before(setup(true))

    it('should throw', function (done) {
      assert.throws(() => {
        Person.get(1, 2, function () {})
      })

      return done()
    })
  })

  describe('if primary key name is changed', function () {
    before(function (done) {
      Person = db.define('person', {
        name: String
      })

      ORM.singleton.clear()

      return helper.dropSync(Person, function () {
        Person.create([{
          name: 'John Doe'
        }, {
          name: 'Jane Doe'
        }], done)
      })
    })

    it("should search by key name and not 'id'", function (done) {
      db.settings.set('properties.primary_key', 'name')

      var OtherPerson = db.define('person', {
        id: Number
      })

      OtherPerson.get('Jane Doe', function (err, person) {
        assert.equal(err, null)

        assert.equal(person.name, 'Jane Doe')

        return done()
      })
    })
  })

  describe('with a point property type', function () {
    if (common.dbType() == 'mongodb') return
    
    const point = { x: 51.5177, y: -0.0968 };
    function assertPoint(locPoint) {
        assert.property(locPoint, 'x');
        assert.equal(locPoint.x, point.x);
        assert.property(locPoint, 'y');
        assert.equal(locPoint.y, point.y);
    }
    const PersonPhoto = new Buffer(1024) // fake photo
    function assertPhoto(photoBuf) {
        assert.isTrue(Buffer.isBuffer(photoBuf));
        assert.equal(photoBuf.compare(PersonPhoto), 0);
    }

    it('should deserialize the point to { x: number; y: number }', function (done) {
      db.settings.set('properties.primary_key', 'id')

      Person = db.define('person', {
        name: String,
        location: { type: 'point' }
      })

      ORM.singleton.clear()

      return helper.dropSync(Person, function () {
        Person.create({
          name: 'John Doe',
          location: { ...point }
        }, function (err, person) {
          assert.equal(err, null)

          assert.ok(person.location instanceof Object)

          assert.isTrue(person.location instanceof Object);
          assertPoint(person.location);

          Person.get(person.id, (err, pulledPerson) => {
            assert.equal(err, null);

            assertPoint(pulledPerson.location);

            return done();
          });
        })
      })
    })

    it('should deserialize the photo to Buffer', function (done) {
      db.settings.set('properties.primary_key', 'id')

      Person = db.define('person', {
        name: String,
        photo: { type: 'binary' }
      })

      ORM.singleton.clear()

      return helper.dropSync(Person, function () {
        Person.create({
          name: 'John Doe',
          photo: PersonPhoto,
        }, function (err, person) {
          assert.equal(err, null)
          assertPhoto(person.photo);

          Person.get(person.id, (err, pulledPerson) => {
            assert.equal(err, null);

            assertPhoto(pulledPerson.photo);

            return done();
          });
        })
      })
    })
  })
})
