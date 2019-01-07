import util = require('util')

const _cloneDeep = require('lodash.clonedeep')

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
export function standardizeOrder (order: string|string[]) {
	if (typeof order === "string") {
		if (order[0] === "-") {
			return [ [ order.substr(1), "Z" ] ];
		}
		return [ [ order, "A" ] ];
	}

	const new_order = [];
	let minus: boolean;

	for (var i = 0; i < order.length; i++) {
		minus = (order[i][0] === "-");

		if (i < order.length - 1 && [ "A", "Z" ].indexOf(order[i + 1].toUpperCase()) >= 0) {
			new_order.push([
				(minus ? order[i].substr(1) : order[i]),
				order[i + 1]
			]);
			i += 1;
		} else if (minus) {
			new_order.push([ order[i].substr(1), "Z" ]);
		} else {
			new_order.push([ order[i], "A" ]);
		}
	}

	return new_order;
};

/**
 * @description filtered out FxOrmInstance.Instance in mixed FxSqlQuerySubQuery.SubQueryConditions | { [k: string]: FxOrmInstance.Instance }
 */
export function checkConditions (
	conditions: ( FxSqlQuerySubQuery.SubQueryConditions | { [k: string]: FxOrmInstance.Instance } ),
	// one_associations: ( FxOrmAssociation.AssociationDefinitionOptions_HasOne | FxOrmAssociation.InstanceAssociationItem_HasOne )[]
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
export function values <T=any>(obj: object|[], keys?: string[]): T[] {
	var vals = [];

	if (keys) {
		for (let i = 0; i < keys.length; i++) {
			vals.push(obj[keys[i]]);
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
export function hasValues (obj: object, keys: string[]): boolean {
	for (var i = 0; i < keys.length; i++) {
		if (!obj[keys[i]] && obj[keys[i]] !== 0) return false;  // 0 is also a good value...
	}
	return true;
};

export function populateConditions (
	model: FxOrmModel.Model,
	fields: string[],
	source: FxOrmAssociation.AssociationDefinitionOptions | FxOrmInstance.Instance,
	target: FxSqlQuerySubQuery.SubQueryConditions,
	overwrite?: boolean
): void {
	for (var i = 0; i < model.id.length; i++) {
		if (typeof target[fields[i]] === 'undefined' || overwrite !== false) {
			target[fields[i]] = source[model.id[i]];
		} else if (Array.isArray(target[fields[i]])) {
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

	populateConditions(model, fields, from, conditions);

	return conditions;
};

export function wrapFieldObject (
	params: {
		field: string | FxOrmProperty.NormalizedFieldOptionsHash
		model: FxOrmModel.Model
		altName: string
		mapsTo?: FxOrmModel.ModelPropertyDefinition['mapsTo']
	}
): FxOrmProperty.NormalizedFieldOptionsHash {
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
		for (var k in params.field) {
			if (!/[0-9]+/.test(k) && params.field.hasOwnProperty(k)) {
				return params.field;
			}
		}
	}

	const field_str = params.field as string

	var newObj = <FxOrmProperty.NormalizedFieldOptionsHash>{},
		newProp: FxOrmProperty.NormalizedFieldOptions,
		propPreDefined: FxOrmProperty.NormalizedProperty,
		propFromKey: FxOrmProperty.NormalizedProperty;

	propPreDefined = params.model.properties[field_str];
	propFromKey    = params.model.properties[params.model.id[0]];
	newProp        = <FxOrmProperty.NormalizedFieldOptions>{ type: 'integer' };

	var prop: FxOrmProperty.NormalizedFieldOptions = _cloneDeep(propPreDefined || propFromKey || newProp);

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
): FxOrmProperty.NormalizedFieldOptionsHash {
	let fields = <FxOrmProperty.NormalizedFieldOptionsHash>{},
		field_opts: FxOrmProperty.NormalizedFieldOptions,
		field_name: string;

	var keys = model.id;
	var assoc_key: FxOrmAssociation.AssociationKeyComputation = model.settings.get("properties.association_key");

	for (var i = 0; i < keys.length; i++) {
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

			field_opts = <FxOrmProperty.NormalizedFieldOptions>{
				type     : p.type || "integer",
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
			field_opts = <FxOrmProperty.NormalizedFieldOptions>{
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
	props: FxOrmProperty.NormalizedFieldOptionsHash,
	opts: { required: boolean, makeKey: boolean }
): FxOrmProperty.NormalizedFieldOptionsHash {
	var prop: FxOrmProperty.NormalizedFieldOptions;

	for (var k in props) {
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

export function getRealPath (path_str, stack_index?) {
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
	dataIn: FxOrmInstance.InstanceDataPayload, properties: FxOrmProperty.NormalizedPropertyHash
) {
	var k: string, prop: FxOrmModel.ModelPropertyDefinition;
	var dataOut: FxOrmInstance.InstanceDataPayload = {};

	for (k in dataIn) {
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

	var item;
	var newOrder = JSON.parse(JSON.stringify(order));

	// Rename order properties according to mapsTo
	for (var i = 0; i < newOrder.length; i++) {
		item = newOrder[i];

		// orderRaw
		if (Array.isArray(item[1])) continue;

		if (Array.isArray(item[0])) {
			// order on a hasMany
			// [ ['modelName', 'propName'], 'Z']
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
	var k, prop;

	for (k in data) {
		prop = fieldToPropertyMap[k];
		if (prop && prop.name != k) {
			data[prop.name] = data[k];
			delete data[k];
		}
	}
	return data;
}
