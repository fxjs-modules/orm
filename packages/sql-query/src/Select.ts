import Knex   = require('@fxjs/knex');
import { get_table_alias } from "./Helpers";
import Helpers = require('./Helpers');
import Where   = require("./Where");

import { FxSqlAggregation } from './Typo/Aggregation';
import { FxSqlQueryDialect } from './Typo/Dialect';
import { FxSqlQueryChainBuilder } from './Typo/Query-ChainBuilder';
import { FxSqlQuerySql } from './Typo/Sql';
import { FxSqlQuery } from "./Typo/Query";
import { FxSqlQueryHelpler } from './Typo/Helper';
import { FxSqlQuerySubQuery } from "./Typo/SubQuery"

export class SelectQuery extends Helpers.ChainBuilderBase implements FxSqlQueryChainBuilder.ChainBuilder__Select {
	Dialect: FxSqlQueryDialect.Dialect

	private sql: FxSqlQuerySql.SqlQueryChainDescriptor = {
		from         : [],
		where        : [],
		order        : [],
		group_by     : null,
		found_rows   : false,
		where_exists : false
	}

	private _aggregation_functions: {[key: string]: Function} = {}
	private fun_stack: FxSqlAggregation.SupportedAggregationFunction[] = []

	private get_aggregate_fun (fun: string) {
		if (this._aggregation_functions[fun])
			return this._aggregation_functions[fun]

		const func = this._aggregation_functions[fun] = (
			...columns: FxSqlQueryChainBuilder.ChainBuilder__SelectAggregationFunColumnArg
		) => {
			fun = fun.toUpperCase()
			if (columns.length === 0) {
				this.fun_stack.push(fun as FxSqlAggregation.SupportedAggregationFunction);
				return this;
			}

			/**
			 * when columns is like this:
			 *
			 * ['MY_FUNC1', 'myfunc1']
			 */
			var alias = (columns.length > 1 && typeof columns[columns.length - 1] == "string" ? columns.pop() : null) as string;

			if (columns.length && Array.isArray(columns[0])) {
				const first = columns[0] as FxSqlQueryChainBuilder.ChainBuilder__SelectAggregationFunColumnArg
				columns = first.concat(
					columns.slice(1)
				);
			}

			return this.fun(
				fun,
				(columns.length && columns[0] ? columns : '*') as string,
				alias
			);
		};

		return func
	};

	constructor(Dialect: FxSqlQueryDialect.Dialect, private opts: FxSqlQuery.QueryOptions) {
		super(Dialect);
	}

	select (fields?: any) {
		if (fields) {
			const from_descriptor = this.sql.from[this.sql.from.length - 1];

			if (!from_descriptor.select || !Array.isArray(from_descriptor.select)) {
				from_descriptor.select = [];
			}
			this.sql.from[this.sql.from.length - 1].select = from_descriptor.select.concat(
				Array.isArray(fields)
					? fields
					: Array.prototype.slice.apply(arguments)
			);
		}
		return this;
	}

	calculateFoundRows () {
		this.sql.found_rows = true;

		return this;
	}

	as (_as: string) {
		var idx = this.sql.from.length - 1;

		if (Array.isArray(this.sql.from[idx].select)) {
			const from_select_arr = this.sql.from[idx].select as FxSqlQuerySql.SqlSelectFieldItemDescriptor[]

			const idx2 = from_select_arr.length - 1;

			if (typeof from_select_arr[idx2] === "string") {
				from_select_arr[idx2] = {
					column_name: from_select_arr[idx2] as string
				};
			}
			from_select_arr[idx2].as = _as || null;
		}

		return this;
	}

	fun (fun: string, column?: FxSqlQuerySql.SqlColumnType, _as?: string) {
		if (!Array.isArray(this.sql.from[this.sql.from.length - 1].select)) {
			this.sql.from[this.sql.from.length - 1].select = [];
		}
		const select = this.sql.from[this.sql.from.length - 1].select as FxSqlQuerySql.SqlSelectFieldItemDescriptor[]
		select.push({
			func_name: fun.toUpperCase(),
			column_name: (column && column != "*" ? column : null),
			as: (_as || null),
			func_stack: this.fun_stack
		});
		this.fun_stack = [];
		return this;
	}

