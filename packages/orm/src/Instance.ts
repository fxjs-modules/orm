/// <reference types="@fibjs/types" />

import util 	 = require('util');
import { EventEmitter } from 'events';

import FxORMCore = require('@fxjs/orm-core');

import Utilities = require("./Utilities");
import Hook      = require("./Hook");
import ORMError from "./Error";
import enforce   = require("@fibjs/enforce");
import * as Helpers from './Helpers';

import type { FxOrmNS } from './Typo/ORM';
import type { FxOrmInstance } from './Typo/instance';
import type { FxOrmModel } from './Typo/model';
import type { FxOrmError } from './Typo/Error';
import type { FxOrmProperty } from './Typo/property';
import type { FxOrmCommon } from './Typo/_common';
import type { FxOrmAssociation } from './Typo/assoc';

import type {
	FxSqlQuerySql,
	FxSqlQuerySubQuery
} from '@fxjs/sql-query';

interface EmitEventFunctionInInstance {
	(state: string, err?: Error | Error[], _instance?: any): void
	(state: string, _instance?: any): void
}

export const Instance = function (
	this: FxOrmInstance.Instance,
	Model: FxOrmModel.Model, _opts: FxOrmInstance.InstanceConstructorOptions
) {
	const instRtd: FxOrmInstance.InnerInstanceRuntimeData = util.extend({}, _opts);
	instRtd.data = instRtd.data || {};
	instRtd.extra = instRtd.extra || {};
	instRtd.keys = (instRtd.keys || "id") as string[];
	instRtd.changes = (instRtd.isNew ? Object.keys(instRtd.data) : []);
	instRtd.extrachanges = [];
	instRtd.associations = {};
	instRtd.events	= util.extend({}, instRtd.events);
	instRtd.originalKeyValues = {};

	const eventor = new EventEmitter();

	var instance_saving = false;
	var instance: FxOrmInstance.Instance = {} as FxOrmInstance.Instance;

	var emitCallbackStyleEvent: EmitEventFunctionInInstance = function (event: string, ...args: any[]) {
		eventor.emit(event, ...args);
	};
	var rememberKeys = function () {
		for(let i = 0; i < instRtd.keyProperties.length; i++) {
			const prop = instRtd.keyProperties[i];
			instRtd.originalKeyValues[prop.name] = instRtd.data[prop.name];
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

	const returnAllErrors = Model.settings.get("instance.returnAllErrors");

	const handleValidationsSync = function (): FxOrmError.ExtendedError | FxOrmError.ExtendedError[] {
		let required: boolean,
			alwaysValidate: boolean;

		let validationErr: FxOrmError.ExtendedError | FxOrmError.ExtendedError[]
		Hook.wait(instance, instRtd.hooks.beforeValidation, function (err: FxOrmError.ExtendedError) {
			if (err) {
				validationErr = err;
				// saveError(err);
				return ;
			}

			const checks = new enforce.Enforce({ returnAllErrors });

			for (let k in instRtd.validations) {
				required = false;

				if (Model.allProperties[k]) {
					required = Model.allProperties[k].required;
					alwaysValidate = Model.allProperties[k].alwaysValidate;
				} else {
					for (let i = 0; i < instRtd.one_associations.length; i++) {
						/* non-normalized `field` maybe string now */
						if ((instRtd.one_associations[i].field as any) === k) {
							required = instRtd.one_associations[i].required;
							break;
						}
					}
				}
				if (!alwaysValidate && !required && instance[k] == null) {
					continue; // avoid validating if property is not required and is "empty"
				}
				
				for (const validator of instRtd.validations[k] as FibjsEnforce.IValidator[]) {
					checks.add(k, validator);
				}
			}

			checks.context("instance", instance);
			checks.context("model", Model);
			checks.context("driver", instRtd.driver);

			const errors = checks.checkSync(instance);
			if (errors && errors.length)
				validationErr = returnAllErrors ? errors : errors[0]
		});

		return validationErr;
	};
	
	const saveError = function (
		err: FxOrmError.ExtendedError | FxOrmError.ExtendedError[],
	) {
		instance_saving = false;

		emitCallbackStyleEvent("save", err, instance);

		Hook.trigger(instance, instRtd.hooks.afterSave, false);

		return instance;
	};

	const throwErrorIfExistsOnSave = function (errors: FxOrmError.ExtendedError | FxOrmError.ExtendedError[], forceList = false) {
		if (!Array.isArray(errors)) {
			if (!errors) return ;

			errors = !forceList ? errors : [errors];
			saveError(errors)
			throw errors;
		} else {
			if (!errors.length) return ;

			errors = returnAllErrors ? errors : errors[0];
			saveError(errors)
			throw errors;
		}
	}

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

		throwErrorIfExistsOnSave(handleValidationsSync(), returnAllErrors);
		
		if (instRtd.isNew) {
			Utilities.attachOnceTypedHookRefToInstance(instance, 'create', {});
			Utilities.attachOnceTypedHookRefToInstance(instance, 'save', {});
			Hook.wait(instance, [ instRtd.hooks['beforeCreate'], instRtd.hooks['beforeSave'] ], function (err: FxOrmError.ExtendedError) {
				if (err) {
					saveError(err);
					throw err;
				}

				saveNewSync(saveOptions, getInstanceData());
			});
		} else {
			Utilities.attachOnceTypedHookRefToInstance(instance, 'save', {});
			Hook.wait(instance, [ instRtd.hooks['beforeSave'] ], function (err: FxOrmError.ExtendedError) {
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

		emitCallbackStyleEvent("save", err, instance);

		if (is_create)
			Hook.trigger(instance, instRtd.hooks.afterCreate, !err);

		Hook.trigger(instance, instRtd.hooks.afterSave, !err);
	};
	const getInstanceData = function () {
		const data: FxOrmInstance.InstanceDataPayload = {};
		let prop: FxOrmProperty.NormalizedProperty;

		for (let k in instRtd.data) {
			if (!instRtd.data.hasOwnProperty(k)) continue;
			prop = Model.allProperties[k];

			if (prop) {
				if (instRtd.data[k] == null &&  (prop.type == 'serial' || typeof prop.defaultValue == 'function')) {
					continue;
				}

				if (instRtd.driver.propertyToValue) {
					data[k] = instRtd.driver.propertyToValue(instRtd.data[k], prop);
				} else {
					data[k] = instRtd.data[k];
				}
			} else {
				data[k] = instRtd.data[k];
			}
		}

		return data;
	};

	const resetChanges = function () {
		instRtd.changes.length = 0;
	}
	
	const saveNewSync = function (
		saveOptions: FxOrmInstance.SaveOptions,
		data: FxOrmInstance.InstanceDataPayload,
	) {
		data = Utilities.transformPropertyNames(data, Model.allProperties);

		const info = instRtd.driver.insert(instRtd.table, data, instRtd.keyProperties);

		resetChanges();
		for (let i = 0, prop; i < instRtd.keyProperties.length; i++) {
			prop = instRtd.keyProperties[i];
			instRtd.data[prop.name] = info.hasOwnProperty(prop.name) ? info[prop.name] : data[prop.name];
		}
		instRtd.isNew = false;
		rememberKeys();

		let err: FxOrmError.ExtendedError;
		
		if (shouldSaveAssocs(saveOptions)) {
			const syncReponse = FxORMCore.catchBlocking<boolean>(saveAssociationsSync)
			err = syncReponse.error;
		}
		
		runSyncAfterSaveActions(true, err);

		if (err)
			throw err;

		saveInstanceExtraSync();
	};

	const oneOneAssocs = Object.values(Model.associations).filter(assoc => assoc.type === 'hasOne');

	const savePersistedSync = function (
		saveOptions: FxOrmInstance.SaveOptions,
		data: FxOrmInstance.InstanceDataPayload,
	) {
		let changes = <FxSqlQuerySql.DataToSet>{},
				conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};

		const savedCheckSync = function (saved: boolean) {
			const _shouldSaveAssocs = shouldSaveAssocs(saveOptions)
			if (!saved && !_shouldSaveAssocs)
				return saveInstanceExtraSync();
			
			if (!_shouldSaveAssocs) {
				runSyncAfterSaveActions(false);
				return saveInstanceExtraSync();
			}
			
			const { error: err, result: assocSaved } = FxORMCore.catchBlocking<boolean>(saveAssociationsSync)

			if (saved || assocSaved) {
				runSyncAfterSaveActions(false, err);
				if (err)
					throw err;
			}

			return saveInstanceExtraSync();
		}

		if (instance.saved())
			return savedCheckSync(false);

		for (let i = 0; i < instRtd.changes.length; i++) {
			changes[instRtd.changes[i]] = data[instRtd.changes[i]];
		}
		
		for (let i = 0; i < instRtd.keyProperties.length; i++) {
			const prop = instRtd.keyProperties[i];
			conditions[prop.mapsTo] = instRtd.originalKeyValues[prop.name];
		}
		changes = Utilities.transformPropertyNames(changes, Model.allProperties);

		Utilities.filterWhereConditionsInput(conditions, instance.model());

		const syncResponse = FxORMCore.catchBlocking(() => instRtd.driver.update(instRtd.table, changes, conditions));
		fillBackAssociatedFieldsAfterPersist: {
			const couldParallel = instRtd.driver.db.isPool;
			
			Utilities.parallelQueryIfPossible(couldParallel, oneOneAssocs, ({ association }) => {
				Utilities.parallelQueryIfPossible(couldParallel, Object.keys(association.field), propName => {
					if (!changes.hasOwnProperty(propName)) {
						return ;
					}
					instance[propName] = changes[propName];
					if (instance.hasOwnProperty(association.name)) {
						instance[association.getSyncAccessor]();
					}
				})
			})
		}
			
		if (syncResponse.error) {
			saveError(syncResponse.error)
			throw syncResponse.error;
		}
		resetChanges();
		rememberKeys();

		savedCheckSync(true);
	};

	const saveAssociationsSync = function (cb?: FxOrmCommon.ExecutionCallback<boolean>): boolean {
		let pending = 1,
			// to check if error passed by cb if cb exists
			error_passed = false,
			assocSaved: boolean;

		const saveAssociationItemSync = function (syncVersionAccessor: string, instances: FxOrmInstance.InstanceDataPayload) {
			pending += 1;

			let error: FxOrmError.ExtendedError = null;

			const syncResponse = FxORMCore.catchBlocking(() => {
				instance[syncVersionAccessor](instances);
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

			FxORMCore.takeAwayResult({ error: error, result: assocSaved }, { callback: cb });
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
					instRtd.driver.db.isPool,
					instances,
					(item) => {
						if (!item.isInstance) {
							item = new assoc.model(item);
						}
						saveAssociationItemSync(assoc.setSyncAccessor, item);
					}
				);
				
				return;
			}

			if (!instance[assoc.name].isInstance) {
			  instance[assoc.name] = new assoc.model(instance[assoc.name]);
			}

			saveAssociationItemSync(assoc.setSyncAccessor, instance[assoc.name]);
		};

		for (let i = 0; i < instRtd.one_associations.length; i++) {
			_saveOneAssociation(instRtd.one_associations[i]);
		}

		const _saveManyAssociation = function (assoc: FxOrmAssociation.InstanceAssociationItem) {
			var assocVal = instance[assoc.name];

			if (!Array.isArray(assocVal)) return;
			if (!instRtd.associations[assoc.name].changed) return;

			for (let j = 0; j < assocVal.length; j++) {
				if (!assocVal[j].isInstance) {
					assocVal[j] = new assoc.model(assocVal[j]);
				}
			}

			saveAssociationItemSync(assoc.setSyncAccessor, assocVal);
		};

		for (let i = 0; i < instRtd.many_associations.length; i++) {
			_saveManyAssociation(instRtd.many_associations[i]);
		}

		if (--pending === 0)
			cb && cb(null, false);

		return assocSaved;
	};
	var getNormalizedExtraDataAtPropertyTime = function () {
		return instRtd.extra as Record<string, FxOrmProperty.NormalizedProperty>
	};

	const saveInstanceExtraSync = function (): FxOrmInstance.Instance {
		if (instRtd.extrachanges.length === 0)
			return instance;

		var data: FxOrmInstance.InstanceDataPayload = {};
		var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};

		for (let i = 0; i < instRtd.extrachanges.length; i++) {
			if (!instRtd.data.hasOwnProperty(instRtd.extrachanges[i])) continue;

			if (getNormalizedExtraDataAtPropertyTime()[instRtd.extrachanges[i]]) {
				data[instRtd.extrachanges[i]] = instRtd.data[instRtd.extrachanges[i]];
				if (instRtd.driver.propertyToValue) {
					data[instRtd.extrachanges[i]] = instRtd.driver.propertyToValue(data[instRtd.extrachanges[i]], getNormalizedExtraDataAtPropertyTime()[instRtd.extrachanges[i]]);
				}
			} else {
				data[instRtd.extrachanges[i]] = instRtd.data[instRtd.extrachanges[i]];
			}
		}

		for (let i = 0; i < instRtd.extra_info.id.length; i++) {
			conditions[instRtd.extra_info.id_prop[i]] = instRtd.extra_info.id[i];
			conditions[instRtd.extra_info.assoc_prop[i]] = instRtd.data[instRtd.keys[i]];
			Utilities.filterWhereConditionsInput(conditions, instance.model());
		}

		Utilities.filterWhereConditionsInput(conditions, instance.model());
		
		instRtd.driver.update(instRtd.extra_info.table, data, conditions);

		return instance;
	};

	const saveInstanceProperty = function (key: string, value: any) {
		const changes: FxOrmInstance.InstanceDataPayload = {},
					conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
					changes[key] = value;

		if (Model.properties[key])
			if (instRtd.driver.propertyToValue)
				changes[key] = instRtd.driver.propertyToValue(changes[key], Model.properties[key]);

		for (let i = 0; i < instRtd.keys.length; i++) {
			conditions[instRtd.keys[i]] = instRtd.data[instRtd.keys[i]];
		}

		Utilities.attachOnceTypedHookRefToInstance(instance, 'save', {});
		Hook.wait(instance, instRtd.hooks.beforeSave, function (err: FxOrmError.ExtendedError) {
			if (err) {
				Hook.trigger(instance, instRtd.hooks.afterSave, false);
				emitCallbackStyleEvent("save", err, instance);
				return;
			}

			Utilities.filterWhereConditionsInput(conditions, instance.model());
			const syncReponse = FxORMCore.catchBlocking(() => instRtd.driver.update(instRtd.table, changes, conditions))
			if (!syncReponse.error)
				instRtd.data[key] = value;

			Hook.trigger(instance, instRtd.hooks.afterSave, !syncReponse.error);
			emitCallbackStyleEvent("save", syncReponse.error, instance);
		});
	};
	const setInstanceProperty = function (key: string, value: any) {
		const prop = Model.allProperties[key] || getNormalizedExtraDataAtPropertyTime()[key];

		if (prop) {
			if ('valueToProperty' in instRtd.driver) {
				value = instRtd.driver.valueToProperty(value, prop);
			}
			if (instRtd.data[key] !== value) {
				instRtd.data[key] = value;
				return true;
			}
		}
		return false;
	}

	// ('data.a.b', 5) => instRtd.data.a.b = 5
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
				instRtd.changes.push(propName);
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

		if (key in instRtd.data) {
			defaultValue = instRtd.data[key];
		} else if (prop && 'defaultValue' in prop) {
			defaultValue = prop.defaultValue;
		}

		setInstanceProperty(key, defaultValue);

		Object.defineProperty(instance, key, {
			get: function () {
				return instRtd.data[key];
			},
			set: function (val) {
				if (prop.key === true) {
					if (prop.type == 'serial' && instRtd.data[key] != null) {
						if (!(val === null || val === undefined)) {
							return ;
						}
					} else {
						instRtd.originalKeyValues[prop.name] = instRtd.data[prop.name];
					}
				}

				if (!setInstanceProperty(key, val)) {
					return;
				}

				if (instRtd.autoSave) {
					saveInstanceProperty(key, val);
				} else if (instRtd.changes.indexOf(key) === -1) {
					instRtd.changes.push(key);
				}
			},
			enumerable: !(prop && !prop.enumerable)
		});
	};
	var addInstanceExtraProperty = function (key: string) {
		if (!instance.hasOwnProperty("extra") || instance.extra === "") {
			instance.extra = {};
		}
		Object.defineProperty(instance.extra, key, {
			get: function () {
				return instRtd.data[key];
			},
			set: function (val) {
				setInstanceProperty(key, val);

				/*if (instRtd.autoSave) {
					saveInstanceProperty(key, val);
				}*/
				if (instRtd.extrachanges.indexOf(key) === -1) {
					instRtd.extrachanges.push(key);
				}
			},
			enumerable: true
		});
	};

	for (let k in Model.allProperties) {
		addInstanceProperty(k);
	}
	for (let k in instRtd.extra) {
		addInstanceProperty(k);
	}

	for (let k in instRtd.methods) {
		Utilities.addHiddenPropertyToInstance(instance, k, instRtd.methods[k].bind(instance), { writable: true });
	}

	for (let k in instRtd.extra) {
		addInstanceExtraProperty(k);
	}

	Utilities.addHiddenUnwritableMethodToInstance(instance, "on", function (event: string, cb: FxOrmCommon.VoidCallback) {
		cb = Utilities.bindInstance(instance, cb);
		eventor.on(event, cb);
		return this;
	});

	const eventEmitterArgsToMap = function (restArgs: any[]): {[k: string]: Function} | string {
		let map = restArgs[0]
		if (typeof map === 'string' && typeof restArgs[1] === 'function')
			map = {[map]: restArgs[1]}

		if (typeof map === 'object')
			Object.keys(map).forEach(evt => map[evt] = Utilities.bindInstance(instance, map[evt]))
			
		return map;
	}

	Utilities.addHiddenUnwritableMethodToInstance(instance, "$on", function (...args: any) {
		const mapOrString = eventEmitterArgsToMap(args);
		if (typeof mapOrString === 'string')
			return ;

		return eventor.on(mapOrString);
	});

	Utilities.addHiddenUnwritableMethodToInstance(instance, "$off", function (...args: any) {
		const mapOrString = eventEmitterArgsToMap(args);
		if (typeof mapOrString === 'string')
			return eventor.off(mapOrString);

		return eventor.off(mapOrString);
	});

	Utilities.addHiddenUnwritableMethodToInstance(instance, "$emit", function (event: string, ...args: any[]) {
		return eventor.emit(event, ...args);
	});

	const collectParamsForSave = function (args: any[]) {
		var objCount = 0;
		var data: FxOrmInstance.InstanceDataPayload = {},
			saveOptions = {};

		Helpers.selectArgs(args, function (arg_type, arg) {
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
					const err: FxOrmNS.ExtensibleError = new Error("Unknown parameter type '" + (typeof arg) + "' in Instance.save()");
					err.model = Model.table;
					throw err;
			}
		});

		return { saveOptions, data }
	}

	Utilities.addHiddenUnwritableMethodToInstance(instance, "saveSync", function (this: typeof instance) {
		const args = Array.prototype.slice.apply(arguments);
		const { saveOptions, data } = collectParamsForSave(args);

		for (let k in data) {
			if (data.hasOwnProperty(k)) {
				this[k] = data[k];
			}
		}

		saveInstanceSync(saveOptions);

		return instance;
	});
	
	Utilities.addHiddenUnwritableMethodToInstance(instance, "save", function (this: typeof instance) {
		var cb: FxOrmCommon.ExecutionCallback<FxOrmInstance.Instance> = null;

		let args: any[] = Array.prototype.slice.apply(arguments);
		Helpers.selectArgs(args, function (arg_type, arg) {
			switch (arg_type) {
				case 'function':
					cb = arg;
					break;
			}
		});
		args = args.filter(x => x !== cb);
		collectParamsForSave(args);

		process.nextTick(() => {
			const syncResponse = FxORMCore.catchBlocking(instance.saveSync, args);
			FxORMCore.takeAwayResult({ error: syncResponse.error, result: instance }, { no_throw: !!cb, callback: cb });
		});

		return this;
	})

	Utilities.addHiddenUnwritableMethodToInstance(instance, "saved", function (this: typeof instance) {
		return instRtd.changes.length === 0;
	});

	Utilities.addHiddenUnwritableMethodToInstance(instance, "removeSync", function () {
		if (instRtd.isNew)
			return ;

		var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
		for (let i = 0; i < instRtd.keys.length; i++) {
		    conditions[instRtd.keys[i]] = instRtd.data[instRtd.keys[i]];
		}

		let removeErr = null as FxOrmError.ExtendedError;

		Utilities.attachOnceTypedHookRefToInstance(instance, 'remove', {});
		Hook.wait(instance, instRtd.hooks.beforeRemove, function (err: FxOrmError.ExtendedError) {
			if (err) {
				emitCallbackStyleEvent("remove", err, instance);

				removeErr = err;
				return ;
			}

			emitCallbackStyleEvent("beforeRemove", instance);
			
			Utilities.filterWhereConditionsInput(conditions, instance.model());
			const syncResponse = FxORMCore.catchBlocking(() => instRtd.driver.remove(instRtd.table, conditions));

			Hook.trigger(instance, instRtd.hooks.afterRemove, !syncResponse.error);

			emitCallbackStyleEvent("remove", syncResponse.error, instance);

			removeErr = syncResponse.error;

			instance = undefined;
		});

		if (removeErr)
			throw removeErr;
	})

	Utilities.addHiddenUnwritableMethodToInstance(instance, "remove", function (cb: FxOrmCommon.ExecutionCallback<FxOrmInstance.Instance>) {
		const syncReponse = FxORMCore.catchBlocking(() => instance.removeSync());
		FxORMCore.takeAwayResult(syncReponse, { callback: cb });

		return this;
	});

	Utilities.addHiddenUnwritableMethodToInstance(instance, "set", setPropertyByPath);
	Utilities.addHiddenUnwritableMethodToInstance(instance, "markAsDirty", function (propName: string) {
		if (propName != undefined) {
			instRtd.changes.push(propName);
		}
	});
	
	Utilities.addHiddenReadonlyPropertyToInstance(instance, "dirtyProperties", function () { return instRtd.changes; });

	Utilities.addHiddenPropertyToInstance(instance, "isInstance", true);
	
	Utilities.addHiddenUnwritableMethodToInstance(instance, "isPersisted", function (this: typeof instance) {
		return !instRtd.isNew;
	});

	Utilities.addHiddenPropertyToInstance(instance, "isShell", function () {
		return instRtd.isShell;
	});

	Utilities.addHiddenUnwritableMethodToInstance(instance, "validateSync", function () {
		return handleValidationsSync() || false;
	});

	Utilities.addHiddenUnwritableMethodToInstance(instance, "validate", function (cb: FxOrmCommon.GenericCallback<FxOrmError.ExtendedError | FxOrmError.ExtendedError[] |false>) {
		cb(null, instance.validateSync());
	});

	Utilities.addHiddenPropertyToInstance(instance, "__singleton_uid", function (this: typeof instance) {
		return instRtd.uid;
	});

	Utilities.addHiddenPropertyToInstance(instance, "__instRtd", instRtd);
	/* just for compat, use __instRtd plz */
	Utilities.addHiddenPropertyToInstance(instance, "__opts", instRtd);
	Utilities.addHiddenPropertyToInstance(instance, "model", function (this: typeof instance) {
		return Model;
	});

	for (let i = 0; i < instRtd.keyProperties.length; i++) {
		var prop = instRtd.keyProperties[i];

		if (!(prop.name in instRtd.data)) {
			instRtd.changes = Object.keys(instRtd.data);
			break;
		}
	}
	rememberKeys();

	instRtd.__setupAssociations(instance);

	for (let i = 0; i < instRtd.one_associations.length; i++) {
		var asc = instRtd.one_associations[i];

		if (!asc.reversed && !asc.__for_extension) {
			for (let k in asc.field as Record<string, FxOrmProperty.NormalizedProperty>) {
				if (!instRtd.data.hasOwnProperty(k)) {
					addInstanceProperty(k);
				}
			}
		}

		if (asc.name in instRtd.data) {
			var d = instRtd.data[asc.name];
			var mapper = function (obj: FxOrmInstance.Instance | FxOrmInstance.InstanceDataPayload) {
				return obj.isInstance ? obj : new asc.model(obj);
			};

			if (Array.isArray(d)) {
				instance[asc.name] = d.map(mapper);
			} else {
				instance[asc.name] = mapper(d);
			}
			delete instRtd.data[asc.name];
		}
	}
	for (let i = 0; i < instRtd.many_associations.length; i++) {
		var aName = instRtd.many_associations[i].name;
		instRtd.associations[aName] = {
			changed: false, data: instRtd.many_associations[i]
		};

		if (Array.isArray(instRtd.data[aName])) {
			instance[aName] = instRtd.data[aName];
			delete instRtd.data[aName];
		}
	}

	Object.keys(instRtd.events).forEach((evtName: FxOrmInstance.InstanceEventType) => {
		if (typeof instRtd.events[evtName] !== 'function')
			throw new ORMError("INVALID_EVENT_HANDLER", 'PARAM_MISMATCH');

		instance.on(evtName, instRtd.events[evtName]);
	});

	Hook.wait(instance, instRtd.hooks.afterLoad, function (err: Error) {
		process.nextTick(() => {
			emitCallbackStyleEvent("ready", err, instance);
		});
	});

	return instance;
} as any as FxOrmInstance.InstanceConstructor