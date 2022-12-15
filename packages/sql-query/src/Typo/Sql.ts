import { FxSqlAggregation } from "./Aggregation"
import { FxSqlQueryComparator } from "./Comparators"
import { FxSqlQueryDialect } from "./Dialect"
import { FxSqlQueryHelpler } from "./Helper"
import { FxSqlQuerySubQuery } from "./SubQuery"
import { FxSqlQuery } from './Query'

export namespace FxSqlQuerySql {
	// type ValueToSet = (string|number)
	export type DataToSet = {
		[key: string]: any
	}

	export type SqlResultStr = string
	export type SqlFragmentStr = string
	export type SqlQueryStr = string

	export type SqlEscapeArgType = string | number | boolean | Date | String | Number | RegExp | Symbol
	export type SqlEscapeArgIdType = string | number

	export type SqlAssignmentValues = SqlEscapeArgType[]
	export type SqlAssignmentTuple = [FxSqlQuerySql.SqlFragmentStr, [...SqlAssignmentValues]?]

	export type SqlTableRaw = string
	export type SqlTableAliasRaw = string
	export type SqlTableTuple = [string, string]
	export type SqlTableInputType = SqlTableRaw | SqlTableAliasRaw | SqlTableTuple

	export type WhereObj = {
		str: string
		escapes: any[]
	}

	// ['f1', 'f2'] ---> (`t1.f1` = `t2.f2`)
	export type WhereExistsLinkTuple_L1 = FxSqlQueryHelpler.BinaryTuple<string>
	// [['f1', 'f2'[, ...]], ['ff1', 'ff2'[, ...]]] ---> (`t1.f1` = `t2.f2`) AND (`t1.ff1` = `t2.ff2`) [...]
	export type WhereExistsLinkTuple_L2 = FxSqlQueryHelpler.BinaryTuple<string[]>
	export type WhereExistsLinkTuple = WhereExistsLinkTuple_L1 | WhereExistsLinkTuple_L2

	export interface DetailedQueryWhereCondition<T = any> extends FxSqlQueryComparator.QueryComparatorObject<T> {
		// from table name
		from: string
		// target table name
		to: string
		expr: FxSqlQueryComparator.QueryComparatorExprType
		val: T
		where: WhereObj
	}
	export type DetailedQueryWhereCondition__InStyle = DetailedQueryWhereCondition<
		FxSqlQueryComparator.InputValue_in['in'] | FxSqlQueryComparator.InputValue_not_in['not_in']
	>

	export interface QueryWhereConjunctionHash {
		or?: FxSqlQueryComparator.Input[]
		and?: FxSqlQueryComparator.Input[]
		not_or?: FxSqlQueryComparator.Input[]
		not_and?: FxSqlQueryComparator.Input[]
		not?: FxSqlQueryComparator.Input[]
	}

	export interface QueryWhereExtendItem {
		// table
		table: string
		// link
		link_info: FxSqlQueryHelpler.Arraiable<any>
		// table linked
		table_linked: string
	}

	export type SqlColumnDescriptorDataType = any
	export interface SqlColumnDescriptor {
		data: SqlColumnDescriptorDataType,
		type? (): string
	}

	export type NormalizedSimpleSqlColumnType = string | '*'
	export type SqlColumnType = (SqlColumnDescriptor|string)[] | NormalizedSimpleSqlColumnType

	// item to describe what columns to select
	export interface SqlSelectFieldItemDescriptor {
		/**
		 * @description fun name
		 */
		func_name?: string
		/**
		 * @description column name
		 * expect NO table prefix
		 * 
		 * ```
		 * recommended: `col`
		 * ```
		 * 
		 * but this allowed also
		 * 
		 * ```
		 * allowed also: `table.col`
		 * ````
		 * 
		 */
		column_name?: SqlColumnType
		/**
		 * @description column as
		 */
		as?: FxSqlQuerySql.NormalizedSimpleSqlColumnType,
		a?: SqlSelectFieldItemDescriptor['as'],
		/**
		 * @description fun_stack
		 */
		func_stack?: FxSqlAggregation.SupportedAggregationFunction[]
		/**
		 * @description pure sql
		 */
		sql?: string

		/**
		 * @description GUESS: useful when this object refer to one complex descriptor?
		 */
		select?: string
		/**
		 * @description having sub query statement
		 */
		having?: string
	}

	export interface SqlSelectFieldsGenerator {
		(dialect: FxSqlQueryDialect.Dialect): string
	}
	export type SqlSelectFieldsType = SqlFragmentStr | SqlSelectFieldItemDescriptor | SqlSelectFieldsGenerator

	export interface QueryFromDescriptorOpts {
		joinType: string
	}

	export interface QueryFromDescriptor {
		// table
		table: string
		// table alias
		alias: string, a?: string
		// ?
		joins?: QueryFromJoinTupleDescriptor[]
		// selected fields
		select?: SqlSelectFieldsType[]
		// from opts
		opts?: QueryFromDescriptorOpts
	}

	export type QueryFromJoinTupleDescriptor = [
		// from id column name
		string,
		// to table alias name
		string,
		// to id column name
		string,
	]

	export type SqlTableOrderTuple = [
		// table(alias) name
		string,
		// column name
		string
	]
	export interface SqlOrderDescriptor {
		// column name or SqlTableOrderTuple
		c: string | SqlTableOrderTuple
		// order
		d: 'DESC' | 'ASC'
	}
	export type SqlOrderPayloadType = SqlOrderDescriptor | FxSqlQuery.OrderSqlStyleTuple[0]

	export type SqlGroupByType = string

	export interface SqlFoundRowItem {
		[k: string]: any
	}

	// type SqlQueryDescriptorWhereItem = SqlWhereDescriptor | string

	export interface SqlQueryChainDescriptor {
		from?: QueryFromDescriptor[]
		table?: string
		// values to set in UPDATE like command
		set?: DataToSet
		where?: FxSqlQuerySubQuery.SubQueryBuildDescriptor[]
		order?: SqlOrderPayloadType[]
		offset?: number
		limit?: number

		found_rows?: SqlFoundRowItem[] | boolean
		group_by?: SqlGroupByType[]

		where_exists?: boolean
	}
}
