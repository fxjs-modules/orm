/// <reference lib="es2017" />

import util = require('util')

import { FxOrmModel } from './Typo/model';

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
import ORMError from "./Error";
import Hook              = require("./Hook");
import AggregateFunctions = require("./AggregateFunctions");
import * as Helpers from './Helpers';
import { getMapsToFromPropertyHash } from './Associations/_utils';
import { FxOrmAssociation } from './Typo/assoc';
import { FxOrmProperty } from './Typo/property';
import { FxOrmInstance } from './Typo/instance';
import { FxOrmCommon } from './Typo/_common';
import { FxOrmNS } from './Typo/ORM';
import { FxOrmSqlDDLSync } from '@fxjs/sql-ddl-sync';
import { FxOrmDMLDriver } from './Typo/DMLDriver';
import { FxOrmError } from './Typo/Error';
import { FxOrmQuery } from './Typo/query';
import fc = require('fib-cache');

import type {
    FxSqlQuerySubQuery,
    FxSqlQueryColumns,
} from '@fxjs/sql-query';
import { pickPointTypeFields } from './Drivers/DML/_dml-helpers';

const AvailableHooks: (keyof FxOrmModel.Hooks)[] = [
	"beforeCreate", "afterCreate",
	"beforeSave", "afterSave",
	"beforeValidation", "afterValidation",
	"beforeRemove", "afterRemove",
	"afterLoad",
	"afterAutoFetch"
];

