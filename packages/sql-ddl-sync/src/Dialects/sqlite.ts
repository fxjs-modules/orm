import FxORMCore = require("@fxjs/orm-core");
import SQL = require("../SQL");

import { getSqlQueryDialect, arraify, filterPropertyDefaultValue } from '../Utils';

// @see https://www.sqlite.org/lang_altertable.html
export const hasCollectionSync: FxOrmSqlDDLSync__Dialect.Dialect['hasCollectionSync'] = function (
	dbdriver, name
) {
	const rows = dbdriver.execute(
		getSqlQueryDialect('sqlite').escape(
			"SELECT * FROM sqlite_master WHERE type = 'table' and name = ?", [name]
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

/**
 * @no_test
 */
export const addPrimaryKeySync: FxOrmSqlDDLSync__Dialect.Dialect['addPrimaryKeySync'] = function (
	dbdriver, tableName, columnName
) {
	return dbdriver.execute(
		getSqlQueryDialect('sqlite').escape(
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
		getSqlQueryDialect('sqlite').escape(
			"ALTER TABLE ?? DROP CONSTRAINT ??;",
			[tableName, columnName + "PK"]
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
		getSqlQueryDialect('sqlite').escape(
			"ALTER TABLE ?? ADD FOREIGN KEY(??) REFERENCES ??(??);",
			[tableName, options.name, options.references.table, options.references.column]
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
		getSqlQueryDialect('sqlite').escape(
			"ALTER TABLE ?? DROP CONSTRAINT ??;",
			[tableName, tableName + "_" + columnName + "_fkey"]
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
		getSqlQueryDialect('sqlite').escape(
			"PRAGMA table_info(??)", [name]
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
	const cols = getCollectionColumnsSync(dbdriver, name)

	let columns = <{ [col: string]: FxOrmSqlDDLSync__Column.PropertySQLite }>{}, m;

	for (let i = 0; i < cols.length; i++) {
		const column = <FxOrmSqlDDLSync__Column.PropertySQLite>{};
		const dCol = cols[i];

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
				column.defaultValue = null;
			}
		}
		
		const TYPE_UPPER = dCol.type.toUpperCase()

		switch (TYPE_UPPER) {
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
			case "POINT":
				column.type = "point";
				break;
			default:
				let [_, type, _before, field] = dCol.type.toUpperCase().match(/(.*)\s(AFTER|BEFORE)\s`(.*)`$/) || [] as any[]

				if (_) {
					switch (_before && field) {
						case 'BEFORE':
							column.before = field
						case 'AFTER':
							column.after = field
							break
					}
					column.type = type;
					break;
				}

				throw new Error(`Unknown column type '${dCol.type}'`);
		}

		columns[dCol.name] = column;
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
		}, 'sqlite')
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
		SQL.DROP_TABLE({ name: name }, 'sqlite')
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
	const cols = getCollectionColumnsSync<FxOrmSqlDDLSync__Column.ColumnInfo__SQLite>(dbdriver, name)

	return arraify(column).every(
		column_name => cols.find(col => col.name === column_name)
	)
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
			after: after_column
		}, 'sqlite')
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
	dbdriver, name,
	oldColName: string,
	newColName: string
) {
	return dbdriver.execute(
		SQL.ALTER_TABLE_RENAME_COLUMN({
			name: name, oldColName: oldColName, newColName: newColName
		}, 'sqlite')
	)
};

export const renameCollectionColumn: FxOrmSqlDDLSync__Dialect.Dialect['renameCollectionColumn'] = function (
	dbdriver, name,
	oldColName: string,
	newColName: string, cb
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
		}, 'sqlite')
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
	throw new Error('sqlite does not support dropping columns')
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
		"PRAGMA index_list(" + getSqlQueryDialect('sqlite').escapeId(name) + ")"
	)

	const indexes = convertIndexRows(rows);

	for (let k in indexes) {
		if (k.match(/^sqlite_autoindex/)) {
			delete indexes[k];
			continue;
		}

		const rows = dbdriver.execute(
			`PRAGMA index_info(${getSqlQueryDialect('sqlite').escapeVal(k)})`
		)

		for (let i = 0; i < rows.length; i++) {
			indexes[k].columns.push(rows[i].name);
		}
	}

	return indexes;
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
	dbdriver, name, unique, collection, columns
) {
	return dbdriver.execute(
		SQL.CREATE_INDEX({
			name: name,
			unique: unique,
			collection: collection,
			columns: columns
		}, 'sqlite')
	)
};

export const addIndex: FxOrmSqlDDLSync__Dialect.Dialect['addIndex'] = function (
	dbdriver, name, unique, collection, columns, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addIndexSync(dbdriver, name, unique, collection, columns)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const removeIndexSync: FxOrmSqlDDLSync__Dialect.Dialect['removeIndexSync'] = function (
	dbdriver, collection, name
) {

	return dbdriver.execute(
		`DROP INDEX IF EXISTS ${getSqlQueryDialect('sqlite').escapeId(name)}`
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
	collection, property: FxOrmSqlDDLSync__Column.PropertySQLite, driver, opts
) {
	const { for: _for = 'create_table' } = opts || {}

	let type: false | FxOrmSqlDDLSync__Column.ColumnType_SQLite = false;
	let customType = null;

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
			property.type = "date";
			property.time = true;
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
	if (property.hasOwnProperty("defaultValue") && property.defaultValue !== undefined) {
		const defaultValue = filterPropertyDefaultValue(property, {
			collection,
			property,
			driver
		})

		let defaultV = ''

		// if (!['alter_table', 'add_column', 'alter_column'].includes(_for)) {
		if (['create_table'].includes(_for)) {
			defaultV = getSqlQueryDialect(driver.type).escapeVal(defaultValue)
		}
		
		type += (
			/**
			 * @description
			 * 	sqlite doens't support alter column's datetime default value,
			 * 	you should alter table's schema to change `datetime` type column's default value
			 * 
			 * @see https://stackoverflow.com/questions/2614483/how-to-create-a-datetime-column-with-default-value-in-sqlite3
			 * @see https://stackoverflow.com/questions/25911191/altering-a-sqlite-table-to-add-a-timestamp-column-with-default-value
			 */
			[
				defaultV ? ` DEFAULT ${defaultV} ` : ``
			]
		).filter(x => x).join('');
	}

	return {
		value: type
	};
};

function convertIndexRows(
	rows: FxOrmSqlDDLSync__Driver.DbIndexInfo_SQLite[]
): {[k: string]: FxOrmSqlDDLSync__Driver.DbIndexInfo_SQLite} {
	const indexes = <{[k: string]: FxOrmSqlDDLSync__Driver.DbIndexInfo_SQLite}>{};

	for (let i = 0; i < rows.length; i++) {
		if (!indexes.hasOwnProperty(rows[i].name)) {
			indexes[rows[i].name] = {
				columns: [],
				unique: rows[i].unique
			};
		}
	}

	return indexes;
}