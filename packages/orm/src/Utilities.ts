import util = require('util')
import uuid = require('uuid')
import coroutine = require('coroutine')
import events         = require("events");

import _cloneDeep = require('lodash.clonedeep')

import FxORMCore = require('@fxjs/orm-core');
import {
	Helpers as QueryHelpers,
	FxSqlQuery,
	FxSqlQuerySubQuery,
	FxSqlQueryComparator,
	FxSqlQuerySql,
	FxSqlQueryDialect,
} from '@fxjs/sql-query';
import { selectArgs } from './Helpers';

import type { FxOrmInstance } from './Typo/instance';
import type { FxOrmModel } from './Typo/model';
import type { FxOrmQuery } from './Typo/query';
import type { FxOrmAssociation } from './Typo/assoc';
import { FxOrmProperty } from './Typo/property';
import { FxOrmCommon } from './Typo/_common';
import { FxOrmNS } from './Typo/ORM';
import { FxOrmError } from './Typo/Error';
import { FxOrmHook } from './Typo/hook';
import { filterDate } from './Where/filterDate';
import { FxOrmDMLDriver } from './Typo/DMLDriver';
import ORMError from './Error';

/**
 * Order should be a String (with the property name assumed ascending)
 * or an Array or property String names.
 *
 * Examples:
 *
 * 1. 'property1' (ORDER BY property1 ASC)
 * 2. '-property1' (ORDER BY property1 DESC)
 * 3. [ 'property1' ] (ORDER BY property1 ASC)
 * 4. [ '-property1' ] (ORDER BY property1 DESC)
 * 5. [ 'property1', 'A' ] (ORDER BY property1 ASC)
 * 6. [ 'property1', 'Z' ] (ORDER BY property1 DESC)
 * 7. [ '-property1', 'A' ] (ORDER BY property1 ASC)
 * 8. [ 'property1', 'property2' ] (ORDER BY property1 ASC, property2 ASC)
 * 9. [ 'property1', '-property2' ] (ORDER BY property1 ASC, property2 DESC)
 * ...
 */
type IOrderFlag = FxSqlQuery.OrderNormalizedTuple[1];
const ZIS = [ "A", "Z" ] as IOrderFlag[]
export function standardizeOrder (
	order: FxOrmModel.ModelOptions__Find['order']
): FxOrmQuery.OrderNormalizedTupleMixin {
	if (typeof order === "string") {
		let item: FxOrmQuery.OrderNormalizedTupleWithoutTable = [ order.substr(1), "Z" ];
		if (order[0] === "-") {
			return [ item ];
		}
		item = [ order, "A" ];
		return [ item ];
	}

	// maybe `FxSqlQuery.OrderNormalizedResult`
	if (
		Array.isArray(order)
		&& (Array.isArray(order[1]) || Array.isArray(order[0]))
	) {
		// is `FxSqlQuery.OrderSqlStyleTuple`
		if (Array.isArray(order[1]))
			return [order] as FxSqlQuery.OrderSqlStyleTuple[];

		// is `FxSqlQuery.OrderNormalizedTuple`
		return [order] as FxSqlQuery.OrderNormalizedTuple[];
	}

	const new_order: FxOrmQuery.OrderNormalizedTupleWithoutTable[] = [];
	let minus: boolean;

	for (let i = 0, item: typeof order[any]; i < order.length; i++) {
		item = order[i];

		// deprecate all non-string item
		if (typeof item !== 'string') continue ;

		/**
		 * order from here would not be add table name afterwards
		 */
		minus = (item[0] === "-");

		const next_one = order[i + 1]
		const maybe_Z = typeof next_one === 'string' ? next_one.toUpperCase() as FxSqlQuery.OrderNormalizedTuple[1] : 'Z'
		if (i < order.length - 1 && ZIS.indexOf(maybe_Z) >= 0) {
			new_order.push([
				(minus ? item.substr(1) : item),
				maybe_Z
			]);
			i += 1;
		} else if (minus) {
			new_order.push([ item.substr(1), "Z" ]);
		} else {
			new_order.push([ item, "A" ]);
		}
	}

	return new_order;
};

export function addTableToStandardedOrder (
	order: FxOrmQuery.OrderNormalizedTupleMixin,
	table_alias: string | FxSqlQuerySql.SqlFromTableInput
): FxOrmQuery.ChainFindOptions['order'] {
	const new_order: FxOrmQuery.ChainFindOptions['order'] = []
	for (let i = 0, item: typeof order[any]; i < order.length; i++) {
		item = order[i]
		// strange here, we support item[0] here as `FxOrmQuery.OrderNormalizedTuple` :)
		if (Array.isArray(item[0])) {
			new_order.push(item)
			continue ;
		}
		
		new_order.push([
			[table_alias, item[0]],
			item[1]
		] as FxOrmQuery.OrderNormalizedTuple)
	}

	return new_order
}

/**
 * @description filtered out FxOrmInstance.Instance in mixed FxSqlQuerySubQuery.SubQueryConditions | { [k: string]: FxOrmInstance.Instance }
 */
