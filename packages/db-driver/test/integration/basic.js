const test = require('test')
test.setup()

var DBDriver   = require("../..").Driver;

describe("DBDriver", function () {
  describe("helpers", function () {
    it('#formatUrl', () => {
      var configs = [
        {
          protocol : "mysql:",
          hostname : "localhost",
          username : "root",
          port     : 3306,
          password : "",
          pathname : "/mydb",
          slashes: true
        },
        {
          protocol : "mysql://",
          hostname : "localhost",
          username : "root",
          port     : 3306,
          password : "",
          pathname : "/mydb",
          slashes: true
        }
      ];

      configs.forEach((config) => {
        assert.equal(
          DBDriver.formatUrl(config),
          "mysql://root@localhost:3306/mydb"
        )
      });
    })
  });

  describe("exports", function () {
    it("should expose Driver Class", function () {
      assert.exist(DBDriver)
      assert.isFunction(DBDriver);
      assert.isFunction(DBDriver.getDriver);

      assert.isFunction(DBDriver.getDriver('mysql'));
      assert.isFunction(DBDriver.getDriver('sqlite'));
      assert.isFunction(DBDriver.getDriver('postgresql'));
      assert.isFunction(DBDriver.getDriver('redis'));
      assert.isFunction(DBDriver.getDriver('mongodb'));

      assert.equal(DBDriver.getDriver('error'), DBDriver);
    });
  });

  describe("#driver", function () {
    [
      [ 'mysql', 'mysql://user:@localhost:3306/db'     ],
      [ 'postgresql', 'psql://user:@localhost:5432/db'     ],
      [ 'sqlite', 'sqlite:test.db'                      ],
      [ 'redis', 'redis://localhost:6379/db'           ],
      // [ 'mongodb', 'mongodb://localhost:27017/db'       ],
    ].forEach(function ([driverType, driverConnString]) {
      describe(`should expose ${driverType} driver`, function () {
        var driver = new (DBDriver.getDriver(driverType))(driverConnString);

        it(`driver ${driverType} exists`, () => {
          assert.exist(driver);
        });
        
        ;[
          'open',
          'close',
          'ping',
        ]
        .concat(
          driver.isSql ? [
            'switchDb',
            
            'begin',
            'commit',
            'rollback',
            'execute'
          ] : []
        ).concat(
          driver.isCommand ? [
            'command',
            'commands'
          ] : []
        )
        .forEach(driver_func => {
          it(`should be function: ${driver_func}`, () => {
            assert.isFunction(driver[driver_func])
          })
        })
      });
    });
  });
  describe("BaseClass", function () {
    ;[
      [
        '[sqlite] general',
        'sqlite:test-driver.db',
        {
          "protocol": "sqlite:",
          "slashes": false,
          "query": {},
          "database": "test-driver.db",
          "username": null,
          "password": null,
          "host": null,
          "hostname": null,
          "port": null,
          "href": "sqlite:test-driver.db",
          "pathname": "test-driver.db"
        },
        (driver) => {
          assert.deepEqual(driver.extend_config.debug, false)

          assert.deepEqual(driver.extend_config.pool, false)
        }
      ],
      [
        '[sqlite] query:pool',
        'sqlite:test-driver.db?pool=1',
        {
          "protocol": "sqlite:",
          "slashes": false,
          "query": {
            "pool": "1"
          },
          "database": "test-driver.db",
          "username": null,
          "password": null,
          "host": null,
          "hostname": null,
          "port": null,
          "href": "sqlite:test-driver.db?pool=1",
          "pathname": "test-driver.db"
        }
      ],
      [
        '[sqlite] query: deep pool options',
        'sqlite:test-driver.db?pool.maxsize=50&pool.timeout=800',
        {
          "protocol": "sqlite:",
          "slashes": false,
          "query": {
            "pool": {
              maxsize: "50",
              timeout: "800",
            }
          },
          "database": "test-driver.db",
          "username": null,
          "password": null,
          "host": null,
          "hostname": null,
          "port": null,
          "href": "sqlite:test-driver.db?pool.maxsize=50&pool.timeout=800",
          "pathname": "test-driver.db"
        },
        (driver) => {
          assert.deepEqual(driver.extend_config.pool.timeout, 800)
          assert.deepEqual(driver.extend_config.pool.maxsize, 50)
        }
      ],
      [
        '[sqlite] query:debug',
        'sqlite:test-driver.db?debug=y',
        {
          "protocol": "sqlite:",
          "slashes": false,
          "query": {
            "debug": "y"
          },
          "database": "test-driver.db",
          "username": null,
          "password": null,
          "host": null,
          "hostname": null,
          "port": null,
          "href": "sqlite:test-driver.db?debug=y",
          "pathname": "test-driver.db"
        },
        (driver) => {
          assert.deepEqual(driver.extend_config.debug, true)

          assert.deepEqual(driver.extend_config.pool, false)
          assert.deepEqual(driver.uri, "sqlite:test-driver.db")
        }
      ],
      [
        '[sqlite] query:pool=y',
        'sqlite:test-driver.db?pool=y',
        {
          "protocol": "sqlite:",
          "slashes": false,
          "query": {
            "pool": "y"
          },
          "database": "test-driver.db",
          "username": null,
          "password": null,
          "host": null,
          "hostname": null,
          "port": null,
          "href": "sqlite:test-driver.db?pool=y",
          "pathname": "test-driver.db"
        },
        (driver) => {
          assert.deepEqual(driver.extend_config.debug, false)

          assert.deepEqual(driver.extend_config.pool, {
            maxsize: 100,
            timeout: 1000
          })
          assert.deepEqual(driver.uri, "sqlite:test-driver.db")
        }
      ],
      [
        '[sqlite] query:pool=false',
        'sqlite:test-driver.db?pool=false',
        {
          "protocol": "sqlite:",
          "slashes": false,
          "query": {
            "pool": "false"
          },
          "database": "test-driver.db",
          "username": null,
          "password": null,
          "host": null,
          "hostname": null,
          "port": null,
          "href": "sqlite:test-driver.db?pool=false",
          "pathname": "test-driver.db"
        },
        (driver) => {
          assert.deepEqual(driver.extend_config.debug, false)

          assert.deepEqual(driver.extend_config.pool, false)
          assert.deepEqual(driver.uri, "sqlite:test-driver.db")
        }
      ],
      [
        '[mysql] full connection string',
        'mysql://root:123456@localhost:3306/test_tb',
        {
          "protocol": "mysql:",
          "slashes": true,
          "query": {
          },
          "database": "test_tb",
          "username": "root",
          "password": "123456",
          "host": "localhost:3306",
          "hostname": "localhost",
          "port": 3306,
          "href": "mysql://root:123456@localhost:3306/test_tb",
          "pathname": "/test_tb"
        },
        (driver) => {
          assert.deepEqual(driver.extend_config.debug, false)
          assert.deepEqual(driver.extend_config.pool, false)

          assert.deepEqual(driver.uri, "mysql://root:123456@localhost:3306/test_tb")
        }
      ],
      [
        '[mysql] change query:pool',
        'mysql://localhost:3306/test_tb',
        {
          "protocol": "mysql:",
          "slashes": true,
          "query": {
          },
          "database": "test_tb",
          "username": null,
          "password": null,
          "host": "localhost:3306",
          "hostname": "localhost",
          "port": 3306,
          "href": "mysql://localhost:3306/test_tb",
          "pathname": "/test_tb"
        },
        (driver) => {
          assert.deepEqual(driver.extend_config.debug, false)
          assert.deepEqual(driver.extend_config.pool, false)

          driver.extend_config.pool = true

          assert.deepEqual(driver.extend_config.pool.maxsize, 100)
          assert.deepEqual(driver.extend_config.pool.timeout, 1000)

          driver.extend_config.pool = null
          assert.deepEqual(driver.extend_config.pool, false)
        }
      ],
      [
        '[psql] full connection string',
        'psql://postgres:123456@localhost:5432/test_tb',
        {
          "protocol": "psql:",
          "slashes": true,
          "query": {
          },
          "database": "test_tb",
          "username": "postgres",
          "password": "123456",
          "host": "localhost:5432",
          "hostname": "localhost",
          "port": 5432,
          "href": "psql://postgres:123456@localhost:5432/test_tb",
          "pathname": "/test_tb"
        },
        (driver) => {
          assert.deepEqual(driver.extend_config.debug, false)
          assert.deepEqual(driver.extend_config.pool, false)

          assert.deepEqual(driver.uri, "psql://postgres:123456@localhost:5432/test_tb")
        }
      ],
      [
        '[psql] change query:pool',
        'psql://localhost:5432/test_tb',
        {
          "protocol": "psql:",
          "slashes": true,
          "query": {
          },
          "database": "test_tb",
          "username": null,
          "password": null,
          "host": "localhost:5432",
          "hostname": "localhost",
          "port": 5432,
          "href": "psql://localhost:5432/test_tb",
          "pathname": "/test_tb"
        },
        (driver) => {
          assert.deepEqual(driver.extend_config.debug, false)
          assert.deepEqual(driver.extend_config.pool, false)

          driver.extend_config.pool = true

          assert.deepEqual(driver.extend_config.pool.maxsize, 100)
          assert.deepEqual(driver.extend_config.pool.timeout, 1000)

          driver.extend_config.pool = null
          assert.deepEqual(driver.extend_config.pool, false)
        }
      ],
      [
        '[redis] general',
        'redis://127.0.0.1:6379',
        {
          "protocol": "redis:",
          "slashes": true,
          "query": {},
          "database": null,
          "username": null,
          "password": null,
          "host": "127.0.0.1:6379",
          "hostname": "127.0.0.1",
          "port": 6379,
          "href": "redis://127.0.0.1:6379",
          "pathname": null
        },
        (driver) => {
          assert.deepEqual(driver.extend_config.debug, false)

          assert.deepEqual(driver.extend_config.pool, false)
        }
      ],
    ].forEach(([ desc, conn, config, extra_check ]) => {
      it(`property: config -- ${desc}`, function () {
        var driver = new DBDriver(conn)

        assert.property(driver, 'config')

        assert.deepEqual(driver.config, config)

        if (extra_check)
          extra_check(driver);
      });
    })
  });

});

if (require.main === module) {
  test.run(console.DEBUG)
}