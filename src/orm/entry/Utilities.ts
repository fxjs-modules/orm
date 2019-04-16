import util = require('util')
import events         = require("events");

import _cloneDeep = require('lodash.clonedeep')

import { Helpers as QueryHelpers } from '@fxjs/sql-query';

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
const ZIS = [ "A", "Z" ] as FxSqlQuery.OrderNormalizedTuple[1][]
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
	table_alias: string
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

export function populateModelIdKeysConditions (
	model: FxOrmModel.Model,
	fields: string[],
	// source: FxOrmAssociation.AssociationDefinitionOptions | FxOrmInstance.Instance,
	source: FxOrmInstance.InstanceDataPayload,
	target: FxSqlQuerySubQuery.SubQueryConditions,
	overwrite?: boolean
): void {
	for (let i = 0; i < model.id.length; i++) {
		if (typeof target[fields[i]] === 'undefined' || overwrite !== false) {
			target[fields[i]] = source[model.id[i]];
		} else if (Array.isArray(target[fields[i]])) { // that might be conjunction query conditions
			(target[fields[i]] as FxSqlQueryComparator.SubQueryInput[])
				.push(
					source[model.id[i]] as FxSqlQueryComparator.SubQueryInput
				);
		} else {
			target[fields[i]] = [target[fields[i]], source[model.id[i]]];
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

export function wrapFieldObject (
	params: {
		field: FxOrmAssociation.InstanceAssociationItem['field']
		model: FxOrmModel.Model
		altName: string
		mapsTo?: FxOrmModel.ModelPropertyDefinition['mapsTo']
	}
): FxOrmProperty.NormalizedPropertyHash {
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
				return params.field as FxOrmProperty.NormalizedPropertyHash;
			}
		}
	}

	const field_str = params.field as string

	var newObj = <FxOrmProperty.NormalizedPropertyHash>{},
		newProp: FxOrmProperty.NormalizedProperty,
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

	newObj[field_str] = prop;

	return newObj;
};

/**
 * 
 * @param model related Model
 * @param name field name
 * @param required is field required for relationship
 * @param reversed is model is reversed in relationship
 */
export function formatField (
	model: FxOrmModel.Model,
	name: string,
	required: boolean,
	reversed: boolean
): FxOrmProperty.NormalizedPropertyHash {
	let fields = <FxOrmProperty.NormalizedPropertyHash>{},
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

// If the parent associations key is `serial`, the join tables
// key should be changed to `integer`.
export function convertPropToJoinKeyProp (
	props: FxOrmProperty.NormalizedPropertyHash,
	opts: { required: boolean, makeKey: boolean }
): FxOrmProperty.NormalizedPropertyHash {
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
	var path = require("path"); // for now, load here (only when needed)
	var cwd = process.cwd();
	var err = new Error();
	var tmp = err.stack.split(/\r?\n/)[typeof stack_index !== "undefined" ? stack_index : 3], m;

	if ((m = tmp.match(/^\s*at\s+(.+):\d+:\d+$/)) !== null) {
		cwd = path.dirname(m[1]);
	} else if ((m = tmp.match(/^\s*at\s+module\.exports\s+\((.+?)\)/)) !== null) {
		cwd = path.dirname(m[1]);
	} else if ((m = tmp.match(/^\s*at\s+.+\s+\((.+):\d+:\d+\)$/)) !== null) {
		cwd = path.dirname(m[1]);
	}
	var pathIsAbsolute = path.isAbsolute || require('path-is-absolute');
	if (!pathIsAbsolute(path_str)) {
		path_str = path.join(cwd, path_str);
	}
	if (path_str.substr(-1) === path.sep) {
		path_str += "index";
	}

	return path_str;
};

export function transformPropertyNames (
	dataIn: FxOrmInstance.InstanceDataPayload, properties: FxOrmProperty.NormalizedPropertyHash | FxOrmModel.ModelPropertyDefinition
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
	order: FxOrmQuery.ChainFindOptions['order'], properties: FxOrmProperty.NormalizedPropertyHash
) {
	if (!order) return order;

	var newOrder: FxOrmQuery.ChainFindOptions['order'] = JSON.parse(JSON.stringify(order));

	// Rename order properties according to mapsTo
	for (let i = 0, item: typeof newOrder[any]; i < newOrder.length; i++) {
		item = newOrder[i];

		// [ ['SQL..??', [arg1, arg2]]
		if (Array.isArray(item[1])) continue;

		if (Array.isArray(item[0])) {
			// [ ['table or alias Name', 'propName'], 'Z']
			item[0][1] = properties[item[0][1]].mapsTo;
		} else {
			// normal order
			item[0] = properties[item[0]].mapsTo;
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
	key: 'assoc:hasMany' | 'assoc:hasOne' | 'findBy:common' | 'findBy:hasOne' | 'assoc:extendsTo' | 'findBy:extendsTo' | 'field:lazyload',
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
			break
	}	
}

export function combineMergeInfoToArray (
	merges: FxOrmQuery.ChainFindOptions['merge']
): FxOrmQuery.ChainFindMergeInfo[] {
	if (!Array.isArray(merges))
		merges = [merges]
	
	return merges.filter(x => x)
}

export function parseFallbackTableAlias (ta_str: string) {
	const [t, a = t] = QueryHelpers.parseTableInputStr(ta_str)

	return a
}

export function tableAlias (table: string, alias: string = table, same_suffix: string = '') {
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

export function ORM_Error(err: Error, cb: FibOrmNS.VoidCallback): FxOrmNS.ORMLike {
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
	if (err.code === "MODULE_NOT_FOUND")
		return true;

	if(
		[
			// windows not found
			'The system cannot find the file specified',
			// unix like not found
			'No such file or directory',
		].some((msg: string) => {
			return err.message.indexOf(msg) > -1
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

export function exposeErrAndResultFromSyncMethod<T = any> (
	doSth: Function,
	args: any[] = [],
	self: any = null
) {
	let error: FxOrmError.ExtendedError,
		result: T

	try {
		result = doSth.apply(self, args);
	} catch (ex) {
		error = ex
	}

	return {
		error,
		result
	}
}