export function checkConditions (
	conditions: ( FxSqlQuerySubQuery.SubQueryConditions | { [k: string]: FxOrmInstance.Instance } ),
	one_associations: ( FxOrmAssociation.InstanceAssociatedInstance | FxOrmAssociation.InstanceAssociationItem_HasOne )[]
): FxSqlQuerySubQuery.SubQueryConditions {
	// A) Build an index of associations, with their name as the key
	var associations = <{[k: string]: FxOrmAssociation.InstanceAssociatedInstance | FxOrmAssociation.InstanceAssociationItem_HasOne}>{};
	for (let i = 0; i < one_associations.length; i++) {
		associations[one_associations[i].name] = one_associations[i];
	}

	for (let k in conditions) {
		// B) Check for any conditions with a key in the association index
		if (!associations.hasOwnProperty(k)) continue;

		// C) Ensure that our condition supports array values
		var values = conditions[k] as (FxOrmAssociation.InstanceAssociatedInstance)[];
		if (!Array.isArray(values))
			values = [values] as any;

		// D) Remove original condition (it's instance rather conditon, we would replace it later; not DB compatible)
		delete conditions[k];

		// E) Convert our association fields into an array, indexes are the same as model.id
		const association_fields = Object.keys(associations[k].field);
		const model: FxOrmModel.Model = (associations[k] as FxOrmAssociation.InstanceAssociationItem_HasOne).model;

		// F) Iterate through values for the condition, only accept instances of the same type as the association
		for (let i = 0; i < values.length; i++) {
			const instance = (values[i].isInstance && values[i] as FxOrmAssociation.InstanceAssociatedInstance)
			if (instance && instance.model().uid === model.uid) {
				if (association_fields.length === 1) {
					const cond_k = association_fields[0]
					
					if (conditions[cond_k] === undefined) {
						conditions[cond_k] = instance[model.id[0]];
					} else if(Array.isArray(conditions[cond_k])) {
						(conditions[cond_k] as FxSqlQueryComparator.SubQueryInput[]).push(instance[model.id[0]]);
					} else {
						conditions[cond_k] = [conditions[cond_k], instance[model.id[0]]];
					}
				} else {
					var _conds = <FxSqlQueryComparator.SubQueryInput>{};
					for (let j = 0; j < association_fields.length; i++) {
						_conds[association_fields[j]] = instance[model.id[j]];
					}

					conditions.or = conditions.or || [];
					(conditions.or as FxSqlQueryComparator.SubQueryInput[]).push(_conds);
				}
			}
		}
	}

	return conditions as FxSqlQuerySubQuery.SubQueryConditions;
};

/**
 * Gets all the values within an object or array, optionally
 * using a keys array to get only specific values
 */
export function values (obj: any[] | {[k: string]: any}, keys?: string[]) {
	var vals: any[] = [];

	if (keys) {
		const non_arr = obj as {[k: string]: any}
		for (let i = 0; i < keys.length; i++) {
			vals.push(
				non_arr[keys[i]]
			);
		}
	} else if (Array.isArray(obj)) {
		for (let i = 0; i < obj.length; i++) {
			vals.push(obj[i]);
		}
	} else {
		for (let k in obj) {
			if (!/[0-9]+/.test(k)) {
				vals.push(obj[k]);
			}
		}
	}
	return vals;
};

// Qn:       is Zero a valid value for a FK column?
// Why?      Well I've got a pre-existing database that started all its 'serial' IDs at zero...
// Answer:   hasValues() is only used in hasOne association, so it's probably ok...
export function hasValues (obj: {[k: string]: any}, keys: string[]): boolean {
	for (let i = 0; i < keys.length; i++) {
		if (!obj[keys[i]] && obj[keys[i]] !== 0) return false;  // 0 is also a good value...
	}
	return true;
};

/**
 * @description from from <source> object, copy specific ids(determined by <source_model>) to <target> object as
 * correspoding <associacted_fields>, for example:
 * 
 * if <source_model> id: id1, id2
 * if <associacted_fields>: user_id, production_id
 * source.id1 = 1, source.id2 = 2
 * target.user_id = undefined, target.production_id = undefined
 * 
 * Then, we will get:
 * 
 * target.user_id = 1, target.production_id = 2
 * 
 * if target.user_id is not undefined, it wouldn't be overwritten unless <overwrite> is true
 * 
 * @param source_model 
 * @param associacted_fields 
 * @param source 
 * @param target 
 * @param overwrite 
 */
export function populateModelIdKeysConditions (
	source_model: FxOrmModel.Model,
	associacted_fields: string[],
	source: FxOrmInstance.InstanceDataPayload,
	target: FxSqlQuerySubQuery.SubQueryConditions,
	overwrite?: boolean
): void {
	const mids = source_model.id;
	for (let i = 0; i < mids.length; i++) {
		if (typeof target[associacted_fields[i]] === 'undefined' || overwrite !== false) {
			target[associacted_fields[i]] = source[mids[i]];
		} else if (Array.isArray(target[associacted_fields[i]])) { // that might be conjunction query conditions
			(target[associacted_fields[i]] as FxSqlQueryComparator.SubQueryInput[])
				.push(
					source[mids[i]] as FxSqlQueryComparator.SubQueryInput
				);
		} else {
			target[associacted_fields[i]] = [target[associacted_fields[i]], source[mids[i]]];
		}
	}
};

