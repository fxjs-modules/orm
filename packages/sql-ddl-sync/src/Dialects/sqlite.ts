import FxORMCore = require("@fxjs/orm-core");
import { ExtractColumnInfo, transformer } from "@fxjs/orm-property";
import type { PropertySQLite } from '@fxjs/orm-property/lib/transformers/sqlite';

import SQL = require("../SQL");
import { FxOrmSqlDDLSync__Dialect } from "../Typo/Dialect";
import { FxOrmSqlDDLSync__Driver } from "../Typo/Driver";

import { getSqlQueryDialect, arraify, filterPropertyDefaultValue } from '../Utils';

const Transformer = transformer('sqlite')

type IDialect = FxOrmSqlDDLSync__Dialect.Dialect<Class_SQLite>;

// @see https://www.sqlite.org/lang_altertable.html
export const hasCollectionSync: IDialect['hasCollectionSync'] = function (
	dbdriver, name
) {
	const rows = dbdriver.execute<any[]>(
		getSqlQueryDialect('sqlite').escape(
			"SELECT * FROM sqlite_master WHERE type = 'table' and name = ?", [name]
		)
	)

	return rows.length > 0;
};

export const hasCollection: IDialect['hasCollection'] = function (
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
export const addPrimaryKeySync: IDialect['addPrimaryKeySync'] = function (
	dbdriver, tableName, columnName
) {
	return dbdriver.execute(
		getSqlQueryDialect('sqlite').escape(
			"ALTER TABLE ?? ADD CONSTRAINT ?? PRIMARY KEY(??);",
			[tableName, columnName + "PK", columnName]
		)
	)
};

export const addPrimaryKey: IDialect['addPrimaryKey'] = function (
	dbdriver, tableName, columnName, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addPrimaryKeySync(dbdriver, tableName, columnName)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const dropPrimaryKeySync: IDialect['dropPrimaryKeySync'] = function (
	dbdriver, tableName, columnName
) {
	return dbdriver.execute(
		getSqlQueryDialect('sqlite').escape(
			"ALTER TABLE ?? DROP CONSTRAINT ??;",
			[tableName, columnName + "PK"]
		)
	)
};

export const dropPrimaryKey: IDialect['dropPrimaryKey'] = function (
	dbdriver, tableName, columnName, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => dropPrimaryKeySync(dbdriver, tableName, columnName)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const addForeignKeySync: IDialect['addForeignKeySync'] = function (
	dbdriver, tableName, options
) {
	return dbdriver.execute(
		getSqlQueryDialect('sqlite').escape(
			"ALTER TABLE ?? ADD FOREIGN KEY(??) REFERENCES ??(??);",
			[tableName, options.name, options.references.table, options.references.column]
		)
	)
};

export const addForeignKey: IDialect['addForeignKey'] = function (
	dbdriver, tableName, options, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addForeignKeySync(dbdriver, tableName, options)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const dropForeignKeySync: IDialect['dropForeignKeySync'] = function (
	dbdriver, tableName, columnName
) {
	return dbdriver.execute(
		getSqlQueryDialect('sqlite').escape(
			"ALTER TABLE ?? DROP CONSTRAINT ??;",
			[tableName, tableName + "_" + columnName + "_fkey"]
		)
	)
};

export const dropForeignKey: IDialect['dropForeignKey'] = function (
	dbdriver, tableName, columnName, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => dropForeignKeySync(dbdriver, tableName, columnName)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const getCollectionColumnsSync: IDialect['getCollectionColumnsSync'] = function (
	dbdriver, name
) {
	return dbdriver.execute(
		getSqlQueryDialect('sqlite').escape(
			"PRAGMA table_info(??)", [name]
		)
	)
}

export const getCollectionColumns: IDialect['getCollectionColumns'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => getCollectionColumnsSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const getCollectionPropertiesSync: IDialect['getCollectionPropertiesSync'] = function (
	dbdriver, name
) {
	const cols = getCollectionColumnsSync(dbdriver, name)

	let columns = <{ [col: string]: PropertySQLite }>{};

	for (let i = 0; i < cols.length; i++) {
		const dCol = cols[i];

		columns[dCol.name] = Transformer.rawToProperty(dCol, {
			collection: name,
		}).property;
	}

	return columns;
};

export const getCollectionProperties: IDialect['getCollectionProperties'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => getCollectionPropertiesSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const createCollectionSync: IDialect['createCollectionSync'] = function (
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

export const createCollection: IDialect['createCollection'] = function (
	dbdriver, name, columns, keys, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => createCollectionSync(dbdriver, name, columns, keys)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const dropCollectionSync: IDialect['dropCollectionSync'] = function (
	dbdriver, name
) {
	return dbdriver.execute(
		SQL.DROP_TABLE({ name: name }, 'sqlite')
	)
};

export const dropCollection: IDialect['dropCollection'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => dropCollectionSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const hasCollectionColumnsSync: IDialect['hasCollectionColumnsSync'] = function (
	dbdriver, name, column
) {
	const cols = getCollectionColumnsSync<ExtractColumnInfo<typeof Transformer>>(dbdriver, name)

	return arraify(column).every(
		column_name => cols.find(col => col.name === column_name)
	)
};

export const hasCollectionColumns: IDialect['hasCollectionColumns'] = function (
	dbdriver, name, column, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => hasCollectionColumnsSync(dbdriver, name, column)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const addCollectionColumnSync: IDialect['addCollectionColumnSync'] = function (
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

export const addCollectionColumn: IDialect['addCollectionColumn'] = function (
	dbdriver, name, column, after_column, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addCollectionColumnSync(dbdriver, name, column, after_column)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const renameCollectionColumnSync: IDialect['renameCollectionColumnSync'] = function (
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

export const renameCollectionColumn: IDialect['renameCollectionColumn'] = function (
	dbdriver, name,
	oldColName: string,
	newColName: string, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => renameCollectionColumnSync(dbdriver, name, oldColName, newColName)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const modifyCollectionColumnSync: IDialect['modifyCollectionColumnSync'] = function (
	dbdriver, name, column
) {
	return dbdriver.execute(
		SQL.ALTER_TABLE_MODIFY_COLUMN({
			name: name,
			column: column
		}, 'sqlite')
	)
};

export const modifyCollectionColumn: IDialect['modifyCollectionColumn'] = function (
	dbdriver, name, column, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => modifyCollectionColumnSync(dbdriver, name, column)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const dropCollectionColumnSync: IDialect['dropCollectionColumnSync'] = function (
	dbdriver, name, column
) {
	throw new Error('sqlite does not support dropping columns')
};

export const dropCollectionColumn: IDialect['dropCollectionColumn'] = function (
	dbdriver, name, column, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => dropCollectionColumnSync(dbdriver, name, column)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const getCollectionIndexesSync: IDialect['getCollectionIndexesSync'] = function (
	dbdriver, name
) {
	const rows = dbdriver.execute<FxOrmSqlDDLSync__Driver.DbIndexInfo_SQLite[]>(
		"PRAGMA index_list(" + getSqlQueryDialect('sqlite').escapeId(name) + ")"
	)

	const indexes = convertIndexRows(rows);

	for (let k in indexes) {
		if (k.match(/^sqlite_autoindex/)) {
			delete indexes[k];
			continue;
		}

		const rows = dbdriver.execute<{ name: string }[]>(
			`PRAGMA index_info(${getSqlQueryDialect('sqlite').escapeVal(k)})`
		)

		for (let i = 0; i < rows.length; i++) {
			indexes[k].columns.push(rows[i].name);
		}
	}

	return indexes;
};

export const getCollectionIndexes: IDialect['getCollectionIndexes'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => getCollectionIndexesSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const addIndexSync: IDialect['addIndexSync'] = function (
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

export const addIndex: IDialect['addIndex'] = function (
	dbdriver, name, unique, collection, columns, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addIndexSync(dbdriver, name, unique, collection, columns)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const removeIndexSync: IDialect['removeIndexSync'] = function (
	dbdriver, collection, name
) {

	return dbdriver.execute(
		`DROP INDEX IF EXISTS ${getSqlQueryDialect('sqlite').escapeId(name)}`
	)
};

export const removeIndex: IDialect['removeIndex'] = function (
	dbdriver, collection, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => removeIndexSync(dbdriver, collection, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const processKeys: IDialect['processKeys'] = function (keys) {
	if (keys.length === 1) {
		return [];
	}

	return keys;
};

export const supportsType: IDialect['supportsType'] = function (type) {
	switch (type) {
		case "boolean":
		case "enum":
			return "number";
	}
	return type;
};

export const getType: IDialect['getType'] = function (
	collection, property, driver, opts
) {
	const { for: _for = 'create_table' } = opts || {}

	const result = Transformer.toStorageType(property, {
		collection,
		customTypes: driver?.customTypes,
		escapeVal: getSqlQueryDialect(driver?.type || 'sqlite').escapeVal,
		userOptions: {
			useDefaultValue: _for === 'create_table',
		}
	});

	return {
		value: result.typeValue
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