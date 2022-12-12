// Transforms:
// "name LIKE ? AND age > ?", ["John", 23]
// into:

import { FxSqlQueryDialect } from "./Typo/Dialect";
import { FxSqlQuery } from "./Typo/Query";
import { FxSqlQueryChainBuilder } from "./Typo/Query-ChainBuilder";
import { FxSqlQuerySql } from "./Typo/Sql";

// "name LIKE 'John' AND age > 23"
export function escapeQuery (
	Dialect: FxSqlQueryDialect.Dialect,
	query: FxSqlQuerySql.SqlFragmentStr,
	args: FxSqlQuerySql.SqlAssignmentValues
): FxSqlQuerySql.SqlFragmentStr {
	let pos = 0;

	return query.replace(/\?{1,2}/g, function (match) {
		if (match == '?') {
			return Dialect.escapeVal(args[pos++]);
		} else if (match == '??') {
			return Dialect.escapeId(args[pos++] as FxSqlQuerySql.SqlEscapeArgIdType);
		}
	});
}

export function dateToString (
	date: number|Date,
	timeZone: FxSqlQuery.FxSqlQueryTimezone,
	opts: FxSqlQueryChainBuilder.ChainBuilderOptions
): string {
	const dt = new Date(date);

	if (timeZone != 'local') {
		const tz = convertTimezone(timeZone);

		dt.setTime(dt.getTime() + (dt.getTimezoneOffset() * 60000));
		if (tz !== false) {
			dt.setTime(dt.getTime() + (tz * 60000));
		}
	}

	const year   = dt.getFullYear();
	const month  = zeroPad(dt.getMonth() + 1);
	const day    = zeroPad(dt.getDate());
	const hour   = zeroPad(dt.getHours());
	const minute = zeroPad(dt.getMinutes());
	const second = zeroPad(dt.getSeconds());
	const milli  = zeroPad(dt.getMilliseconds(), 3);

	if (opts.dialect == 'mysql' || timeZone == 'local') {
		return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second + '.' + milli;
	} else {
		return year + '-' + month + '-' + day + 'T' + hour + ':' + minute + ':' + second + '.' + milli + 'Z';
	}
}

export function zeroPad ( number: string|number, n: number = 2 ): string {
	number = "" + number;

	while (number.length < n) {
		number = "0" + number;
	}
	return number;
}

function convertTimezone(tz: FxSqlQuery.FxSqlQueryTimezone): false | number {
	if (tz == "Z") return 0;

	const m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);
	if (m) {
		return (m[1] == '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
	}
	return false;
}

export function get_table_alias (
	sql: FxSqlQuerySql.SqlQueryChainDescriptor, table: string | FxSqlQuerySql.SqlFromTableInput
): string {
	for (let i = 0; i < sql.from.length; i++) {
		if (sql.from[i].table == table) {
			return pickAliasFromFromDescriptor(sql.from[i]);
		}
	}

	return typeof table === 'string' ? table : '';
};

// TODO: add test about it
function unwrapIdentifier (identifier: string = '', dialect: FxSqlQueryDialect.DialectType): string {
	switch (dialect) {
		case 'postgresql':			
			return identifier.replace(/^"|"$/g, '')
		case 'sqlite':
		case 'mysql':			
			return identifier.replace(/^`|`$/g, '')
	}

	return identifier;
}

export function parseTableInputStr (
	table_name: FxSqlQuerySql.SqlTableInputType,
	dialect?: FxSqlQueryDialect.DialectType,
): FxSqlQuerySql.SqlTableTuple {
	if (!table_name)
		throw new Error(`[parseTableInputStr] invalid input table_name!`)

	let ta_tuple: FxSqlQuerySql.SqlTableTuple = ['', ''];

	if (typeof table_name === 'string') {
		table_name = table_name.trim()

		let idx = table_name.lastIndexOf(' as ');
		if (idx > 0) {
			ta_tuple = [
				table_name.slice(0, idx).trim(),
				table_name.slice(idx + 4).trim()
			] as FxSqlQuerySql.SqlTableTuple
		} else {
			ta_tuple = table_name.split(' ').slice(0, 2) as FxSqlQuerySql.SqlTableTuple
		}
	} else if (maybeKnexRawOrQueryBuilder(table_name)) {
		ta_tuple = [table_name, ''] as FxSqlQuerySql.SqlTableTuple
	} else {
		ta_tuple = table_name.slice(0, 2) as FxSqlQuerySql.SqlTableTuple
	}

	if (dialect) {
		if (typeof ta_tuple[0] === 'string') ta_tuple[0] = unwrapIdentifier(ta_tuple[0], dialect)
		ta_tuple[1] = unwrapIdentifier(ta_tuple[1], dialect)
	}

	return ta_tuple
}

export function pickAliasFromFromDescriptor(fd: FxSqlQuerySql.QueryFromDescriptor) {
	return fd.alias || fd.a
}