export function getConditions (
	model: FxOrmModel.Model,
	fields: string[],
	from: FxSqlQuerySubQuery.SubQueryConditions
): FxSqlQuerySubQuery.SubQueryConditions {
	var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};

	populateModelIdKeysConditions(model, fields, from, conditions);

	return conditions;
};

/**
 * TODO: add comment for this method
 * 
 * @description WIP
 * @param params 
 * @returns 
 */
export function wrapFieldObject (
	params: {
		field: FxOrmAssociation.InstanceAssociationItem['field']
		model: FxOrmModel.Model
		altName: string
		mapsTo?: FxOrmModel.ModelPropertyDefinition['mapsTo']
	}
): Record<string, FxOrmProperty.NormalizedProperty> {
	if (!params.field) {
		var assoc_key = params.model.settings.get("properties.association_key");

		if (typeof assoc_key === "function") {
		    params.field = assoc_key(params.altName.toLowerCase(), params.model.id[0]);
		} else {
			params.field = assoc_key.replace("{name}", params.altName.toLowerCase())
			               .replace("{field}", params.model.id[0]);
		}
	}

	if (typeof params.field == 'object') {
		for (let k in params.field) {
			/* 1st self-own & non-array kv */
			if (!/[0-9]+/.test(k) && params.field.hasOwnProperty(k)) {
				return params.field as Record<string, FxOrmProperty.NormalizedProperty>;
			}
		}
	}

	const field_str = params.field as string

	var newProp: FxOrmProperty.NormalizedProperty,
		propPreDefined: FxOrmProperty.NormalizedProperty,
		propFromKey: FxOrmProperty.NormalizedProperty;

	propPreDefined = params.model.properties[field_str];
	propFromKey    = params.model.properties[params.model.id[0]];
	newProp        = <FxOrmProperty.NormalizedProperty>{ type: 'integer' };

	var prop: FxOrmProperty.NormalizedProperty = _cloneDeep(propPreDefined || propFromKey || newProp);

	if (!propPreDefined) {
		util.extend(prop, {
			name: field_str,
			mapsTo: params.mapsTo || field_str
		});
	}

	return {
		[field_str]: prop
	};
};

/**
 * TODO: add comment for this method
 * @param model related Model
 * @param name field name
 * @param required is field required for relationship
 * @param reversed is model is reversed in relationship
 */
export function formatAssociatedField (
	model: FxOrmModel.Model,
	name: string,
	required: boolean,
	reversed: boolean
): Record<string, FxOrmProperty.NormalizedProperty> {
	let fields = <Record<string, FxOrmProperty.NormalizedProperty>>{},
		field_opts: FxOrmProperty.NormalizedProperty,
		field_name: string;

	var keys = model.id;
	var assoc_key: FxOrmAssociation.AssociationKeyComputation = model.settings.get("properties.association_key");

	for (let i = 0; i < keys.length; i++) {
		if (reversed) {
			field_name = keys[i];
		} else if (typeof assoc_key === "function") {
			field_name = assoc_key(name.toLowerCase(), keys[i]);
		} else {
			field_name = assoc_key.replace("{name}", name.toLowerCase())
			                      .replace("{field}", keys[i]);
		}

		if (model.properties.hasOwnProperty(keys[i])) {
			var p = model.properties[keys[i]];

			field_opts = <FxOrmProperty.NormalizedProperty>{
				type     : p.type || "integer",
				// TODO: make 32 when p.type === 'text'
				size     : p.size || 4,
				unsigned : p.unsigned || true,
				time     : p.time || false,
				big      : p.big || false,
				values   : p.values || null,
				required : required,
				name     : field_name,
				mapsTo   : field_name
			};
		} else {
			field_opts = <FxOrmProperty.NormalizedProperty>{
				type     : "integer",
				unsigned : true,
				size     : 4,
				required : required,
				name     : field_name,
				mapsTo   : field_name
			};
		}

		fields[field_name] = field_opts;
	}

	return fields;
};

/** @internal */
export function extractHasManyExtraConditions (
	association: FxOrmAssociation.InstanceAssociationItem_HasMany,
	conditions: FxOrmModel.ModelFindByDescriptorItem['conditions'],
	extra_where?: FxOrmModel.ModelFindByDescriptorItem['conditions'],
) {
	// extract extra info on conditions
	extra_where = { ...extra_where } as typeof extra_where;
	// populate out conditions in extra, not belonging to either one model of associations
	for (let k in conditions) {
		if (association.props[k]) {
			extra_where[k] = conditions[k];
			delete conditions[k];
		}
	}

	return extra_where
}

/**
 * @description top conditions means that conditions which matches query's top select.
 */
export function extractSelectTopConditions (
	conditions: FxOrmModel.ModelOptions__Find['conditions'],
	topFields: string[],
) {
	const topConditions = util.pick(conditions, topFields);
	
	return {
		topConditions,
		tableConditions: util.omit(conditions, topFields)
	}
}

