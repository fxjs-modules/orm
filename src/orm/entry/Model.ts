/// <reference lib="es2017" />

import coroutine = require('coroutine')
import util = require('util')

import ChainFind         = require("./ChainFind");
import { Instance }      from "./Instance";
import LazyLoad          = require("./LazyLoad");
import ManyAssociation   = require("./Associations/Many");
import OneAssociation    = require("./Associations/One");
import ExtendAssociation = require("./Associations/Extend");
import Property          = require("./Property");
import Singleton         = require("./Singleton");
import Utilities         = require("./Utilities");
import Validators        = require("./Validators");
import ORMError          = require("./Error");
import Hook              = require("./Hook");
import AggregateFunctions = require("./AggregateFunctions");

const AvailableHooks: (keyof FxOrmModel.Hooks)[] = [
	"beforeCreate", "afterCreate",
	"beforeSave", "afterSave",
	"beforeValidation",
	"beforeRemove", "afterRemove",
	"afterLoad",
	"afterAutoFetch"
];

function noOp () {};

export const Model: FxOrmModel.ModelConstructor = function (
	this: FxOrmModel.Model,
	opts: FxOrmModel.ModelConstructorOptions
) {
	opts = util.extend(opts || {}, { keys: opts.keys || [] });
	opts.keys = Array.isArray(opts.keys) ? opts.keys : [opts.keys];

	const one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[] = [];
	const many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[] = [];
	const extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[] = [];
	const association_properties: string[] = [];
	const model_fields: FxSqlQueryColumns.SelectInputArgType[] = [];
	const fieldToPropertyMap: FxOrmProperty.FieldToPropertyMapType = {};
	const allProperties: FxOrmProperty.NormalizedPropertyHash = {};
	const keyProperties: FxOrmProperty.NormalizedProperty[] = [];

	var createHookHelper = function (hook: string) {
		return function (cb: FxOrmHook.HookActionCallback) {
			if (typeof cb !== "function") {
				delete opts.hooks[hook];
			} else {
				opts.hooks[hook] = cb;
			}
			return this;
		};
	};
	var createInstance = function (
		data: FxOrmInstance.InstanceDataPayload,
		inst_opts: FxOrmInstance.CreateOptions,
		cb?: FxOrmNS.GenericCallback<FxOrmInstance.Instance>
	): FxOrmInstance.Instance {
		if (!inst_opts) {
			inst_opts = {};
		}

		var found_assoc = false;

		for (let k in data) {
			if (k === "extra_field") continue;
			if (opts.properties.hasOwnProperty(k)) continue;
			if (inst_opts.extra && inst_opts.extra.hasOwnProperty(k)) continue;
			if (opts.keys.indexOf(k) >= 0) continue;
			if (association_properties.indexOf(k) >= 0) continue;

			for (let i = 0; i < one_associations.length; i++) {
				if (one_associations[i].name === k) {
					found_assoc = true;
					break;
				}
			}
			if (!found_assoc) {
				for (let i = 0; i < many_associations.length; i++) {
					if (many_associations[i].name === k) {
						found_assoc = true;
						break;
					}
				}
			}
			if (!found_assoc) {
				delete data[k];
			}
		}

		var assoc_opts = {
			autoFetch      : inst_opts.autoFetch || false,
			autoFetchLimit : inst_opts.autoFetchLimit,
			cascadeRemove  : inst_opts.cascadeRemove
		};

		var setupAssociations = function (instance: FxOrmInstance.Instance) {
			OneAssociation.extend(model, instance, opts.driver, one_associations);
			ManyAssociation.extend(model, instance, opts.driver, many_associations, assoc_opts, createInstance);
			ExtendAssociation.extend(model, instance, opts.driver, extend_associations, assoc_opts);
		};

		var pending  = 2, create_err = null;
		var instance = new Instance(model, {
			uid                    : inst_opts.uid, // singleton unique id
			keys                   : opts.keys,
			is_new                 : inst_opts.is_new || false,
			isShell                : inst_opts.isShell || false,
			data                   : data,
			autoSave               : inst_opts.autoSave || false,
			extra                  : inst_opts.extra,
			extra_info             : inst_opts.extra_info,
			driver                 : opts.driver,
			table                  : opts.table,
			hooks                  : opts.hooks,
			methods                : opts.methods,
			validations            : opts.validations,
			one_associations       : one_associations,
			many_associations      : many_associations,
			extend_associations    : extend_associations,
			association_properties : association_properties,
			setupAssociations      : setupAssociations,
			fieldToPropertyMap     : fieldToPropertyMap,
			keyProperties          : keyProperties
		});
		instance.on("ready", function (err: Error) {
			if (--pending > 0) {
				create_err = err;
				return;
			}
			if (typeof cb === "function") {
				return cb(err || create_err, instance);
			}
		});
		if (model_fields !== null) {
			LazyLoad.extend(instance, model, opts.properties);
		}

		OneAssociation.autoFetch(instance, one_associations, assoc_opts, function () {
			ManyAssociation.autoFetch(instance, many_associations, assoc_opts, function () {
				ExtendAssociation.autoFetch(instance, extend_associations, assoc_opts, function () {
					Hook.wait(instance, opts.hooks.afterAutoFetch, function (err: Error) {
						if (--pending > 0) {
							create_err = err;
							return;
						}
						if (typeof cb === "function") {
							return cb(err || create_err, instance);
						}
					});
				});
			});
		});
		return instance;
	};

	const model = function (
		..._data: FxOrmModel.ModelInstanceConstructorOptions
	) {
	    let data = _data.length > 1 ? _data : _data[0];

	    if (Array.isArray(opts.keys) && Array.isArray(data)) {
	        if (data.length == opts.keys.length) {
	            var data2 = {};
	            for (let i = 0; i < opts.keys.length; i++) {
	                data2[opts.keys[i]] = data[i++];
	            }

	            return createInstance(data2, { isShell: true });
	        }
	        else {
	            const err: FibOrmNS.ExtensibleError = new Error('Model requires ' + opts.keys.length + ' keys, only ' + data.length + ' were provided');
	            err.model = opts.table;

	            throw err;
	        }
	    } else if (typeof data === "number" || typeof data === "string") {
	        var data2 = {};
	        data2[opts.keys[0]] = data;

	        return createInstance(data2, { isShell: true });
	    } else if (typeof data === "undefined") {
	        data = {};
	    }

	    var isNew = false;

	    for (let i = 0; i < opts.keys.length; i++) {
	        if (!data.hasOwnProperty(opts.keys[i])) {
	            isNew = true;
	            break;
	        }
	    }

		if (keyProperties.length != 1 || (keyProperties.length == 1 && keyProperties[0].type != 'serial')) {
			isNew = true;
		}

	    return createInstance(data, {
	        is_new: isNew,
	        autoSave: opts.autoSave,
	        cascadeRemove: opts.cascadeRemove
	    });
	} as FxOrmModel.Model;

	model.allProperties = allProperties;
	model.properties    = opts.properties;
	model.settings      = opts.settings;
	model.keys          = opts.keys;

	model.drop = function <T>(
		this:FxOrmModel.Model,
		cb?: FxOrmNS.GenericCallback<void>
	) {
		if (arguments.length === 0) {
			cb = noOp;
		}
		if (typeof opts.driver.drop === "function") {
			opts.driver.drop({
				table             : opts.table,
				properties        : opts.properties,
				one_associations  : one_associations,
				many_associations : many_associations
			}, cb);

			return this;
		}

		return cb(new ORMError("Driver does not support Model.drop()", 'NO_SUPPORT', { model: opts.table }));
	};

	model.sync = function <T>(
		this:FxOrmModel.Model,
		cb?: FxOrmNS.GenericCallback<FxOrmSqlDDLSync.SyncResult>
	) {
		if (arguments.length === 0) {
			cb = function () {};
		}
		if (typeof opts.driver.sync === "function") {
			try {
				opts.driver.sync({
					extension           : opts.extension,
					id                  : opts.keys,
					table               : opts.table,
					properties          : opts.properties,
					allProperties       : allProperties,
					indexes             : opts.indexes || [],
					customTypes         : opts.db.customTypes,
					one_associations    : one_associations,
					many_associations   : many_associations,
					extend_associations : extend_associations
				}, cb);
			} catch (e) {
				return cb(e);
			}

			return this;
		}

		return cb(new ORMError("Driver does not support Model.sync()", 'NO_SUPPORT', { model: opts.table }));
	};

	model.get = function (
		this:FxOrmModel.Model,
		cb?: FxOrmModel.ModelMethodCallback__Get
	) {
		const conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
		let options    = <FxOrmModel.ModelOptions__Get>{};
		let ids        = Array.prototype.slice.apply(arguments);
		let prop: FxOrmProperty.NormalizedProperty;

		cb = ids.pop() as any;

		if (typeof cb !== "function") {
		    throw new ORMError("Missing Model.get() callback", 'MISSING_CALLBACK', { model: opts.table });
		}

		if (typeof ids[ids.length - 1] === "object" && !Array.isArray(ids[ids.length - 1])) {
			options = ids.pop();
		}

		if (ids.length === 1 && Array.isArray(ids[0])) {
			ids = ids[0];
		}

		if (ids.length !== opts.keys.length) {
		    throw new ORMError("Model.get() IDs number mismatch (" + opts.keys.length + " needed, " + ids.length + " passed)", 'PARAM_MISMATCH', { model: opts.table });
		}

		for (let i = 0; i < keyProperties.length; i++) {
			prop = keyProperties[i];
			conditions[prop.mapsTo] = ids[i];
		}

		if (!options.hasOwnProperty("autoFetch")) {
			options.autoFetch = opts.autoFetch;
		}
		if (!options.hasOwnProperty("autoFetchLimit")) {
			options.autoFetchLimit = opts.autoFetchLimit;
		}
		if (!options.hasOwnProperty("cascadeRemove")) {
			options.cascadeRemove = opts.cascadeRemove;
		}

		opts.driver.find(
			model_fields,
			opts.table,
			conditions,
			{ limit: 1 },
			function (err: FxOrmError.ExtendedError, data: FxOrmDMLDriver.QueryDataPayload[]) {
				if (err) {
					return cb(new ORMError(err.message, 'QUERY_ERROR', { originalCode: err.code }));
				}
				if (data.length === 0) {
					return cb(new ORMError("Not found", 'NOT_FOUND', { model: opts.table }));
				}

				Utilities.renameDatastoreFieldsToPropertyNames(data[0], fieldToPropertyMap);

				var uid = opts.driver.uid + "/" + opts.table + "/" + ids.join("/");

				Singleton.get(
					uid,
					{
						identityCache : (options.hasOwnProperty("identityCache") ? options.identityCache : opts.identityCache),
						saveCheck     : opts.settings.get("instance.identityCacheSaveCheck")
					},
					function (cb: FxOrmNS.GenericCallback<FxOrmInstance.Instance>) {
						return createInstance(data[0], {
							uid            : uid,
							autoSave       : options.autoSave,
							autoFetch      : (options.autoFetchLimit === 0 ? false : options.autoFetch),
							autoFetchLimit : options.autoFetchLimit,
							cascadeRemove  : options.cascadeRemove
						}, cb);
					},
					cb
				);
			}
		);

		return this;
	};

	model.find = function (
		this:FxOrmModel.Model
	) {
		var conditions: FxSqlQuerySubQuery.SubQueryConditions = null;
		var options = <FxOrmModel.ModelOptions__Find>{};
		var cb: FxOrmModel.ModelMethodCallback__Find = null;
		var order = null;
		var merge = null;

		for (var i = 0; i < arguments.length; i++) {
			switch (typeof arguments[i]) {
				case "number":
					options.limit = arguments[i];
					break;
				case "object":
					if (Array.isArray(arguments[i])) {
						if (arguments[i].length > 0) {
							order = arguments[i];
						}
					} else {
						if (conditions === null) {
							conditions = arguments[i];
						} else {
							if (options.hasOwnProperty("limit")) {
								arguments[i].limit = options.limit;
							}
							options = arguments[i];

							if (options.hasOwnProperty("__merge")) {
								merge = options.__merge;
								merge.select = Object.keys(options.extra);
								delete options.__merge;
							}
							if (options.hasOwnProperty("order")) {
								order = options.order;
								delete options.order;
							}
						}
					}
					break;
				case "function":
					cb = arguments[i];
					break;
				case "string":
					if (arguments[i][0] === "-") {
						order = [ arguments[i].substr(1), "Z" ];
					} else {
						order = [ arguments[i] ];
					}
					break;
			}
		}

		if (!options.hasOwnProperty("identityCache")) {
			options.identityCache = opts.identityCache;
		}
		if (!options.hasOwnProperty("autoFetchLimit")) {
			options.autoFetchLimit = opts.autoFetchLimit;
		}
		if (!options.hasOwnProperty("cascadeRemove")) {
			options.cascadeRemove = opts.cascadeRemove;
		}

		if (order) {
			order = Utilities.standardizeOrder(order);
		}
		
		if (conditions) {
			conditions = Utilities.checkConditions(conditions, one_associations);
		}

		var chain = new ChainFind(model, {
			only         : options.only || model_fields,
			keys         : opts.keys,
			table        : opts.table,
			driver       : opts.driver,
			conditions   : conditions,
			associations : many_associations,
			limit        : options.limit,
			order        : order,
			merge        : merge,
			exists		 : options.exists || [],
			offset       : options.offset,
			properties   : allProperties,
			keyProperties: keyProperties,
			newInstance  : function (data, cb) {
				// We need to do the rename before we construct the UID & do the cache lookup
				// because the cache is loaded using propertyName rather than fieldName
				Utilities.renameDatastoreFieldsToPropertyNames(data, fieldToPropertyMap);

				// Construct UID
				var uid = opts.driver.uid + "/" + opts.table + (merge ? "+" + merge.from.table : "");
				for (var i = 0; i < opts.keys.length; i++) {
					uid += "/" + data[opts.keys[i]];
				}

				// Now we can do the cache lookup
				Singleton.get(uid, {
					identityCache : options.identityCache,
					saveCheck     : opts.settings.get("instance.identityCacheSaveCheck")
				}, function (cb: FxOrmNS.GenericCallback<FxOrmInstance.Instance>) {
					return createInstance(data, {
						uid            : uid,
						autoSave       : opts.autoSave,
						autoFetch      : (options.autoFetchLimit === 0 ? false : (options.autoFetch || opts.autoFetch)),
						autoFetchLimit : options.autoFetchLimit,
						cascadeRemove  : options.cascadeRemove,
						extra          : options.extra,
						extra_info     : options.extra_info
					}, cb);
				}, cb);
			}
		});

		if (typeof cb !== "function") {
			return chain;
		} else {
			chain.run(cb);
			return this;
		}
	} as FxOrmModel.Model['find'];

	model.where = model.all = model.find;

	model.one = function (...args: any[]) {
		var cb: FxOrmModel.ModelMethodCallback__Get = null;

		// extract callback
		for (var i = 0; i < args.length; i++) {
			if (typeof args[i] === "function") {
				cb = args.splice(i, 1)[0];
				break;
			}
		}

		if (cb === null) {
		    throw new ORMError("Missing Model.one() callback", 'MISSING_CALLBACK', { model: opts.table });
		}

		// add limit 1
		args.push(1);
		args.push(function (err: Error, results: FxOrmInstance.Instance[]) {
			if (err) {
				return cb(err);
			}
			return cb(null, results.length ? results[0] : null);
		});

		return this.find.apply(this, args);
	} as FxOrmModel.Model['one'];

	model.count = function () {
		var conditions: FxSqlQuerySubQuery.SubQueryConditions = null;
		var cb: FxOrmModel.ModelMethodCallback__Count         = null;

		for (var i = 0; i < arguments.length; i++) {
			switch (typeof arguments[i]) {
				case "object":
					conditions = arguments[i];
					break;
				case "function":
					cb = arguments[i];
					break;
			}
		}

		if (typeof cb !== "function") {
		    throw new ORMError('MISSING_CALLBACK', "Missing Model.count() callback", { model: opts.table });
		}

		if (conditions) {
			conditions = Utilities.checkConditions(conditions, one_associations);
		}

		opts.driver.count(
			opts.table,
			conditions,
			{}, 
			function (err, data) {
				if (err || data.length === 0) {
					return cb(err);
				}
				return cb(null, data[0].c);
			});
		return this;
	} as FxOrmModel.Model['count'];

	model.aggregate = function () {
		var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
		var propertyList: string[] = [];

		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] === 'object') {
				if (Array.isArray(arguments[i])) {
					propertyList = arguments[i];
				} else {
					conditions = arguments[i];
				}
			}
		}

		if (conditions) {
			conditions = Utilities.checkConditions(conditions, one_associations);
		}

		return new AggregateFunctions({
			table        : opts.table,
			driver_name  : opts.driver_name,
			driver       : opts.driver,
			conditions   : conditions,
			propertyList : propertyList,
			properties   : allProperties
		});
	} as FxOrmModel.Model['aggregate'];

	model.exists = function (...ids: any[]) {
		var cb: FxOrmModel.ModelMethodCallback__Boolean  = ids.pop() as any;

		if (typeof cb !== "function") {
		    throw new ORMError("Missing Model.exists() callback", 'MISSING_CALLBACK', { model: opts.table });
		}

		var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};

		/**
		 * assign keys' id columns comparator-eq value
		 * as its order in `opts.keys`
		 * 
		 * @example
		 * define('test', {
		 * 	key_1: {
		 * 		type: 'integer', key: true
		 * 	},
		 *  key_2: {
		 * 		type: 'integer', key: true
		 *  }
		 * })
		 */
		if (ids.length === 1 && typeof ids[0] === "object") {
			if (Array.isArray(ids[0])) {
				/**
				 * @example
				 * Person.exists([1, 7])
				 */
				const col_values = ids[0]
				for (let i = 0; i < opts.keys.length; i++) {
					conditions[opts.keys[i]] = col_values[i];
				}
			} else {
				/**
				 * @access general usage
				 * @example
				 * Person.exists({key_1: 1, key_2: 7})
				 */
				conditions = ids[0];
			}
		} else {
			/**
			 * @example
			 * Person.exists(1, 7)
			 */
			for (let i = 0; i < opts.keys.length; i++) {
				conditions[opts.keys[i]] = ids[i];
			}
		}

		if (conditions) {
			conditions = Utilities.checkConditions(conditions, one_associations);
		}

		opts.driver.count(opts.table, conditions, {}, function (err, data) {
			if (err || data.length === 0) {
				return cb(err);
			}
			return cb(null, data[0].c > 0);
		});
		return this;
	} as FxOrmModel.Model['exists'];

	model.create = function () {
		var itemsParams = []
		var items       = [];
		// var options     = {};
		var done        = null;
		var create_err	= null;
		var single      = false;

		for (var i = 0; i < arguments.length; i++) {
			switch (typeof arguments[i]) {
				case "object":
					if ( !single && Array.isArray(arguments[i]) ) {
						itemsParams = itemsParams.concat(arguments[i]);
					} else if (i === 0) {
						single = true;
						itemsParams.push(arguments[i]);
					} else {
						// options = arguments[i];
					}
					break;
				case "function":
					done = arguments[i];
					break;
			}
		}

		coroutine.parallel(itemsParams.map(
			(data: FxOrmInstance.InstanceDataPayload, index: number) => {
				return () => {
					if (create_err)
						return ;

					createInstance(data, {
						is_new    : true,
						autoSave  : opts.autoSave,
						// not fetch associated instance on its creation.
						autoFetch : false
					}, function (err: FxOrmError.BatchOperationInstanceErrorItem, item: FxOrmInstance.Instance) {
						if (create_err = err) {
							err.index    = index;
							err.instance = item;
							
							return done(err);
						}

						item.save(function (err: FxOrmError.BatchOperationInstanceErrorItem) {
							if (create_err = err) {
								err.index    = index;
								err.instance = item;

								return done(err);
							}

							items[index] = item;

							if (index === itemsParams.length - 1)
								done(null, single ? items[0] : items);
						});
					});
				}
			}
		));

		return this;
	} as FxOrmModel.Model['create'];

	model.clear = function (cb?) {
		opts.driver.clear(opts.table, function (err: Error) {
			if (typeof cb === "function") cb(err);
		});

		return this;
	} as FxOrmModel.Model['clear'];

	model.prependValidation = function (key: string, validation: enforce.IValidator) {
		if(opts.validations.hasOwnProperty(key)) {
			(opts.validations[key] as enforce.IValidator[]).splice(0, 0, validation);
		} else {
			opts.validations[key] = [validation];
		}
	} as FxOrmModel.Model['prependValidation'];

	// control current owned fields
	const currFields = {};

	model.addProperty = function (propIn, options) {
		var cType: FxOrmProperty.CustomPropertyType;
		var prop = Property.normalize({
			prop: propIn as FxOrmModel.ModelPropertyDefinition, name: (options && options.name || propIn.name),
			customTypes: opts.db.customTypes, settings: opts.settings
		});

		// Maintains backwards compatibility
		if (opts.keys.indexOf(k) != -1) {
			prop.key = true;
		} else if (prop.key) {
			opts.keys.push(k);
		}

		if (options && options.klass) {
			prop.klass = options.klass;
		}

		switch (prop.klass) {
			case 'primary':
				opts.properties[prop.name]  = prop;
				break;
			case 'hasOne':
				association_properties.push(prop.name)
				break;
		}

		allProperties[prop.name]        = prop;
		fieldToPropertyMap[prop.mapsTo] = prop;

		if (prop.required) {
			model.prependValidation(prop.name, Validators.required());
		}

		if (prop.key && prop.klass == 'primary') {
			keyProperties.push(prop);
		}

		if (prop.lazyload !== true && !currFields[prop.name]) {
			currFields[prop.name] = true;
			if ((cType = opts.db.customTypes[prop.type]) && cType.datastoreGet) {
				model_fields.push({
					a: prop.mapsTo, sql: cType.datastoreGet(prop, opts.db.driver.query)
				});
			} else {
				model_fields.push(prop.mapsTo);
			}
		}

		return prop;
	} as FxOrmModel.Model['addProperty'];

	Object.defineProperty(model, "table", {
		value: opts.table,
		enumerable: false
	});
	Object.defineProperty(model, "id", {
		value: opts.keys,
		enumerable: false
	});
	Object.defineProperty(model, "uid", {
	    value: opts.driver.uid + "/" + opts.table + "/" + opts.keys.join("/"),
        enumerable: false
	});

	// Standardize validations
	for (var k in opts.validations) {
		if (!Array.isArray(opts.validations[k])) {
			opts.validations[k] = [ opts.validations[k] ] as enforce.IValidator[];
		}
	}

	// If no keys are defined add the default one
	if (opts.keys.length == 0 && !Object.values(opts.properties).some((p: FxOrmProperty.NormalizedProperty) => p.key === true)) {
		opts.properties[opts.settings.get("properties.primary_key")] = {
			type: 'serial', key: true, required: false, klass: 'primary'
		} as FxOrmProperty.NormalizedProperty;
	}

	// standardize properties
	for (k in opts.properties) {
		model.addProperty(opts.properties[k], { name: k, klass: 'primary' });
	}

	if (keyProperties.length == 0) {
		throw new ORMError("Model defined without any keys", 'BAD_MODEL', { model: opts.table });
	}

	// setup hooks
	for (k in AvailableHooks) {
		model[AvailableHooks[k]] = createHookHelper(AvailableHooks[k]);
	}

	OneAssociation.prepare(model, one_associations);
	ManyAssociation.prepare(opts.db, model, many_associations);
	ExtendAssociation.prepare(opts.db, model, extend_associations);

	return model;
}