export function pickColumnAsFromSelectFieldsDescriptor(sitem: FxSqlQuerySql.SqlSelectFieldItemDescriptor): FxSqlQuerySql.SqlSelectFieldItemDescriptor['as'] {
	return sitem.as || sitem.a
}

export function autoIncreatementTableIndex (
	from: FxSqlQuerySql.SqlQueryChainDescriptor['from']
) {
	return from.length + 1;
}

export function defaultTableAliasNameRule (idx: number) {
	return `t${idx}`
}

export const DialectTypes: FxSqlQueryDialect.DialectType[] = ['mysql', 'sqlite', 'mssql', 'postgresql']

export function ucfirst (str: string = '') {
	if (str.length <= 1)
		return str.toUpperCase()

	return str[0].toUpperCase() + str.slice(1)
}

export function ensureNumber (num: any) {
	if (typeof num !== 'number') {
		num = parseInt(num);
	}

	if (isNaN(num))
		return 0;

	return num;
}

export function bufferToString (buffer: Class_Buffer | string, dialect: FxSqlQueryDialect.DialectType) {
	switch (dialect) {
		case 'mssql':
			return "X'" + buffer.toString('hex') + "'";
		case 'mysql':
			return "X'" + buffer.toString('hex')+ "'";
		case 'sqlite':
			return "X'" + buffer.toString('hex') + "'";
		case 'postgresql':
			return "'\\x" + buffer.toString('hex') + "'";
	}
}

export function escapeValForKnex (val: any, Dialect: FxSqlQueryDialect.Dialect, opts: FxSqlQueryChainBuilder.ChainBuilderOptions) {
	// no escape for `knex.raw(...)`, `knex.ref(...)` and subquery
	if (maybeKnexRawOrQueryBuilder(val)) return val;

	// never escapeVal those types with `Dialect.escapeVal`, knex would escape them automatically
	const _type = typeof val;

	if (_type === 'string')
		return val;
	else if (_type === 'number')
		return val;
	else if (_type === 'symbol')
		return val = null;
	else if (_type === 'boolean') {
		if (Dialect.DataTypes.isSQLITE)
			return val ? 1 : 0;

		return val;
	}
	else if (_type === 'function')
		return Dialect.knex.raw( val(Dialect) );
	else if (val instanceof Date)
		// TODO: how to suppor timezone?
		return val;
	else if (Buffer.isBuffer(val)) {
		return Dialect.type === 'postgresql' ? Dialect.knex.raw( bufferToString(val, Dialect.type) ) : val;
	} else if (val instanceof Array)
		return val;
	else if (val === null)
		return val;
	else if (val === undefined)
		return val = null;

	return Dialect.escapeVal(val, opts.timezone);
}

export function cutOffOrderDirectionFromColumnFirstStr (col_name: string): {
	col_name: string
	direction: FxSqlQuerySql.SqlOrderDescriptor['d']
} {
	const result = {
		col_name,
		direction: 'ASC' as FxSqlQuerySql.SqlOrderDescriptor['d']
	}

	if (typeof col_name !== 'string')
		return result

	if (col_name[0] === '-') {
		result.col_name = col_name.substr(1)
		result.direction = 'DESC'
	}

	return result
}

export function maybeKnexSubQuery(input: any): input is import('@fxjs/knex').Knex.QueryBuilder {
	return typeof input?.toQuery === "function";
}

export function maybeKnexRaw(input: any): input is import('@fxjs/knex').Knex.Raw {
	return typeof input?.toQuery === "function";
}

export function maybeKnexRawOrQueryBuilder(input: any): input is import('@fxjs/knex').Knex.QueryBuilder | import('@fxjs/knex').Knex.Raw {
	return typeof input?.toQuery === "function";
}

export function isWrapperdSubQuerySelect (sql: any): sql is `(${string})` {
	return typeof sql === 'string' && /^\(\s*SELECT\s.*\)$/i.test(sql)
}

/** @internal */
export function convertSqlFromTable (
	sql_from_item: FxSqlQuerySql.QueryFromDescriptor,
	knex: import('@fxjs/knex').Knex,
	isSubQuery: boolean = isWrapperdSubQuerySelect((sql_from_item.table as any)?.trim?.()),
) {
	// from: select subquery as table
	return maybeKnexRawOrQueryBuilder(sql_from_item.table) ? knex.raw(sql_from_item.table).wrap('(', ')')
		: isSubQuery ? knex.raw(sql_from_item.table.trim()).wrap('', '')
		: sql_from_item.table;
}

export class ChainBuilderBase implements FxSqlQueryChainBuilder.ChainBuilder {
	// readonly Dialect: FxSqlQueryDialect.Dialect
	readonly knex: FxSqlQuery.Class_Query['knex']

	constructor (protected Dialect: FxSqlQueryDialect.Dialect) {
		Object.defineProperty(this, 'Dialect', {
			get () {
				return Dialect;
			},
			configurable: false
		});

		Object.defineProperty(this, 'knex', {
			get () {
				return Dialect.knex;
			},
			configurable: false
		});
	}

	/**
	 * @override
	 */
	build(): string { return ''; };
}