import Helpers = require('./Helpers');
import ComparatorsHash = require('./Comparators');

import { FxSqlQuerySubQuery } from './Typo/SubQuery';
import { FxSqlQuerySql } from './Typo/Sql';
import { FxSqlQueryDialect } from './Typo/Dialect';
import { FxSqlQueryChainBuilder } from './Typo/Query-ChainBuilder';
import { FxSqlQueryComparator } from './Typo/Comparators';

export function build (
	knexQueryBuilder: import('@fxjs/knex').Knex.QueryBuilder,
	Dialect: FxSqlQueryDialect.Dialect,
	whereList: FxSqlQuerySubQuery.SubQueryBuildDescriptor[],
	opts: FxSqlQueryChainBuilder.ChainBuilderOptions
): void {
	if (whereList.length === 0) {
		return ;
	}

	for (let i = 0; i < whereList.length; i++) {
		buildOrGroup(knexQueryBuilder, Dialect, whereList[i], opts);
	}
};

const WHERE_CONJUNCTIONS = [ "or", "and", "not_or", "not_and", "not" ];
const NOT_PREFIX_LEN = 'not_'.length;

function isKeyConjunctionNot (k: string) {
	return k.indexOf("_") >= 0
}

type SelectedWhereOperator =
	'where'
	| 'andWhere'
	| 'orWhere'
	| 'whereNot'
	| 'andWhereNot'
	| 'orWhereNot'
	| 'whereRaw'
	| 'orWhereRaw'
	| 'andWhereRaw'
	| 'whereWrapped'
	| 'havingWrapped'
	| 'whereExists'
	| 'orWhereExists'
	| 'whereNotExists'
	| 'orWhereNotExists'
	| 'whereIn'
	| 'orWhereIn'
	| 'whereNotIn'
	| 'orWhereNotIn'
	| 'whereNull'
	| 'orWhereNull'
	| 'whereNotNull'
	| 'orWhereNotNull'
	| 'whereBetween'
	| 'orWhereBetween'
	| 'andWhereBetween'
	| 'whereNotBetween'
	| 'orWhereNotBetween'
	| 'andWhereNotBetween'

