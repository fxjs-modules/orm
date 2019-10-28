var common  = require("../common");
var Driver = require("../..").getDriver('sqlite');

describe("Redis", function () {
	var driver;

	var setup = function () {
		return function () {
			driver = Driver.create('redis://127.0.0.1:6379');
		}
	}

	describe("basic operation", () => {
		before(setup());

		it("#open, #ping, #close, re-open", () => {
			driver.open()

			driver.ping()

			driver.close()
		});

		it('#command', () => {
			driver.reopen()

			assert.deepEqual(
				driver.command("set", "test", "aaa").toString(),
				"OK"
			);
			
			assert.deepEqual(
				driver.command("get", "test").toString(),
				"aaa"
			);

			assert.deepEqual(
				driver.command("exists", "test"),
				1
			);

			assert.deepEqual(
				driver.command("type", "test").toString(),
				"string"
			);
		});

		it('#commands', () => {
			driver.reopen()

			const resuls = driver.commands({
				"set": ["test", "aaa"],
				"get": "test",
				"exists": "test",
				"type": "test",
			});

			assert.deepEqual(resuls[0].result.toString(), "OK")
			assert.deepEqual(resuls[1].result.toString(), "aaa")
			assert.deepEqual(resuls[2].result, 1)
			assert.deepEqual(resuls[3].result.toString(), "string")
		});
	})

	describe("#useTrans", () => {
		var result, executed = false
		before(setup());

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