// If the parent associations key is `serial`, the join tables
// key should be changed to `integer`.
export function convertPropToJoinKeyProp (
	props: Record<string, FxOrmProperty.NormalizedProperty>,
	opts: { required: boolean, makeKey: boolean }
): Record<string, FxOrmProperty.NormalizedProperty> {
	var prop: FxOrmProperty.NormalizedProperty;

	for (let k in props) {
		prop = props[k];

		prop.required = opts.required;

		if (prop.type == 'serial') {
			prop.type = 'integer';
		}
		if (opts.makeKey) {
			prop.key = true;
		} else {
			delete prop.key;
		}
	}

	return props;
}

export function getRealPath (path_str: string, stack_index?: number) {
	const path = require("path"); // for now, load here (only when needed)
	let cwd = process.cwd();
	const err = new Error();
	let tmp = err.stack.split(/\r?\n/)[typeof stack_index !== "undefined" ? stack_index : 3], m;

	if ((m = tmp.match(/^\s*at\s+(.+):\d+:\d+$/)) !== null) {
		cwd = path.dirname(m[1]);
	} else if ((m = tmp.match(/^\s*at\s+module\.exports\s+\((.+?)\)/)) !== null) {
		cwd = path.dirname(m[1]);
	} else if ((m = tmp.match(/^\s*at\s+.+\s+\((.+):\d+:\d+\)$/)) !== null) {
		cwd = path.dirname(m[1]);
	}
	const pathIsAbsolute = path.isAbsolute || require('path-is-absolute');
	if (!pathIsAbsolute(path_str)) {
		path_str = path.join(cwd, path_str);
	}
	if (path_str.substr(-1) === path.sep) {
		path_str += "index";
	}

	return path_str;
};

/**
 * @description rename a field name in <dataIn> according to the name map in <properties>
 * @example
 * ```
 * dataIn: { a: 1, b: 2 };
 * properties: { a: { mapsTo: 'a1' }, b: { mapsTo: 'b' } };
 * -->
 * result: { a1: 1, b: 2 };
 * ```
 * 
 * @param dataIn 
 * @param properties 
 */
export function transformPropertyNames (
	dataIn: FxOrmInstance.InstanceDataPayload,
	properties: Record<string, FxOrmProperty.NormalizedProperty> | FxOrmModel.ModelPropertyDefinition
) {
	var prop: FxOrmModel.ModelPropertyDefinition;
	var dataOut: FxOrmInstance.InstanceDataPayload = {};

	for (let k in dataIn) {
		prop = properties[k];
		if (prop) {
			dataOut[prop.mapsTo] = dataIn[k];
		} else {
			dataOut[k] = dataIn[k];
		}
	}
	return dataOut;
};

export function transformOrderPropertyNames (
	order: FxOrmQuery.ChainFindOptions['order'],
	properties: Record<string, FxOrmProperty.NormalizedProperty>
) {
	if (!order) return order;

	const newOrder: FxOrmQuery.ChainFindOptions['order'] = JSON.parse(JSON.stringify(order));

	// Rename order properties according to mapsTo
	for (let i = 0, item: typeof newOrder[any]; i < newOrder.length; i++) {
		item = newOrder[i];

		// [ 'SQL..??', [arg1, arg2]]
		if (Array.isArray(item[1])) continue;

		if (Array.isArray(item[0])) {
			// [ ['table or alias Name', 'propName'], 'Z']
			let maybePropertyName = item[0][1], orderFlag: IOrderFlag = 'A';
			[maybePropertyName, orderFlag] = standardizeOrder(maybePropertyName)[0] as FxOrmQuery.OrderNormalizedTupleWithoutTable;
			if (!item[1]) { item[1] = orderFlag; }
			item[0][1] = properties[maybePropertyName].mapsTo;
		} else {
			const [maybePropertyName] = standardizeOrder(item[0])[0] as FxOrmQuery.OrderNormalizedTupleWithoutTable;
			// normal order
			item[0] = properties[maybePropertyName].mapsTo;
		}
	}
	return newOrder;
}

export function renameDatastoreFieldsToPropertyNames (
	data: FxOrmInstance.InstanceDataPayload, fieldToPropertyMap: FxOrmProperty.FieldToPropertyMapType
) {
	for (let k in data) {
		const prop = fieldToPropertyMap[k];
		if (prop && prop.name != k) {
			data[prop.name] = data[k];
			delete data[k];
		}
	}
	return data;
}

export function camelCaseHasMany(text: string) {
	return ucfirst(text[0]) + text.substr(1).replace(/_([a-z])/, function (m, l) {
		return l.toUpperCase();
	});
}

export function ucfirst(text: string) {
	return text[0].toUpperCase() + text.substr(1);
}

export function formatNameFor (
	key: 'assoc:hasMany' | 'assoc:hasOne' | 'findBy:common' | 'findBy:hasOne' | 'assoc:extendsTo' | 'findBy:extendsTo' | 'field:lazyload' | 'syncify:assoc',
	name: string
) {
	switch (key) {
		case 'assoc:hasMany':
			return camelCaseHasMany(name)
		case 'findBy:common':
		case 'assoc:hasOne':
		case 'findBy:hasOne':
			return ucfirst(name)
		case 'assoc:extendsTo':
		case 'findBy:extendsTo':
			return ucfirst(name)
		case 'field:lazyload':
			return ucfirst(name.toLocaleLowerCase())
		case 'syncify:assoc':
			return name + 'Sync'
	}	
}