function buildOrGroup(
	knexQueryBuilder: import('@fxjs/knex').Knex.QueryBuilder,
	Dialect: FxSqlQueryDialect.Dialect,
	where: FxSqlQuerySubQuery.SubQueryBuildDescriptor,
	opts: FxSqlQueryChainBuilder.ChainBuilderOptions,
	nextPrefixedOpWord?: FxSqlQueryComparator.QueryConjunctionWord,
	innerInfo?: {
		innerOperator?: SelectedWhereOperator,
		innerSuffix?: SelectedWhereSuffix,
		innerPrefix?: SelectedWherePrefix,
	}
): FxSqlQuerySql.SqlFragmentStr[] | FxSqlQuerySql.SqlResultStr | false {
	opts = opts || {};

	if (where.exists) {
		buildExistsSqlFragments(knexQueryBuilder, Dialect, where, opts);
		return ;
	}

	let query: string[] = [],
		op: FxSqlQueryComparator.QueryComparatorType,
		transformed_result_op: string = op;

	for (let k in where.wheres) {
		let where_conditem_value = where.wheres[k];
		if (where_conditem_value === null || where_conditem_value === undefined) {
			// ? in subquery
			knexQueryBuilder.whereNull(k);
			continue;
		}
		// `not` is an alias for `not_and`
		if (isConjunctionWhereConditionInput(k, where_conditem_value)) {
			let conjunctionWord = (k.toLocaleLowerCase() as FxSqlQueryComparator.QueryConjunctionWord);

			/**
			 * @values FxSqlQueryComparator.QueryConjunctionWord
			 */
			transformed_result_op = (k == "not" ? "and" : (isKeyConjunctionNot(k) ? k.substr(NOT_PREFIX_LEN) : k)).toUpperCase();

			const conjunction_where_list = where_conditem_value;

			let {
				nextOperator: parentConjuncWhereClosureOperator,
			} = selectWhereOperatorByCtx(nextPrefixedOpWord);

			let {
				nextOperator: wrapperConjuncWhereClosureOperator,
				conjunction: innerConjunction,
				suffix: innerSuffix,
			} = selectWhereOperatorByCtx(conjunctionWord);

			if (wrapperConjuncWhereClosureOperator === 'whereNot')
				wrapperConjuncWhereClosureOperator = selectWhereOperatorByCtx('not', innerSuffix, innerConjunction).nextOperator


			const p_call = function (cb: Function) {
				knexQueryBuilder[ parentConjuncWhereClosureOperator ].call(
					knexQueryBuilder,
					cb
				)
			}

			const loop_inner_call = function () {
				const innerOperator = selectWhereOperatorByCtx(undefined, innerSuffix, innerConjunction).nextOperator

				for (let j = 0; j < conjunction_where_list.length; j++) {
					const conj_c = conjunction_where_list[j];

					this[ wrapperConjuncWhereClosureOperator ].call(
						this,
						function () {
							buildOrGroup(
								this,
								Dialect,
								{ table: where.table, wheres: conj_c },
								opts,
								null,
								{
									innerOperator: j === 0 ? undefined : innerOperator
								}
							);
						}
					)
				}
			}

			p_call(loop_inner_call);

			continue;
		}

		let {
			innerOperator = 'where' as SelectedWhereOperator,
		} = innerInfo || {};

		const normalizedKey = getComparisonKey(Dialect, where.table, k);

		let non_conj_where_conditem_value: FxSqlQuerySubQuery.NonConjunctionInputValue
			= transformSqlComparatorLiteralObject(where_conditem_value) || where_conditem_value;

		if (isSqlComparatorPayload(non_conj_where_conditem_value)) {
			op = non_conj_where_conditem_value.sql_comparator();

			switch (op) {
				case "between":
					innerOperator = selectWhereOperatorByCtx(nextPrefixedOpWord, 'between').nextOperator
					knexQueryBuilder[innerOperator].call(knexQueryBuilder, normalizedKey, [non_conj_where_conditem_value.from, non_conj_where_conditem_value.to])
					break;
				case "not_between":

					innerOperator = selectWhereOperatorByCtx(nextPrefixedOpWord, 'notBetween').nextOperator
					knexQueryBuilder[innerOperator].call(knexQueryBuilder, normalizedKey, [non_conj_where_conditem_value.from, non_conj_where_conditem_value.to])
					break;
				case "like":
					innerOperator = innerOperator || selectWhereOperatorByCtx(nextPrefixedOpWord).nextOperator
					knexQueryBuilder[innerOperator].call(knexQueryBuilder, normalizedKey, 'like', Helpers.escapeValForKnex(non_conj_where_conditem_value.expr, Dialect, opts))
					break;
				case "not_like":
					innerOperator = innerOperator || selectWhereOperatorByCtx(nextPrefixedOpWord).nextOperator
					knexQueryBuilder[innerOperator].call(knexQueryBuilder, normalizedKey, 'not like', Helpers.escapeValForKnex(non_conj_where_conditem_value.expr, Dialect, opts))
					break;
				case "eq":
				case "ne":
				case "gt":
				case "gte":
				case "lt":
				case "lte":
				case "in":
				case "not_in":
					switch (op) {
						case "eq"  : transformed_result_op = (non_conj_where_conditem_value.val === null ? "IS" : "="); break;
						case "ne"  : transformed_result_op = (non_conj_where_conditem_value.val === null ? "IS NOT" : "<>"); break;
						case "gt"  : transformed_result_op = ">";  break;
						case "gte" : transformed_result_op = ">="; break;
						case "lt"  : transformed_result_op = "<";  break;
						case "lte" : transformed_result_op = "<="; break;
						case "in"  : transformed_result_op = "IN"; break;
						case "not_in" : transformed_result_op = "NOT IN"; break;
					}

					if (!isInStyleOperator(op, non_conj_where_conditem_value)) {
						innerOperator = innerOperator || selectWhereOperatorByCtx(nextPrefixedOpWord).nextOperator
						knexQueryBuilder[innerOperator].call(knexQueryBuilder, normalizedKey, transformed_result_op, Helpers.escapeValForKnex(non_conj_where_conditem_value.val, Dialect, opts))
					} else {
						innerOperator = innerOperator || selectWhereOperatorByCtx(nextPrefixedOpWord).nextOperator
						knexQueryBuilder[innerOperator].call(knexQueryBuilder, normalizedKey, transformed_result_op, Helpers.escapeValForKnex(non_conj_where_conditem_value.val, Dialect, opts))
					}

					break;
			}
			continue;
		}

		if (isUnderscoreSqlInput(k, non_conj_where_conditem_value)) {
			if (
				!Array.isArray(non_conj_where_conditem_value)
				|| (non_conj_where_conditem_value[0] && non_conj_where_conditem_value[0].length < 1)
			) {
				throw new Error(`invalid value for ${k}, expected its 2 dimension array like __sql: [ ['expr with ? or ??', ['value', 'id']], ['SQL'], ... ]`)
			}
			for (let i = 0; i < non_conj_where_conditem_value.length; i++) {
				knexQueryBuilder.whereRaw(
					normalizeSqlConditions(Dialect, non_conj_where_conditem_value[i])
				)
			}
		} else {
			/**
			 * array as 'IN'
			 */
			if (Array.isArray(non_conj_where_conditem_value)) {
				innerOperator = selectWhereOperatorByCtx(nextPrefixedOpWord, 'in').nextOperator
				knexQueryBuilder[innerOperator].call(knexQueryBuilder, normalizedKey, Helpers.escapeValForKnex(non_conj_where_conditem_value, Dialect, opts))
			} else { // finally, simplest where-equal
				const simple_value = non_conj_where_conditem_value as any

				innerOperator = innerOperator || selectWhereOperatorByCtx(nextPrefixedOpWord).nextOperator

				knexQueryBuilder[innerOperator].call(knexQueryBuilder, normalizedKey, Helpers.escapeValForKnex(simple_value, Dialect, opts))
			}
		}
	}

	if (query.length === 0) {
		return false;
	}

	return query.join(" AND ");
}

