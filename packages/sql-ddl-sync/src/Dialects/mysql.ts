import FxORMCore = require("@fxjs/orm-core");
import { IProperty, ExtractColumnInfo, transformer } from "@fxjs/orm-property";

import SQL = require("../SQL");
import { FxOrmSqlDDLSync__DbIndex } from "../Typo/DbIndex";
import { FxOrmSqlDDLSync__Dialect } from "../Typo/Dialect";
import { FxOrmSqlDDLSync__Driver } from "../Typo/Driver";
import { getSqlQueryDialect, arraify } from '../Utils';

const Transformer = transformer('mysql')

type IDialect = FxOrmSqlDDLSync__Dialect.Dialect<Class_MySQL>;

export const hasCollectionSync: IDialect['hasCollectionSync'] = function (
	dbdriver, name
): boolean {
	const rows = dbdriver.execute<any[]>(
		getSqlQueryDialect('mysql').escape(
			"SHOW TABLES LIKE ?", [name]
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

export const addPrimaryKeySync: IDialect['addPrimaryKeySync'] = function (
	dbdriver, tableName, columnName
) {
	return dbdriver.execute(
		getSqlQueryDialect('mysql').escape(
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
		getSqlQueryDialect('mysql').escape(
			"ALTER TABLE ?? DROP PRIMARY KEY;",
			[tableName]
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
		getSqlQueryDialect('mysql').escape(
			"ALTER TABLE ?? ADD CONSTRAINT ?? FOREIGN KEY(??) REFERENCES ??(??)",
			[tableName, options.name + "_fk", options.name, options.references.table, options.references.column]
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
		getSqlQueryDialect('mysql').escape(
			`ALTER TABLE ?? DROP FOREIGN KEY ??;`,
			[tableName, columnName + '_fk']
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
	return dbdriver.execute<Record<string, Class_Buffer>[]>(
		getSqlQueryDialect('mysql').escape(
			"SHOW COLUMNS FROM ??", [name]
		)
	).map(row => Transformer.filterRawColumns(row as any)) as any
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
	const cols = getCollectionColumnsSync<ExtractColumnInfo<typeof Transformer>>(dbdriver, name)

	const props = <{ [col: string]: IProperty }>{};

	for (let i = 0; i < cols.length; i++) {
		const colInfo = cols[i];
		props[colInfo.Field] = Transformer.rawToProperty(colInfo, {
			collection: name,
		}).property;
	}

	return props;
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
		}, 'mysql')
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
		SQL.DROP_TABLE({ name: name }, 'mysql')
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
	const columns = arraify(column)
	let res: null | any[] = null, has = false
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
			after: after_column,
			first: !after_column
		}, 'mysql')
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
	dbdriver, name, oldColName, newColName
) {
	throw new Error("MySQL doesn't support simple column rename");
};

export const renameCollectionColumn: IDialect['renameCollectionColumn'] = function (
	dbdriver, name, oldColName, newColName, cb
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
		}, 'mysql')
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
	return dbdriver.execute(
		SQL.ALTER_TABLE_DROP_COLUMN({
			name: name,
			column: column
		}, 'mysql')
	)
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
	const rows = dbdriver.execute<any[]>(
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

export const getCollectionIndexes: IDialect['getCollectionIndexes'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => getCollectionIndexesSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const addIndexSync: IDialect['addIndexSync'] = function (
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

export const addIndex: IDialect['addIndex'] = function (
	dbdriver, indexName, unique, collection, columns, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addIndexSync(dbdriver, indexName, unique, collection, columns)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const removeIndexSync: IDialect['removeIndexSync'] = function (
	dbdriver, collection, name
) {
	return dbdriver.execute(
		SQL.DROP_INDEX({
			name: name,
			collection: collection
		}, 'mysql')
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

export const toRawType: IDialect['toRawType'] = function (
	property, ctx
) {
	return Transformer.toStorageType(property, {
		collection: ctx.collection,
		customTypes: ctx.driver?.customTypes,
		escapeVal: getSqlQueryDialect(ctx.driver?.type || 'mysql').escapeVal
	});
};

function convertIndexRows(
	rows: FxOrmSqlDDLSync__Driver.DbIndexInfo_MySQL[]
): FxOrmSqlDDLSync__DbIndex.DbIndexInfoHash {
	const indexes = <FxOrmSqlDDLSync__DbIndex.DbIndexInfoHash>{};

	for (let i = 0; i < rows.length; i++) {
		const index_name = getObjectPropertyCaseInsensitive(rows[i], "index_name");
		const non_unique = getObjectPropertyCaseInsensitive(rows[i], "non_unique");
		const column_name= getObjectPropertyCaseInsensitive(rows[i], "column_name");

		if (index_name == 'PRIMARY') {
			continue;
		}
		if (!indexes.hasOwnProperty(index_name)) {
			indexes[index_name] = {
				columns: [],
				unique: (non_unique == 0)
			};
		}

		indexes[index_name].columns.push(column_name);
	}

	return indexes;
}

function getObjectPropertyCaseInsensitive(obj: any, key: string) {
	return obj[Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase())];
}