export function combineMergeInfoToArray (
	merges: FxOrmQuery.ChainFindOptions['merge']
): FxOrmQuery.ChainFindMergeInfo[] {
	if (!Array.isArray(merges))
		merges = [merges]
	
	return merges.filter(Boolean)
}

export function parseTableInputForSelect (ta_str: string) {
	const [pure_table, alias = typeof pure_table === 'string' ? pure_table : ''] = QueryHelpers.parseTableInputStr(ta_str)

	return {
		pure_table,
		alias,
		from_tuple: [pure_table, alias] as FxSqlQuerySql.SqlTableTuple
	}
}

export function tableAlias (
	table: string | FxSqlQuerySql.SqlFromTableInput,
	alias: string = typeof table === 'string' ? table : '',
	same_suffix: string = ''
) {
	if (QueryHelpers.maybeKnexRawOrQueryBuilder(table)) {
		if (!alias) {
			throw new Error(`[tableAlias] when table is knex.raw or knex.queryBuilder, alias must be provided!`)
		}
		return alias;
	}

	return `${table} ${alias}${same_suffix ? ` ${same_suffix}` : ''}`
}

export function tableAliasCalculatorInOneQuery () {
	const countHash = {} as {[k: string]: number}

	return function increment (tableName: string, get_only: boolean = false) {
		countHash[tableName] = countHash[tableName] || 0;
		if (!get_only) {
			countHash[tableName]++;
		}

		return countHash[tableName]
	}
}

export function ORM_Error(err: Error, cb?: FxOrmCommon.VoidCallback): FxOrmNS.ORMLike {
	var Emitter: any = new events.EventEmitter();

	Emitter.use = Emitter.define = Emitter.sync = Emitter.load = function () {};

	if (typeof cb === "function")
		cb(err);

	process.nextTick(function () {
		Emitter.emit("connect", err);
	});

	return Emitter;
}

export function queryParamCast (val: any): any {
	if (typeof val == 'string')	{
		switch (val) {
			case '1':
			case 'true':
				return true;
			case '0':
			case 'false':
				return false;
		}
	}
	return val;
}

export function isDriverNotSupportedError (err: FxOrmError.ExtendedError) {
	if (err.code === 'MODULE_NOT_FOUND') return true;

	if(
		[
			// windows not found
			'The system cannot find the file specified',
			// unix like not found
			'No such file or directory',
		].some((msg: string) => {
			return err.message.indexOf(msg) > -1 || (err.message.toLocaleLowerCase()).indexOf(msg.toLowerCase()) > -1
		})
	)
		return true

	if(
		[
			'find module',
		].some((msg: string) => {
			return err.message.indexOf(msg) > -1
		})
	)
		return true

	return false;
}

export const catchBlocking = FxORMCore.catchBlocking;
export const takeAwayResult = FxORMCore.takeAwayResult

export function doWhenErrIs (
	compare: {
		message?: string,
		literalCode?: string
	},
	callback: Function,
	err?: FxOrmError.ExtendedError,
) {
	if (!err || util.isEmpty(compare)) return ;
	
	if (!(err instanceof Error)) return ;

	if (compare.hasOwnProperty('message') && err.message !== compare.message) return ;

	if (compare.hasOwnProperty('literalCode') && err.literalCode !== compare.literalCode) return ;

	callback(err)
}

export function getErrWaitor (shouldWait: boolean = false): FxOrmError.ErrorWaitor {
	return {
		evt: shouldWait ? new coroutine.Event : null,
		err: null as FxOrmError.ExtendedError,
	}
}

export function getValueWaitor <T = any>(shouldWait: boolean = false): FxOrmCommon.ValueWaitor<T> {
	return {
		evt: shouldWait ? new coroutine.Event : null,
		value: null as T,
	}
}

export function parallelQueryIfPossible<T = any, RESP = any> (
	can_parallel: boolean,
	iteratee: T[],
	iterator: (value: T, index?: number, array?: T[]) => RESP
): RESP[] {
	if (can_parallel && iteratee.length > 1)
		return coroutine.parallel(iteratee, (item: T) => iterator(item));

	return iteratee.map(iterator)
}

/**
 * @description do some mutation for field-value in conditions
 * 
 * @param conditions 
 * @param host 
 */
export function filterWhereConditionsInput (
	conditions: FxSqlQuerySubQuery.SubQueryConditions,
	host: {
		properties: Record<string, FxOrmProperty.NormalizedProperty>
	} | FxOrmModel.Model
): FxSqlQuerySubQuery.SubQueryConditions {
	if (host.properties) {
		filterDate(conditions, { properties: host.properties });
	} else {
		filterDate(conditions, { properties: (host as FxOrmModel.Model).allProperties });
	}

	return conditions;
}

export function addUnwritableProperty (
	obj: any,
	property: string,
	value: any,
	propertyConfiguration: PropertyDescriptor = {}
) {
	Object.defineProperty(
		obj,
		property,
		{
			value,
			...propertyConfiguration,
			writable: false
		}
	)
}