	/**
	 *
	 * @param table from-table
	 * @param from_id from-table id(s), align with to_id
	 * @param to_table to table
	 * @param to_id to-table id(s), align with from_id
	 * @param from_opts join descriptor
	 */
	from (
		table: FxSqlQuerySql.SqlTableInputType,
		from_id?: FxSqlQueryHelpler.Arraiable<string>,
		to_table?: string,
		to_id?: FxSqlQueryHelpler.Arraiable<string>,
		from_opts?: FxSqlQuerySql.QueryFromDescriptorOpts
	): this {
		const [table_name, table_alias] = Helpers.parseTableInputStr(table, this.Dialect.type)

		const from: FxSqlQuerySql.QueryFromDescriptor = {
			table: table_name,
			alias: table_alias || Helpers.defaultTableAliasNameRule( Helpers.autoIncreatementTableIndex(this.sql.from) )
		};

		if (this.sql.from.length === 0) {
			this.sql.from.push(from);
			return this;
		}

		const args = Array.prototype.slice.call(arguments);
		const last = args[args.length - 1];

		if (args.length == 1) { // another table
			this.sql.from.push(from);
			return this;
		} 

		let alias: string;

		if (typeof last == 'object' && !Array.isArray(last)) {
			from_opts = args.pop()
			from.opts = from_opts;
		}

		if (args.length == 3) {
			alias = Helpers.pickAliasFromFromDescriptor(this.sql.from[this.sql.from.length - 1]);
			to_id = to_table;
		} else if (args.length === 4) { // expect args.length === 4
			const [to_table_name, to_table_alias] = Helpers.parseTableInputStr(to_table)
			alias = to_table_alias || get_table_alias(this.sql, to_table_name);
		} else {
			throw new Error('[SQL-QUERY] invalid arguments for .from()');
		}

		from.joins = [];
		if (!from_id.length || !to_id.length)
			throw new Error('[SQL-QUERY] both from_id & to_id cannot be empty!');

		/**
		 * expect
		 * ```
		 * 	.from(
		 * 		'fromtable',
		 * 		['from_table_c1', 'from_table_c2', 'from_table_c3', ...],
		 * 		'totable',
		 * 		['to_table_c1', 'to_table_c2', 'to_table_c3', ...],
		 * 	)
		 * ```
		 */
		if (Array.isArray(from_id) && Array.isArray(to_id) && from_id.length == to_id.length) {
			for (let i = 0; i < from_id.length; i++) {
				from.joins.push([
					from_id[i],
					alias,
					to_id[i]
				]);
			}
		} else {
			/**
			 * expect
			 * ```
			 * 	.from('fromtable', from_table_c1', 'totable', 'to_table_c1')
			 * ```
			 */
			from.joins.push([
				from_id as string,
				alias,
				to_id as string
			]);
		}

		this.sql.from.push(from);
		return this;
	}

