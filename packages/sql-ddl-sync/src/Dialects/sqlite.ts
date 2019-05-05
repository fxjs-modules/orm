import { Queue } from '../Queue';
import SQL = require("../SQL");

// @see https://www.sqlite.org/lang_altertable.html

export const hasCollection: FxOrmSqlDDLSync__Dialect.Dialect['hasCollection'] = function (
	driver, name, cb
) {
	driver.execQuery("SELECT * FROM sqlite_master " +
		"WHERE type = 'table' and name = ?",
		[name],
		function (err: Error, rows) {
			if (err) return cb(err);

			return cb(null, rows.length > 0);
		});
};

export const addPrimaryKey: FxOrmSqlDDLSync__Dialect.Dialect['addPrimaryKey'] = function (
	driver, tableName, columnName, cb
) {
	var sql = "ALTER TABLE ?? ADD CONSTRAINT ?? PRIMARY KEY(??);";
	return driver.execQuery(sql, [tableName, columnName + "PK", columnName], cb);
};

export const dropPrimaryKey: FxOrmSqlDDLSync__Dialect.Dialect['dropPrimaryKey'] = function (
	driver, tableName, columnName, cb
) {
	var sql = "ALTER TABLE ?? DROP CONSTRAINT ??;"
	return driver.execQuery(sql, [tableName, columnName + "PK"], cb);
};

export const addForeignKey: FxOrmSqlDDLSync__Dialect.Dialect['addForeignKey'] = function (
	driver, tableName, options, cb
) {
	var sql = "ALTER TABLE ?? ADD FOREIGN KEY(??) REFERENCES ??(??);";
	return driver.execQuery(sql, [tableName, options.name, options.references.table, options.references.column], cb);
};

export const dropForeignKey: FxOrmSqlDDLSync__Dialect.Dialect['dropForeignKey'] = function (
	driver, tableName, columnName, cb
) {
	var sql = "ALTER TABLE ?? DROP CONSTRAINT ??;"
	return driver.execQuery(sql, [tableName, tableName + "_" + columnName + "_fkey"], cb);
};

export const getCollectionProperties: FxOrmSqlDDLSync__Dialect.Dialect['getCollectionProperties'] = function (
	driver, name, cb
) {
	driver.execQuery("PRAGMA table_info(??)", [name], function (err, cols) {
		if (err) return cb(err);

		var columns = <{ [col: string]: FxOrmSqlDDLSync__Column.PropertySQLite }>{}, m;

		for (let i = 0; i < cols.length; i++) {
			var column = <FxOrmSqlDDLSync__Column.PropertySQLite>{};
			var dCol = cols[i];

			if (dCol.pk) {
				column.key = true;
			}

			if (dCol.notnull) {
				column.required = true;
			}
			if (dCol.dflt_value) {
				m = dCol.dflt_value.match(/^'(.*)'$/);
				if (m) {
					column.defaultValue = m[1];
				} else {
					column.defaultValue = m[0];
				}
			}

			switch (dCol.type.toUpperCase()) {
				case "INTEGER":
					// In sqlite land, integer primary keys are autoincrement by default
					// weather you asked for this behaviour or not.
					// http://www.sqlite.org/faq.html#q1
					if (dCol.pk == 1) {
						column.type = "serial";
					} else {
						column.type = "integer";
					}
					break;
				case "INTEGER UNSIGNED":
					column.type = "boolean";
					break;
				case "REAL":
					column.type = "number";
					column.rational = true;
					break;
				case "DATETIME":
					column.type = "date";
					column.time = true;
					break;
				case "BLOB":
					column.type = "binary";
					column.big = true;
					break;
				case "TEXT":
					column.type = "text";
					break;
				default:
					return cb(new Error("Unknown column type '" + dCol.type + "'"));
			}

			columns[dCol.name] = column;
		}

		return cb(null, columns);
	});
};

export const createCollection: FxOrmSqlDDLSync__Dialect.Dialect['createCollection'] = function (
	driver, name, columns, keys, cb
) {
	return driver.execQuery(SQL.CREATE_TABLE({
		name: name,
		columns: columns,
		keys: keys
	}, driver), cb);
};

export const dropCollection: FxOrmSqlDDLSync__Dialect.Dialect['dropCollection'] = function (
	driver, name, cb
) {
	return driver.execQuery(SQL.DROP_TABLE({
		name: name
	}, driver), cb);
};

export const addCollectionColumn: FxOrmSqlDDLSync__Dialect.Dialect['addCollectionColumn'] = function (
	driver, name, column, after_column, cb
) {
	return driver.execQuery(SQL.ALTER_TABLE_ADD_COLUMN({
		name: name,
		column: column,
		after: after_column
	}, driver), cb);
};

export const renameCollectionColumn: FxOrmSqlDDLSync__Dialect.Dialect['renameCollectionColumn'] = function (
	driver, name,
	oldColName: string,
	newColName: string, cb
) {
	var sql = SQL.ALTER_TABLE_RENAME_COLUMN({
		name: name, oldColName: oldColName, newColName: newColName
	}, driver);

	return driver.execQuery(sql, cb);
};