export function addHiddenReadonlyProperty (
	obj: any,
	property: string,
	getter: () => any,
	propertyConfiguration: PropertyDescriptor = {}
) {
	Object.defineProperty(
		obj,
		property,
		{
			get: getter,
			...propertyConfiguration,
			enumerable: false
		}
	);
}

export function addHiddenUnwritableMethodToInstance (
	instance: FxOrmInstance.Instance,
	method_name: 'save' | 'saveSync' | string,
	fn: Function,
	propertyConfiguration: PropertyDescriptor = {}
) {
	Object.defineProperty(
		instance,
		method_name,
		{
			value: fn.bind(instance),
			...propertyConfiguration,
			writable: true,
			enumerable: false,
		}
	)
}

export function addHiddenPropertyToInstance (
	instance: FxOrmInstance.Instance,
	property_name: string,
	value: any,
	propertyConfiguration: PropertyDescriptor = {}
) {
	Object.defineProperty(
		instance,
		property_name,
		{
			value: value,
			...propertyConfiguration,
			enumerable: false
		}
	);
}

export function addHiddenReadonlyPropertyToInstance (
	instance: FxOrmInstance.Instance,
	property_name: string,
	getter: () => any,
	propertyConfiguration: PropertyDescriptor = {}
) {
	Object.defineProperty(
		instance,
		property_name,
		{
			get: getter,
			...propertyConfiguration,
			enumerable: false
		}
	);
}

export function fillSyncVersionAccessorForAssociation (
	association: FxOrmAssociation.InstanceAssociationItem
) {
	if (!association.getSyncAccessor)
		association.getSyncAccessor = formatNameFor('syncify:assoc', association.getAccessor)

	if (!association.setSyncAccessor)
		association.setSyncAccessor = formatNameFor('syncify:assoc', association.setAccessor)
		
	if (!association.delSyncAccessor)
		association.delSyncAccessor = formatNameFor('syncify:assoc', association.delAccessor)

	if (!association.hasSyncAccessor)
		association.hasSyncAccessor = formatNameFor('syncify:assoc', association.hasAccessor)

	if (!association.addSyncAccessor && association.addAccessor)
		association.addSyncAccessor = formatNameFor('syncify:assoc', association.addAccessor)

	if (!association.modelFindBySyncAccessor && association.modelFindByAccessor)
		association.modelFindBySyncAccessor = formatNameFor('syncify:assoc', association.modelFindByAccessor)

	return association;
}


const AvailableHooks = [
	'beforeSet', 'afterSet',
	'beforeRemove', 'afterRemove',
	'beforeAdd', 'afterAdd'
]
export function addHookPatchHelperForAssociation (
	association: FxOrmAssociation.InstanceAssociationItem,
	// { for = 'hasOne' }: Fibjs.AnyObject = {}
) {
	// setup hooks
	for (let k in AvailableHooks) {
		association[AvailableHooks[k]] = createHookHelper(association.hooks, AvailableHooks[k], { initialHooks: Object.assign({}, association.hooks) });
	}
}

export function generateUID4SoloGet (
	m_opts: FxOrmModel.ModelConstructorOptions,
	ids: (string | number)[]
) {
	return m_opts.driver.uid + "/" + m_opts.table + "/" + ids.join("/");
}

export function generateUID4ChainFind (
	m_opts: FxOrmModel.ModelConstructorOptions,
	merges: FxOrmQuery.ChainFindMergeInfo[] = [],
	data: FxOrmInstance.InstanceDataPayload
) {
	const merge_id = merges.map(merge => (merge ? merge.from.table : "")).join(',');
	let uid = m_opts.driver.uid + "/" + m_opts.table + (merge_id ? `+${merge_id}` : "");
	for (let i = 0; i < m_opts.keys.length; i++) {
		uid += "/" + data[m_opts.keys[i]];
	}

	return uid;
}

export function generateUID4Model (
	m_opts: FxOrmModel.ModelConstructorOptions
) {
	return m_opts.driver.uid + "/" + m_opts.table + "/" + m_opts.keys.join("/")
}

export function makeIdForDriverTable (driver_uid: string, table: string) {
	return `${driver_uid}/${table}`
}

export function bindInstance (instance: FxOrmInstance.Instance, fn: Function) {
	return fn.bind(instance)
}

export function buildAssocHooksContext(
	hookName: keyof FxOrmAssociation.InstanceAssociationItem['hooks'],
	payload: {
		$ref: FxOrmAssociation.__AssocHooksCtx,
		useChannel?: FxOrmAssociation.__AssocHooksCtx['useChannel']
	}
): Record<string, any> {
	const {
		$ref = {} as FxOrmAssociation.__AssocHooksCtx,
		useChannel = $ref.useChannel || reusableChannelGenerator()
	} = payload;

	const {
		instance = null,
		association = null,
		associations = [],
		association_ids = [],
		removeConditions = {},
	} = $ref;

	if (!instance)
		throw `[buildAssocHooksContext] instance is required`

	if (!$ref || typeof $ref !== 'object')
		throw `[buildAssocHooksContext]$ref must be valid Object`

	const ctx = $ref;
	if (!ctx.hasOwnProperty('$ref') || Object.getOwnPropertyDescriptor(ctx, '$ref').configurable)
		Object.defineProperty(ctx, '$ref', { get () { return ctx }, configurable: false, enumerable: true})

	ctx.association = association
	ctx.associations = associations
	ctx.association_ids = association_ids

	ctx.useChannel = useChannel

	switch (hookName) {
		case 'beforeSet':
		case 'afterSet':
			break
		case 'beforeAdd':
		case 'afterAdd':
			break
		case 'beforeRemove':
			ctx.removeConditions = removeConditions
			break
		case 'afterRemove':
			ctx.removeConditions = removeConditions
			break
	}

	return ctx
}