	where (
		...whereConditions: (
			FxSqlQuerySubQuery.SubQueryBuildDescriptor['wheres'] | FxSqlQuerySubQuery.WhereExistsTuple_Flatten[0]
		)[]
	): this {
		var whereItem: FxSqlQuerySubQuery.SubQueryBuildDescriptor = null;
		const pushNonEmptyWhereItem = () => {
			if (whereItem !== null) {
				this.sql.where.push(whereItem);
			}
		}

		for (let i = 0; i < whereConditions.length; i++) {
			if (whereConditions[i] === null) {
				continue;
			}
			if (typeof whereConditions[i] === "string") {
				/**
				 * deal with input like this:
				 * [
						"table1",
						{
							"col": 1
						},
						"table2",
						{
							"col": 2
						}
					]
				 */
				const table_or_alias = whereConditions[i] as FxSqlQuerySubQuery.WhereExistsTuple_Flatten[0]
				pushNonEmptyWhereItem()
				whereItem = {
					table: get_table_alias(this.sql, table_or_alias),
					wheres: whereConditions[i + 1] as FxSqlQuerySubQuery.WhereExistsTuple_Flatten[1]
				};
				i++;
			} else { // expect it's `FxSqlQuerySubQuery.SubQueryBuildDescriptor['wheres']`
				pushNonEmptyWhereItem()
				whereItem = {
					table: null,
					wheres: { ...whereConditions[i] as FxSqlQuerySubQuery.SubQueryBuildDescriptor['wheres'] }
				};
			}
		}
		pushNonEmptyWhereItem()

		// make tmp variable null.
		whereItem = null;

		return this;
	}

	whereExists (table: string, table_link: string, link: FxSqlQuerySql.WhereExistsLinkTuple, cond: FxSqlQuerySubQuery.SubQueryBuildDescriptor['wheres']) {
		this.sql.where.push({
			table: (this.sql.from.length ? Helpers.pickAliasFromFromDescriptor(this.sql.from[this.sql.from.length - 1]) : null),
			wheres: cond,
			exists: { table: table, table_linked: get_table_alias(this.sql, table_link), link_info: link }
		});
		this.sql.where_exists = true;
		return this;
	}

	groupBy (...args: FxSqlQuerySql.SqlGroupByType[]) {
		this.sql.group_by = args;
		return this;
	}

	offset (offset: number) {
		this.sql.offset = offset;
		return this;
	}

	limit (limit: number) {
		this.sql.limit = limit;
		return this;
	}

	order (column: FxSqlQuery.OrderNormalizedResult[0], dir?: FxSqlQuery.OrderNormalizedResult[1]) {
		// 1st arg if raw sql fragment, the rest args are arguments.
		if (Array.isArray(dir)) {
			this.sql.order.push(
				Helpers.escapeQuery(
					this.Dialect,
					column as FxSqlQuery.OrderSqlStyleTuple[0],
					dir
				)
			);
		// normalized order array
		} else {
			let column_name = Array.isArray(column) ? column[1] : column

			let d = null as FxSqlQuerySql.SqlOrderDescriptor['d'];

			const { direction, col_name } = Helpers.cutOffOrderDirectionFromColumnFirstStr(column_name)
			d = direction;
			column_name = col_name;

			if (dir)
				d = (dir === "Z" ? "DESC" : "ASC")

			this.sql.order.push({
				c : Array.isArray(column) ? [
					get_table_alias(this.sql, column[0]),
					column_name
				] : column_name,
				d : d
			});
		}
		return this;
	}

