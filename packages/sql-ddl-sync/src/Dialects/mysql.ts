/// <reference path="../../@types/index.d.ts" />

import SQL = require("../SQL");

var columnSizes = {
	integer: { 2: 'SMALLINT', 4: 'INTEGER', 8: 'BIGINT' } as {[k: string]: string},
	floating: { 4: 'FLOAT', 8: 'DOUBLE' } as {[k: string]: string}
};

export const hasCollection: FxOrmSqlDDLSync__Dialect.Dialect['hasCollection'] = function (
	driver, name, cb
) {
	driver.execQuery("SHOW TABLES LIKE ?", [name], function (err, rows) {
		if (err) return cb(err);

		return cb(null, rows.length > 0);
	});
};

export const addPrimaryKey: FxOrmSqlDDLSync__Dialect.Dialect['addPrimaryKey'] = function (
	driver, tableName, columnName, cb
) {
	var sql = "ALTER TABLE ?? ADD CONSTRAINT ?? PRIMARY KEY(??);"
	return driver.execQuery(sql, [tableName, columnName + "PK", columnName], cb);
};

export const dropPrimaryKey: FxOrmSqlDDLSync__Dialect.Dialect['dropPrimaryKey'] = function (
	driver, tableName, columnName, cb
) {
	var sql = "ALTER TABLE ?? DROP PRIMARY KEY;";
	return driver.execQuery(sql, [tableName], cb);
};

export const addForeignKey: FxOrmSqlDDLSync__Dialect.Dialect['addForeignKey'] = function (
	driver, tableName, options, cb
) {
	var sql = " ALTER TABLE ?? ADD CONSTRAINT ?? FOREIGN KEY(??) REFERENCES ??(??)";
	return driver.execQuery(sql, [tableName, options.name + "_fk", options.name, options.references.table, options.references.column], cb);
};

export const dropForeignKey: FxOrmSqlDDLSync__Dialect.Dialect['dropForeignKey'] = function (
	driver, tableName, columnName, cb
) {
	var sql = "ALTER TABLE " + tableName + " DROP FOREIGN KEY " + columnName + "_fk;";
	return driver.execQuery(sql, [tableName, columnName + '_fk'], cb);
};

export const getCollectionProperties: FxOrmSqlDDLSync__Dialect.Dialect['getCollectionProperties'] = function (
	driver, name, cb
) {
	driver.execQuery("SHOW COLUMNS FROM ??", [name], function (err, cols: FxOrmSqlDDLSync__Column.PropertyDescriptor__MySQL[]) {
		if (err) return cb(err);

		const columns = <{ [col: string]: FxOrmSqlDDLSync__Column.ColumnInfo }>{};

		for (let i = 0; i < cols.length; i++) {
			let column = <FxOrmSqlDDLSync__Column.Property>{};
			colInfoBuffer2Str(cols[i]);

			if (cols[i].Type.indexOf(" ") > 0) {
				cols[i].SubType = cols[i].Type.substr(cols[i].Type.indexOf(" ") + 1).split(/\s+/);
				cols[i].Type = cols[i].Type.substr(0, cols[i].Type.indexOf(" "));
			}

			// match_result
			let m = cols[i].Type.match(/^(.+)\((\d+)\)$/);
			if (m) {
				cols[i].Size = parseInt(m[2], 10);
				cols[i].Type = m[1];
			}

			if (cols[i].Extra.toUpperCase() == "AUTO_INCREMENT") {
				column.serial = true;
				column.unsigned = true;
			}

			if (cols[i].Key == "PRI") {
				column.primary = true;
			}

			if (cols[i].Null.toUpperCase() == "NO") {
				column.required = true;
			}
			if (cols[i].Default !== null) {
				column.defaultValue = cols[i].Default;
			}

			switch (cols[i].Type.toUpperCase()) {
				case "SMALLINT":
				case "INTEGER":
				case "BIGINT":
				case "INT":
					column.type = "integer";
					column.size = 4; // INT
					for (let k in columnSizes.integer) {
						if (columnSizes.integer[k] == cols[i].Type.toUpperCase()) {
							column.size = k;
							break;
						}
					}
					break;
				case "FLOAT":
				case "DOUBLE":
					column.type = "number";
					column.rational = true;
					for (let k in columnSizes.floating) {
						if (columnSizes.floating[k] == cols[i].Type.toUpperCase()) {
							column.size = k;
							break;
						}
					}
					break;
				case "TINYINT":
					if (cols[i].Size == 1) {
						column.type = "boolean";
					} else {
						column.type = "integer";
					}
					break;
				case "DATETIME":
					column.time = true;
				case "DATE":
					column.type = "date";
					break;
				case "LONGBLOB":
					column.big = true;
				case "BLOB":
					column.type = "binary";
					break;
				case "VARCHAR":
					column.type = "text";
					if (cols[i].Size) {
						column.size = cols[i].Size;
					}
					break;
				default:
					m = cols[i].Type.match(/^enum\('(.+)'\)$/);
					if (m) {
						column.type = "enum";
						column.values = m[1].split(/'\s*,\s*'/);
						break;
					}
					return cb(new Error("Unknown column type '" + cols[i].Type + "'"));
			}

			if (column.serial) {
				column.type = "serial";
			}

			columns[cols[i].Field] = column;
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
		after: after_column,
		first: !after_column
	}, driver), cb);
};

