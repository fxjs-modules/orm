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
import * as Helpers from './Helpers';
import { getMapsToFromPropertyHash } from './Associations/_utils';

const AvailableHooks: (keyof FxOrmModel.Hooks)[] = [
	"beforeCreate", "afterCreate",
	"beforeSave", "afterSave",
	"beforeValidation",
	"beforeRemove", "afterRemove",
	"afterLoad",
	"afterAutoFetch"
];

function noOp () {};

export const Model = function (
	m_opts: FxOrmModel.ModelConstructorOptions
) {
	m_opts = util.extend(m_opts || {}, { keys: m_opts.keys || [] });
	m_opts.keys = Array.isArray(m_opts.keys) ? m_opts.keys : [m_opts.keys];

	const one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[] = [];
	const many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[] = [];
	const extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[] = [];
	const association_properties: string[] = [];
	const model_fields: FxSqlQueryColumns.SelectInputArgType[] = [];
	const fieldToPropertyMap: FxOrmProperty.FieldToPropertyMapType = {};
	const allProperties: FxOrmProperty.NormalizedPropertyHash = {};
	const keyProperties: FxOrmProperty.NormalizedProperty[] = [];

	var createHookHelper = function (hook: keyof FxOrmModel.Hooks) {
		return function (cb: FxOrmHook.HookActionCallback) {
			if (typeof cb !== "function") {
				delete m_opts.hooks[hook];
			} else {
				m_opts.hooks[hook] = cb;
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
			if (m_opts.properties.hasOwnProperty(k)) continue;
			if (inst_opts.extra && inst_opts.extra.hasOwnProperty(k)) continue;
			if (m_opts.keys.indexOf(k) >= 0) continue;
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

		const assoc_opts = {
			autoFetch      : inst_opts.autoFetch || false,
			autoFetchLimit : inst_opts.autoFetchLimit,
			cascadeRemove  : inst_opts.cascadeRemove
		};

		const setupAssociations = function (instance: FxOrmInstance.Instance) {
			OneAssociation.extend(model, instance, m_opts.driver, one_associations);
			ManyAssociation.extend(model, instance, m_opts.driver, many_associations, assoc_opts, createInstance);
			ExtendAssociation.extend(model, instance, m_opts.driver, extend_associations, assoc_opts);
		};

		let pending = 2, create_err: FxOrmError.ExtendedError = null;

		const create_instance_evt_lock = new coroutine.Event();

		const readyTrigger = function (err?: Error, instance_item?: FxOrmInstance.Instance) {
			if (err)
				create_err = err;

			// TODO: add timeout for callback
			if (--pending === 0 || create_err) {
				create_instance_evt_lock.set();
			}
		}
		const instance = new Instance(model, {
			uid                    : inst_opts.uid, // singleton unique id
			keys                   : m_opts.keys,
			is_new                 : inst_opts.is_new || false,
			isShell                : inst_opts.isShell || false,
			data                   : data,
			autoSave               : inst_opts.autoSave || false,
			extra                  : inst_opts.extra,
			extra_info             : inst_opts.extra_info,
			driver                 : m_opts.driver,
			table                  : m_opts.table,
			hooks                  : m_opts.hooks,
			methods                : m_opts.methods,
			validations            : m_opts.validations,
			one_associations       : one_associations,
			many_associations      : many_associations,
			extend_associations    : extend_associations,
			association_properties : association_properties,
			setupAssociations      : setupAssociations,
			fieldToPropertyMap     : fieldToPropertyMap,
			keyProperties          : keyProperties,
			events				   : {
				'ready': function (err, instance) {
					readyTrigger(err, instance);
				}
			}
		});
		
		if (model_fields !== null) {
			LazyLoad.extend(instance, model, m_opts.properties);
		}

		OneAssociation.autoFetch(instance, one_associations, assoc_opts, m_opts.driver.isPool);
		ManyAssociation.autoFetch(instance, many_associations, assoc_opts, m_opts.driver.isPool);
		ExtendAssociation.autoFetch(instance, extend_associations, assoc_opts, m_opts.driver.isPool);

		Hook.wait(instance, m_opts.hooks.afterAutoFetch, function (err: Error) {
			readyTrigger(err, instance);
		});

		if (typeof cb === "function") {
			cb(create_err, instance);
		} else {
			create_instance_evt_lock.set();
		}

		create_instance_evt_lock.wait();

		return instance;
	};

	const createInstanceSync = util.sync(createInstance);

	const model = function (
		..._data: FxOrmModel.ModelInstanceConstructorOptions
	) {
	    let data = _data.length > 1 ? _data : _data[0];

	    if (Array.isArray(m_opts.keys) && Array.isArray(data)) {
	        if (data.length == m_opts.keys.length) {
	            var data2: FxOrmModel.ModelInstanceConstructorOptions[0] = {};
	            for (let i = 0; i < m_opts.keys.length; i++) {
	                data2[m_opts.keys[i]] = data[i++];
	            }

	            return createInstance(data2, { isShell: true });
	        }
	        else {
	            const err: FibOrmNS.ExtensibleError = new Error('Model requires ' + m_opts.keys.length + ' keys, only ' + data.length + ' were provided');
	            err.model = m_opts.table;

	            throw err;
	        }
	    } else if (typeof data === "number" || typeof data === "string") {
	        var data2: FxOrmModel.ModelInstanceConstructorOptions[0] = {};
	        data2[m_opts.keys[0]] = data;

	        return createInstance(data2, { isShell: true });
	    } else if (typeof data === "undefined") {
	        data = {};
	    }

	    var isNew = false;

	    for (let i = 0; i < m_opts.keys.length; i++) {
	        if (!data.hasOwnProperty(m_opts.keys[i])) {
	            isNew = true;
	            break;
	        }
	    }

		if (keyProperties.length != 1 || (keyProperties.length == 1 && keyProperties[0].type != 'serial')) {
			isNew = true;
		}

	    return createInstance(data, {
	        is_new: isNew,
	        autoSave: m_opts.autoSave,
	        cascadeRemove: m_opts.cascadeRemove
	    });
	} as FxOrmModel.Model;

	model.allProperties = allProperties;
	model.properties    = m_opts.properties;
	model.settings      = m_opts.settings;
	model.keys          = m_opts.keys;

	model.dropSync = function (
		this:FxOrmModel.Model,
	) {
		if (typeof m_opts.driver.drop !== "function") {
			throw new ORMError("Driver does not support Model.drop()", 'NO_SUPPORT', { model: m_opts.table });
		}

		return m_opts.driver.drop({
			table             : m_opts.table,
			properties        : m_opts.properties,
			one_associations  : one_associations,
			many_associations : many_associations
		});
	}
	
	model.drop = function (
		this:FxOrmModel.Model,
		cb?: FxOrmNS.GenericCallback<void>
	) {
		const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(model.dropSync, [], { thisArg: model });
		Utilities.throwErrOrCallabckErrResult(syncResponse, { callback: cb });

		return this;
	};

	model.syncSync = function () {
		m_opts.driver.sync({
			extension           : m_opts.extension,
			id                  : m_opts.keys,
			table               : m_opts.table,
			properties          : m_opts.properties,
			allProperties       : allProperties,
			indexes             : m_opts.indexes || [],
			customTypes         : m_opts.db.customTypes,
			one_associations    : one_associations,
			many_associations   : many_associations,
			extend_associations : extend_associations
		});
	}

	model.sync = function <T>(
		this:FxOrmModel.Model,
		cb?: FxOrmNS.GenericCallback<FxOrmSqlDDLSync.SyncResult>
	) {
		const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(() => {
			if (typeof m_opts.driver.sync !== "function") {
				throw new ORMError("Driver does not support Model.sync()", 'NO_SUPPORT', { model: m_opts.table })
			}

			model.syncSync();
		});
		Utilities.throwErrOrCallabckErrResult(syncResponse, { callback: cb });

		return this;
	};

	model.getSync = function (
		this: FxOrmModel.Model,
		...ids
	) {
		
		const conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
		let options    = <FxOrmModel.ModelOptions__Get>{};
		let prop: FxOrmProperty.NormalizedProperty;

		if (typeof ids[ids.length - 1] === "object" && !Array.isArray(ids[ids.length - 1])) {
			options = ids.pop();
		}

		if (ids.length === 1 && Array.isArray(ids[0])) {
			ids = ids[0];
		}

		if (ids.length !== m_opts.keys.length) {
		    throw new ORMError("Model.get() IDs number mismatch (" + m_opts.keys.length + " needed, " + ids.length + " passed)", 'PARAM_MISMATCH', { model: m_opts.table });
		}

		for (let i = 0; i < keyProperties.length; i++) {
			prop = keyProperties[i];
			conditions[prop.mapsTo] = ids[i];
		}
		Utilities.filterWhereConditionsInput(conditions, model);

		if (!options.hasOwnProperty("autoFetch")) {
			options.autoFetch = m_opts.autoFetch;
		}
		if (!options.hasOwnProperty("autoFetchLimit")) {
			options.autoFetchLimit = m_opts.autoFetchLimit;
		}
		if (!options.hasOwnProperty("cascadeRemove")) {
			options.cascadeRemove = m_opts.cascadeRemove;
		}

		let founditems: FxOrmDMLDriver.QueryDataPayload[],
			err: FxOrmError.ExtendedError

		let found_instance: FxOrmInstance.Instance;
		const singleton_lock = new coroutine.Event();

		function deferGet () {
			try {
				founditems = m_opts.driver.find(
					model_fields,
					m_opts.table,
					conditions,
					{ limit: 1 }
				);
			} catch (ex) {
				err = ex;

				if (err)
					throw new ORMError(err.message, 'QUERY_ERROR', { originalCode: err.code });
			}

			if (founditems.length === 0) {
				throw new ORMError("Not found", 'NOT_FOUND', { model: m_opts.table });
			}

			Utilities.renameDatastoreFieldsToPropertyNames(founditems[0], fieldToPropertyMap);
		}

		const uid = m_opts.driver.uid + "/" + m_opts.table + "/" + ids.join("/");
		Singleton.get(
			uid,
			{
				identityCache : (options.hasOwnProperty("identityCache") ? options.identityCache : m_opts.identityCache),
				saveCheck     : m_opts.settings.get("instance.identityCacheSaveCheck")
			},
			function (returnCb: FxOrmNS.GenericCallback<FxOrmInstance.Instance>) {
				deferGet();

				return createInstance(founditems[0], {
					uid            : uid,
					autoSave       : options.autoSave,
					autoFetch      : (options.autoFetchLimit === 0 ? false : options.autoFetch),
					autoFetchLimit : options.autoFetchLimit,
					cascadeRemove  : options.cascadeRemove
				}, returnCb);
			},
			function (ex: FxOrmError.ExtendedError, instance: FxOrmInstance.Instance) {
				err = ex;

				found_instance = instance;
				singleton_lock.set();
			}
		);

		singleton_lock.wait();

		return found_instance;
	}

	model.get = function (
		this:FxOrmModel.Model,
		...args: any[]
	) {
		const cb: FxOrmModel.ModelMethodCallback__Get = util.last(args);
		const with_callback = typeof cb === 'function';

		if (with_callback)
			args.pop();

		const waitor = with_callback ? new coroutine.Event() : undefined

		process.nextTick(() => {
			const syncReponse = Utilities.exposeErrAndResultFromSyncMethod<FxOrmInstance.Instance>(model.getSync, args, { thisArg: model });

			if (waitor) waitor.set();
			if (with_callback)
				cb(syncReponse.error, syncReponse.result);
		});
		if (waitor) waitor.wait();

		return this;
	};

	const chainOrRun = function (
		this: FxOrmModel.Model
	) {
		var conditions: FxSqlQuerySubQuery.SubQueryConditions = null;
		var options = <FxOrmModel.ModelOptions__Find>{};
		var order: FxOrmModel.ModelOptions__Find['order'] = null;
		var merges: FxOrmQuery.ChainFindMergeInfo[] = [];

		Helpers.selectArgs(arguments, (arg_type, arg) => {
			switch (arg_type) {
				case "number":
					options.limit = arg;
					break;
				case "object":
					if (Array.isArray(arg)) {
						if (arg.length > 0) {
							order = arg;
						}
					} else {
						if (conditions === null) {
							conditions = arg;
							Utilities.filterWhereConditionsInput(conditions, model);
						} else {
							if (options.hasOwnProperty("limit")) {
								arg.limit = options.limit;
							}
							options = arg;

							if (options.hasOwnProperty("__merge")) {
								merges = Utilities.combineMergeInfoToArray(options.__merge);
								merges.forEach(merge => {
									if (Array.isArray(merge.select) && merge.select.length) {
									} else {
										merge.select = [];

										// compat old interface, but not recommended
										if (options.extra && Object.keys(options.extra).length)
											merge.select = merge.select.concat(Object.keys(options.extra))
									}

									merge.select = Array.from( new Set(merge.select) )
								});
								delete options.__merge;
							}
							if (options.hasOwnProperty("order")) {
								order = options.order;
								delete options.order;
							}
						}
					}
					break;
				case "string":
					order = arg
					// if (arg[0] === "-") {
					// 	order = [ arg.substr(1), "Z" ];
					// } else {
					// 	order = [ arg ];
					// }
					break;
			}
		});

		if (!options.hasOwnProperty("limit")) {
			options.limit = m_opts.settings.get('instance.defaultFindLimit');
		}

		if (!options.hasOwnProperty("identityCache")) {
			options.identityCache = m_opts.identityCache;
		}
		if (!options.hasOwnProperty("autoFetchLimit")) {
			options.autoFetchLimit = m_opts.autoFetchLimit;
		}
		if (!options.hasOwnProperty("cascadeRemove")) {
			options.cascadeRemove = m_opts.cascadeRemove;
		}

		let normalized_order_without_table: FxOrmQuery.OrderNormalizedTupleMixin = []
		if (order) {
			normalized_order_without_table = Utilities.standardizeOrder(order);
		} else {
			normalized_order_without_table = []
		}

		const base_table = options.chainfind_linktable || m_opts.table;
		let normalized_order = normalized_order_without_table
		if (merges && merges.length) {
			const table_alias = Utilities.parseFallbackTableAlias(base_table);
			normalized_order = Utilities.addTableToStandardedOrder(normalized_order_without_table, table_alias);
		}
		
		if (conditions) {
			conditions = Utilities.checkConditions(conditions, one_associations);
		}

		var chain = new ChainFind(model, {
			only         : options.only || model_fields,
			keys         : m_opts.keys,
			table        : base_table,
			driver       : m_opts.driver,
			conditions   : conditions,
			associations : many_associations,
			limit        : options.limit,
			order        : normalized_order,
			merge        : merges,
			exists		 : options.exists || [],
			offset       : options.offset,
			properties   : allProperties,
			keyProperties: keyProperties,
			newInstanceSync  : function (data) {
				// We need to do the rename before we construct the UID & do the cache lookup
				// because the cache is loaded using propertyName rather than fieldName
				Utilities.renameDatastoreFieldsToPropertyNames(data, fieldToPropertyMap);

				// Construct UID
				const merge_id = merges.map(merge => (merge ? merge.from.table : "")).join(',');
				var uid = m_opts.driver.uid + "/" + m_opts.table + (merge_id ? `+${merge_id}` : "");
				for (let i = 0; i < m_opts.keys.length; i++) {
					uid += "/" + data[m_opts.keys[i]];
				}

				const singleton_lock = new coroutine.Event();
				let found_instance: FxOrmInstance.Instance = null;
				// Now we can do the cache lookup
				Singleton.get(uid, {
					identityCache : options.identityCache,
					saveCheck     : m_opts.settings.get("instance.identityCacheSaveCheck")
				}, function (cb: FxOrmNS.GenericCallback<FxOrmInstance.Instance>) {
					return createInstance(data, {
						uid            : uid,
						autoSave       : m_opts.autoSave,
						autoFetch      : (options.autoFetchLimit === 0 ? false : (options.autoFetch || m_opts.autoFetch)),
						autoFetchLimit : options.autoFetchLimit,
						cascadeRemove  : options.cascadeRemove,
						extra          : options.extra,
						extra_info     : options.extra_info
					}, cb);
				}, function (ex: FxOrmError.ExtendedError, instance: FxOrmInstance.Instance) {
					found_instance = instance;

					singleton_lock.set();
					if (ex)
						throw ex;
				});

				singleton_lock.wait();

				return found_instance;
			}
		});

		return chain;
	}

	model.findSync = function (
		this:FxOrmModel.Model,
		...args: any[]
	) {
		const chain: FxOrmQuery.IChainFind = chainOrRun.apply(model, args);

		return chain.runSync()
	};

	model.find = function (
		this:FxOrmModel.Model,
		...args: any[]
	) {
		var cb: FxOrmModel.ModelMethodCallback__Find = null;
		if (typeof util.last(args) === 'function')
			cb = args.pop();

		const chain = chainOrRun.apply(model, args);

		if (cb)
			chain.run(cb);
			
		return chain;
	};

	model.where = model.all = model.find;
	model.whereSync = model.allSync = model.findSync;

	model.oneSync = function (
		this:FxOrmModel.Model,
		...args: any[]
	) {
		const results = this.find(...args).limit(1).runSync();

		return results.length ? results[0] : null;
	};

	model.one = function (...args: any[]) {
		var cb: FxOrmModel.ModelMethodCallback__Get = null;

		Helpers.selectArgs(args, function (arg_type, arg) {
			switch (arg_type) {
				case 'function':
					cb = arg;
					break;
			}
		});
		args = args.filter(x => x !== cb);

		if (typeof cb !== "function") {
		    throw new ORMError("Missing Model.one() callback", 'MISSING_CALLBACK', { model: m_opts.table });
		}

		const newCb = function (err: Error, results: FxOrmInstance.Instance[]) {
			if (err)
				return cb(err);

			return cb(null, results.length ? results[0] : null);
		}

		args.push(1);	

		const chain = this.find(...args);

		chain.run(newCb);

		return chain;
	};

	model.countSync = function (conditions) {
		if (conditions) {
			conditions = Utilities.checkConditions(conditions, one_associations);
			Utilities.filterWhereConditionsInput(conditions, model);
		}

		const data = m_opts.driver.count(
			m_opts.table,
			conditions,
			{}
		);

		if (data.length === 0)
			return 0;

		return data[0].c;
	};

	model.count = function () {
		var conditions: FxSqlQuerySubQuery.SubQueryConditions = null;
		var cb: FxOrmModel.ModelMethodCallback__Count         = null;

		Helpers.selectArgs(arguments, (arg_type, arg) => {
			switch (arg_type) {
				case "object":
					conditions = arg;
					break;
				case "function":
					cb = arg;
					break;
			}
		});

		if (typeof cb !== "function") {
		    throw new ORMError("Missing Model.count() callback", 'MISSING_CALLBACK', { model: m_opts.table });
		}
		
		process.nextTick(() => {
			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(model.countSync, [conditions, cb], {thisArg: model});
			Utilities.throwErrOrCallabckErrResult(syncResponse, { callback: cb });
		});

		return this;
	}

	model.aggregate = function () {
		var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
		var propertyList: string[] = [];

		Helpers.selectArgs(arguments, (arg_type, arg) => {
			if (arg_type === 'object') {
				if (Array.isArray(arg)) {
					propertyList = arg;
				} else {
					conditions = arg;
				}
			}
		});

		if (conditions) {
			conditions = Utilities.checkConditions(conditions, one_associations);
			Utilities.filterWhereConditionsInput(conditions, model);
		}

		return new AggregateFunctions({
			table        : m_opts.table,
			driver_name  : m_opts.driver_name,
			driver       : m_opts.driver,
			conditions   : conditions,
			propertyList : propertyList,
			properties   : allProperties
		});
	};

	model.existsSync = function (...ids) {
		let conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};

		/**
		 * assign keys' id columns comparator-eq value
		 * as its order in `m_opts.keys`
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
		const firstItem = ids[0];
		if (ids.length === 1 && typeof firstItem === "object") {
			if (Array.isArray(firstItem)) {
				/**
				 * @example
				 * Person.exists([1, 7])
				 */
				const col_values = firstItem
				for (let i = 0; i < m_opts.keys.length; i++) {
					conditions[m_opts.keys[i]] = col_values[i];
				}
			} else {
				/**
				 * @access general usage
				 * @example
				 * Person.exists({key_1: 1, key_2: 7})
				 */
				conditions = firstItem;
			}
		} else {
			/**
			 * @example
			 * Person.exists(1, 7)
			 */
			for (let i = 0; i < m_opts.keys.length; i++) {
				conditions[m_opts.keys[i]] = ids[i] as any;
			}
		}

		if (conditions) {
			conditions = Utilities.checkConditions(conditions, one_associations);
			Utilities.filterWhereConditionsInput(conditions, model);
		}

		const data = m_opts.driver.count(m_opts.table, conditions, {});

		if (data.length === 0)
			return false;

		return data[0].c > 0;
	}

	model.exists = function (...ids) {
		var cb: FxOrmModel.ModelMethodCallback__Boolean  = ids.pop() as any;

		if (typeof cb !== "function") {
		    throw new ORMError("Missing Model.exists() callback", 'MISSING_CALLBACK', { model: m_opts.table });
		}

		const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(model.existsSync, ids, { thisArg: model });
		Utilities.throwErrOrCallabckErrResult(syncResponse, { callback: cb });

		return this;
	}

	model.create = function (...args: any[]) {
		var done: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance | FxOrmInstance.Instance[]>        = null;
		Helpers.selectArgs(arguments, (arg_type, arg, idx) => {
			switch (arg_type) {
				case "function":
					done = arg;
					args = args.filter(x => x !== done)
					break;
			}
		});
	
		const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(
			model.createSync,
			args,
			{ thisArg: model }
		)

		Utilities.throwErrOrCallabckErrResult(syncResponse, { callback: done });

		return syncResponse.result;
	}

	model.createSync = function (): any {
		const items: FxOrmInstance.Instance[] = [];

		let create_single: boolean      = false;
		let itemsParams: FxOrmInstance.InstanceDataPayload[] = []

		Helpers.selectArgs(arguments, (arg_type, arg, idx) => {
			switch (arg_type) {
				case "object":
					if ( !create_single && Array.isArray(arg) ) {
						itemsParams = itemsParams.concat(arg);
					} else if (idx === 0) {
						create_single = true;
						itemsParams.push(arg);
					}
					break;
			}
		});

		for (let idx = 0; idx < itemsParams.length; idx++) {
			const data = itemsParams[idx];
			
			const item = createInstanceSync(data, {
				is_new    : true,
				autoSave  : m_opts.autoSave,
				// not fetch associated instance on its creation.
				autoFetch : false
			});

			item.saveSync();
			items.push(item);
		}

		const results = create_single ? items[0] : items;
		
		return results;
	};

	model.clearSync = function () {
		return m_opts.driver.clear(m_opts.table);
	};

	model.clear = function (cb?) {
		m_opts.driver.clear(m_opts.table, function (err: Error) {
			if (typeof cb === "function") cb(err);
		});

		return this;
	};

	model.prependValidation = function (key: string, validation: FibjsEnforce.IValidator) {
		if(m_opts.validations.hasOwnProperty(key)) {
			(m_opts.validations[key] as FibjsEnforce.IValidator[]).splice(0, 0, validation);
		} else {
			m_opts.validations[key] = [validation];
		}
	};

	// control current owned fields
	const currFields: {[k: string]: true} = {};

	model.findBy = function <T = any> (...args: any[]): FxOrmQuery.IChainFind {
		if (Array.isArray(args[0])) {
			const [by_list, self_conditions = {}, self_options, cb] = args as [
				FxOrmModel.ModelFindByDescriptorItem[],
				FxOrmModel.ModelQueryConditions__Find,
				FxOrmModel.ModelOptions__Find,
				FxOrmNS.ExecutionCallback<T>
			]
			return ListFindByChainOrRunSync(model, self_conditions, by_list, self_options, cb) as FxOrmQuery.IChainFind;
		}
		
		const [association_name, self_conditions, findby_options, cb] = args as [
			FxOrmModel.ModelFindByDescriptorItem['association_name'],
			FxOrmModel.ModelFindByDescriptorItem['conditions'],
			FxOrmModel.ModelFindByDescriptorItem['options'],
			FxOrmNS.ExecutionCallback<T>
		]
		return findBySolo(model, association_name, self_conditions, findby_options, cb)
	}

	model.findBySync = util.sync(model.findBy) as FxOrmModel.Model['findBySync']

	model.addProperty = function (propIn, options) {
		var cType: FxOrmProperty.CustomPropertyType;
		var prop = Property.normalize({
			prop: propIn as FxOrmModel.ModelPropertyDefinition, name: (options && options.name || propIn.name),
			customTypes: m_opts.db.customTypes, settings: m_opts.settings
		});

		// Maintains backwards compatibility
		if (m_opts.keys.indexOf(prop.name) != -1) {
			prop.key = true;
		} else if (prop.key) {
			m_opts.keys.push(prop.name);
		}

		if (options && options.klass) {
			prop.klass = options.klass;
		}

		switch (prop.klass) {
			case 'primary':
				m_opts.properties[prop.name]  = prop;
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
			if ((cType = m_opts.db.customTypes[prop.type]) && cType.datastoreGet) {
				model_fields.push({
					a: prop.mapsTo, sql: cType.datastoreGet(prop, m_opts.db.driver.query)
				});
			} else {
				model_fields.push(prop.mapsTo);
			}
		}

		return prop;
	} as FxOrmModel.Model['addProperty'];

	Object.defineProperty(model, "table", {
		value: m_opts.table,
		enumerable: false
	});
	Object.defineProperty(model, "id", {
		value: m_opts.keys,
		enumerable: false
	});
	Object.defineProperty(model, "uid", {
	    value: m_opts.driver.uid + "/" + m_opts.table + "/" + m_opts.keys.join("/"),
        enumerable: false
	});

	// Standardize validations
	for (let k in m_opts.validations) {
		const validationHash = m_opts.validations[k]
		if (!Array.isArray(validationHash)) {
			m_opts.validations[k] = [ validationHash ];
		}
	}

	// If no keys are defined add the default one
	if (m_opts.keys.length == 0 && !Object.values(m_opts.properties).some((p: FxOrmProperty.NormalizedProperty) => p.key === true)) {
		m_opts.properties[m_opts.settings.get("properties.primary_key")] = {
			type: 'serial', key: true, required: false, klass: 'primary'
		} as FxOrmProperty.NormalizedProperty;
	}

	// standardize properties
	for (let k in m_opts.properties) {
		model.addProperty(m_opts.properties[k], { name: k, klass: 'primary' });
	}

	if (keyProperties.length == 0) {
		throw new ORMError("Model defined without any keys", 'BAD_MODEL', { model: m_opts.table });
	}

	// setup hooks
	for (let k in AvailableHooks) {
		model[AvailableHooks[k]] = createHookHelper(AvailableHooks[k]);
	}

	model.associations = {};
	OneAssociation.prepare(model, one_associations);
	ManyAssociation.prepare(m_opts.db, model, many_associations);
	ExtendAssociation.prepare(m_opts.db, model, extend_associations);

	return model;
} as any as FxOrmModel.ModelConstructor;