	build () {
		const having: string[] = [];

		const sql_from = this.sql.from;

		if (this.fun_stack.length) {
			this.fun(this.fun_stack.pop());
		}

		const tableAliasMap = {} as {[k: string]: string};

		const from_len = sql_from.length;
		for (let i = 0; i < from_len; i++) {
			sql_from[i].alias = Helpers.pickAliasFromFromDescriptor(sql_from[i]) || Helpers.defaultTableAliasNameRule(i + 1);

			tableAliasMap[`${sql_from[i].alias}`] = `${sql_from[i].table}`
		}

		const single_query = from_len === 1;

		const sqlBuilder = this.Dialect.knex(tableAliasMap);

		for (let i = 0; i < from_len; i++) {
			if (!sql_from[i].select) continue;

			for (let j = 0; j < sql_from[i].select.length; j++) {
				const sql_from_item = sql_from[i];
				const sql_select_item = sql_from_item.select[j]
				const selectFromPrefix = single_query ? '' : `${sql_from_item.alias}.`;

				if (typeof sql_select_item == "string" ) {
					sqlBuilder.select(`${selectFromPrefix}${sql_select_item}`)
					continue;
				} else if (typeof sql_select_item == "object") {
					const { should_continue } = buildObjectTypeSelectItem.apply(this, [
						sqlBuilder,
						sql_select_item,
						single_query,
						sql_from_item,
						{ having, from_len }
					]);

					if (should_continue)
						continue ;
				} else if (typeof sql_select_item == "function") {
					const raw = sql_select_item(this.Dialect);

					sqlBuilder.select(this.Dialect.knex.raw(raw))

					continue;
				}
			}
		}

		if (sql_from.length > 0) {
			const single_query = sql_from.length == 1 && !this.sql.where_exists;
			if (single_query) {
				const isSubQuery = Helpers.isWrapperdSubQuerySelect(sql_from[0].table)
				const isKnexQuery = Helpers.maybeKnexRawOrQueryBuilder(sql_from[0].table)
				const table = Helpers.convertSqlFromTable(sql_from[0], this.knex, isSubQuery);

				if (!isSubQuery && !isKnexQuery) {
					sqlBuilder.from(table);
				} else {
					const alias = Helpers.pickAliasFromFromDescriptor(sql_from[0]);
					sqlBuilder.from(alias ? { [alias]: table } as any : table);
				}
			} else {
				const fromAliasDict: Record<string, FxSqlQuerySql.QueryFromDescriptor['table']> = {};
				for (let i = 0; i < sql_from.length; i++) {
					const sql_from_item = sql_from[i];
					
					const fallbackAlias = typeof sql_from_item.table == "string" ? sql_from_item.table : `t${i + 1}`;
					const alias = Helpers.pickAliasFromFromDescriptor(sql_from_item) || fallbackAlias;

					if (sql_from_item.joins?.length) { // from describe joins
						const join_obj: {[k: string]: string} = {};

						sql_from_item.joins.forEach(join_item => {
							join_obj[`${alias}.${join_item[0]}`] = `${join_item[1]}.${join_item[2]}`
						});

						const joinOperator = filterJoinOperator(sql_from_item.opts)

						sqlBuilder[joinOperator](
							`${sql_from_item.table} as ${Helpers.pickAliasFromFromDescriptor(sql_from_item)}`, join_obj
						)
					} else {
						fromAliasDict[alias] = Helpers.convertSqlFromTable(sql_from_item, this.knex);
					}
				}

				sqlBuilder.from(fromAliasDict as any);
			}
		}

		if (having.length > 0) {
		}

		Where.build(
			sqlBuilder,
			this.Dialect,
			this.sql.where,
			this.opts
		)

		if (this.sql.group_by !== null) {
			const _group_by = this.sql.group_by.map((column) => {
				if (column[0] == "-") {
					const cname = column.substr(1)
					this.sql.order.unshift({ c: cname, d: "DESC" });
					return cname;
				}
				return column;
			});

			sqlBuilder.groupBy(_group_by)
		}

		let ord;
		// order
		if (this.sql.order.length > 0) {
			for (let i = 0; i < this.sql.order.length; i++) {
				ord = this.sql.order[i];

				if (typeof ord == 'object') {
					// ord.c must be tuple [table, column]
					if (!Array.isArray(ord.c)) {
						sqlBuilder.orderBy(ord.c, ord.d)
					} else if (ord.c.length === 2) {
						sqlBuilder.orderBy(
							this.Dialect.knex.ref(ord.c[1]).withSchema(ord.c[0]) as any,
							// this.Dialect.escapeId.apply(this.Dialect, ord.c),
							ord.d
						)
					} else {
						throw `invalid order item input!`
					}
				} else if (typeof ord == 'string') {
					sqlBuilder.orderByRaw(ord)
				}
			}
		}

		// limit for all Dialects but MSSQL
		if (!this.Dialect.limitAsTop) {
			if (this.sql.hasOwnProperty("limit")) {
				if (this.sql.hasOwnProperty("offset")) {
					sqlBuilder.offset( Helpers.ensureNumber(this.sql.offset) )
				}

				sqlBuilder.limit( Helpers.ensureNumber(this.sql.limit) )
			} else if (this.sql.hasOwnProperty("offset")) {
				sqlBuilder.offset( Helpers.ensureNumber(this.sql.offset) )
			}
		}

		const sql = sqlBuilder.toQuery();

		// MYSQL specific.
		if (this.sql.found_rows)
			return sql.replace('select ', 'select SQL_CALC_FOUND_ROWS ')

		return sql;
	}

