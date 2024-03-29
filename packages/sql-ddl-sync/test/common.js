const FxOrmCore = require('@fxjs/orm-core')
const { addSqlQueryDialect, getAllSqlQueryDialects } = require('../lib/Utils');

exports.testdb = 'sql-ddl-sync-test';
exports.dialect = null;
exports.table   = "sql_ddl_sync_test_table";
const Dialects = getAllSqlQueryDialects();

addSqlQueryDialect('fake', {
	escapeId  : function (id) {
		return "$$" + id + "$$";
	},
	escapeVal : function (val) {
		return "^^" + val + "^^";
	}
});

exports.fakeDriver = {
	type: 'fake',
	customTypes: {
		json: {
			datastoreType: function (prop, opts) {
				return prop.type.toUpperCase();
			}
		}
	}
};

exports.createDatabase = function (database = exports.testdb) {
	return function (done) {
		switch (exports.dbdriver.type) {
			case "mysql":
				exports.dbdriver.execute(
					Dialects[exports.dbdriver.type].escape(
						'CREATE DATABASE IF NOT EXISTS ??', [ database ]
					)
				);
				exports.dbdriver.switchDb(database);
				return done();
			case "psql":
				if (!exports.dbdriver.dbExists(database)) {
					exports.dbdriver.execute(
						Dialects[exports.dbdriver.type].escape(
							`CREATE DATABASE ??`,
							[ database ]
						)
					);
				}
				exports.dbdriver.switchDb(database);
				return done();
			case "sqlite": return done();
		}
		return done(unknownProtocol());
	};
};

exports.dropDatabase = function (database = exports.testdb) {
	return function (done) {
		switch (exports.dbdriver.type) {
			case "mysql":
				exports.dbdriver.execute(
					Dialects[exports.dbdriver.type].escape(
						'DROP DATABASE IF EXISTS ??', [ exports.testdb ]
					)
				);
				return done();
			case "psql":
				if (exports.dbdriver.dbExists(database)) {
					exports.dbdriver.execute(
						Dialects[exports.dbdriver.type].escape(
							`DROP DATABASE ??`,
							[ database ]
						)
					);
				}
				return done();
			case "sqlite": return done();
		}
		return done(unknownProtocol());
	};
};

exports.dropColumn = function (column) {
	return function (done) {
		switch (exports.dbdriver.type) {
			case "mysql":
			case "psql":
				exports.dbdriver.execute(
					Dialects[exports.dbdriver.type].escape(
						"ALTER TABLE ?? DROP ??", [ exports.table, column ]
					)
				);
				return done();
		}
		return done(unknownProtocol());
	};
};

exports.addColumn = function (column) {
	return function (done) {
		switch (exports.dbdriver.type) {
			case "mysql":
				var exposedErrResult = FxOrmCore.catchBlocking(
					() => exports.dbdriver.execute(
						Dialects[exports.dbdriver.type].escape(
							"ALTER TABLE ?? ADD ?? INTEGER NOT NULL", [ exports.table, column ]
						)
					)
				)
				return FxOrmCore.takeAwayResult(exposedErrResult, { no_throw: true, callback: done })
			case "psql":
				var exposedErrResult = FxOrmCore.catchBlocking(
					() => exports.dbdriver.execute(
						Dialects[exports.dbdriver.type].escape(
							"ALTER TABLE " + exports.table + " ADD " + column + " INTEGER NOT NULL"
						)
					)
				)
				return FxOrmCore.takeAwayResult(exposedErrResult, { no_throw: true, callback: done })
			case "sqlite":
				var exposedErrResult = FxOrmCore.catchBlocking(
					() => exports.dbdriver.execute(
						Dialects[exports.dbdriver.type].escape(
							"ALTER TABLE " + exports.table + " ADD " + column + " INTEGER"
						)
					)
				)
				return FxOrmCore.takeAwayResult(exposedErrResult, { no_throw: true, callback: done })
		}
		return done(unknownProtocol());
	};
};

exports.changeColumn = function (column) {
	return function (done) {
		switch (exports.dbdriver.type) {
			case "mysql":
				exports.dbdriver.execute(
					Dialects[exports.dbdriver.type].escape(
						"ALTER TABLE ?? MODIFY ?? INTEGER NOT NULL", [ exports.table, column ]
					)
				);
				return done();
			case "psql":
				exports.dbdriver.execute(
					Dialects[exports.dbdriver.type].escape(
						"ALTER TABLE " + exports.table + " ALTER " + column + " TYPE DOUBLE PRECISION"
					)
				);
				return done();
			case "sqlite":
				exports.dbdriver.execute(
					Dialects[exports.dbdriver.type].escape(
						"ALTER TABLE " + exports.table + " MODIFY " + column + " INTEGER NOT NULL"
					)
				);
				return done();
		}
		return done(unknownProtocol());
	};
};

exports.addIndex = function (name, column, unique) {
	return function (done) {
		switch (exports.dbdriver.type) {
			case "mysql":
				exports.dbdriver.execute(
					Dialects[exports.dbdriver.type].escape(
						"CREATE " + (unique ? "UNIQUE" : "") + " INDEX ?? ON ?? (??)", [ name, exports.table, column ]
					)
				);
				return done();
			case "psql":
				exports.dbdriver.execute(
					Dialects[exports.dbdriver.type].escape(
						"CREATE " + (unique ? "UNIQUE" : "") + " INDEX " + exports.table + "_" + name + " ON " + exports.table + " (" + column + ")"
					)
				);
				return done();
			case "sqlite":
				exports.dbdriver.execute(
					Dialects[exports.dbdriver.type].escape(
						"CREATE " + (unique ? "UNIQUE" : "") + " INDEX " + name + " ON " + exports.table + " (" + column + ")"
					)
				);
				return done();
		}
		return done(unknownProtocol());
	};
};

exports.dropIndex = function (name) {
	return function (done) {
		switch (exports.dbdriver.type) {
			case "mysql":
				var exposedErrResult = FxOrmCore.catchBlocking(
					() => exports.dbdriver.execute(
						Dialects[exports.dbdriver.type].escape(
							"DROP INDEX ?? ON ??", [ name, exports.table ]
						)
					)
				)
				return FxOrmCore.takeAwayResult(exposedErrResult, { no_throw: true, callback: done })
			case "psql":
				var exposedErrResult = FxOrmCore.catchBlocking(
					() => exports.dbdriver.execute(
						Dialects[exports.dbdriver.type].escape(
							"DROP INDEX " + exports.table + "_" + name
						)
					)
				)
				return FxOrmCore.takeAwayResult(exposedErrResult, { no_throw: true, callback: done })
			case "sqlite":
				var exposedErrResult = FxOrmCore.catchBlocking(
					() => exports.dbdriver.execute(
						Dialects[exports.dbdriver.type].escape(
							"DROP INDEX " + name
						)
					)
				)
				return FxOrmCore.takeAwayResult(exposedErrResult, { no_throw: true, callback: done })
		}
		return done(unknownProtocol());
	};
};

exports.dropTable = function (names = exports.table) {
	return function (done) {
		if (!Array.isArray(names))
			names = [names]

		names.forEach(name => {
			exports.dbdriver.execute(
				Dialects[exports.dbdriver.type].escape(
					"DROP TABLE IF EXISTS ??", [name]
				)
			);
		});
		return done();
	};
}

function unknownProtocol() {
	return new Error("Unknown protocol - " + exports.dbdriver.type);
}