type SelectedWhereSuffix = 'null' | 'between' | 'notBetween' | 'in' | 'notIn'
type SelectedWherePrefix = 'or' | 'and'

function selectWhereOperatorByCtx (
	conjunctionWord: FxSqlQueryComparator.QueryConjunctionWord,
	suffix?: SelectedWhereSuffix,
	prefix?: SelectedWherePrefix
): {
	nextOperator: SelectedWhereOperator,
	conjunction: FxSqlQueryComparator.SimpleQueryConjunctionWord_NonNegetive,
	suffix?: SelectedWhereSuffix,
	prefix?: SelectedWherePrefix
} {
	const result = {
		nextOperator: 'where' as SelectedWhereOperator,
		conjunction: 'and' as FxSqlQueryComparator.SimpleQueryConjunctionWord_NonNegetive,
		suffix: undefined as SelectedWhereSuffix,
		prefix: undefined as SelectedWherePrefix,
	};

	switch (conjunctionWord) {
		case 'not_and':
		case 'not':
			result.nextOperator = 'whereNot'
			result.conjunction = 'and'
			break
		case 'and':
			result.nextOperator = 'where'
			break
		case 'or':
			result.nextOperator = 'orWhere'
			result.conjunction = 'or'
			break
		case 'not_or':
			result.nextOperator = 'whereNot'
			result.conjunction = 'or'
			break
		default:
			result.nextOperator = 'where'
			break
	}

	if (result.suffix = suffix)
		result.nextOperator = `${result.nextOperator}${Helpers.ucfirst(suffix)}` as SelectedWhereOperator

	if (result.prefix = prefix)
		result.nextOperator = `${prefix}${Helpers.ucfirst(result.nextOperator)}` as SelectedWhereOperator

	return result
}

