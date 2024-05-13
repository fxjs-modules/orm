var common  = require("../common");
var Driver = require("../..").Driver.getDriver('psql');

var querystring = require('querystring');

describe("PostgreSQL", function () {
	var driver
	var knex
	var DBNAME = 'fxjs-db-driver-test';

	function getDriver (opts) {
		const { query = {} } = opts || {};
		const ret = { driverInst: null, knexInst: null };

		ret.driverInst = Driver.create([
			`psql://postgres:@localhost:5432`,
			query && querystring.stringify(query),
		].filter(Boolean).join('?'));
		ret.knexInst = common.getKnexInstance(ret.driverInst);

		return ret;
	}

	var setup = function (opts) {
		const { afterSetup } = opts || {};

		return function () {
			const result = getDriver(opts);

			driver = result.driverInst;
			knex = result.knexInst;

			if (typeof afterSetup === 'function') {
				afterSetup({ driver, knex });
			}
		}
	}

	before(() => {
		driver = Driver.create(`psql://postgres:@localhost:5432`);
		driver.open()
		driver.execute(`SELECT 'CREATE DATABASE ${DBNAME}' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DBNAME}');`)
	})

	after(() => {
		driver.execute(`SELECT 'DROP DATABASE ${DBNAME}' WHERE EXISTS (SELECT FROM pg_database WHERE datname = '${DBNAME}');`)
	})

	describe("protocol format", () => {
		// protocol aliases
		;[
			'postgresql:',
			'postgres:',
			'psql:',
			'pg:',
		].forEach((protocol) => {
			it(`alias: ${protocol}`, () => {
				var postgresqlDriver = Driver.create(`${protocol}//postgres:@localhost:5432`);
				assert.equal(postgresqlDriver.type, 'psql');
				assert.equal(postgresqlDriver.uri, 'psql://postgres@localhost:5432');
			})
		})
	});

	describe("basic operation", () => {
		before(setup());
		it("#open, #ping, #close, re-open", () => {
			driver.open()

			driver.ping()

			driver.close()
		});

		it('#execute', () => {
			driver.reopen()

			// driver.switchDb(DBNAME)

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
				).filter(row => row.table_name === 'users').length === 1,
				true,
			);

			// has col `id`
			assert.deepEqual(
				driver.execute(
					knex.schema.hasColumn('users', 'id').toString()
				).filter(row => row.column_name === 'id').length === 1,
				true 
			)

			// has col `created_at`
			assert.deepEqual(
				driver.execute(
					knex.schema.hasColumn('users', 'created_at').toString()
				).filter(row => row.column_name === 'created_at').length === 1,
				true
			)

			// has col `updated_at`
			assert.deepEqual(
				driver.execute(
					knex.schema.hasColumn('users', 'updated_at').toString()
				).filter(row => row.column_name === 'updated_at').length === 1,
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
	});

	describe('searchPath', () => {
		it("default search_path", () => {
			const { driverInst } = getDriver();
			var result = driverInst.execute(`SHOW search_path;`);

			assert.equal(result[0].search_path, '"$user", public');
		});

		it("configure search_path by connection query", () => {
			const { driverInst } = getDriver({
				query: {
					search_path: 'test_sp'
				}
			});
			
			var result = driverInst.execute(`SHOW search_path;`);

			assert.equal(result[0].search_path, 'test_sp');
		});
		
		it("comma separated search_path list", () => {
			const { driverInst } = getDriver({
				query: {
					search_path: 'test_sp, "$user", public'
				}
			});
			
			var result = driverInst.execute(`SHOW search_path;`);

			assert.equal(result[0].search_path, 'test_sp, "$user", public');
		});
	});

	describe("#useTrans", () => {
		before(setup());

		var result, executed = false
		before(() => setup());

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