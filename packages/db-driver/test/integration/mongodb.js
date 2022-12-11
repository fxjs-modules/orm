var common  = require("../common");
var Driver = require("../..").Driver.getDriver('mongodb');

describe.skip("MongoDB", function () {
	var driver;
	var DBNAME = 'fxjs-db-driver-test';

	var setupObj = {
		before: function () {
			// driver = Driver.create('mongodb://root:root@127.0.0.1:27017/test');
			driver = Driver.create('mongodb://@127.0.0.1:27017/test');
			driver.open();
			driver.switchDb(DBNAME);
		},
		after: function () {
			driver.close()
		}
	};

	describe("basic operation", () => {
		before(setupObj.before);
		after(setupObj.after);

		it("#open, #ping, #close, re-open", () => {
			driver.open()

			driver.ping()

			driver.close()

			driver.reopen()
		});

		it.skip("#switchDb", () => {
			var name = driver.connection.getName()
			assert.equal(name, DBNAME);

			driver.switchDb('test');

			var name = driver.connection.getName();
			assert.equal(name, 'test');
		});
	})

	describe("database methods", () => {
		before(setupObj.before);
		after(setupObj.after);

		it('#getName', () => {
			
		})
	})

	describe.skip("#useTrans", () => {
		var result, executed = false
		before(setupObj.before);
		after(setupObj.after);

		beforeEach(() => {
			executed = false
		})

		it("normal", () => {
			result = driver.useTrans((conn) => {
				executed = true
			});

			assert.isTrue(executed, true)
			assert.equal(result, undefined)
		});

		it("return number", () => {
			result = driver.useTrans((conn) => {
				executed = true
				return 1
			});

			assert.isTrue(executed, true)
			assert.equal(result, 1)
		});

		it("return object", () => {
			result = driver.useTrans((conn) => {
				executed = true
				return {foo: 'bar'}
			});

			assert.isTrue(executed, true)
			assert.deepEqual(result, {foo: 'bar'})
		});
	});
})