export const modifyCollectionColumn: FxOrmSqlDDLSync__Dialect.Dialect['modifyCollectionColumn'] = function (
	driver, name, column, cb
) {
	return driver.execQuery(SQL.ALTER_TABLE_MODIFY_COLUMN({
		name: name,
		column: column
	}, driver), cb);
};

export const dropCollectionColumn: FxOrmSqlDDLSync__Dialect.Dialect['dropCollectionColumn'] = function (
	driver, name, column, cb
) {
	// sqlite does not support dropping columns
	return cb();
};

export const getCollectionIndexes: FxOrmSqlDDLSync__Dialect.Dialect['getCollectionIndexes'] = function (
	driver, name, cb
) {
	driver.execQuery("PRAGMA index_list(" + driver.query.escapeId(name) + ")", function (err, rows) {
		if (err) return cb(err);

		var indexes = convertIndexRows(rows);
		var queue = new Queue(function (err) {
			return cb(err, indexes);
		});

		for (let k in indexes) {
			if (k.match(/^sqlite_autoindex/)) {
				delete indexes[k];
				continue;
			}
			queue.add(k, function (k, next) {
				driver.execQuery("PRAGMA index_info(" + driver.query.escapeVal(k) + ")", function (err, rows) {
					if (err) return next(err);

					for (let i = 0; i < rows.length; i++) {
						indexes[k].columns.push(rows[i].name);
					}

					return next();
				});
			});
		}

		return queue.check();
	});
};

export const addIndex: FxOrmSqlDDLSync__Dialect.Dialect['addIndex'] = function (
	driver, name, unique, collection, columns, cb
) {
	return driver.execQuery(SQL.CREATE_INDEX({
		name: name,
		unique: unique,
		collection: collection,
		columns: columns
	}, driver), cb);
};

export const removeIndex: FxOrmSqlDDLSync__Dialect.Dialect['removeIndex'] = function (
	driver, collection, name, cb
) {
	return driver.execQuery("DROP INDEX IF EXISTS " + driver.query.escapeId(name), cb);
};

export const processKeys: FxOrmSqlDDLSync__Dialect.Dialect['processKeys'] = function (keys) {
	if (keys.length === 1) {
		return [];
	}

	return keys;
};

export const supportsType: FxOrmSqlDDLSync__Dialect.Dialect['supportsType'] = function (type) {
	switch (type) {
		case "boolean":
		case "enum":
			return "number";
	}
	return type;
};

export const getType: FxOrmSqlDDLSync__Dialect.Dialect['getType'] = function (
	collection, property: FxOrmSqlDDLSync__Column.PropertySQLite, driver
) {
	var type: false | FxOrmSqlDDLSync__Column.ColumnType_SQLite = false;
	var customType = null;

	if (property.type == 'number' && property.rational === false) {
		property.type = 'integer';
		delete property.rational;
	}

	switch (property.type) {
		case "text":
			type = "TEXT";
			break;
		case "integer":
			type = "INTEGER";
			break;
		case "number":
			type = "REAL";
			break;
		case "serial":
			property.serial = true;
			property.key = true;
			type = "INTEGER";
			break;
		case "boolean":
			type = "INTEGER UNSIGNED";
			break;
		case "datetime":
		case "date":
			type = "DATETIME";
			break;
		case "binary":
		case "object":
			type = "BLOB";
			break;
		case "enum":
			type = "INTEGER";
			break;
		case "point":
			type = "POINT";
			break;
		default:
			customType = driver.customTypes[property.type];
			if (customType) {
				type = customType.datastoreType(property, { collection, driver })
			}
	}

	if (!type) return false;

	if (property.required) {
		type += " NOT NULL";
	}
	if (property.key) {
		if (!property.required) {
			// append if not set
			type += " NOT NULL";
		}
		if (property.serial) {
			type += " PRIMARY KEY";
		}
	}
	if (property.serial) {
		if (!property.key) {
			type += " PRIMARY KEY";
		}
		type += " AUTOINCREMENT";
	}
	if (property.hasOwnProperty("defaultValue")) {
		type += " DEFAULT " + driver.query.escapeVal(property.defaultValue);
	}

	return {
		value: type,
		before: false
	};
};

function convertIndexRows(
	rows: FxOrmSqlDDLSync__Driver.DbIndexInfo_SQLite[]
): {[k: string]: FxOrmSqlDDLSync__Driver.DbIndexInfo_SQLite} {
	var indexes = <{[k: string]: FxOrmSqlDDLSync__Driver.DbIndexInfo_SQLite}>{};

	for (let i = 0; i < rows.length; i++) {
		if (!indexes.hasOwnProperty(rows[i].name)) {
			indexes[rows[i].name] = {
				columns: [],
				// unique: (rows[i].unique == 1)
				unique: rows[i].unique
			};
		}
	}

	return indexes;
}