function buildExistsSqlFragments (
	knexQueryBuilder: import('@fxjs/knex').Knex.QueryBuilder,
	Dialect: FxSqlQueryDialect.Dialect,
	where: FxSqlQuerySubQuery.SubQueryBuildDescriptor,
	opts: FxSqlQueryChainBuilder.ChainBuilderOptions
) {
	/* start of deal with case `whereExists` */
	const link_table = where.exists.table_linked;

	knexQueryBuilder.whereExists(function () {
		this.select('*')
			.from(where.exists.table)

		/**
		 * @example whereExists('table2', 'table1', [['fid1', 'fid2'], ['id1', 'id2']], { col1: 1, col2: 2 })
		 */
		if (Array.isArray(where.exists.link_info[0]) && Array.isArray(where.exists.link_info[1])) {
			const col_tuple_for_aligning_from = where.exists.link_info[0];
			const col_tuple_for_aligning_to = where.exists.link_info[1];

			for (let i = 0; i < col_tuple_for_aligning_from.length; i++) {
				this.where(
					// `${col_tuple_for_aligning_from}.${col_tuple_for_aligning_from[i]}`,
					`${col_tuple_for_aligning_from[i]}`,
					Dialect.knex.ref(col_tuple_for_aligning_to[i]).withSchema(link_table)
				)
			}
		} else {
			const [table_from, table_to] = where.exists.link_info
			/**
			 * @example whereExists('table2', 'table1', ['fid', 'id'], { col1: 1, col2: 2 })
			 */
			if (table_from && table_to) {
				this.where(
					// `${where.exists.table}.${table_from}`,
					`${table_from}`,
					Dialect.knex.ref(table_to).withSchema(link_table)
				)
			}
		}

		buildOrGroup(this, Dialect, { table: null, wheres: where.wheres }, opts)
	});
}

function getComparisonKey(Dialect: FxSqlQueryDialect.Dialect, table: string, column: string) {
	if (!table)
		return column;

	return Dialect.knex.ref(column).withSchema(table);
}

function normalizeSqlConditions(Dialect: FxSqlQueryDialect.Dialect, queryArray: FxSqlQuerySql.SqlAssignmentTuple) {
	if (queryArray.length == 1) {
		return queryArray[0];
	}
	return Helpers.escapeQuery(Dialect, queryArray[0], queryArray[1]);
}

function isSqlComparatorPayload (
	non_special_kv: FxSqlQuerySubQuery.NonConjunctionInputValue
): non_special_kv is FxSqlQuerySql.DetailedQueryWhereCondition {
	if (typeof non_special_kv !== 'object') return false;
	if (! ('sql_comparator' in non_special_kv)) return false;

	return typeof non_special_kv.sql_comparator === "function"
}

function transformSqlComparatorLiteralObject (
	non_special_kv: FxSqlQuerySubQuery.NonConjunctionInputValue,
): false | FxSqlQueryComparator.QueryComparatorObject {
	if (typeof non_special_kv !== 'object') return false;

	const keys = Object.keys(non_special_kv) as [FxSqlQueryComparator.ComparatorNameType]
	const op: FxSqlQueryComparator.ComparatorNameType = keys.find(k => k in ComparatorsHash);

	if (!op)
		return false;

	const literal_kv = non_special_kv as FxSqlQueryComparator.QueryComparatorLiteralObject;
	const modifiers = literal_kv.modifiers = literal_kv.modifiers || {};

	const fn = ComparatorsHash[op] as FxSqlQueryComparator.ComparatorHash[FxSqlQueryComparator.ComparatorNameType]

	let input = literal_kv[op];
	// non in-style tuple op contains: `between`, `not_between`
	const is_in_style = ['not_in', 'in'].includes(op);
	const in_input_arr = Array.isArray(input);
	if (modifiers.is_date) {
		let to_filter = in_input_arr ? input : [input]
		const args_0 = (to_filter)
			.map((x: any) => new Date(x))
			.filter((x: Date) => x + '' !== 'Invalid Date')

		if (args_0.length === to_filter.length) {
			to_filter = args_0
			input = in_input_arr ? to_filter : to_filter[0]
		}
	}

	const apply_args = in_input_arr && !is_in_style ? input : [input];
	const result = fn.apply(null, apply_args);

	return result;
}

function isConjunctionWhereConditionInput (
	k: string,
	where_conditem_value: FxSqlQuerySubQuery.SubQueryBuildDescriptor['wheres'][string]
): where_conditem_value is FxSqlQuerySubQuery.ConjunctionInputValue {
	return WHERE_CONJUNCTIONS.indexOf(k) >= 0;
}

function isUnderscoreSqlInput (
	k: string,
	where_conditem_value: FxSqlQuerySubQuery.SubQueryBuildDescriptor['wheres'][string]
): where_conditem_value is FxSqlQuerySubQuery.UnderscoreSqlInput {
	return k === '__sql';
}

function isInStyleOperator (
	op: string,
	where_conditem_value: FxSqlQuerySql.DetailedQueryWhereCondition<any>
): where_conditem_value is FxSqlQuerySql.DetailedQueryWhereCondition__InStyle {
	return !!~['in', 'not_in'].indexOf(op);
}