export function makeHandlerDecorator(
	opts: {
		thisArg?: any
		onlyOnce?: boolean
	} = {},
	hdlr: () => any
) {
	const {
		thisArg = null,
		onlyOnce = true
	} = opts;
	let finishOnce = false

	return (err: FxOrmCommon.Arraible<FxOrmError.ExtendedError> | false) => {
		if (onlyOnce && finishOnce) {
			console.warn(`[makeHandlerDecorator] this function was once only`)
			return ;
		}
		
		finishOnce === true;

		if (err)
			throw err;

		if (err === false) return ;

		return hdlr.call(thisArg)
	}
}

function getChannelInfo () {
	return {
		id: uuid.snowflake().hex(),
		executed: false,
		fn: null as Function
	}
}

export function reusableChannelGenerator () {
	const DEFAULT_KEY = `$$default`
	const channelInfos: {[k: string]: Record<string, any> } = {
		[DEFAULT_KEY]: getChannelInfo()
	}

	return function useChannel () {
		let name: string, _channel: Function

		selectArgs(Array.prototype.slice.apply(arguments), (arg_type, arg) => {
			switch (arg_type) {
				case 'string':
					name = arg
					break
				case 'function':
					_channel = arg
					break
			}
		})
		if (!name)
			name = DEFAULT_KEY
		
		if (!channelInfos.hasOwnProperty(name))
			channelInfos[name] = getChannelInfo()

		const channelInfo = channelInfos[name]

		_channel = _channel || channelInfo.fn
		if (!_channel)
			throw `[useChannel] channel is required and must be function type`
			
		if (!channelInfo.fn && _channel)
			channelInfo.fn = _channel

		const results = [
			function (...args: any) {
				if (channelInfo.executed)
					return ;

				channelInfo.executed = true;

				if (typeof channelInfo.fn !== 'function')
					throw `[reusableChannelGenerator/useChannel] channel with name ${name} haven't been set 'fn'!`

				channelInfo.fn.apply(null, args)
			},
			function (fn: Function) {
				if (typeof fn !== 'function')
					throw `[reusableChannelGenerator/useChannel::setChannel] new channel must be function!`

				channelInfo.fn = fn
			}
		] as any as FxOrmHook.HookChannelResults

		results.run = (...args: any[]) => {
			return results[0].apply(null, args)
		}
		results.set = (fn, ...args: any[]) => {
			return results[1].apply(null, [fn].concat(args))
		}

		return results
	}
}

export const createHookHelper = function (
	hooks: Record<string, any>,
	hook: keyof FxOrmModel.Hooks | keyof FxOrmAssociation.InstanceAssociationItem['hooks'],
	{ initialHooks = [] }: Record<string, any> = {}
) {
	return function (
		cb: FxOrmHook.HookActionCallback | FxOrmHook.HookResultCallback,
		opts?: FxOrmModel.ModelHookPatchOptions
	) {
		if (typeof cb !== "function") {
			delete hooks[hook];
			return this;
		}
		
		const { oldhook = undefined } = opts || {}
		let tmp = null as any
		switch (oldhook) {
			default:
			case 'initial':
				hooks[hook] = initialHooks[hook] as any;
				break
			case 'overwrite':
			case undefined:
				hooks[hook] = cb as any;
				break
			case 'prepend':
				tmp = arraify(hooks[hook]);
				tmp.push(cb)
				hooks[hook] = tmp;
				break
			case 'append':
				tmp = arraify(hooks[hook]);
				tmp.unshift(cb)
				hooks[hook] = tmp;
				break
		}
		return this;
	};
};

export function attachOnceTypedHookRefToInstance (
	instance: FxOrmInstance.Instance,
	type: 
		'save'
		| 'create'
		| 'remove'
		,
	typedHookRef: Record<string, any>,
) {
	// ensure instance.$hookRef existed
	if (!instance.hasOwnProperty('$hookRef')) {
		const hookRef = <FxOrmInstance.Instance['$hookRef']>{}
		addHiddenReadonlyPropertyToInstance(
			instance,
			'$hookRef',
			() => hookRef,
			{
				configurable: false
			}
		)
	}

	typedHookRef = {...typedHookRef}
	typedHookRef.instance = instance
	typedHookRef.useChannel = reusableChannelGenerator()

	instance.$hookRef[type] = typedHookRef as FxOrmInstance.Instance['$hookRef'][typeof type]
}

export function arraify<T = any> (item: T | T[]): T[] {
	return Array.isArray(item) ? item : [item]
}

export function firstEl<T = any> (item: T | T[]): T {
	return Array.isArray(item) ? item[0] : item
}

