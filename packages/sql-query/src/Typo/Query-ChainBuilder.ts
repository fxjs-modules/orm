import { FxSqlQuery } from "./Query"
import { FxSqlQuerySql } from "./Sql"
import { FxSqlAggregation } from "./Aggregation"
import { FxSqlQueryDialect } from "./Dialect"
import { FxSqlQueryColumns } from "./Field"
import { FxSqlQuerySubQuery } from "./SubQuery"
import { FxSqlQueryHelpler } from "./Helper"

export namespace FxSqlQueryChainBuilder {
	export type QueryWhereConditionPayloadUnit = FxSqlQuerySql.DetailedQueryWhereCondition | string | null

	export interface ChainBuilderOptions extends FxSqlQuery.QueryOptions {}

	export interface ChainBuilder {
		readonly knex: FxSqlQuery.Class_Query['knex']
		build(): string
	}

	export interface ChainBuilderPaginationMixin {
		offset(offset: number): this
		limit(limit: number|string): this
	}

	export interface ChainBuilderSortMixin {
		/**
		 *
		 * @param column
		 * @param dir
		 *
		 * @sample
		 * .order('col1', 'Z')
		 * .order(['table1', 'col1'], 'A')
		 * .order('ID DESC')
		 * .order('?? DESC', ['ID'])
		 */
		order(column: FxSqlQuery.OrderNormalizedResult[0], dir?: FxSqlQuery.OrderNormalizedResult[1]): this
	}

	export type ChainBuilder__SelectAggregationFunColumnArg = (string | string[])[]
	export interface ChainBuilder__Select
		extends ChainBuilder, FxSqlAggregation.SupportedAggregationsMixin, ChainBuilderPaginationMixin, ChainBuilderSortMixin
	{
		Dialect: FxSqlQueryDialect.Dialect

		select: (fields: FxSqlQueryColumns.SelectInputArgType[]) => this
		/**
		 * .where('table1', {t1_col1: 'v1'}, 'table2', {t1_col2: 'v2'}, ...)
		 * .where({__sql: 'xxx'})
		 * .where({col1: 'v1', col1: 'v1'})
		 * .where(not: [ { col: 2 }, { col: 3 } ])
		 */
		where: (...whereConditions: (FxSqlQuerySubQuery.SubQueryBuildDescriptor['wheres'] | FxSqlQuerySubQuery.WhereExistsTuple_Flatten[0])[]) => this
		whereExists: (
			table: string,
			table_link: string,
			link: FxSqlQuerySql.WhereExistsLinkTuple,
			cond: FxSqlQuerySubQuery.SubQueryBuildDescriptor['wheres']
		) => this
		groupBy: (...args: FxSqlQuerySql.SqlGroupByType[]) => this
		fun: (fun: string, column?: FxSqlQuerySql.SqlColumnType, _as?: string) => this
		from: {
			/**
			 * @warning can be only used in first call!
			 */
			(table: FxSqlQuerySql.SqlTableInputType): ChainBuilder__Select
			(
				table: FxSqlQuerySql.SqlTableInputType,
				from_id: FxSqlQueryHelpler.Arraiable<string>,
				to_id: FxSqlQueryHelpler.Arraiable<string>
			): ChainBuilder__Select
			(
				table: FxSqlQuerySql.SqlTableInputType,
				from_id: FxSqlQueryHelpler.Arraiable<string>,
				to_table: string,
				to_id: FxSqlQueryHelpler.Arraiable<string>,
				fromOpts?: FxSqlQuerySql.QueryFromDescriptorOpts
			): ChainBuilder__Select
		}

		[extra: string]: any
	}
	export interface ChainBuilder__Insert extends ChainBuilder {
		into(table: string): this | ChainBuilder__Insert
		set(values: FxSqlQuerySql.DataToSet): this | ChainBuilder__Insert
	}

	export interface ChainBuilder__Create extends ChainBuilder {
		table(table: string): this | ChainBuilder__Create
		field(table: string, type: FxSqlQueryDialect.DialectFieldType): this | ChainBuilder__Create

		fields: {
			(): FxSqlQueryColumns.FieldItemTypeMap
			(fields: FxSqlQueryColumns.FieldItemTypeMap): ChainBuilder__Create
		}
	}

	export interface ChainBuilder__Update extends ChainBuilder {
		where: (...whereConditions: FxSqlQuerySubQuery.SubQueryBuildDescriptor['wheres'][]) => ChainBuilder__Update
		into(table: string): this | ChainBuilder__Update
		set(values: FxSqlQuerySql.DataToSet): this | ChainBuilder__Update
	}

	export interface ChainBuilder__Remove
		extends ChainBuilder, ChainBuilderPaginationMixin
	{
		order(column: string, dir: FxSqlQuery.QueryOrderDirection): this
		where: (...whereConditions: FxSqlQuerySubQuery.SubQueryBuildDescriptor['wheres'][]) => this
		from(table: string): this
	}
}
