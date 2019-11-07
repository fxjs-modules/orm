/// <reference path="../../@types/index.d.ts" />

import FxORMCore = require("@fxjs/orm-core");
import SQL = require("../SQL");
import { getSqlQueryDialect, arraify, filterPropertyDefaultValue } from '../Utils';

const columnSizes = {
	integer: {
		2: 'SMALLINT', 4: 'INTEGER', 8: 'BIGINT'
	} as {[k: string]: string},
	floating: {
		4: 'FLOAT',
		8: 'DOUBLE'
	} as {[k: string]: string}
};

export const hasCollectionSync: FxOrmSqlDDLSync__Dialect.Dialect['hasCollectionSync'] = function (
	dbdriver, name
): boolean {
	const rows = dbdriver.execute(
		getSqlQueryDialect('mysql').escape(
			"SHOW TABLES LIKE ?", [name]
		)
	)
	return rows.length > 0;
};

export const hasCollection: FxOrmSqlDDLSync__Dialect.Dialect['hasCollection'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => hasCollectionSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const addPrimaryKeySync: FxOrmSqlDDLSync__Dialect.Dialect['addPrimaryKeySync'] = function (
	dbdriver, tableName, columnName
) {
	return dbdriver.execute(
		getSqlQueryDialect('mysql').escape(
			"ALTER TABLE ?? ADD CONSTRAINT ?? PRIMARY KEY(??);",
			[tableName, columnName + "PK", columnName]
		)
	)
};

export const addPrimaryKey: FxOrmSqlDDLSync__Dialect.Dialect['addPrimaryKey'] = function (
	dbdriver, tableName, columnName, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addPrimaryKeySync(dbdriver, tableName, columnName)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const dropPrimaryKeySync: FxOrmSqlDDLSync__Dialect.Dialect['dropPrimaryKeySync'] = function (
	dbdriver, tableName, columnName
) {
	return dbdriver.execute(
		getSqlQueryDialect('mysql').escape(
			"ALTER TABLE ?? DROP PRIMARY KEY;",
			[tableName]
		)
	)
};

export const dropPrimaryKey: FxOrmSqlDDLSync__Dialect.Dialect['dropPrimaryKey'] = function (
	dbdriver, tableName, columnName, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => dropPrimaryKeySync(dbdriver, tableName, columnName)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const addForeignKeySync: FxOrmSqlDDLSync__Dialect.Dialect['addForeignKeySync'] = function (
	dbdriver, tableName, options
) {
	return dbdriver.execute(
		getSqlQueryDialect('mysql').escape(
			"ALTER TABLE ?? ADD CONSTRAINT ?? FOREIGN KEY(??) REFERENCES ??(??)",
			[tableName, options.name + "_fk", options.name, options.references.table, options.references.column]
		)
	)
};

export const addForeignKey: FxOrmSqlDDLSync__Dialect.Dialect['addForeignKey'] = function (
	dbdriver, tableName, options, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addForeignKeySync(dbdriver, tableName, options)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const dropForeignKeySync: FxOrmSqlDDLSync__Dialect.Dialect['dropForeignKeySync'] = function (
	dbdriver, tableName, columnName
) {
	return dbdriver.execute(
		getSqlQueryDialect('mysql').escape(
			`ALTER TABLE ?? DROP FOREIGN KEY ??;`,
			[tableName, columnName + '_fk']
		)
	)
};

export const dropForeignKey: FxOrmSqlDDLSync__Dialect.Dialect['dropForeignKey'] = function (
	dbdriver, tableName, columnName, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => dropForeignKeySync(dbdriver, tableName, columnName)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const getCollectionColumnsSync: FxOrmSqlDDLSync__Dialect.Dialect['getCollectionColumnsSync'] = function (
	dbdriver, name
) {
	return dbdriver.execute(
		getSqlQueryDialect('mysql').escape(
			"SHOW COLUMNS FROM ??", [name]
		)
	)
}

export const getCollectionColumns: FxOrmSqlDDLSync__Dialect.Dialect['getCollectionColumns'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => getCollectionColumnsSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const getCollectionPropertiesSync: FxOrmSqlDDLSync__Dialect.Dialect['getCollectionPropertiesSync'] = function (
	dbdriver, name
) {

	const cols: FxOrmSqlDDLSync__Column.ColumnInfo__MySQL[] = getCollectionColumnsSync(dbdriver, name)

	const columns = <{ [col: string]: FxOrmSqlDDLSync__Column.Property }>{};

	for (let i = 0; i < cols.length; i++) {
		let column = <FxOrmSqlDDLSync__Column.Property>{};
		const colInfo = cols[i];
		colInfoBuffer2Str(colInfo);

		let Type = colInfo.Type + ''
		if (Type.indexOf(" ") > 0) {
			colInfo.SubType = Type.substr(Type.indexOf(" ") + 1).split(/\s+/);
			Type = Type.substr(0, Type.indexOf(" "));
		}

		// match_result
		let [_, _type, _size] = Type.match(/^(.+)\((\d+)\)$/) || [] as any[];
		if (_) {
			colInfo.Size = parseInt(_size, 10);
			Type = _type;
		}

		if (colInfo.Extra.toUpperCase() == "AUTO_INCREMENT") {
			column.serial = true;
			column.unsigned = true;
		}

		if (colInfo.Key == "PRI") {
			column.primary = true;
		}

		if (colInfo.Null.toUpperCase() == "NO") {
			column.required = true;
		}
		if (colInfo.Default !== "null") {
			column.defaultValue = colInfo.Default;
		}

		switch (Type.toUpperCase()) {
			case "SMALLINT":
			case "INTEGER":
			case "BIGINT":
			case "INT":
				column.type = "integer";
				column.size = 4; // INT
				for (let k in columnSizes.integer) {
					if (columnSizes.integer[k] == Type.toUpperCase()) {
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
					if (columnSizes.floating[k] == Type.toUpperCase()) {
						column.size = k;
						break;
					}
				}
				break;
			case "TINYINT":
				if (colInfo.Size == 1) {
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
				if (colInfo.Size) {
					column.size = colInfo.Size;
				}
				break;
			case "TEXT":
				column.type = "text";
				break;
			case "POINT":
				column.type = "point";
				break;
			default:
				let [_2, _enum_value_str] = Type.match(/^enum\('(.+)'\)$/) || [] as any;
				if (_2) {
					column.type = "enum";
					column.values = _enum_value_str.split(/'\s*,\s*'/);
					break;
				}
				throw new Error(`Unknown column type '${Type}'`);
		}

		if (column.serial) {
			column.type = "serial";
		}

		columns[colInfo.Field] = column;
	}

	return columns;
};

export const getCollectionProperties: FxOrmSqlDDLSync__Dialect.Dialect['getCollectionProperties'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => getCollectionPropertiesSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const createCollectionSync: FxOrmSqlDDLSync__Dialect.Dialect['createCollectionSync'] = function (
	dbdriver, name, columns, keys
) {
	return dbdriver.execute(
		SQL.CREATE_TABLE({
			name: name,
			columns: columns,
			keys: keys
		}, 'mysql')
	)
};

export const createCollection: FxOrmSqlDDLSync__Dialect.Dialect['createCollection'] = function (
	dbdriver, name, columns, keys, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => createCollectionSync(dbdriver, name, columns, keys)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const dropCollectionSync: FxOrmSqlDDLSync__Dialect.Dialect['dropCollectionSync'] = function (
	dbdriver, name
) {
	return dbdriver.execute(
		SQL.DROP_TABLE({ name: name }, 'mysql')
	)
};

export const dropCollection: FxOrmSqlDDLSync__Dialect.Dialect['dropCollection'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => dropCollectionSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const hasCollectionColumnsSync: FxOrmSqlDDLSync__Dialect.Dialect['hasCollectionColumnsSync'] = function (
	dbdriver, name, column
) {
	const columns = arraify(column)
	let res = null, has = false
	try {
		has = columns.every(
			column =>
				(res = dbdriver.execute(
					SQL.CHECK_TABLE_HAS_COLUMN({
						name: name,
						column: column,
					}, 'mysql')
				)) && !!(res && res.length)
		)
	} catch (error) {
		has = false
	}

	return has
};

export const hasCollectionColumns: FxOrmSqlDDLSync__Dialect.Dialect['hasCollectionColumns'] = function (
	dbdriver, name, column, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => hasCollectionColumnsSync(dbdriver, name, column)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const addCollectionColumnSync: FxOrmSqlDDLSync__Dialect.Dialect['addCollectionColumnSync'] = function (
	dbdriver, name, column, after_column
) {
	return dbdriver.execute(
		SQL.ALTER_TABLE_ADD_COLUMN({
			name: name,
			column: column,
			after: after_column,
			first: !after_column
		}, 'mysql')
	)
};

export const addCollectionColumn: FxOrmSqlDDLSync__Dialect.Dialect['addCollectionColumn'] = function (
	dbdriver, name, column, after_column, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addCollectionColumnSync(dbdriver, name, column, after_column)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const renameCollectionColumnSync: FxOrmSqlDDLSync__Dialect.Dialect['renameCollectionColumnSync'] = function (
	dbdriver, name, oldColName, newColName
) {
	throw new Error("MySQL doesn't support simple column rename");
};

export const renameCollectionColumn: FxOrmSqlDDLSync__Dialect.Dialect['renameCollectionColumn'] = function (
	dbdriver, name, oldColName, newColName, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => renameCollectionColumnSync(dbdriver, name, oldColName, newColName)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const modifyCollectionColumnSync: FxOrmSqlDDLSync__Dialect.Dialect['modifyCollectionColumnSync'] = function (
	dbdriver, name, column
) {
	return dbdriver.execute(
		SQL.ALTER_TABLE_MODIFY_COLUMN({
			name: name,
			column: column
		}, 'mysql')
	)
};

export const modifyCollectionColumn: FxOrmSqlDDLSync__Dialect.Dialect['modifyCollectionColumn'] = function (
	dbdriver, name, column, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => modifyCollectionColumnSync(dbdriver, name, column)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const dropCollectionColumnSync: FxOrmSqlDDLSync__Dialect.Dialect['dropCollectionColumnSync'] = function (
	dbdriver, name, column
) {
	return dbdriver.execute(
		SQL.ALTER_TABLE_DROP_COLUMN({
			name: name,
			column: column
		}, 'mysql')
	)
};

export const dropCollectionColumn: FxOrmSqlDDLSync__Dialect.Dialect['dropCollectionColumn'] = function (
	dbdriver, name, column, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => dropCollectionColumnSync(dbdriver, name, column)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const getCollectionIndexesSync: FxOrmSqlDDLSync__Dialect.Dialect['getCollectionIndexesSync'] = function (
	dbdriver, name
) {
	const rows = dbdriver.execute(
		getSqlQueryDialect('mysql').escape(
			[
				"SELECT index_name, column_name, non_unique ",
				"FROM information_schema.statistics ",
				"WHERE table_schema = ? AND table_name = ?",
			].join(''),
			[dbdriver.config.database, name]
		)
	)

	return convertIndexRows(rows);
};

export const getCollectionIndexes: FxOrmSqlDDLSync__Dialect.Dialect['getCollectionIndexes'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => getCollectionIndexesSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const addIndexSync: FxOrmSqlDDLSync__Dialect.Dialect['addIndexSync'] = function (
	dbdriver, indexName, unique, collection, columns
) {
	return dbdriver.execute(
		SQL.CREATE_INDEX({
			name: indexName,
			unique: unique,
			collection: collection,
			columns: columns
		}, 'mysql')
	)
};

export const addIndex: FxOrmSqlDDLSync__Dialect.Dialect['addIndex'] = function (
	dbdriver, indexName, unique, collection, columns, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addIndexSync(dbdriver, indexName, unique, collection, columns)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const removeIndexSync: FxOrmSqlDDLSync__Dialect.Dialect['removeIndexSync'] = function (
	dbdriver, collection, name
) {
	return dbdriver.execute(
		SQL.DROP_INDEX({
			name: name,
			collection: collection
		}, 'mysql')
	)
};

export const removeIndex: FxOrmSqlDDLSync__Dialect.Dialect['removeIndex'] = function (
	dbdriver, collection, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => removeIndexSync(dbdriver, collection, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
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
			type = columnSizes.integer[property.size] || columnSizes.integer[4];
			break;
		case "number":
			type = columnSizes.floating[property.size] || columnSizes.floating[4];
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
			type = "ENUM (" + property.values.map((val: any) => getSqlQueryDialect(driver.type).escapeVal(val)) + ")";
			break;
		case "point":
			type = "POINT";
			break;
		default:
			if (
				driver.customTypes && 
				(customType = driver.customTypes[property.type])
			) {
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
		const defaultValue = filterPropertyDefaultValue(property, {
			collection,
			property,
			driver
		})

		type += (
			[
				" DEFAULT ",
				property.type === 'date'
				&& (['CURRENT_TIMESTAMP'].includes(defaultValue)) ? defaultValue
				: getSqlQueryDialect(driver.type).escapeVal(defaultValue)
			]
		).filter(x => x).join('');
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
		for (let j in rows[i]) {
			rows[i][j.toLowerCase()] = rows[i][j];
			delete (rows[i][j]);
		}
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

function colInfoBuffer2Str (col: FxOrmSqlDDLSync__Column.ColumnInfo__MySQL) {
	col.Type += '';
	col.Size += '';
	col.Extra += '';
	col.Key += '';
	col.Null += '';
	col.Default += '';
}