	abs (...args: any[]) { return this.get_aggregate_fun('ABS')(...args) }
	ceil (...args: any[]) { return this.get_aggregate_fun('CEIL')(...args) }
	floor (...args: any[]) { return this.get_aggregate_fun('FLOOR')(...args) }
	round (...args: any[]) { return this.get_aggregate_fun('ROUND')(...args) }
	avg (...args: any[]) { return this.get_aggregate_fun('AVG')(...args) }
	min (...args: any[]) { return this.get_aggregate_fun('MIN')(...args) }
	max (...args: any[]) { return this.get_aggregate_fun('MAX')(...args) }
	log (...args: any[]) { return this.get_aggregate_fun('LOG')(...args) }
	log2 (...args: any[]) { return this.get_aggregate_fun('LOG2')(...args) }
	log10 (...args: any[]) { return this.get_aggregate_fun('LOG10')(...args) }
	exp (...args: any[]) { return this.get_aggregate_fun('EXP')(...args) }
	power (...args: any[]) { return this.get_aggregate_fun('POWER')(...args) }
	acos (...args: any[]) { return this.get_aggregate_fun('ACOS')(...args) }
	asin (...args: any[]) { return this.get_aggregate_fun('ASIN')(...args) }
	atan (...args: any[]) { return this.get_aggregate_fun('ATAN')(...args) }
	cos (...args: any[]) { return this.get_aggregate_fun('COS')(...args) }
	sin (...args: any[]) { return this.get_aggregate_fun('SIN')(...args) }
	tan (...args: any[]) { return this.get_aggregate_fun('TAN')(...args) }
	conv (...args: any[]) { return this.get_aggregate_fun('CONV')(...args) }
	random (...args: any[]) { return this.get_aggregate_fun('RANDOM')(...args) }
	rand (...args: any[]) { return this.get_aggregate_fun('RAND')(...args) }
	radians (...args: any[]) { return this.get_aggregate_fun('RADIANS')(...args) }
	degrees (...args: any[]) { return this.get_aggregate_fun('DEGREES')(...args) }
	sum (...args: any[]) { return this.get_aggregate_fun('SUM')(...args) }
	count (...args: any[]) { return this.get_aggregate_fun('COUNT')(...args) }
	distinct (...args: any[]) { return this.get_aggregate_fun('DISTINCT')(...args) }
}

function filterJoinOperator (
	opts: FxSqlQuerySql.QueryFromDescriptor['opts'] | undefined
):  'join'
	| 'leftJoin'
	| 'leftOuterJoin'
	| 'rightJoin'
	| 'rightOuterJoin'
	| 'fullOuterJoin'
	| 'crossJoin'
{
	let { joinType = '' } = opts || {};
	joinType = (joinType || '').trim();

	joinType = joinType.toUpperCase()
	switch (joinType) {
		default:
		case 'FULL':
			return 'join';
		case 'LEFT':
		case 'LEFT INNER':
			return 'leftJoin';
		case 'LEFT OUTER JOIN':
			return 'leftOuterJoin';
		case 'RIGHT':
		case 'RIGHT INNER':
			return 'rightJoin';
		case 'RIGHT OUTER':
			return 'rightOuterJoin';
		case 'FULL OUTER':
			return 'fullOuterJoin';
		case 'CROSS':
			return 'crossJoin';
	}
}

