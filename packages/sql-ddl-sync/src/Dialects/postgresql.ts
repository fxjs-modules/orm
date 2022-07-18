/**
 * @TODO: dbdriver.execute -> 
 * dbdriver.execute(
 * 	dbdriver.execute(getSqlQueryDialect(dbdriver.type)).escape
 * )
 */ 
import coroutine = require('coroutine');
import { IDbDriver } from "@fxjs/db-driver";
import FxORMCore = require("@fxjs/orm-core");
import SQL = require("../SQL");
import { columnInfo2Property, property2ColumnType } from "../Transformers/postgresql";
import { FxOrmSqlDDLSync__Column } from "../Typo/Column";
import { FxOrmSqlDDLSync__Dialect } from "../Typo/Dialect";
import { FxOrmSqlDDLSync__Driver } from "../Typo/Driver";
import { getSqlQueryDialect, arraify, filterPropertyDefaultValue } from '../Utils';

type IDialect = FxOrmSqlDDLSync__Dialect.Dialect<Class_DbConnection>;

export const hasCollectionSync: IDialect['hasCollectionSync'] = function (dbdriver, name) {
	const rows = dbdriver.execute<any[]>(
		getSqlQueryDialect('psql').escape(
			"SELECT * FROM information_schema.tables WHERE table_name = ?", [ name ]
		)
		
	);

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

export const getCollectionPropertiesSync: IDialect['getCollectionPropertiesSync'] = function (dbdriver, name) {
	const cols = getCollectionColumnsSync(dbdriver, name);

	let columns = <Record<string, FxOrmSqlDDLSync__Column.Property>>{}, m;

	for (let i = 0; i < cols.length; i++) {
		const dCol = cols[i];

		columns[dCol.column_name] = columnInfo2Property(dCol);
	}

	return checkColumnTypes(dbdriver, name, columns);
};

export const getCollectionProperties: IDialect['getCollectionProperties'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => getCollectionPropertiesSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const createCollectionSync: IDialect['createCollectionSync'] = function (dbdriver, name, columns, keys) {
	return dbdriver.execute(SQL.CREATE_TABLE({
		name    : name,
		columns : columns,
		keys    : keys
	}, 'psql'));
};

export const createCollection: IDialect['createCollection'] = function (
	dbdriver, name, columns, keys, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => createCollectionSync(dbdriver, name, columns, keys)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const dropCollectionSync: IDialect['dropCollectionSync'] = function (dbdriver, name) {
	return dbdriver.execute(SQL.DROP_TABLE({
		name    : name
	}, 'psql'));
};

export const dropCollection: IDialect['dropCollection'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => dropCollectionSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const addPrimaryKeySync: IDialect['addPrimaryKeySync'] = function(dbdriver, tableName, columnName) {
	return dbdriver.execute(
		getSqlQueryDialect('psql').escape(
			"ALTER TABLE ?? ADD CONSTRAINT ?? PRIMARY KEY(??);",
			[tableName, tableName + "_" + columnName + "_pk", columnName]
		)
	);
};

export const addPrimaryKey: IDialect['addPrimaryKey'] = function (
	dbdriver, tableName, columnName, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addPrimaryKeySync(dbdriver, tableName, columnName)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const dropPrimaryKeySync: IDialect['dropPrimaryKeySync'] = function(dbdriver, tableName, columnName) {
	return dbdriver.execute(
		getSqlQueryDialect('psql').escape(
			"ALTER TABLE ?? DROP CONSTRAINT ??;",
			[tableName, tableName + "_" + columnName + "_pk"]
		)
	);
};

export const dropPrimaryKey: IDialect['dropPrimaryKey'] = function (
	dbdriver, tableName, columnName, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => dropPrimaryKeySync(dbdriver, tableName, columnName)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const addForeignKeySync: IDialect['addForeignKeySync'] = function(dbdriver, tableName, options) {
	return dbdriver.execute(
		getSqlQueryDialect('psql').escape(
			"ALTER TABLE ?? ADD FOREIGN KEY(??) REFERENCES ?? (??);",
			[tableName, options.name, options.references.table, options.references.column]
		)
	);
};

export const addForeignKey: IDialect['addForeignKey'] = function (
	dbdriver, tableName, options, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addForeignKeySync(dbdriver, tableName, options)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const dropForeignKeySync: IDialect['dropForeignKeySync'] = function(dbdriver, tableName, columnName) {
	return dbdriver.execute(
		getSqlQueryDialect('psql').escape(
			"ALTER TABLE ?? DROP CONSTRAINT ??;",
			[tableName, tableName + '_' + columnName + '_fkey']
		)
	);
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
		getSqlQueryDialect('psql').escape(
			"SELECT * FROM information_schema.columns WHERE table_name = ?;",
			[name]
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

export const hasCollectionColumnsSync: IDialect['hasCollectionColumnsSync'] = function (
	dbdriver, name, column
) {
	const columnSet = new Set(arraify(column))
	const res = dbdriver.execute<{ column_name: string }[]>(
		getSqlQueryDialect('psql').escape(
			"select column_name from information_schema.columns where table_name = '?' and column_name in (?);",
			[name, [...columnSet].map(col => `'${col}'`).join(', ')]
		)
	)
	const resSet = new Set(res.map(({ column_name }) => column_name))

	return [...columnSet].every(column => resSet.has(column))
};

export const hasCollectionColumns: IDialect['hasCollectionColumns'] = function (
	dbdriver, name, column, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => hasCollectionColumnsSync(dbdriver, name, column)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const addCollectionColumnSync: IDialect['addCollectionColumnSync'] = function (dbdriver, name, column, afterColumn) {
	return dbdriver.execute(
		getSqlQueryDialect('psql').escape(
			`ALTER TABLE ?? ADD ${column};`,
			[name]
		)
	);
};

export const addCollectionColumn: IDialect['addCollectionColumn'] = function (
	dbdriver, name, column, after_column, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addCollectionColumnSync(dbdriver, name, column, after_column)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const renameCollectionColumnSync: IDialect['renameCollectionColumnSync'] = function (dbdriver, name, oldColName, newColName) {
	var sql = SQL.ALTER_TABLE_RENAME_COLUMN({
		name: name, oldColName: oldColName, newColName: newColName
	}, 'psql');

	return dbdriver.execute(sql);
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

export const modifyCollectionColumnSync: IDialect['modifyCollectionColumnSync'] = function (dbdriver, name, column): any {
	let p        = column.indexOf(" ");
	const col_name = column.substr(0, p);
	let col_type: string;

	column = column.substr(p + 1);

	p = column.indexOf(" ");
	if (p > 0) {
		col_type = column.substr(0, p);
		column = column.substr(p + 1);
	} else {
		col_type = column;
		column = '';
	}

	var res;

	res = dbdriver.execute(`ALTER TABLE ${name} ALTER ${col_name} TYPE ${col_type}`);

	if (column) {
		if (column.match(/NOT NULL/)) {
			res = dbdriver.execute("ALTER TABLE " + name +
				                " ALTER " + col_name +
				                " SET NOT NULL");
		} else {
			res = dbdriver.execute("ALTER TABLE " + name +
				                " ALTER " + col_name +
				                " DROP NOT NULL");
		}

		let m: any[];
		if (m = column.match(/DEFAULT (.+)$/)) {
			res = dbdriver.execute("ALTER TABLE " + name +
				                " ALTER " + col_name +
				                " SET DEFAULT " + m[1]);
		}
	}

	return res;
};

export const modifyCollectionColumn: IDialect['modifyCollectionColumn'] = function (
	dbdriver, name, column, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => modifyCollectionColumnSync(dbdriver, name, column)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const dropCollectionColumnSync: IDialect['dropCollectionColumnSync'] = function (dbdriver, name, column) {
	return dbdriver.execute(SQL.ALTER_TABLE_DROP_COLUMN({
		name        : name,
		column      : column
	}, 'psql'));
};

export const dropCollectionColumn: IDialect['dropCollectionColumn'] = function (
	dbdriver, name, column, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => dropCollectionColumnSync(dbdriver, name, column)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const getCollectionIndexesSync: IDialect['getCollectionIndexesSync'] = function (dbdriver, name) {
	const rows = dbdriver.execute<FxOrmSqlDDLSync__Driver.DbIndexInfo_PostgreSQL[]>(
		getSqlQueryDialect('psql').escape(
			"SELECT t.relname, i.relname, a.attname, ix.indisunique, ix.indisprimary " +
	         "FROM pg_class t, pg_class i, pg_index ix, pg_attribute a " +
	         "WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid " +
	         "AND a.attrelid = t.oid AND a.attnum = ANY(ix.indkey) " +
	         "AND t.relkind = 'r' AND t.relname = ?",
	         [ name ]
		)
	);

	return convertIndexRows(rows)
};

export const getCollectionIndexes: IDialect['getCollectionIndexes'] = function (
	dbdriver, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => getCollectionIndexesSync(dbdriver, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const addIndexSync: IDialect['addIndexSync'] = function (dbdriver, name, unique, collection, columns) {
	return dbdriver.execute(SQL.CREATE_INDEX({
		name       : name,
		unique     : unique,
		collection : collection,
		columns    : columns
	}, 'psql'));
};

export const addIndex: IDialect['addIndex'] = function (
	dbdriver, name, unique, collection, columns, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => addIndexSync(dbdriver, name, unique, collection, columns)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const removeIndexSync: IDialect['removeIndexSync'] = function (dbdriver, collection, name) {
	return dbdriver.execute("DROP INDEX " + getSqlQueryDialect('psql').escapeId(name));
};

export const removeIndex: IDialect['removeIndex'] = function (
	dbdriver, collection, name, cb
) {
	const exposedErrResults = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
		() => removeIndexSync(dbdriver, collection, name)
	)
	FxORMCore.Utils.throwErrOrCallabckErrResult(exposedErrResults, { no_throw: true, callback: cb });
};

export const convertIndexes: IDialect['convertIndexes'] = function (collection, indexes) {
	for (let i = 0; i < indexes.length; i++) {
		indexes[i].name = collection.name + "_" + indexes[i].name;
	}

	return indexes;
};

export const getType: IDialect['getType'] = function (collection, property, driver) {
	let type: false | string   = false;
	let before: false = false;
	let customType = null;

	if (property.serial) {
		type = "SERIAL";
	} else {
		const result = property2ColumnType(property, { collection });
		property = result.property;
		type = result.value;
		if (result.isCustomType) {
			if (
				driver.customTypes && 
				(customType = driver.customTypes[property.type])
			) {
				type = customType.datastoreType(property)
			}
		}

		if (!type) return false;

		if (property.hasOwnProperty("defaultValue") && property.defaultValue !== undefined) {
			if (property.type == 'date' && property.defaultValue === Date.now){
				type += " DEFAULT now()";
			} else {
				const defaultValue = filterPropertyDefaultValue(property, {
					collection,
					property,
					driver
				})
				type += " DEFAULT " + getSqlQueryDialect('psql').escapeVal(defaultValue);
			}
		}
	}

	return {
		value  : type,
		before : before
	};
};

function convertIndexRows(rows: FxOrmSqlDDLSync__Driver.DbIndexInfo_PostgreSQL[]) {
	var indexes: Record<string, any> = {};

	for (var i = 0; i < rows.length; i++) {
		if (rows[i].indisprimary) {
			continue;
		}

		if (!indexes.hasOwnProperty(rows[i].relname)) {
			indexes[rows[i].relname] = {
				columns : [],
				unique  : rows[i].indisunique
			};
		}

		indexes[rows[i].relname].columns.push(rows[i].attname);
	}

	return indexes;
}

function checkColumnTypes(
	dbdriver: IDbDriver.ITypedDriver<Class_DbConnection>,
	collection: string,
	columns: Record<string, FxOrmSqlDDLSync__Column.Property>
) {
	coroutine.parallel(columns, (column: FxOrmSqlDDLSync__Column.Property) => {
		const name = column.name;
		if (columns[name].type == "enum") {
			const col = columns[name];
			const col_name = collection + "_enum_" + name;

			const rows = dbdriver.execute<any[]>(
				getSqlQueryDialect('psql').escape(
`SELECT t.typname, string_agg(e.enumlabel, '|' ORDER BY e.enumsortorder) AS enum_values 
FROM pg_catalog.pg_type t JOIN pg_catalog.pg_enum e ON t.oid = e.enumtypid WHERE t.typname = ? GROUP BY 1`, [ col_name ]
				)
			);

			if (rows.length) {
				col.values = rows[0].enum_values.split("|");
			}
		}
	})

	return columns;
}