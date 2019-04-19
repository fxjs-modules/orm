/// <reference types="fibjs" />

import util 	 = require('util');
import coroutine 	 = require('coroutine');
const events = require('events');
const EventEmitter = events.EventEmitter;

import Utilities = require("./Utilities");
import Hook      = require("./Hook");
import ORMError       = require("./Error");
import enforce   = require("@fibjs/enforce");
import * as Helpers from './Helpers';

interface EmitEventFunctionInInstance {
	(state: string, err?: Error | Error[], _instance?: any): void
	(state: string, _instance?: any): void
}

export const Instance = function (
	this: FxOrmInstance.Instance,
	Model: FxOrmModel.Model, _opts: FxOrmInstance.InstanceConstructorOptions
) {
	const opts: FxOrmInstance.InnerInstanceOptions = util.extend({}, _opts);
	opts.data = opts.data || {};
	opts.extra = opts.extra || {};
	opts.keys = (opts.keys || "id") as string[];
	opts.changes = (opts.is_new ? Object.keys(opts.data) : []);
	opts.extrachanges = [];
	opts.associations = {};
	opts.events	= util.extend({}, opts.events);
	opts.originalKeyValues = {};

	const eventor = new EventEmitter();

	var instance_saving = false;
	var instance: FxOrmInstance.Instance = {} as FxOrmInstance.Instance;

	var emitEvent: EmitEventFunctionInInstance = function () {
		var args = Array.prototype.slice.apply(arguments);
		var event = args.shift();

		eventor.emit(event, ...args);
	};
	var rememberKeys = function () {
		for(let i = 0; i < opts.keyProperties.length; i++) {
			const prop = opts.keyProperties[i];
			opts.originalKeyValues[prop.name] = opts.data[prop.name];
		}
	};
	var shouldSaveAssocs = function (
		saveOptions: {
			saveAssociations?: boolean
		}
	) {
		if (Model.settings.get("instance.saveAssociationsByDefault")) {
			return saveOptions.saveAssociations !== false;
		} else {
			return !!saveOptions.saveAssociations;
		}
	};
	const handleValidationsSync = function (): FxOrmError.ExtendedError | FxOrmError.ExtendedError[] {
		let required: boolean,
				alwaysValidate: boolean;

		let validationErr: FxOrmError.ExtendedError | FxOrmError.ExtendedError[]
		Hook.wait(instance, opts.hooks.beforeValidation, function (err: FxOrmError.ExtendedError) {
			if (err) {
				validationErr = err;
				// saveError(err);
				return ;
			}

			const checks = new enforce.Enforce({ returnAllErrors : Model.settings.get("instance.returnAllErrors") });

			for (let k in opts.validations) {
				required = false;

				if (Model.allProperties[k]) {
					required = Model.allProperties[k].required;
					alwaysValidate = Model.allProperties[k].alwaysValidate;
				} else {
					for (let i = 0; i < opts.one_associations.length; i++) {
						/* non-normalized `field` maybe string now */
						if (opts.one_associations[i].field as any === k) {
							required = opts.one_associations[i].required;
							break;
						}
					}
				}
				if (!alwaysValidate && !required && instance[k] == null) {
					continue; // avoid validating if property is not required and is "empty"
				}
				const validation = opts.validations[k] as FibjsEnforce.IValidator[]
				for (let i = 0; i < validation.length; i++) {
					checks.add(k, validation[i]);
				}
			}

			checks.context("instance", instance);
			checks.context("model", Model);
			checks.context("driver", opts.driver);

			const lock = new coroutine.Event();
			checks.check(instance, function (err) {
				validationErr = err;
				lock.set();
			});
			lock.wait();
		});

		return validationErr;
	};
	
	const saveError = function (
		err: FxOrmError.ExtendedError | FxOrmError.ExtendedError[],
	) {
		instance_saving = false;

		emitEvent("save", err, instance);

		Hook.trigger(instance, opts.hooks.afterSave, false);

		return instance;
	};

	const saveInstanceSync = function (
		saveOptions: FxOrmInstance.SaveOptions,
	) {
		// what this condition means:
		// - If the instance is in state mode
		// - AND it's not an association that is asking it to save
		//   -> return has already saved
		if (instance_saving && saveOptions.saveAssociations !== false)
			return instance;

		instance_saving = true;

		// TODO: maybe error list
		const err = handleValidationsSync();
		if (err) {
			saveError(err);
			throw err;
		}
		
		if (opts.is_new) {
			waitHooks([ "beforeCreate", "beforeSave" ], function (err: FxOrmError.ExtendedError) {
				if (err) {
					saveError(err);
					throw err;
				}

				saveNewSync(saveOptions, getInstanceData());
			});
		} else {
			waitHooks([ "beforeSave" ], function (err: FxOrmError.ExtendedError) {
				if (err) {
					saveError(err);
					throw err;
				}

				savePersistedSync(saveOptions, getInstanceData());
			});
		}
	};

	const runSyncAfterSaveActions = function (is_create?: boolean, err?: Error) {
		instance_saving = false;

		emitEvent("save", err, instance);

		if (is_create)
			Hook.trigger(instance, opts.hooks.afterCreate, !err);

		Hook.trigger(instance, opts.hooks.afterSave, !err);
	};
	const getInstanceData = function () {
		const data: FxOrmInstance.InstanceDataPayload = {};
		let prop: FxOrmProperty.NormalizedProperty;

		for (let k in opts.data) {
			if (!opts.data.hasOwnProperty(k)) continue;
			prop = Model.allProperties[k];

			if (prop) {
				if (opts.data[k] == null &&  (prop.type == 'serial' || typeof prop.defaultValue == 'function')) {
					continue;
				}

				if (opts.driver.propertyToValue) {
					data[k] = opts.driver.propertyToValue(opts.data[k], prop);
				} else {
					data[k] = opts.data[k];
				}
			} else {
				data[k] = opts.data[k];
			}
		}

		return data;
	};
	const waitHooks = function (hooks: FxOrmModel.keyofHooks[], next: FxOrmHook.HookActionNextFunction) {
		const nextHook = function () {
			if (hooks.length === 0) {
				return next();
			}
			Hook.wait(instance, opts.hooks[hooks.shift()], function (err: FxOrmError.ExtendedError) {
				if (err) {
					return next(err);
				}

				return nextHook();
			});
		};

		return nextHook();
	};

	const resetChanges = function () {
		opts.changes.length = 0;
	}
	
	const saveNewSync = function (
		saveOptions: FxOrmInstance.SaveOptions,
		data: FxOrmInstance.InstanceDataPayload,
	) {
		data = Utilities.transformPropertyNames(data, Model.allProperties);

		const info = opts.driver.insert(opts.table, data, opts.keyProperties);

		resetChanges();
		for (let i = 0, prop; i < opts.keyProperties.length; i++) {
			prop = opts.keyProperties[i];
			opts.data[prop.name] = info.hasOwnProperty(prop.name) ? info[prop.name] : data[prop.name];
		}
		opts.is_new = false;
		rememberKeys();

		let err: FxOrmError.ExtendedError;
		
		if (shouldSaveAssocs(saveOptions)) {
			const syncReponse = Utilities.exposeErrAndResultFromSyncMethod<boolean>(saveAssociationsSync)
			err = syncReponse.error;
		}
		
		runSyncAfterSaveActions(true, err);

		if (err)
			throw err;

		saveInstanceExtraSync();
	};

	const savePersistedSync = function (
		saveOptions: FxOrmInstance.SaveOptions,
		data: FxOrmInstance.InstanceDataPayload,
	) {
		let changes = <FxSqlQuerySql.DataToSet>{},
				conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};

		const savedCheckSync = function (saved: boolean) {
			if (!saved && !shouldSaveAssocs(saveOptions))
				return saveInstanceExtraSync();
			
			if (!shouldSaveAssocs(saveOptions)) {
				runSyncAfterSaveActions(false);
				return saveInstanceExtraSync();
			}
			
			const { error: err, result: assocSaved } = Utilities.exposeErrAndResultFromSyncMethod<boolean>(saveAssociationsSync)

			if (saved || assocSaved) {
				runSyncAfterSaveActions(false, err);
				if (err)
					throw err;
			}

			return saveInstanceExtraSync();
		}

		if (instance.saved())
			return savedCheckSync(false);

		for (let i = 0; i < opts.changes.length; i++) {
			changes[opts.changes[i]] = data[opts.changes[i]];
		}
		
		for (let i = 0; i < opts.keyProperties.length; i++) {
			const prop = opts.keyProperties[i];
			conditions[prop.mapsTo] = opts.originalKeyValues[prop.name];
		}
		changes = Utilities.transformPropertyNames(changes, Model.allProperties);

		Utilities.filterWhereConditionsInput(conditions, instance.model());

		const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(() => opts.driver.update(opts.table, changes, conditions));
			
		if (syncResponse.error) {
			saveError(syncResponse.error)
			throw syncResponse.error;
		}
		resetChanges();
		rememberKeys();

		savedCheckSync(true);
	};

	const saveAssociationsSync = function (cb?: FxOrmNS.ExecutionCallback<boolean>): boolean {
		let pending = 1,
				// to check if error passed by cb if cb exists
				error_passed = false,
				assocSaved: boolean;

		const saveAssociationItemSync = function (callbackVersionAccessor: string, instances: FxOrmInstance.InstanceDataPayload) {
			pending += 1;

			let error: FxOrmError.ExtendedError = null;

			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(() => {
				instance[callbackVersionAccessor + 'Sync'](instances);
			});
			
			error = syncResponse.error;
				
			if (syncResponse.error) {
				if (error_passed) return ;

				error_passed = true;
				assocSaved = true;
			}

			if (--pending === 0) {
				assocSaved = true;
			}

			Utilities.throwErrOrCallabckErrResult({ error: error, result: assocSaved }, { callback: cb });
		};

		const _saveOneAssociation = function (assoc: FxOrmAssociation.InstanceAssociationItem) {
			if (!instance[assoc.name] || typeof instance[assoc.name] !== "object") return;
			if (assoc.reversed) {
				// reversed hasOne associations should behave like hasMany
				if (!Array.isArray(instance[assoc.name])) {
					instance[assoc.name] = [ instance[assoc.name] ];
				}

				const instances = instance[assoc.name] as FxOrmInstance.Instance[];
				Utilities.parallelQueryIfPossible(
					opts.driver.opts.pool,
					instances,
					(item) => {
						if (!item.isInstance) {
							item = new assoc.model(item);
						}
						saveAssociationItemSync(assoc.setAccessor, item);
					}
				);
				
				return;
			}

			if (!instance[assoc.name].isInstance) {
			  instance[assoc.name] = new assoc.model(instance[assoc.name]);
			}

			saveAssociationItemSync(assoc.setAccessor, instance[assoc.name]);
		};

		for (let i = 0; i < opts.one_associations.length; i++) {
			_saveOneAssociation(opts.one_associations[i]);
		}

		const _saveManyAssociation = function (assoc: FxOrmAssociation.InstanceAssociationItem) {
			var assocVal = instance[assoc.name];

			if (!Array.isArray(assocVal)) return;
			if (!opts.associations[assoc.name].changed) return;

			for (let j = 0; j < assocVal.length; j++) {
				if (!assocVal[j].isInstance) {
					assocVal[j] = new assoc.model(assocVal[j]);
				}
			}

			saveAssociationItemSync(assoc.setAccessor, assocVal);
		};

		for (let i = 0; i < opts.many_associations.length; i++) {
			_saveManyAssociation(opts.many_associations[i]);
		}

		if (--pending === 0)
			cb && cb(null, false);

		return assocSaved;
	};
	var getNormalizedExtraDataAtPropertyTime = function () {
		return opts.extra as FxOrmProperty.NormalizedPropertyHash
	};

	const saveInstanceExtraSync = function (): FxOrmInstance.Instance {
		if (opts.extrachanges.length === 0)
			return instance;

		var data: FxOrmInstance.InstanceDataPayload = {};
		var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};

		for (let i = 0; i < opts.extrachanges.length; i++) {
			if (!opts.data.hasOwnProperty(opts.extrachanges[i])) continue;

			if (getNormalizedExtraDataAtPropertyTime()[opts.extrachanges[i]]) {
				data[opts.extrachanges[i]] = opts.data[opts.extrachanges[i]];
				if (opts.driver.propertyToValue) {
					data[opts.extrachanges[i]] = opts.driver.propertyToValue(data[opts.extrachanges[i]], getNormalizedExtraDataAtPropertyTime()[opts.extrachanges[i]]);
				}
			} else {
				data[opts.extrachanges[i]] = opts.data[opts.extrachanges[i]];
			}
		}

		for (let i = 0; i < opts.extra_info.id.length; i++) {
			conditions[opts.extra_info.id_prop[i]] = opts.extra_info.id[i];
			conditions[opts.extra_info.assoc_prop[i]] = opts.data[opts.keys[i]];
			Utilities.filterWhereConditionsInput(conditions, instance.model());
		}

		Utilities.filterWhereConditionsInput(conditions, instance.model());
		
		opts.driver.update(opts.extra_info.table, data, conditions);

		return instance;
	};;

	const saveInstanceProperty = function (key: string, value: any) {
		const changes: FxOrmInstance.InstanceDataPayload = {},
					conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
					changes[key] = value;

		if (Model.properties[key])
			if (opts.driver.propertyToValue)
				changes[key] = opts.driver.propertyToValue(changes[key], Model.properties[key]);

		for (let i = 0; i < opts.keys.length; i++) {
			conditions[opts.keys[i]] = opts.data[opts.keys[i]];
		}

		Hook.wait(instance, opts.hooks.beforeSave, function (err: FxOrmError.ExtendedError) {
			if (err) {
				Hook.trigger(instance, opts.hooks.afterSave, false);
				emitEvent("save", err, instance);
				return;
			}

			Utilities.filterWhereConditionsInput(conditions, instance.model());
			const syncReponse = Utilities.exposeErrAndResultFromSyncMethod(() => opts.driver.update(opts.table, changes, conditions))
			if (!syncReponse.error)
				opts.data[key] = value;

			Hook.trigger(instance, opts.hooks.afterSave, !syncReponse.error);
			emitEvent("save", syncReponse.error, instance);
		});
	};
	const setInstanceProperty = function (key: string, value: any) {
		const prop = Model.allProperties[key] || getNormalizedExtraDataAtPropertyTime()[key];

		if (prop) {
			if ('valueToProperty' in opts.driver) {
				value = opts.driver.valueToProperty(value, prop);
			}
			if (opts.data[key] !== value) {
				opts.data[key] = value;
				return true;
			}
		}
		return false;
	}

	// ('data.a.b', 5) => opts.data.a.b = 5
	const setPropertyByPath: FxOrmInstance.Instance['set'] = function (path, value) {
		if (typeof path == 'string') {
			path = path.split('.');
		} else if (!Array.isArray(path)) {
			return;
		}

		var propName = path.shift();
		var prop = Model.allProperties[propName] || getNormalizedExtraDataAtPropertyTime()[propName];
		var currKey: string, currObj: any;

		if (!prop) {
			return;
		}
		if (path.length == 0) {
			instance[propName] = value;
			return;
		}
		currObj = instance[propName];

		while(currObj && path.length > 0 ) {
			currKey = path.shift();

			if (path.length > 0) {
				currObj = currObj[currKey];
			} else if (currObj[currKey] !== value) {
				currObj[currKey] = value;
				opts.changes.push(propName);
			}
		}
	}

	var addInstanceProperty = function (key: string) {
		var defaultValue = null;
		var prop = Model.allProperties[key];

		// This code was first added, and then commented out in a later commit.
		// Its presence doesn't affect tests, so I'm just gonna log if it ever gets called.
		// If someone complains about noise, we know it does something, and figure it out then.
		if (instance.hasOwnProperty(key))
			(global as any).console.log("Overwriting instance property");

		if (key in opts.data) {
			defaultValue = opts.data[key];
		} else if (prop && 'defaultValue' in prop) {
			defaultValue = prop.defaultValue;
		}

		setInstanceProperty(key, defaultValue);

		Object.defineProperty(instance, key, {
			get: function () {
				return opts.data[key];
			},
			set: function (val) {
				if (prop.key === true) {
					if (prop.type == 'serial' && opts.data[key] != null) {
						return;
					} else {
						opts.originalKeyValues[prop.name] = opts.data[prop.name];
					}
				}

				if (!setInstanceProperty(key, val)) {
					return;
				}

				if (opts.autoSave) {
					saveInstanceProperty(key, val);
				} else if (opts.changes.indexOf(key) === -1) {
					opts.changes.push(key);
				}
			},
			enumerable: !(prop && !prop.enumerable)
		});
	};
	var addInstanceExtraProperty = function (key: string) {
		if (!instance.hasOwnProperty("extra")) {
			instance.extra = {};
		}
		Object.defineProperty(instance.extra, key, {
			get: function () {
				return opts.data[key];
			},
			set: function (val) {
				setInstanceProperty(key, val);

				/*if (opts.autoSave) {
					saveInstanceProperty(key, val);
				}*/if (opts.extrachanges.indexOf(key) === -1) {
					opts.extrachanges.push(key);
				}
			},
			enumerable: true
		});
	};

	for (let k in Model.allProperties) {
		addInstanceProperty(k);
	}
	for (let k in opts.extra) {
		addInstanceProperty(k);
	}

	for (let k in opts.methods) {
		Object.defineProperty(instance, k, {
			value      : opts.methods[k].bind(instance),
			enumerable : false,
			writable  : true
		});
	}

	for (let k in opts.extra) {
		addInstanceExtraProperty(k);
	}

	Utilities.addHiddenUnwritableMethodToInstance(instance, "on", function (event: string, cb: FxOrmNS.VoidCallback) {
		eventor.on(event, cb);

		return this;
	});

	Utilities.addHiddenUnwritableMethodToInstance(instance, "saveSync", function (this: typeof instance) {
		var objCount = 0;
		var data: FxOrmInstance.InstanceDataPayload = {},
				saveOptions = {};

		Helpers.selectArgs(arguments, function (arg_type, arg) {
			switch (arg_type) {
				case 'object':
					switch (objCount) {
						case 0:
							data = arg;
							break;
						case 1:
							saveOptions = arg;
							break;
					}
					objCount++;
					break;
				default:
						const err: FibOrmNS.ExtensibleError = new Error("Unknown parameter type '" + (typeof arg) + "' in Instance.save()");
						err.model = Model.table;
						throw err;
			}
		});

		for (let k in data) {
			if (data.hasOwnProperty(k)) {
				this[k] = data[k];
			}
		}

		saveInstanceSync(saveOptions);

		return instance;
	});
	
	Utilities.addHiddenUnwritableMethodToInstance(instance, "save", function (this: typeof instance) {
		var cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance> = null;

		let args: any[] = Array.prototype.slice.apply(arguments);
		Helpers.selectArgs(args, function (arg_type, arg, idx) {
			switch (arg_type) {
				case 'function':
					cb = arg;
					break;
			}
		});
		args = args.filter(x => x !== cb);

		const waitor = cb ? new coroutine.Event() : undefined
		process.nextTick(() => {
			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(instance.saveSync, args);
			if (waitor) waitor.set();

			Utilities.throwErrOrCallabckErrResult({ error: syncResponse.error, result: instance }, { callback: cb });
		});

		if (waitor) waitor.wait();

		return this;
	})

	Utilities.addHiddenUnwritableMethodToInstance(instance, "saved", function (this: typeof instance) {
		return opts.changes.length === 0;
	});

	Utilities.addHiddenUnwritableMethodToInstance(instance, "removeSync", function () {
		if (opts.is_new)
			return ;

		var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
		for (let i = 0; i < opts.keys.length; i++) {
		    conditions[opts.keys[i]] = opts.data[opts.keys[i]];
		}

		let removeErr = null as FxOrmError.ExtendedError;

		Hook.wait(instance, opts.hooks.beforeRemove, function (err: FxOrmError.ExtendedError) {
			if (err) {
				emitEvent("remove", err, instance);

				removeErr = err;
				return ;
			}

			emitEvent("beforeRemove", instance);
			
			Utilities.filterWhereConditionsInput(conditions, instance.model());
			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(() => opts.driver.remove(opts.table, conditions));

			Hook.trigger(instance, opts.hooks.afterRemove, !syncResponse.error);

			emitEvent("remove", syncResponse.error, instance);

			removeErr = syncResponse.error;

			instance = undefined;
		});

		if (removeErr)
			throw removeErr;
	})

	Utilities.addHiddenUnwritableMethodToInstance(instance, "remove", function (cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>) {
		const syncReponse = Utilities.exposeErrAndResultFromSyncMethod(() => instance.removeSync());
		Utilities.throwErrOrCallabckErrResult(syncReponse, { callback: cb });

		return this;
	});

	Utilities.addHiddenUnwritableMethodToInstance(instance, "set", setPropertyByPath);
	Utilities.addHiddenUnwritableMethodToInstance(instance, "markAsDirty", function (propName: string) {
		if (propName != undefined) {
			opts.changes.push(propName);
		}
	});
	
	Utilities.addHiddenReadonlyPropertyToInstance(instance, "dirtyProperties", function () { return opts.changes; });

	Utilities.addHiddenPropertyToInstance(instance, "isInstance", true);
	
	Utilities.addHiddenUnwritableMethodToInstance(instance, "isPersisted", function (this: typeof instance) {
		return !opts.is_new;
	});

	Utilities.addHiddenPropertyToInstance(instance, "isShell", function () {
		return opts.isShell;
	});

	Utilities.addHiddenUnwritableMethodToInstance(instance, "validateSync", function () {
		return handleValidationsSync() || false;
	});

	Utilities.addHiddenUnwritableMethodToInstance(instance, "validate", function (cb: FxOrmNS.GenericCallback<FxOrmError.ExtendedError | FxOrmError.ExtendedError[] |false>) {
		cb(null, instance.validateSync());
	});

	Utilities.addHiddenPropertyToInstance(instance, "__singleton_uid", function (this: typeof instance) {
		return opts.uid;
	});

	Utilities.addHiddenPropertyToInstance(instance, "__opts", opts);
	Utilities.addHiddenPropertyToInstance(instance, "model", function (this: typeof instance) {
		return Model;
	});

	for (let i = 0; i < opts.keyProperties.length; i++) {
		var prop = opts.keyProperties[i];

		if (!(prop.name in opts.data)) {
			opts.changes = Object.keys(opts.data);
			break;
		}
	}
	rememberKeys();

	opts.setupAssociations(instance);

	for (let i = 0; i < opts.one_associations.length; i++) {
		var asc = opts.one_associations[i];

		if (!asc.reversed && !asc.extension) {
			for (let k in asc.field as FxOrmProperty.NormalizedPropertyHash) {
				if (!opts.data.hasOwnProperty(k)) {
					addInstanceProperty(k);
				}
			}
		}

		if (asc.name in opts.data) {
			var d = opts.data[asc.name];
			var mapper = function (obj: FxOrmInstance.Instance | FxOrmInstance.InstanceDataPayload) {
				return obj.isInstance ? obj : new asc.model(obj);
			};

			if (Array.isArray(d)) {
				instance[asc.name] = d.map(mapper);
			} else {
				instance[asc.name] = mapper(d);
			}
			delete opts.data[asc.name];
		}
	}
	for (let i = 0; i < opts.many_associations.length; i++) {
		var aName = opts.many_associations[i].name;
		opts.associations[aName] = {
			changed: false, data: opts.many_associations[i]
		};

		if (Array.isArray(opts.data[aName])) {
			instance[aName] = opts.data[aName];
			delete opts.data[aName];
		}
	}

	Object.keys(opts.events).forEach((evtName: FxOrmInstance.InstanceEventType) => {
		if (typeof opts.events[evtName] !== 'function')
			throw new ORMError("INVALID_EVENT_HANDLER", 'PARAM_MISMATCH');

		instance.on(evtName, opts.events[evtName]);
	});

	Hook.wait(instance, opts.hooks.afterLoad, function (err: Error) {
		emitEvent("ready", err, instance);
	});

	return instance;
} as any as FxOrmInstance.InstanceConstructor