function buildObjectTypeSelectItem (
	this: FxSqlQueryChainBuilder.ChainBuilder__Select,
	knexSqlBuilder: import('@fxjs/knex').Knex.QueryBuilder,
	sql_select_obj: FxSqlQuerySql.SqlSelectFieldItemDescriptor,
	single_query: boolean,
	sql_from_item: FxSqlQuerySql.QueryFromDescriptor,
	__helper_info: {
		having: string[],
		from_len: number
	}
): {
	should_continue: boolean,
	return_value: string
} {
	const alias = Helpers.pickAliasFromFromDescriptor(sql_from_item);

	const return_wrapper = {
		should_continue: false,
		return_value: ''
	};

	if (!sql_select_obj.func_name && sql_select_obj.column_name) {
		// TODO: use better normalization for whole sql_select_obj
		const col_name = sql_select_obj.column_name as FxSqlQuerySql.SqlFragmentStr
		
		const col_id = __helper_info.from_len > 1 ? `${alias}.${col_name}` : col_name;

		const _as = Helpers.pickColumnAsFromSelectFieldsDescriptor(sql_select_obj)
		if (_as) {
			knexSqlBuilder.select(
				this.Dialect.knex.ref(col_id).as(_as)
			)
		} else {
			knexSqlBuilder.select(col_id);
		}
	}

	if (sql_select_obj.having) {
	}

	if (sql_select_obj.select) {
		knexSqlBuilder.select(sql_select_obj.select)
	}

	if (sql_select_obj.func_name) {
		let func_col_raw = '';

		let column_descriptors = null;

		if (sql_select_obj.column_name) {
			column_descriptors = Array.isArray(sql_select_obj.column_name) ? sql_select_obj.column_name : [ sql_select_obj.column_name as string ];
		}
		if (Array.isArray(column_descriptors) && column_descriptors.length) {
			func_col_raw += column_descriptors.map((col_desc) => {
				if (!col_desc) {
					return this.Dialect.escapeVal(col_desc as string);
				}

				/* when col_desc is type:SqlColumnDescriptor */
				if (typeof col_desc === 'object' && typeof col_desc.type === "function") {
					switch (col_desc.type()) {
						/**
						 * @usage support usage like below:
						 *
						 * ```
						 * query.select().from('table1').fun('myfun', [ 'col1', common.Text('col2') ], 'alias')
						 * ```
						 */
						case "text":
							return this.Dialect.escapeVal(col_desc.data, this.opts.timezone);
						default:
							return col_desc;
					}
				} else if (typeof col_desc !== "string") {
					return col_desc;
				}

				if (single_query) {
					return this.Dialect.escapeId(col_desc);
				} else {
					return this.Dialect.escapeId(alias, col_desc);
				}
			}).join(", ");
		}

		if (!func_col_raw)
			func_col_raw = '*'

		if (!func_col_raw) {
			func_col_raw += `${sql_select_obj.func_name}(*)`;
		} else {
			func_col_raw = `${sql_select_obj.func_name}(${func_col_raw})`;
		}

		if (sql_select_obj.func_stack && sql_select_obj.func_stack.length > 0) {
			func_col_raw = sql_select_obj.func_stack.join("(") + "(" + func_col_raw +
					Array(sql_select_obj.func_stack.length + 1).join(")");
		}

		const _as = Helpers.pickColumnAsFromSelectFieldsDescriptor(sql_select_obj);
		if (_as)
			func_col_raw += ` as ${this.Dialect.escapeId(_as)}`

		knexSqlBuilder.select(
			this.Dialect.knex.raw(func_col_raw)
		)
	} else if (sql_select_obj.sql) {
		const _as = Helpers.pickColumnAsFromSelectFieldsDescriptor(sql_select_obj);

		const raw = this.Dialect.knex.raw(`${sql_select_obj.sql}${_as ? ` as ${this.Dialect.escapeId(_as)}` : ``}`);

		knexSqlBuilder.select( raw )
	} else {
	}

	return return_wrapper;
}