export function isKeyProperty(prop: FxOrmProperty.NormalizedProperty) {
	return prop.key;
}

export function isKeyPrimaryProperty(prop: FxOrmProperty.NormalizedProperty) {
	return prop.key && prop.klass === 'primary';
}

export function coercePositiveInt<T extends number | undefined | null = undefined>(value: any, fallbackValue: T = undefined): number | T {
	const num = parseInt(value, 10);
	
	if (Number.isNaN(num)) return fallbackValue;

	return Math.abs(num);
}

export function getUUID () {
	return uuid.snowflake().hex()
}

export const DEFAULT_GENERATE_SQL_QUERY_SELECT: FxOrmDMLDriver.DMLDriver_FindOptions['generateSqlSelect']
= function (ctx) {
	return this.query.select()
		.from(ctx.fromTuple)
		.select(ctx.selectFields)
}

export function isVirtualViewModel (model: FxOrmModel.Model) {
	return (
		Object.keys(model.allProperties).length === 0
		&& Object.keys(model.virtualProperties).length > 0
	)
}

export function disAllowOpForVModel (model: FxOrmModel.Model, opName: string) {
	if (isVirtualViewModel(model)) {
		throw new ORMError(`operation '${opName}' not supported for virtual model`, 'NO_SUPPORT', { model: model.name });
	}
}

export function normalizeVirtualViewOption (
	virtualView: FxOrmModel.ModelDefineOptions['virtualView'],
	knex: import('@fxjs/knex').Knex,
): FxOrmModel.ModelConstructorOptions['virtualView'] {
	let result: FxOrmModel.ModelConstructorOptions['virtualView'] = {
		disabled: true,
		subQuery: '()'
	};

	if (!virtualView) {
		return result;
	} else if (typeof virtualView === 'string') {
		result = {
			disabled: false,
			subQuery: virtualView as `(${string})`
		}
	} else if (QueryHelpers.maybeKnexRawOrQueryBuilder(virtualView)) {
		result = {
			disabled: false,
			subQuery: knex.raw(virtualView.toQuery()).wrap('(', ')').toQuery() as `(${string})`
		}
	} else if (typeof virtualView === 'object') {
		result = {
			disabled: !!virtualView.disabled,
			subQuery: virtualView.subQuery
		}
	}

	if (!QueryHelpers.isWrapperdSubQuerySelect(result?.subQuery)) {
		throw new Error(`[normalizeVirtualViewOption] invalid virtualView.subQuery: ${result?.subQuery}, it must be knex.raw(...), knex's query build, or sub query string wrapped with ()`)
	}

	return result;
}

/** @internal only for plugin developers */
export function __wrapTableSourceAsGneratingSqlSelect(
	{
		virtualView,
		customSelect: _customSelect,
		generateSqlSelect,
	}: {
		virtualView: FxOrmModel.ModelConstructorOptions['virtualView'],
		customSelect?: FxOrmModel.ModelDefineOptions['customSelect']
		generateSqlSelect?: FxOrmModel.ModelDefineOptions['generateSqlSelect'],
	},
	opts: {
		dialect: FxSqlQueryDialect.Dialect,
		modelTable: string,
	}
): FxOrmModel.ModelDefineOptions['generateSqlSelect'] {
	const {
		modelTable, dialect
	} = opts;

	if (!virtualView.disabled) {
		return function (ctx, querySelect) {
			querySelect
				.from(`${virtualView.subQuery} as ${modelTable}`)
				.select(ctx.selectVirtualFields)

			return querySelect;
		}
	}

	if (!_customSelect) return generateSqlSelect;

	const customSelect = arraify(_customSelect).filter(x => !!x && typeof x === 'object').map((tfq) => {
		return {
			from: arraify(tfq.from).filter(Boolean),
			select: arraify(tfq.select)
				.map(select => {
					return typeof select === 'function' ? select(dialect) : select
				})
				.filter(Boolean),
			wheres: (typeof tfq.wheres === 'string' ? { __sql: [[tfq.wheres]] } : tfq.wheres) as Exclude<typeof tfq.wheres, string>,
		}
	});

	return function (ctx) {
        const qSelect = this.query.select()
          .from([ctx.table, ctx.table]) // specify the alias as table name itself
          .select(ctx.selectFields)

		customSelect.forEach((tfq) => {
			if (tfq.from.length) {
				tfq.from.forEach(fromItem => {
					// pre convert string like `a` as `[a, a]`
					if (typeof fromItem === 'string' && !QueryHelpers.isWrapperdSubQuerySelect(fromItem)) {
						let [tableName = ctx.table, tableAlias] = QueryHelpers.parseTableInputStr(fromItem, this.query.Dialect.type);
						tableAlias = tableAlias || tableName as string;
						qSelect.from([tableName, tableAlias]);
					} else {
						qSelect.from(fromItem);
					}
				})
			} else {
				qSelect.from([ctx.table, ctx.table])
			}

			const select = [...new Set([
				...ctx.selectVirtualFields,
				...tfq.select
			])]

			if (select.length) qSelect.select(select);

			if (tfq.wheres) {
				qSelect.where(tfq.wheres)
			};
		});

		return qSelect;
	}
}