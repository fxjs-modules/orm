export namespace FxSqlQueryComparator {
	export type IdType = string | number
	export type SimpleEqValueType = string | number | boolean | Date
	export type NormalizedInOperator = 'in' | 'not_in' | 'IN' | 'NOT_IN'

    export type InputValue_eq = { "eq": SimpleEqValueType }
    export type InputValue_ne = { "ne": SimpleEqValueType }
    export type InputValue_gt = { "gt": number }
    export type InputValue_gte = { "gte": number }
    export type InputValue_lt = { "lt": number }
    export type InputValue_lte = { "lte": number }
    export type InputValue_like = { "like": string }
    export type InputValue_not_like = { "not_like": string }
    export type InputValue_between = { "between": [number, number] }
    export type InputValue_not_between = { "not_between": [number, number] }

    export type InputValue_in = { "in": IdType[] }
	export type InputValue_not_in = { "not_in": IdType[] }

	export type InputComparatorObjectValue =
		InputValue_eq
		| InputValue_ne
		| InputValue_gt
		| InputValue_gte
		| InputValue_lt
		| InputValue_lte
		| InputValue_like
		| InputValue_not_like
		| InputValue_between
		| InputValue_not_between
		| InputValue_in
		| InputValue_not_in

	export type InputValueType =
		SimpleEqValueType | InputComparatorObjectValue

	export interface SubQueryComparatorInput {
		[k: string]: FxSqlQueryComparator.QueryComparatorObject
	}

	// compatible
	export interface SubQuerySimpleEqInput {
		[k: string]: SimpleEqValueType
	}

	export interface SubQueryInput {
		[k: string]: FxSqlQueryComparator.QueryComparatorObject | SimpleEqValueType
	}

	export interface Input {
		[key: string]: InputValueType
	}

	export type QueryComparatorExprType = string
	export type QueryComparatorObject<T = any> = {
		sql_comparator (): ComparatorNames
		// value
		val?: T
		// WIP: if use value as identifier
		// asIdentifier?: boolean
		// expression regular
		expr?: QueryComparatorExprType
		// from field
		from?: string
		// to field
		to?: string
	}
	export type SimpleQueryConjunctionWord_NonNegetive = "or" | "and"
	export type SimpleQueryConjunctionWord = SimpleQueryConjunctionWord_NonNegetive | "not"
	export type QueryConjunctionWord = SimpleQueryConjunctionWord | "not_or" | "not_and"

	export interface QueryComparatorLiteralObject {
		between: any | any[]
		not_between: any | any[]
		like: any | any[]
		not_like: any | any[]
		eq: any | any[]
		ne: any | any[]
		gt: any | any[]
		gte: any | any[]
		lt: any | any[]
		lte: any | any[]
		in: any | any[]
		not_in: any | any[]

		modifiers?: {
			is_date?: boolean
			// timezone?: FxSqlQuery.FxSqlQueryTimezone

			[modifier_name: string]: any
		}
	}

	export type ComparatorHash = {
		between: FxSqlQueryComparatorFunction.between
		not_between: FxSqlQueryComparatorFunction.not_between
		like: FxSqlQueryComparatorFunction.like
		not_like: FxSqlQueryComparatorFunction.not_like
		eq: FxSqlQueryComparatorFunction.eq
		ne: FxSqlQueryComparatorFunction.ne
		gt: FxSqlQueryComparatorFunction.gt
		gte: FxSqlQueryComparatorFunction.gte
		lt: FxSqlQueryComparatorFunction.lt
		lte: FxSqlQueryComparatorFunction.lte
		in: FxSqlQueryComparatorFunction.not_in
		not_in: FxSqlQueryComparatorFunction.not_in
	}

	export type ComparatorNameType = keyof ComparatorHash
	// just compatible
	export type ComparatorNames = ComparatorNameType

	export type QueryComparatorType =
		ComparatorNameType
		| 'sql'
}

export namespace FxSqlQueryComparatorFunction {
	export interface between {
		(a: string, b: string): FxSqlQueryComparator.QueryComparatorObject
	}
	export interface not_between {
		(a: string, b: string): FxSqlQueryComparator.QueryComparatorObject
	}
	export interface like {
		(expr: FxSqlQueryComparator.QueryComparatorExprType): FxSqlQueryComparator.QueryComparatorObject
	}
	export interface not_like {
		(expr: FxSqlQueryComparator.QueryComparatorExprType): FxSqlQueryComparator.QueryComparatorObject
	}
	export interface eq {
		(v: any): FxSqlQueryComparator.QueryComparatorObject
	}
	export interface ne {
		(v: any): FxSqlQueryComparator.QueryComparatorObject
	}
	export interface gt {
		(v: any): FxSqlQueryComparator.QueryComparatorObject
	}
	export interface gte {
		(v: any): FxSqlQueryComparator.QueryComparatorObject
	}
	export interface lt {
		(v: any): FxSqlQueryComparator.QueryComparatorObject
	}
	export interface lte {
		(v: any): FxSqlQueryComparator.QueryComparatorObject
	}
	export interface not_in {
		(v: any): FxSqlQueryComparator.QueryComparatorObject
	}
}
