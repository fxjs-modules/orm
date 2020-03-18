var test = require('test')
test.setup()

var _ = require('lodash')
var helper = require('../support/spec_helper')
var ORM = require('../../')
var common = require('../common')
var protocol = common.protocol()

xdescribe('ORM', function () {
  describe('when loaded', function () {
    it('should expose .use() and .connect()', function () {
      assert.isFunction(ORM.connect)
    })

    xit('should expose default settings container', function () {
      assert.isObject(ORM.settings)
      assert.isFunction(ORM.settings.get)
      assert.isFunction(ORM.settings.set)
      assert.isFunction(ORM.settings.unset)
    })

    xit('should expose generic Settings constructor', function () {
      assert.isObject(ORM.Settings)
      assert.isFunction(ORM.Settings.Container)
    })

    xit('should expose singleton manager', function () {
      assert.isObject(ORM.singleton)
      assert.isFunction(ORM.singleton.clear)
    })

    xit('should expose predefined validators', function () {
      assert.isObject(ORM.validators)
      assert.isFunction(ORM.validators.rangeNumber)
      assert.isFunction(ORM.validators.rangeLength)
    })
  })

  describe('ORM.connect()', function () {
    it('should be a function', function () {
      assert.isFunction(ORM.connect)
    })

    it('should throw error with correct message when protocol not supported', function () {
      let errored = false
      try {
        ORM.connect('bd://127.0.0.6')
      } catch (err) {
        errored = true
        assert.exist(err)
        assert.equal(err.message, `Connection protocol not supported - have you installed the database driver for 'bd:'?`)
      }

      assert.isTrue(errored)
    })

    it("should throw error with correct message when connection URL doesn't exist", function () {
      try {
        ORM.connect()
      } catch (err) {
        assert.exist(err)
        assert.equal(err.message, '[driver.config] invalid protocol')
      }
    })

    it('should throw error when passed empty string like connection URL', function () {
      try {
        ORM.connect('')
      } catch (err) {
        assert.exist(err)
        assert.equal(err.message, '[driver.config] invalid protocol')
      }
    })

    it('should throw error when passed string with spaces only', function () {
      try {
        ORM.connect('    ')
      } catch (err) {
        assert.exist(err)
        assert.equal(err.message, '[driver.config] invalid protocol')
      }
    })

    it('should throw error when passed invalid protocol', function () {
      try {
        ORM.connect('user@db')
      } catch (err) {
        assert.exist(err)
        assert.equal(err.message, '[driver.config] invalid protocol')
      }
    })

    it('should throw error when passed unknown protocol', function () {
      try {
        ORM.connect('unknown://db')
      } catch (err) {
        assert.exist(err)
        // assert.equal(err.literalCode, 'NO_SUPPORT')
        assert.equal(err.message, `Connection protocol not supported - have you installed the database driver for 'unknown:'?`)
      }
    })

    it('should throw error when passed invalid connection db link', function () {
      let errored = false
      try {
        ORM.connect('mysql://fakeuser:nopassword@127.0.0.1/unknowndb')
      } catch (err) {
        errored = true
        assert.exist(err)
        assert.equal(err.message, `Access denied for user 'fakeuser'@'localhost' (using password: YES)`)
      }
      assert.isTrue(errored)
    })

    it('should do not mutate opts', function () {
      var opts = {
        protocol: 'mysql',
        query: { pool: true, debug: true },
        username: 'notauser',
        password: 'wrong password',
      }

      var expected = JSON.stringify(opts)

      try {
        ORM.connect(opts)
      } catch (err) {
        assert.equal(
          JSON.stringify(opts),
          expected
        )
      }
    })

    it('should pass successful when opts is OK!', function () {
      const db = ORM.connect(common.getConnectionString())

      assert.exist(db)

      assert.isFunction(db.use)
      assert.isFunction(db.define)
      // assert.isFunction(db.load)

      // assert.isFunction(db.sync)
      // assert.isFunction(db.syncSync)

      // assert.isFunction(db.drop)
      // assert.isFunction(db.dropSync)
    })

    xdescribe('POOL via connect', function () {
      var connStr = null

      beforeEach(function () {
        connStr = common.getConnectionString()
      })

      afterEach(function () {
        connStr = null
      })

      if (protocol !== 'mongodb') {
        it("should understand pool `'false'` from query string", function () {
          var connString = connStr + 'debug=false&pool=false'
          return ORM.connect(connString)
            .then(function (db) {
              should.strictEqual(db.driver.opts.pool, false)
              should.strictEqual(db.driver.opts.debug, false)
            })
        })

        it("should understand pool `'0'` from query string", function () {
          var connString = connStr + 'debug=0&pool=0'
          return ORM.connect(connString)
            .then(function (db) {
              should.strictEqual(db.driver.opts.pool, false)
              should.strictEqual(db.driver.opts.debug, false)
            })
        })

        it("should understand pool `'true'` from query string", function () {
          var connString = connStr + 'debug=true&pool=true'
          return ORM.connect(connString)
            .then(function (db) {
              should.strictEqual(db.driver.opts.pool, true)
              should.strictEqual(db.driver.opts.debug, true)
            })
        })

        it("should understand pool `'true'` from query string", function () {
          var connString = connStr + 'debug=1&pool=1'
          return ORM.connect(connString)
            .then(function (db) {
              should.strictEqual(db.driver.opts.pool, true)
              should.strictEqual(db.driver.opts.debug, true)
            })
        })

        it("should understand pool `'true'` from query string", function () {
          var connCopy = _.cloneDeep(common.getConfig())
          var connOpts = _.extend(connCopy, {
            protocol: common.protocol(),
            query: {
              pool: true, debug: true
            }
          })

          return ORM.connect(connOpts)
            .then(function (db) {
              should.strictEqual(db.driver.opts.pool, true)
              should.strictEqual(db.driver.opts.debug, true)
            })
        })

        it('should understand pool `false` from query options', function () {
          var connCopy = _.cloneDeep(common.getConfig())
          var connOpts = _.extend(connCopy, {
            protocol: common.protocol(),
            query: {
              pool: false, debug: false
            }
          })

          return ORM.connect(connOpts)
            .then(function (db) {
              should.strictEqual(db.driver.opts.pool, false)
              should.strictEqual(db.driver.opts.debug, false)
            })
        })
      }
    })
  })

  xdescribe('ORM.connect()', function () {
    it('should expose .use(), .define(), .sync() and .load()', function (done) {
      var db = ORM.connect()

      assert.isFunction(db.use)
      assert.isFunction(db.define)
      assert.isFunction(db.sync)
      assert.isFunction(db.load)

      return done()
    })

    it('should emit an error if no url is passed', function (done) {
      var db = ORM.connect()

      db.on('connect', function (err) {
        assert.equal(err.message, 'CONNECTION_URL_EMPTY')

        return done()
      })
    })

    xit('should allow protocol alias', function (done) {
      this.timeout(60000)
      var db = ORM.connect('pg://127.0.0.6')

      db.once('connect', function (err) {
        assert.exist(err)
        err.message.should.not.equal('CONNECTION_PROTOCOL_NOT_SUPPORTED')

        return done()
      })
    })

    it('should emit an error if empty url is passed', function (done) {
      var db = ORM.connect('')

      db.on('connect', function (err) {
        assert.equal(err.message, 'CONNECTION_URL_EMPTY')

        return done()
      })
    })

    it('should emit an error if empty url (with only spaces) is passed', function (done) {
      var db = ORM.connect('   ')

      db.on('connect', function (err) {
        assert.equal(err.message, 'CONNECTION_URL_EMPTY')

        return done()
      })
    })

    it('should emit an error if no protocol is passed', function (done) {
      var db = ORM.connect('user@db')

      db.on('connect', function (err) {
        assert.equal(err.message, 'CONNECTION_URL_NO_PROTOCOL')

        return done()
      })
    })

    xit('should emit an error if unknown protocol is passed', function () {
      var db = ORM.connect('unknown://db')

      db.on('connect', function (err) {
        assert.equal(err.literalCode, 'NO_SUPPORT')
        assert.equal(
          err.message,
          'Connection protocol not supported - have you installed the database driver for unknown?'
        )
      })
    })

    it('should emit an error if cannot connect', function () {
      var db = ORM.connect('mysql://fakeuser:nopassword@127.0.0.1/unknowndb')

      db.on('connect', function (err) {
        assert.exist(err)
        assert.equal(err.message.indexOf('Connection protocol not supported'), -1)
        assert.notEqual(err.message, 'CONNECTION_URL_NO_PROTOCOL')
        assert.notEqual(err.message, 'CONNECTION_URL_EMPTY')
      })
    })

    xit('should emit valid error if exception being thrown during connection try', function () {
      var testConfig = {
          protocol: 'mongodb',
          href: 'unknownhost',
          database: 'unknowndb',
          user: '',
          password: ''
        },
        db = ORM.connect(testConfig)

      db.on('connect', function (err) {
        assert.exist(err)
        assert.equal(err.message.indexOf('Connection protocol not supported'), -1)
        assert.notEqual(err.message, 'CONNECTION_URL_NO_PROTOCOL')
        assert.notEqual(err.message, 'CONNECTION_URL_EMPTY')
      })
    })

    it('should not modify connection opts', function (done) {
      var opts = {
        protocol: 'mysql',
        username: 'notauser',
        password: 'wrong password',
        query: { pool: true, debug: true }
      }

      var expected = JSON.stringify(opts)

      ORM.connect(opts, function (err, db) {
        assert.equal(
          JSON.stringify(opts),
          expected
        )
        done()
      })
    })

    it('should emit no error if ok', function (done) {
      var db = ORM.connect(common.getConnectionString())

      db.on('connect', function (err) {
        assert.notExist(err)

        return done()
      })
    })

    it('E-A/S', function () {
      const coroutine = require('coroutine');

      var evt = new coroutine.Event();
      var _conn = null;
      var conn = ORM.connect(common.getConnectionString(), function (err, conn1) {
          evt.set();

          _conn = conn1;
      });
      evt.wait();
      assert.equal(conn, _conn);
    });

    describe('if no connection error', function () {
      var db = null

      before(function (done) {
        helper.connect(function (connection) {
          db = connection

          return done()
        })
      })

      after(function () {
        return db.close()
      })

      it('should be able to ping the server', function (done) {
        db.ping(function () {
          return done()
        })
      })

      it('should be able to pingSync the server', function () {
        return db.pingSync()
      })
    })

    describe('if callback is passed', function () {
      it('should return an error if empty url is passed', function (done) {
        ORM.connect('', function (err) {
          assert.equal(err.message, 'CONNECTION_URL_EMPTY')

          return done()
        })
      })

      it('should return an error if no protocol is passed', function (done) {
        ORM.connect('user@db', function (err) {
          assert.equal(err.message, 'CONNECTION_URL_NO_PROTOCOL')

          return done()
        })
      })

      it('should return an error if unknown protocol is passed', function (done) {
        ORM.connect('unknown://db', function (err) {
          assert.equal(err.literalCode, 'NO_SUPPORT')
          assert.equal(
            err.message,
            'Connection protocol not supported - have you installed the database driver for unknown?'
          )

          return done()
        })
      })
    })
  })

  xdescribe('ORM.use()', function () {
    xit('should be able to use an established connection', function (done) {
      var db = new sqlite.Database(':memory:')

      ORM.use(db, 'sqlite', function (err) {
        assert.notExist(err)

        return done()
      })
    })

    xit('should be accept protocol alias', function (done) {
      var db = new pg.Client()

      ORM.use(db, 'pg', function (err) {
        assert.equal(err, null)

        return done()
      })
    })

    xit('should return an error in callback if protocol not supported', function (done) {
      var db = new pg.Client()

      ORM.use(db, 'unknowndriver', function (err) {
        assert.exist(err)

        return done()
      })
    })
  })
})

if (require.main === module) {
  test.run(console.DEBUG)
  process.exit()
}