export const Model = function (
	m_opts: FxOrmModel.ModelConstructorOptions
) {
	m_opts = util.extend(m_opts || {}, { keys: m_opts.keys || [] });
	m_opts.keys = (Array.isArray(m_opts.keys) ? m_opts.keys : [m_opts.keys]).filter(Boolean);

	const one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[] = [];
	const many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[] = [];
	const extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[] = [];
	const association_properties: string[] = [];
	const model_selectable_fields: FxSqlQueryColumns.SelectInputArgType[] = [];
	const fieldToPropertyMap: FxOrmProperty.FieldToPropertyMapType = {};
	/**
	 * @description compared to m_opts.properties, allProperties means all properties including:
	 * 	1. association key properties, such as `{assoc_name}_{id}` property in default `hasOne` case,
	 * 	which was not included by m_opts.properties;
	 *  2. dynamically added properties by `model.addProperty(...)`, in fact, all association-about properties
	 *  were added by `addProperty` method
	 */
	const allProperties: Record<string, FxOrmProperty.NormalizedProperty> = {};
	const virtualProperties: Record<string, FxOrmProperty.NormalizedProperty> = {};
	// const __propertiesByName = new Proxy<typeof allProperties>(allProperties, {
	// 	get: (target, prop) => {
	// 		return target[prop as string] || virtualProperties[prop as string];
	// 	},
	// 	has: (target, prop) => {
	// 		return Reflect.has(target, prop) || (prop in virtualProperties);
	// 	},
	// 	ownKeys: (target) => {
	// 		return Reflect.ownKeys(target).concat(Object.keys(virtualProperties));
	// 	}
	// });

	const keyProperties: FxOrmProperty.NormalizedProperty[] = [];
	
	const initialHooks = Object.assign({}, m_opts.hooks)
	
	const createInstanceSync = function (
		data: FxOrmInstance.InstanceDataPayload,
		inst_opts: FxOrmInstance.CreateOptions,
		cb?: FxOrmCommon.GenericCallback<FxOrmInstance.Instance>
	): FxOrmInstance.Instance {
		if (!inst_opts) {
			inst_opts = {};
		}

		let found_assoc = false;

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

		const __setupAssociations = function (instance: FxOrmInstance.Instance) {
			OneAssociation.extend(model, instance, m_opts.driver, one_associations, { assoc_opts });
			ManyAssociation.extend(model, instance, m_opts.driver, many_associations, { assoc_opts });
			ExtendAssociation.extend(model, instance, m_opts.driver, extend_associations, { assoc_opts });
		};

		const instance = new Instance(model, {
			uid                    : inst_opts.uid, // singleton unique id
			keys                   : m_opts.keys,
			isNew                  : inst_opts.isNew || false,
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
			__setupAssociations      : __setupAssociations,
			fieldToPropertyMap     : fieldToPropertyMap,
			keyProperties          : keyProperties,
			events				   : m_opts.ievents
		});
		
		if (model_selectable_fields !== null) {
			LazyLoad.extend(instance, model, m_opts.properties);
		}

		OneAssociation.autoFetch(instance, one_associations, assoc_opts, m_opts.driver.isPool);
		ManyAssociation.autoFetch(instance, many_associations, assoc_opts, m_opts.driver.isPool);
		ExtendAssociation.autoFetch(instance, extend_associations, assoc_opts, m_opts.driver.isPool);

		Hook.wait(instance, m_opts.hooks.afterAutoFetch, function (err: Error) {
			if (err)
				throw err
		});

		return instance;
	};

	const model = function (
		..._data: FxOrmModel.ModelInstanceConstructorOptions
	) {
	    let data = _data.length > 1 ? _data : _data[0];

	    if (Array.isArray(m_opts.keys) && Array.isArray(data)) {
	        if (data.length == m_opts.keys.length) {
	            const data2: FxOrmModel.ModelInstanceConstructorOptions[0] = {};
	            for (let i = 0; i < m_opts.keys.length; i++) {
	                data2[m_opts.keys[i]] = data[i++];
	            }

	            return createInstanceSync(data2, { isShell: true });
	        }
	        else {
	            const err: FxOrmNS.ExtensibleError = new Error('Model requires ' + m_opts.keys.length + ' keys, only ' + data.length + ' were provided');
	            err.model = m_opts.table;

	            throw err;
	        }
	    } else if (typeof data === "number" || typeof data === "string") {
	        const data2: FxOrmModel.ModelInstanceConstructorOptions[0] = {};
	        data2[m_opts.keys[0]] = data;

	        return createInstanceSync(data2, { isShell: true });
	    } else if (typeof data === "undefined") {
	        data = {};
	    }

	    let isNew = false;

	    for (let i = 0; i < m_opts.keys.length; i++) {
	        if (!data.hasOwnProperty(m_opts.keys[i])) {
	            isNew = true;
	            break;
	        }
	    }

		if (keyProperties.length != 1 || (keyProperties.length == 1 && keyProperties[0].type != 'serial')) {
			isNew = true;
		}

	    return createInstanceSync(data, {
	        isNew,
	        autoSave: m_opts.autoSave,
	        cascadeRemove: m_opts.cascadeRemove
	    });
	} as FxOrmModel.Model;

	Utilities.addUnwritableProperty(model, 'name', m_opts.name || m_opts.table, { configurable: false })
	Utilities.addUnwritableProperty(model, 'allProperties', allProperties, { configurable: false })
	Utilities.addUnwritableProperty(model, 'virtualProperties', virtualProperties, { configurable: false })
	Utilities.addHiddenReadonlyProperty(model, '__propertiesByName', function () {
		return Object.assign({}, allProperties, virtualProperties);
	}, { configurable: false })

	Utilities.addUnwritableProperty(model, 'properties', m_opts.properties, { configurable: false })
	Utilities.addUnwritableProperty(model, 'settings', m_opts.settings, { configurable: false })
	Utilities.addUnwritableProperty(model, 'keys', m_opts.keys, { configurable: false })
	Utilities.addUnwritableProperty(model, 'caches', new fc.LRU({
		max: m_opts.instanceCacheSize > 0 && Number.isInteger(m_opts.instanceCacheSize) ? m_opts.instanceCacheSize : m_opts.settings.get('instance.defaultCacheSize'),
		ttl: (typeof m_opts.identityCache === 'number' ? m_opts.identityCache : 1) * 1000
	}), { configurable: false })

	model.dropSync = function (
		this: FxOrmModel.Model,
	) {
		if (typeof m_opts.driver.doDrop !== "function") {
			throw new ORMError("Driver does not support Model.drop()", 'NO_SUPPORT', { model: m_opts.table });
		}

		if (Utilities.isVirtualViewModel(model)) {
			return ;
		}

		return m_opts.driver.doDrop({
			table             : m_opts.table,
			properties        : m_opts.properties,
			one_associations  : one_associations,
			many_associations : many_associations
		});
	}
	
	model.drop = function (
		this:FxOrmModel.Model,
		cb?: FxOrmCommon.GenericCallback<void>
	) {
		const syncResponse = Utilities.catchBlocking(model.dropSync, [], { thisArg: model });
		Utilities.takeAwayResult(syncResponse, { callback: cb });

		return this;
	};

	model.syncSync = function () {
		if (typeof m_opts.driver.doSync !== "function") {
			throw new ORMError("Driver does not support Model.sync()", 'NO_SUPPORT', { model: m_opts.table })
		}

		if (Utilities.isVirtualViewModel(model)) {
			if (m_opts.driver.ddlSync.hasCollectionSync(m_opts.driver.sqlDriver, m_opts.table)) {
				console.warn(`model '${model.name}' defined as virtual view model, but collection with same already exists.`)
			}
			return ;
		}

		m_opts.driver.doSync({
			repair_column		: !!model.settings.get(`model.dbsync.repair_column.${model.name}`),
			allow_drop_column   : !!model.settings.get(`model.dbsync.allow_drop_column.${model.name}`),
			extension           : m_opts.__for_extension,
			id                  : m_opts.keys,
			table               : m_opts.table,
			tableComment		: m_opts.tableComment,
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
		cb?: FxOrmCommon.GenericCallback<FxOrmSqlDDLSync.SyncResult>
	) {
		const syncResponse = Utilities.catchBlocking(model.syncSync, [], { thisArg: model });
		Utilities.takeAwayResult(syncResponse, { callback: cb });

		return this;
	};

	const collectParamsForGet = function (ids: any[]) {
		let options    = <FxOrmModel.ModelOptions__Get>{};

		ids = ids.filter(x => x !== undefined && x !== null)
		if (typeof ids[ids.length - 1] === "object" && !Array.isArray(ids[ids.length - 1])) {
			options = ids.pop();
		}

		if (ids.length === 1 && Array.isArray(ids[0])) {
			ids = ids[0];
		}

		if (ids.length !== m_opts.keys.length) {
		    throw new ORMError("Model.get() IDs number mismatch (" + m_opts.keys.length + " needed, " + ids.length + " passed)", 'PARAM_MISMATCH', { model: m_opts.table });
		}

		return { options, ids }
	}

	model.getSync = function (
		this: FxOrmModel.Model,
		...args
	) {
		if (!keyProperties.length) {
			Utilities.disAllowOpForVModel(model, 'model.get');
		}

		const conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
		let prop: FxOrmProperty.NormalizedProperty;

		const { options, ids } = collectParamsForGet(args);

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

		function deferGet () {
			const vFields = Object.entries(model.virtualProperties).map(([k, p]) => p.mapsTo || k);;
			const { tableConditions, topConditions } = Utilities.extractSelectTopConditions(conditions, vFields);

			const __pointTypeMapsTo = pickPointTypeFields(m_opts.driver, allProperties);

			try {
				founditems = m_opts.driver.find(
					model_selectable_fields,
					m_opts.table,
					tableConditions,
					{
						limit: 1,
						topConditions,
						selectVirtualFields: vFields,
						generateSqlSelect: m_opts.generateSqlSelect,
						__pointTypeMapsTo,
					}
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

		const uid = Utilities.generateUID4SoloGet(m_opts, ids);
		return Singleton.modelGet(
			model,
			uid,
			{
				identityCache : (options.hasOwnProperty("identityCache") ? options.identityCache : m_opts.identityCache),
				saveCheck     : m_opts.settings.get("instance.identityCacheSaveCheck")
			},
			function () {
				deferGet();

				return createInstanceSync(founditems[0], {
					uid            : uid,
					autoSave       : options.autoSave,
					autoFetch      : (options.autoFetchLimit === 0 ? false : options.autoFetch),
					autoFetchLimit : options.autoFetchLimit,
					cascadeRemove  : options.cascadeRemove
				});
			}
		);
	}

	model.get = function (
		this: FxOrmModel.Model,
		...args: any[]
	) {
		let cb: FxOrmModel.ModelMethodCallback__Get = null;

		Helpers.selectArgs(args, function (arg_type, arg) {
			switch (arg_type) {
				case 'function':
					cb = arg;
					break;
			}
		});
		args = args.filter(x => x !== cb);

		if (typeof cb !== "function")
			throw new ORMError("Missing Model.get() callback", 'MISSING_CALLBACK', { model: m_opts.table });
		
		collectParamsForGet(args);

		process.nextTick(() => {
			const syncReponse = Utilities.catchBlocking<FxOrmInstance.Instance>(model.getSync, args, { thisArg: model });
			Utilities.takeAwayResult(syncReponse, { no_throw: true, callback: cb });
		});

		return this;
	};

	const chainOrRunSync = function (
		this: FxOrmModel.Model
	) {
		let conditions: FxSqlQuerySubQuery.SubQueryConditions = null;
		let options = <FxOrmModel.ModelOptions__Find>{};
		let order: FxOrmModel.ModelOptions__Find['order'] = null;
		let merges: FxOrmQuery.ChainFindMergeInfo[] = [];

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
							conditions = { ...arg };
							Utilities.filterWhereConditionsInput(conditions, model);
						} else {
							if (options.hasOwnProperty("limit")) {
								arg.limit = options.limit;
							}
							options = arg;

							if (options.hasOwnProperty("__merge")) {
								merges = Utilities.combineMergeInfoToArray(options.__merge);
								merges.forEach(merge => {
									if (!Array.isArray(merge.select) || !merge.select.length) {
										merge.select = [];

										if (options.extra && Object.keys(options.extra).length)
											merge.select = merge.select.concat(Object.keys(options.extra))
									}

									merge.select = merge.select.map(field => {
										if (typeof field === 'object') return field;

										const propname = field;
										const mapsTo = options.extra[field]?.mapsTo || field;

										return {
											as: propname,
											column_name: mapsTo
										}
									});

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

		let base_table = m_opts.table;

		let normalized_order = normalized_order_without_table
		if (merges && merges.length) {
			base_table = options.chainfind_linktable || base_table;
			normalized_order = Utilities.addTableToStandardedOrder(
				normalized_order_without_table,
				Utilities.parseTableInputForSelect(base_table).alias
			);
		}
		
		if (conditions) {
			conditions = Utilities.checkConditions(conditions, one_associations);
		}

		return new ChainFind(model, {
			only: options.only || model_selectable_fields,
			keys: m_opts.keys,
			table: base_table,
			driver: m_opts.driver,
			conditions: conditions,
			associations: many_associations,
			limit: options.limit,
			order: normalized_order,
			merge: merges,
			exists: options.exists || [],
			offset: options.offset,
			properties: model.__propertiesByName,
			keyProperties: keyProperties,
			generateSqlSelect: m_opts.generateSqlSelect,
			newInstanceSync: function (data: any) {
				// We need to do the rename before we construct the UID & do the cache lookup
				// because the cache is loaded using propertyName rather than fieldName
				Utilities.renameDatastoreFieldsToPropertyNames(data, fieldToPropertyMap);

				// Construct UID
				const uid = Utilities.generateUID4ChainFind(m_opts, merges, data);

				// Now we can do the cache lookup
				return Singleton.modelGet(
					model,
					uid,
					{
						identityCache : options.identityCache,
						saveCheck     : m_opts.settings.get("instance.identityCacheSaveCheck")
					},
					function () {
						return createInstanceSync(data, {
							uid            : uid,
							autoSave       : m_opts.autoSave,
							autoFetch      : (options.autoFetchLimit === 0 ? false : (options.autoFetch || m_opts.autoFetch)),
							autoFetchLimit : options.autoFetchLimit,
							cascadeRemove  : options.cascadeRemove,
							extra          : options.extra,
							extra_info     : options.extra_info
						});
					}
				);
			}
		});
	}

	model.findSync = function (
		this:FxOrmModel.Model,
		...args: any[]
	) {
		const chain: FxOrmQuery.IChainFind = chainOrRunSync.apply(model, args);

		return chain.runSync()
	};

	model.find = function (
		this:FxOrmModel.Model,
		...args: any[]
	) {
		var cb: FxOrmModel.ModelMethodCallback__Find = null;
		if (typeof util.last(args) === 'function')
			cb = args.pop();

		const chain = chainOrRunSync.apply(model, args);

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
		Utilities.disAllowOpForVModel(model, 'model.count');

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
			const syncResponse = Utilities.catchBlocking(model.countSync, [conditions, cb], {thisArg: model});
			Utilities.takeAwayResult(syncResponse, { callback: cb });
		});

		return this;
	}

	model.aggregate = function () {
		Utilities.disAllowOpForVModel(model, 'model.aggregate');

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
		Utilities.disAllowOpForVModel(model, 'model.exists');

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

		const syncResponse = Utilities.catchBlocking(model.existsSync, ids, { thisArg: model });
		Utilities.takeAwayResult(syncResponse, { callback: cb });

		return this;
	}

	model.create = function (...args: any[]) {
		var done: FxOrmCommon.ExecutionCallback<FxOrmInstance.Instance | FxOrmInstance.Instance[]>        = null;
		Helpers.selectArgs(arguments, (arg_type, arg, idx) => {
			switch (arg_type) {
				case "function":
					done = arg;
					args = args.filter(x => x !== done)
					break;
			}
		});
	
		const syncResponse = Utilities.catchBlocking(
			model.createSync,
			args,
			{ thisArg: model }
		)

		Utilities.takeAwayResult(syncResponse, { callback: done });

		return syncResponse.result;
	}

	model.createSync = function (): any {
		Utilities.disAllowOpForVModel(model, 'model.create');

		let create_single: boolean      = false;
		let opts: FxOrmModel.ModelOptions__Create = {};
		let itemsParams: FxOrmInstance.InstanceDataPayload[] = []

		Helpers.selectArgs(arguments, (arg_type, arg, idx) => {
			switch (arg_type) {
				case "object":
					if ( !create_single && Array.isArray(arg) ) {
						itemsParams = itemsParams.concat(arg);
					} else if (idx === 0) {
						create_single = true;
						itemsParams.push(arg);
					} else {
						opts = { parallel: false };
					}
					break;
			}
		});

		const items: FxOrmInstance.Instance[] = Utilities.parallelQueryIfPossible(
			opts.parallel && m_opts.driver.isPool,
			itemsParams,
			(data) => {
				const item = createInstanceSync(data, {
					isNew    : true,
					autoSave  : m_opts.autoSave,
					// not fetch associated instance on its creation.
					autoFetch : false
				});
	
				item.saveSync();

				return item;
			}
		)

		const results = create_single ? items[0] : items;
		
		return results;
	};

	model.clearSync = function () {
		Utilities.disAllowOpForVModel(model, 'model.clear');
		
		return m_opts.driver.clear(m_opts.table);
	};

	model.clear = function (cb?) {
		Utilities.disAllowOpForVModel(model, 'model.clear');

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

	model.findBy = function (...args: any[]): FxOrmQuery.IChainFind {
		if (Array.isArray(args[0])) {
			const [by_list, self_conditions = {}, self_options, cb] = args as FxOrmModel.FindByListStyleFunctionArgs
			return listFindByChainOrRunSync(model, self_conditions, by_list, self_options, { callback: cb }) as FxOrmQuery.IChainFind;
		}
		
		const [association_name, self_conditions, findby_options, cb] = args as FxOrmModel.FindByItemStyleFunctionArgs
		return soloFindByChainOrRunSync(model, association_name, self_conditions, findby_options, { callback: cb, is_sync: false }) as FxOrmQuery.IChainFind;
	}

	model.findBySync = function (...args: any[]) {
		if (Array.isArray(args[0])) {
			const [by_list, self_conditions = {}, self_options] = args as FxOrmModel.FindByListStyleFunctionArgs
			return listFindByChainOrRunSync(model, self_conditions, by_list, self_options, { is_sync: true }) as any;
		}
		
		const [association_name, self_conditions, findby_options] = args as FxOrmModel.FindByItemStyleFunctionArgs
		return soloFindByChainOrRunSync(model, association_name, self_conditions, findby_options, { is_sync: true }) as any;
	}

	model.addProperty = function (propIn, options) {
		var cType: FxOrmProperty.CustomPropertyType;
		var prop = Property.normalize({
			prop: propIn as FxOrmModel.ModelPropertyDefinition, name: (options && options.name || propIn.name),
			customTypes: m_opts.db.customTypes, settings: m_opts.settings
		});

		if (!m_opts.virtualView.disabled) { prop.virtual = true;  }

		if (prop.type === 'serial') {
			prop.key = true;
			prop.klass = prop.klass || 'primary';
		}

		// Maintains backwards compatibility
		if (m_opts.keys.indexOf(prop.name) !== -1) {
			prop.key = true;
		} else if (prop.key) {
			m_opts.keys.push(prop.name);
		}

		if (options && options.klass) {
			prop.klass = options.klass;
		}

		switch (prop.klass) {
			default:
				m_opts.properties[prop.name] = prop;
				break;
			case 'extendsTo':
				association_properties.push(prop.name)
				break;
			case 'hasOne':
				association_properties.push(prop.name)
				break;
		}

		if (!prop.virtual) { allProperties[prop.name] = prop; }
		else {
			virtualProperties[prop.name] = prop;
			// TODO: should we force virtual view without keys?
			m_opts.keys = m_opts.keys.filter(key => key !== prop.name);
			prop.required = false;
			prop.index = false;
			prop.primary = false;
			delete prop.klass;
		}

		fieldToPropertyMap[prop.mapsTo] = prop;

		if (prop.required) {
			model.prependValidation(prop.name, Validators.required());
		}

		if (Utilities.isKeyProperty(prop) && !m_opts.__for_extension) {
			keyProperties.push(prop);
		}

		if (prop.lazyload !== true && !currFields[prop.name]) {
			currFields[prop.name] = true;

			if (prop.virtual) {
				return prop;
			}
			
			if ((cType = m_opts.db.customTypes[prop.type]) && cType.datastoreGet) {
				model_selectable_fields.push({
					a: prop.mapsTo, sql: cType.datastoreGet(prop, m_opts.db.driver.query)
				});
			} else {
				model_selectable_fields.push(prop.mapsTo);
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
	    value: Utilities.generateUID4Model(m_opts),
        enumerable: false
	});

	// Standardize validations
	for (let k in m_opts.validations) {
		const validationHash = m_opts.validations[k]
		if (!Array.isArray(validationHash)) {
			m_opts.validations[k] = [ validationHash ];
		}
	}

	if (Object.keys(m_opts.properties).every((k) => m_opts.properties[k].virtual === true)) {
		m_opts.virtualView.disabled = false;
	}

	// If no keys are defined add the default one
	if (m_opts.virtualView.disabled && m_opts.keys.length == 0 && !Object.values(m_opts.properties).some((p: FxOrmProperty.NormalizedProperty) => p.key === true)) {
		m_opts.properties[m_opts.settings.get("properties.primary_key")] = {
			type: 'serial', key: true, required: false, klass: 'primary'
		} as FxOrmProperty.NormalizedProperty;
	}

	let p: FxOrmProperty.NormalizedProperty,
		keyPrimaryP: FxOrmProperty.NormalizedProperty = null,
		keyP: FxOrmProperty.NormalizedProperty = null;
	// standardize properties
	for (let k in m_opts.properties) {
		p = model.addProperty(m_opts.properties[k], { name: k });
		if (Utilities.isKeyPrimaryProperty(p)) keyPrimaryP = keyPrimaryP || p;
		else if (Utilities.isKeyProperty(p)) keyP = keyP || p;
	}

	if (keyP && keyPrimaryP) {
		keyProperties.splice(0, keyProperties.length);
		keyProperties.push(keyPrimaryP);
	}

	// if no any serial-type, keyPrimiary property
	if (m_opts.virtualView.disabled && keyProperties.length === 0) {
		if (keyP) // use keyPrimary as the only keyProperties
			keyProperties.push(keyP);
		else
			throw new ORMError("Model defined without any keys", 'BAD_MODEL', { model: m_opts.table });
	}

	// setup hooks
	for (let k in AvailableHooks) {
		model[AvailableHooks[k]] = Utilities.createHookHelper(m_opts.hooks, AvailableHooks[k], { initialHooks }) as any;
	}

	Utilities.addUnwritableProperty(model, 'associations', {}, { configurable: false })
	Utilities.addUnwritableProperty(model, '__keyProperties', keyProperties, { enumerable: false, configurable: false })
	
	OneAssociation.prepare(model, { one_associations, many_associations, extend_associations }, { db: m_opts.db });
	ManyAssociation.prepare(model, { one_associations, many_associations, extend_associations }, { db: m_opts.db });
	ExtendAssociation.prepare(model, { one_associations, many_associations, extend_associations }, { db: m_opts.db });

	return model;
} as any as (new (opts: FxOrmModel.ModelDefineOptions) => FxOrmModel.Model);

function soloFindByChainOrRunSync <T = any>(
	model: FxOrmModel.Model,
	association_name: FxOrmModel.ModelFindByDescriptorItem['association_name'],
	conditions: FxOrmModel.ModelFindByDescriptorItem['conditions'],
	findby_options: FxOrmModel.ModelFindByDescriptorItem['options'],
	opts: FxOrmCommon.SyncCallbackInputArags
): FxOrmQuery.IChainFind | FxOrmInstance.Instance[] {
	const { callback: cb, is_sync = false } = opts

	if (is_sync) {
		const modelFindBySyncAccessor = model.associations[association_name].association.modelFindBySyncAccessor
		if (!modelFindBySyncAccessor || typeof model[modelFindBySyncAccessor] !== 'function')
			throw new Error(`[soloFindByChainOrRunSync] invalid association name ${association_name} provided!`)
				
		return model[modelFindBySyncAccessor](conditions, findby_options)
	}

	const findByAccessor = model.associations[association_name].association.modelFindByAccessor
	if (!findByAccessor || typeof model[findByAccessor] !== 'function')
		throw new Error(`[soloFindByChainOrRunSync] invalid association name ${association_name} provided!`)

	if (typeof cb === 'function')
		return model[findByAccessor](conditions, findby_options, cb)

	return model[findByAccessor](conditions, findby_options)
}

export function listFindByChainOrRunSync (
	model: FxOrmModel.Model,
	self_conditions: FxOrmQuery.QueryConditions__Find,
	by_list: FxOrmModel.ModelFindByDescriptorItem[],
	self_options: FxOrmModel.ModelOptions__Find,
	opts: FxOrmCommon.SyncCallbackInputArags
): FxOrmQuery.IChainFind | (FxOrmInstance.Instance[]) {
	const { callback: cb, is_sync = false } = opts
	
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

	by_list.forEach(by_item => {
		const association = Helpers.tryGetAssociationItemFromModel(by_item.association_name, model);
		if (!association)
			return ;

		const isHasMany = Helpers.getManyAssociationItemFromModel(by_item.association_name, model) === association;
		const isHasOne = Helpers.getOneAssociationItemFromModel(by_item.association_name, model) === association;
		const isExtendsTo = Helpers.getExtendsToAssociationItemFromModel(by_item.association_name, model) === association;

		const by_item_conditions = { ...by_item.conditions };
		Utilities.filterWhereConditionsInput(by_item_conditions, model);

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

			const extraProps = (association as FxOrmAssociation.InstanceAssociationItem_HasMany).props;
			let extra_where = Utilities.extractHasManyExtraConditions(
				association as FxOrmAssociation.InstanceAssociationItem_HasMany,
				by_item_conditions
			);

			extra_where = { ...by_item.join_where, ...extra_where };
			Utilities.filterWhereConditionsInput(extra_where, model);

			merges.push({
				from: { table: Utilities.tableAlias(ljoin_info.table, ljoin_info.alias), field: ljoin_info.ids },
				to: { table: left_info.table, field: left_info.ids },
				where : [ ljoin_info.alias, extra_where ],
				table : left_info.alias,
				select: (by_item.extra_select || []).filter(x => extraProps.hasOwnProperty(x))
			});

			merges.push({
				from: { table: Utilities.tableAlias(right_info.table, right_info.alias), field: right_info.ids },
				to: { table: rjoin_info.table, field: rjoin_info.ids },
				where : [ right_info.alias, by_item_conditions ],
				table : ljoin_info.alias,
				select: [],
			});

			self_options.chainfind_linktable = Utilities.tableAlias(model.table);
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

			merges.push({
				from: { table: Utilities.tableAlias(rel_info.table, rel_info.alias), field: rel_info.ids },
				to: { table: Utilities.tableAlias(base_info.table, base_info.alias), field: base_info.ids },
				where : [ rel_info.alias, by_item_conditions ],
				table : base_info.alias,
				select: []
			});

			self_options.chainfind_linktable = Utilities.tableAlias(base_info.table, base_info.alias);
		} else if (isExtendsTo) { // support extendsTo
			merges.push({
				from  : { table: association.model.table, field: Object.keys(association.field) },
				to    : { table: model.table, field: model.id },
				where : [ association.model.table, by_item_conditions ],
				table : model.table,
				select: []
			});
		}
	});

	self_options.__merge = merges;
	self_options.extra = {};

	if (typeof cb === "function") {
		return model.find.call(model, self_conditions, self_options, cb);
	}

	const chain = model.find(self_conditions, self_options);

	if (is_sync)
		return chain.runSync();

	return chain;
}