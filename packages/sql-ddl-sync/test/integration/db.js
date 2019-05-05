const test = require('test')
test.setup()

require("should");

var common = require("../common");
var Sync = require('../../').Sync;

// These will fail because autosync has been disabled pending data integrity concerns.

function testOnUseSync (use_force_sync = Math.random(0, 1) > 0.5) {
	var db = null;
	var driver = null;
	var dialect = null;
	var sync = null;

	function prepare () {
		db = common.getORM();
		driver = db.driver;
		dialect = driver.dialect;

		sync    = new Sync({
			driver  : driver,
			debug   : function (text) {
				process.env.DEBUG_SYNC && console.log("> %s", text);
			}
		});

		sync.defineCollection(common.table, {
			id     : { type: "serial", key: true, serial: true },
			name   : { type: "text", required: true },
			age    : { type: "integer" },
			male   : { type: "boolean" },
			born   : { type: "date", time: true },
			born2  : { type: "date" },
			int2   : { type: "integer", size: 2, index: [ "idx1", "idx2" ] },
			int4   : { type: "integer", size: 4 },
			int8   : { type: "integer", size: 8, index: [ "idx2" ] },
			float4 : { type: "number",  size: 4 },
			float8 : { type: "number",  size: 8, index: [ "index" ] },
			photo  : { type: "binary" }
		});
	}
	
	describe(`db: in ${use_force_sync ? 'forceSync' : 'sync'}`, function () {
		before(() => {
			prepare()
			common.dropTable()()
		})

		after(() => {
			db.closeSync()
		})

		describe("Syncing", function () {
			it("should create the table", function (done) {
				sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
					should.not.exist(err);
					should.exist(info);
					info.should.have.property("changes");

					return done();
				});
			});

			it("should have no changes on second call", function (done) {
				sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
					should.not.exist(err);
					should.exist(info);
					info.should.have.property("changes", 0);

					return done();
				});
			});
		});

		if (common.protocol() != "sqlite") {
			describe("Dropping a column", function () {
				before(common.dropColumn('born'));

				it("should recreate it on first call", function (done) {
					sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
						should.not.exist(err);
						should.exist(info);
						if (use_force_sync)
							info.should.have.property("changes", 1);
						else
							info.should.have.property("changes", 0);

						return done();
					});
				});

				it("should have no changes on second call", function (done) {
					sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
						should.not.exist(err);
						should.exist(info);
						info.should.have.property("changes", 0);

						return done();
					});
				});
			});

			describe("Dropping a column that has an index", function () {
				before(common.dropColumn('born2'));

				it("should recreate column and index on first call", function (done) {
					sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
						should.not.exist(err);
						should.exist(info);
						if (use_force_sync)
							// info.should.have.property("changes", 2);
							info.should.have.property("changes", 1);
						else
							info.should.have.property("changes", 0);

						return done();
					});
				});

				it("should have no changes on second call", function (done) {
					sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
						should.not.exist(err);
						should.exist(info);
						info.should.have.property("changes", 0);

						return done();
					});
				});
			});

			describe("Adding a column", function () {
				before(common.addColumn('unknown_col'));

				it("should drop column on first call", function (done) {
					sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
						should.not.exist(err);
						should.exist(info);
						if (use_force_sync)
							info.should.have.property("changes", 1);
						else
							info.should.have.property("changes", 0);

						return done();
					});
				});

				it("should have no changes on second call", function (done) {
					sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
						should.not.exist(err);
						should.exist(info);
						info.should.have.property("changes", 0);

						return done();
					});
				});
			});

			describe("Changing a column", function () {
				before(common.changeColumn('int4'));

				it("should update column on first call", function (done) {
					sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
						should.not.exist(err);
						should.exist(info);
						if (use_force_sync)
							info.should.have.property("changes", 1);
						else
							info.should.have.property("changes", 0);

						return done();
					});
				});

				it("should have no changes on second call", function (done) {
					sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
						should.not.exist(err);
						should.exist(info);
						info.should.have.property("changes", 0);

						return done();
					});
				});
			});
		}

		describe("Adding an index", function () {
			before(common.addIndex(`xpto`, 'int4'));

			it("should drop index on first call", function (done) {
				sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
					should.not.exist(err);
					should.exist(info);
					if (use_force_sync)
						info.should.have.property("changes", 1);
					else
						info.should.have.property("changes", 0);

					return done();
				});
			});

			it("should have no changes on second call", function (done) {
				sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
					should.not.exist(err);
					should.exist(info);
					info.should.have.property("changes", 0);

					return done();
				});
			});
		});

		describe("Dropping an index", function () {
			// before(common.addIndex('idx2', 'int4'));
			after(common.dropIndex('idx2'))

			it("should drop index on first call", function (done) {
				sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
					should.not.exist(err);
					should.exist(info);
					if (use_force_sync)
						info.should.have.property("changes", 0);
					else
						info.should.have.property("changes", 0);

					return done();
				});
			});

			it("should have no changes on second call", function (done) {
				sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
					should.not.exist(err);
					should.exist(info);
					info.should.have.property("changes", 0);

					return done();
				});
			});
		});

		describe("Changing index to unique index", function () {
			before(function (done) {
				common.dropIndex('float8_index')(function () {
					common.addIndex('float8_index', 'float8', true)(done);
				});
			});

			it("should drop index and recreate it on first call", function (done) {
				sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
					should.not.exist(err);
					should.exist(info);
					if (use_force_sync)
						info.should.have.property("changes", 2);
					else
						info.should.have.property("changes", 0);

					return done();
				});
			});

			it("should have no changes on second call", function (done) {
				sync[use_force_sync ? 'forceSync' : 'sync'](function (err, info) {
					should.not.exist(err);
					should.exist(info);
					info.should.have.property("changes", 0);

					return done();
				});
			});
		});
	});
}

testOnUseSync(true);
testOnUseSync(false);

if (require.main === module) {
	test.run(console.DEBUG)
}