export const renameCollectionColumn: FxOrmSqlDDLSync__Dialect.Dialect['renameCollectionColumn'] = function (
	driver, name, oldColName, newColName, cb
) {
	return cb(new Error("MySQL doesn't support simple column rename"));
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
	return driver.execQuery(SQL.ALTER_TABLE_DROP_COLUMN({
		name: name,
		column: column
	}, driver), cb);
};

export const getCollectionIndexes: FxOrmSqlDDLSync__Dialect.Dialect['getCollectionIndexes'] = function (
	driver, name, cb
) {
	var q = "";
	q += "SELECT index_name, column_name, non_unique ";
	q += "FROM information_schema.statistics ";
	q += "WHERE table_schema = ? AND table_name = ?";

	driver.execQuery(
		q,
		[driver.config.database, name],
		function (err: Error, rows) {
			if (err) return cb(err);

			return cb(null, convertIndexRows(rows));
		}
	);
};

export const addIndex: FxOrmSqlDDLSync__Dialect.Dialect['addIndex'] = function (
	driver, indexName, unique, collection, columns, cb
) {
	return driver.execQuery(SQL.CREATE_INDEX({
		name: indexName,
		unique: unique,
		collection: collection,
		columns: columns
	}, driver), cb);
};

export const removeIndex: FxOrmSqlDDLSync__Dialect.Dialect['removeIndex'] = function (
	driver, collection, name, cb
) {
	return driver.execQuery(SQL.DROP_INDEX({
		name: name,
		collection: collection
	}, driver), cb);
};

export const getType: FxOrmSqlDDLSync__Dialect.Dialect['getType'] = function (
	collection, property, driver
) {
	var type: false | FxOrmSqlDDLSync__Column.ColumnType_MySQL = false;
	var customType: FxOrmSqlDDLSync__Driver.CustomPropertyType = null;

	if (property.type == 'number' && property.rational === false) {
		property.type = 'integer';
		delete property.rational;
	}

	switch (property.type) {
		case "text":
			if (property.big) {
				type = "LONGTEXT";
			} else {
				type = "VARCHAR(" + Math.min(Math.max(parseInt(property.size as any, 10) || 255, 1), 65535) + ")";
			}
			break;
		case "integer":
			type = columnSizes.integer[property.size || 4];
			break;
		case "number":
			type = columnSizes.floating[property.size || 4];
			break;
		case "serial":
			property.type = "number";
			property.serial = true;
			property.key = true;
			type = `INT(${property.size || 11})`;
			break;
		case "boolean":
			type = "TINYINT(1)";
			break;
		case "datetime":
			property.type = "date";
			property.time = true;
		case "date":
			if (!property.time) {
				type = "DATE";
			} else {
				type = "DATETIME";
			}
			break;
		case "binary":
		case "object":
			if (property.big === true) {
				type = "LONGBLOB";
			} else {
				type = "BLOB";
			}
			break;
		case "enum":
			type = "ENUM (" + property.values.map((val: any) => driver.query.escapeVal(val)) + ")";
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
	if (property.serial) {
		if (!property.required) {
			// append if not set
			type += " NOT NULL";
		}
		type += " AUTO_INCREMENT";
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
	rows: FxOrmSqlDDLSync__Driver.DbIndexInfo_MySQL[]
): FxOrmSqlDDLSync__DbIndex.DbIndexInfoHash {
	const indexes = <FxOrmSqlDDLSync__DbIndex.DbIndexInfoHash>{};

	for (let i = 0; i < rows.length; i++) {
		if (rows[i].index_name == 'PRIMARY') {
			continue;
		}
		if (!indexes.hasOwnProperty(rows[i].index_name)) {
			indexes[rows[i].index_name] = {
				columns: [],
				unique: (rows[i].non_unique == 0)
			};
		}

		indexes[rows[i].index_name].columns.push(rows[i].column_name);
	}

	return indexes;
}

function colInfoBuffer2Str (col: FxOrmSqlDDLSync__Column.PropertyDescriptor__MySQL) {
	col.Type += '';
	col.Size += '';
	col.Extra += '';
	col.Key += '';
	col.Null += '';
	col.Default += '';
}