export function findBySolo <T = any>(
	model: FxOrmModel.Model,
	association_name: FxOrmModel.ModelFindByDescriptorItem['association_name'],
	conditions: FxOrmModel.ModelFindByDescriptorItem['conditions'],
	findby_options: FxOrmModel.ModelFindByDescriptorItem['options'],
	cb: FxOrmNS.ExecutionCallback<T>
): FxOrmQuery.IChainFind {
	const findByAccessor = model.associations[association_name].association.modelFindByAccessor
	
	if (!findByAccessor || typeof model[findByAccessor] !== 'function')
		throw `invalid association name ${association_name} provided!`

	if (typeof cb === 'function')
		return model[findByAccessor](conditions, findby_options, cb)

	return model[findByAccessor](conditions, findby_options)
}

export function ListFindByChainOrRunSync <T = any> (
	model: FxOrmModel.Model,
	self_conditions: FxOrmModel.ModelQueryConditions__Find,
	by_list: FxOrmModel.ModelFindByDescriptorItem[],
	self_options: FxOrmModel.ModelOptions__Find,
	cb: FxOrmNS.ExecutionCallback<T>,
	is_sync: boolean = false
): FxOrmQuery.IChainFind | (FxOrmInstance.Instance | FxOrmInstance.Instance[]) {
	self_options = self_options || {};
	const merges = Utilities.combineMergeInfoToArray(self_options.__merge);

	const tableCountHash = {} as {[t: string]: number}
	function countTable (t: string, is_add: boolean = false) {
		if (!tableCountHash[t])
			tableCountHash[t] = 0

		if (is_add)
			tableCountHash[t]++

		return tableCountHash[t];
	}

	function getTableAlias(alias_from_t: string) {
		return `${alias_from_t}${countTable(alias_from_t, true)}`
	}

	let chainfind_linktable: string = null

	by_list.forEach(by_item => {
		const association = Helpers.tryGetAssociationItemFromModel(by_item.association_name, model);
		if (!association)
			return ;

		const isHasMany = Helpers.getManyAssociationItemFromModel(by_item.association_name, model) === association;
		const isHasOne = Helpers.getOneAssociationItemFromModel(by_item.association_name, model) === association;
		const isExtendsTo = Helpers.getExtendsToAssociationItemFromModel(by_item.association_name, model) === association;

		let merge_item: FxOrmQuery.ChainFindMergeInfo = null;
		Utilities.filterWhereConditionsInput(by_item.conditions, model);

		if (isHasMany) { // support hasmany
			const left_info = {
				table: `${model.table}`,
				alias: getTableAlias(`lt_${model.table}`),
				ids: model.id
			}
			const ljoin_info = {
				table: `${association.mergeTable}`,
				alias: getTableAlias(`lj_${association.mergeTable}`),
				ids: getMapsToFromPropertyHash(association.mergeId)
			}
			const rjoin_info = {
				table: `${association.mergeTable}`,
				alias: getTableAlias(`rj_${association.mergeTable}`),
				ids: getMapsToFromPropertyHash(association.mergeAssocId)
			}
			const right_info = {
				table: `${association.model.table}`,
				alias: getTableAlias(`rt_${association.model.table}`),
				ids: association.model.id
			}
			const extra_props = (association as FxOrmAssociation.InstanceAssociationItem_HasMany).props;

			const join_where = by_item.join_where || {};
			Utilities.filterWhereConditionsInput(join_where, model);

			merge_item = {
				from: { table: Utilities.tableAlias(ljoin_info.table, ljoin_info.alias), field: ljoin_info.ids },
				to: { table: left_info.table, field: left_info.ids },
				where : [ ljoin_info.alias, join_where ],
				table : left_info.alias,
				select: (by_item.extra_select || []).filter(x => extra_props.hasOwnProperty(x))
			};

			merges.push(merge_item);

			merge_item = {
				from: { table: Utilities.tableAlias(right_info.table, right_info.alias), field: right_info.ids },
				to: { table: rjoin_info.table, field: rjoin_info.ids },
				where : [ right_info.alias, by_item.conditions ],
				table : ljoin_info.alias,
				select: [],
			};

			merges.push(merge_item);

			chainfind_linktable = Utilities.tableAlias(model.table);
		} else if (isHasOne) { // support hasone
			const reled_ids = typeof association.field === 'string' ? [association.field] : (
				Array.isArray(association.field) ? association.field : getMapsToFromPropertyHash(association.field)
			)

			const base_info = {
				table: `${model.table}`,
				alias: `_base$${model.table}`,
				ids: !association.reversed ? reled_ids : association.model.id 
			}

			const rel_info = {
				table: `${association.model.table}`,
				alias: `_rel$${association.model.table}`,
				ids: !association.reversed ? association.model.id : reled_ids
			}

			merge_item = {
				from: { table: Utilities.tableAlias(rel_info.table, rel_info.alias), field: rel_info.ids },
				to: { table: Utilities.tableAlias(base_info.table, base_info.alias), field: base_info.ids },
				where : [ rel_info.alias, by_item.conditions ],
				table : base_info.alias,
				select: []
			}

			merges.push(merge_item);

			chainfind_linktable = Utilities.tableAlias(base_info.table, base_info.alias);
		} else if (isExtendsTo) { // support extendsTo
			merge_item = {
				from  : { table: association.model.table, field: Object.keys(association.field) },
				to    : { table: model.table, field: model.id },
				where : [ association.model.table, by_item.conditions ],
				table : model.table,
				select: []
			};

			merges.push(merge_item);
		}
	});

	self_options.__merge = merges;
	self_options.extra = {};
	
	if (chainfind_linktable)
		self_options.chainfind_linktable = chainfind_linktable;

	if (typeof cb === "function") {
		return model.find.call(model, self_conditions, self_options, cb);
	}

	const chain = model.find(self_conditions, self_options);

	if (is_sync)
		return chain.runSync();

	return chain;
}