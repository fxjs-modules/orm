var common  = require("../common");
var Driver = require("../..").getDriver('sqlite');

describe("SQLite", function () {
	var driver;
	var knex;

	var setup = function () {
		return function () {
			driver = Driver.create('sqlite:test-driver.db');
			knex = common.getKnexInstance(driver, { useNullAsDefault: true });
		}
	}
	
	describe("basic operation", () => {
		before(setup());

		it("#open, #ping, #close, re-open", () => {
			driver.open()

			driver.ping()

			driver.close()
		});

		it('#execute', () => {
			driver.reopen()

			driver.execute(
				knex.schema.dropTableIfExists('users').toString()
			)

			assert.deepEqual(
				driver.execute(
					knex.schema.createTable('users', function (table) {
						table.increments();
						table.string('name');
						table.timestamps();
					}).toString()
				),
				[]
			);

			// has table `users`
			assert.deepEqual(
				driver.execute(
					knex.schema.hasTable('users').toString()
				).filter(row => row.name === 'users').length === 1,
				true,
			);

			// has col `id`
			assert.deepEqual(
				driver.execute(
					knex.schema.hasColumn('users', 'id').toString()
				).filter(row => row.name === 'id').length === 1,
				true
			)

			// has col `created_at`
			assert.deepEqual(
				driver.execute(
					knex.schema.hasColumn('users', 'created_at').toString()
				).filter(row => row.name === 'created_at').length === 1,
				true
			)

			// has col `updated_at`
			assert.deepEqual(
				driver.execute(
					knex.schema.hasColumn('users', 'updated_at').toString()
				).filter(row => row.name === 'updated_at').length === 1,
				true
			)

			// now drop table `users`
			assert.deepEqual(
				driver.execute(
					knex.schema.dropTable('users').toString()
				),
				[]
			)
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