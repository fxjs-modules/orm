/// <reference types="@fxjs/knex" />

import { FxSqlQueryDialect } from "./Dialect"
import { FxSqlQueryChainBuilder } from "./Query-ChainBuilder"
import { FxSqlQuerySql } from './Sql'

export namespace FxSqlQuery {
    export type OrderNormalizedTuple = [string|string[], "Z" | "A"]
    export type OrderSqlStyleTuple = [FxSqlQuerySql.SqlFragmentStr, FxSqlQuerySql.SqlAssignmentValues?]
    export type OrderNormalizedResult = OrderNormalizedTuple | OrderSqlStyleTuple

	export interface QueryOptions {
		dialect?: FxSqlQueryDialect.DialectType /*  | string */
		timezone?: FxSqlQueryTimezone
	}

	export type QueryOrderDirection =
		// Z means 'z->a'
		'Z'
		// other string means 'a->z'
		| 'A'
		| string

	export type FxSqlQueryTimezone =
		'Z'
		| 'local'
		| string

	export interface TypedQueryObject<T = 'text' | string, TD = any> {
		data: TD
		type(): T
	}
	export interface TypedQueryObjectWrapper<T = 'text' | string, TD = any> {
		(data: TD): FxSqlQuery.TypedQueryObject<T, TD>
	}

	export declare class Class_Query {
		constructor (_opts?: string | FxSqlQuery.QueryOptions);

		/* @internal */
		readonly knex: FxSqlQueryDialect.Dialect['knex']
		readonly Dialect: FxSqlQueryDialect.Dialect

		escape: FxSqlQueryDialect.Dialect['escape']
		escapeId: FxSqlQueryDialect.Dialect['escapeId']
		escapeVal: FxSqlQueryDialect.Dialect['escapeVal']

		create (): FxSqlQueryChainBuilder.ChainBuilder__Create
		select (): FxSqlQueryChainBuilder.ChainBuilder__Select
		insert (): FxSqlQueryChainBuilder.ChainBuilder__Insert
		update (): FxSqlQueryChainBuilder.ChainBuilder__Update
		remove (): FxSqlQueryChainBuilder.ChainBuilder__Remove
	}

	// interface ExportModule {
	// 	comparators: FxSqlQueryComparator.ComparatorHash
	// 	Text: FxSqlQuery.TypedQueryObjectWrapper<'text'>
	// 	Helpers: FxSqlQueryHelpler.HelperModule

	// 	Dialects: {
	// 		mysql: FxSqlQueryDialect.Dialect
	// 		sqlite: FxSqlQueryDialect.Dialect
	// 		mssql: FxSqlQueryDialect.Dialect
	// 	}
	// 	Query: typeof FxSqlQuery.Class_Query
	// }
}
