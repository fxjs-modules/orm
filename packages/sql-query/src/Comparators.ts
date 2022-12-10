import { FxSqlQueryComparator, FxSqlQueryComparatorFunction } from "./Typo/Comparators";

type FuncOpts = FxSqlQueryComparatorFunction.__Options;
type between = FxSqlQueryComparatorFunction.between
function between (a: string, b: string, opts?: FuncOpts) {
	return createSpecialObject({
		from: a, to: b, asIdentifier: !!opts?.asIdentifier
	}, 'between');
};

type not_between = FxSqlQueryComparatorFunction.not_between
function not_between (a: string, b: string, opts?: FuncOpts) {
	return createSpecialObject({
		from: a, to: b, asIdentifier: !!opts?.asIdentifier
	}, 'not_between');
};

type like = FxSqlQueryComparatorFunction.like
function like (expr: FxSqlQueryComparator.QueryComparatorExprType, opts?: FuncOpts) {
	return createSpecialObject({
		expr: expr, asIdentifier: !!opts?.asIdentifier
	}, 'like');
};

type not_like = FxSqlQueryComparatorFunction.not_like
function not_like (expr: FxSqlQueryComparator.QueryComparatorExprType, opts?: FuncOpts) {
	return createSpecialObject({
		expr: expr, asIdentifier: !!opts?.asIdentifier
	}, 'not_like');
};


type eq = FxSqlQueryComparatorFunction.eq
function eq (v: any, opts?: FuncOpts) {
	return createSpecialObject({
		val: v, asIdentifier: !!opts?.asIdentifier
	}, 'eq');
};

type ne = FxSqlQueryComparatorFunction.ne
function ne (v: any, opts?: FuncOpts) {
	return createSpecialObject({
		val: v, asIdentifier: !!opts?.asIdentifier
	}, 'ne');
};

type gt = FxSqlQueryComparatorFunction.gt
function gt (v: any, opts?: FuncOpts) {
	return createSpecialObject({
		val: v, asIdentifier: !!opts?.asIdentifier
	}, 'gt');
};

type gte = FxSqlQueryComparatorFunction.gte
function gte (v: any, opts?: FuncOpts) {
	return createSpecialObject({
		val: v, asIdentifier: !!opts?.asIdentifier
	}, 'gte');
};

type lt = FxSqlQueryComparatorFunction.lt
function lt (v: any, opts?: FuncOpts) {
	return createSpecialObject({
		val: v, asIdentifier: !!opts?.asIdentifier
	}, 'lt');
};

type lte = FxSqlQueryComparatorFunction.lte
function lte (v: any, opts?: FuncOpts) {
	return createSpecialObject({
		val: v, asIdentifier: !!opts?.asIdentifier
	}, 'lte');
};

type _in = FxSqlQueryComparatorFunction.not_in
function _in (v: any, opts?: FuncOpts) {
	return createSpecialObject({
		val: v, asIdentifier: !!opts?.asIdentifier
	}, 'in');
};

type not_in = FxSqlQueryComparatorFunction.not_in
function not_in (v: any, opts?: FuncOpts) {
	return createSpecialObject({
		val: v, asIdentifier: !!opts?.asIdentifier
	}, 'not_in');
};

export = {
	between,
	not_between,
	like,
	not_like,
	eq,
	ne,
	gt,
	gte,
	lt,
	lte,
	in: _in,
	not_in,
} as FxSqlQueryComparator.ComparatorHash

function createSpecialObject(
	obj: object,
	tag: FxSqlQueryComparator.QueryComparatorType,
): FxSqlQueryComparator.QueryComparatorObject {
	Object.defineProperty(obj, "sql_comparator", {
		configurable : false,
		enumerable   : false,
		value        : function () { return tag; }
	});

	return obj as FxSqlQueryComparator.QueryComparatorObject;
}
