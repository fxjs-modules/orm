import { FxOrmSqlDDLSync__SQL } from './Typo/SQL';
import { getSqlQueryDialect } from './Utils';
import { FxDbDriverNS } from "@fxjs/db-driver/typings/Typo";

export function CREATE_TABLE (
	options: FxOrmSqlDDLSync__SQL.TableOptions,
	db_type: FxDbDriverNS.DriverType,
) {
	let sql = "CREATE TABLE " + getSqlQueryDialect(db_type).escapeId(options.name) + " (" + options.columns.join(", ");

	if (options.keys && options.keys.length > 0) {
		sql += ", PRIMARY KEY (" + options.keys.map(function (val) {
			return getSqlQueryDialect(db_type).escapeId(val);
		}).join(", ") + ")";
	}

	sql += ")";

	return sql;
};

export function DROP_TABLE (
	options: FxOrmSqlDDLSync__SQL.TableOptions,
	db_type: FxDbDriverNS.DriverType,
) {
	const sql = "DROP TABLE " + getSqlQueryDialect(db_type).escapeId(options.name);

	return sql;
};

export function CHECK_TABLE_HAS_COLUMN (
	options: FxOrmSqlDDLSync__SQL.CheckTableHasColumnOptions,
	db_type: FxDbDriverNS.DriverType,
) {
	const eid = getSqlQueryDialect(db_type).escapeId;
	const evalue = getSqlQueryDialect(db_type).escapeVal;
	const sql = [
		db_type === 'mysql'
		? `SHOW FULL COLUMNS FROM ${eid(options.name)} LIKE ${evalue(options.column)}`
		: `SHOW COLUMNS FROM ${eid(options.name)} LIKE ${evalue(options.column)}`
	].filter(x => x).join('')

	return sql;
};

export function ALTER_TABLE_ADD_COLUMN (
	options: FxOrmSqlDDLSync__SQL.AddColumnOptions,
	db_type: FxDbDriverNS.DriverType,
) {
	const sql = [
		"ALTER TABLE " + getSqlQueryDialect(db_type).escapeId(options.name),
		" ADD " + options.column,
		options.after && " AFTER " + getSqlQueryDialect(db_type).escapeId(options.after),
		options.first && " FIRST",
	].filter(x => x).join('')

	return sql;
};

export function ALTER_TABLE_RENAME_COLUMN (
	opts: FxOrmSqlDDLSync__SQL.AlertColumnRenameOptions,
	db_type: FxDbDriverNS.DriverType,
) {
	const eid = getSqlQueryDialect(db_type).escapeId;
	const sql = "ALTER TABLE "	+ eid(opts.name) +
	          " RENAME COLUMN " + eid(opts.oldColName) + " TO " + eid(opts.newColName);

  return sql;
}

export function ALTER_TABLE_MODIFY_COLUMN (
	options: FxOrmSqlDDLSync__SQL.AlterColumnOptions,
	db_type: FxDbDriverNS.DriverType,
) {
	const sql = "ALTER TABLE " + getSqlQueryDialect(db_type).escapeId(options.name) +
	          " MODIFY " + options.column;
			  
	return sql;
};

export function ALTER_TABLE_DROP_COLUMN (
	options: FxOrmSqlDDLSync__SQL.AlterColumnOptions,
	db_type: FxDbDriverNS.DriverType,
) {
	const sql = "ALTER TABLE " + getSqlQueryDialect(db_type).escapeId(options.name) +
	          " DROP " + getSqlQueryDialect(db_type).escapeId(options.column);

	return sql;
};

export function CREATE_INDEX (
	options: FxOrmSqlDDLSync__SQL.IndexOptions,
	db_type: FxDbDriverNS.DriverType,
) {
	const sql = "CREATE" + (options.unique ? " UNIQUE" : "") + " INDEX " + getSqlQueryDialect(db_type).escapeId(options.name) +
	          " ON " + getSqlQueryDialect(db_type).escapeId(options.collection) +
	          " (" + options.columns.map(function (col) { return getSqlQueryDialect(db_type).escapeId(col); }) + ")";
	
	return sql;
};

export function DROP_INDEX (
	options: FxOrmSqlDDLSync__SQL.IndexOptions,
	db_type: FxDbDriverNS.DriverType,
) {
	const sql = "DROP INDEX " + getSqlQueryDialect(db_type).escapeId(options.name) +
	          " ON " + getSqlQueryDialect(db_type).escapeId(options.collection);

	return sql;
};

// export function RENAME_TABLE (options, driver: FxOrmSqlDDLSync__Driver.Driver) {
//  const sql = "ALTER TABLE " + options.oldCollectionName + " RENAME TO " + options.newCollectionName + " ;";
// }
