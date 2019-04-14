/// <reference types="fibjs" />

import util 	 = require('util')

import Utilities = require("./Utilities");
import Hook      = require("./Hook");
import ORMError       = require("./Error");
import enforce   = require("@fibjs/enforce");

interface EmitEventFunctionInInstance {
	(state: string, err?: Error, _instance?: any): void
	(state: string, _instance?: any): void
}

interface InnerSaveOptions {
		saveAssociations?: boolean
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

	var instance_saving = false;
	var events: {[k: string]: Function[]} = {};
	var instance: FxOrmInstance.Instance = {} as FxOrmInstance.Instance;

	var emitEvent: EmitEventFunctionInInstance = function () {
		var args = Array.prototype.slice.apply(arguments);
		var event = args.shift();

		if (!events.hasOwnProperty(event)) return;

		events[event].map(function (cb) {
			cb.apply(instance, args);
		});
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
	var handleValidations = function <T = any>(cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>) {
		// var pending = [], errors = [];
		var required: boolean,
				alwaysValidate: boolean;

		Hook.wait(instance, opts.hooks.beforeValidation, function (err: FxOrmError.ExtendedError) {
			if (err) {
				return saveError(cb, err);
			}

			var checks = new enforce.Enforce({
				returnAllErrors : Model.settings.get("instance.returnAllErrors")
			});

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

			return checks.check(instance, cb);
		});
	};
	var saveError = function (
		cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>,
		err: FxOrmError.ExtendedError
	) {
		instance_saving = false;

		emitEvent("save", err, instance);

		Hook.trigger(instance, opts.hooks.afterSave, false);

		if (typeof cb === "function") {
			cb(err, instance);
		}
	};
	var saveInstance = function (saveOptions: InnerSaveOptions, cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>) {
		// what this condition means:
		// - If the instance is in state mode
		// - AND it's not an association that is asking it to save
		//   -> return has already saved
		if (instance_saving && saveOptions.saveAssociations !== false) {
			return cb(null, instance);
		}
		instance_saving = true;

		handleValidations(function (err: FxOrmError.ExtendedError) {
			if (err) {
				return saveError(cb, err);
			}

			if (opts.is_new) {
				waitHooks([ "beforeCreate", "beforeSave" ], function (err: FxOrmError.ExtendedError) {
					if (err) {
						return saveError(cb, err);
					}

					return saveNew(saveOptions, getInstanceData(), cb);
				});
			} else {
				waitHooks([ "beforeSave" ], function (err: FxOrmError.ExtendedError) {
					if (err) {
						return saveError(cb, err);
					}

					return savePersisted(saveOptions, getInstanceData(), cb);
				});
			}
		});
	};
	var runAfterSaveActions = function (cb?: Function, create?: boolean, err?: Error) {
		instance_saving = false;

		emitEvent("save", err, instance);

		if (create) {
			Hook.trigger(instance, opts.hooks.afterCreate, !err);
		}
		Hook.trigger(instance, opts.hooks.afterSave, !err);

		cb();
	};
	var getInstanceData = function () {
		var data: FxOrmInstance.InstanceDataPayload = {},
				prop;
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
	var waitHooks = function (hooks: FxOrmModel.keyofHooks[], next: FxOrmHook.HookActionNextFunction) {
		var nextHook = function () {
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
	var saveNew = function (saveOptions: InnerSaveOptions, data: FxOrmInstance.InstanceDataPayload, cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>) {
		var i, prop;

		var finish = function (err?: Error) {
			runAfterSaveActions(function () {
				if (err) return cb(err);
				saveInstanceExtra(cb);
			}, true);
		}

		data = Utilities.transformPropertyNames(data, Model.allProperties);

		opts.driver.insert(opts.table, data, opts.keyProperties, function (save_err, info) {
			if (save_err) {
				return saveError(cb, save_err);
			}

			opts.changes.length = 0;

			for (let i = 0; i < opts.keyProperties.length; i++) {
				prop = opts.keyProperties[i];
				opts.data[prop.name] = info.hasOwnProperty(prop.name) ? info[prop.name] : data[prop.name];
			}
			opts.is_new = false;
			rememberKeys();

			if (!shouldSaveAssocs(saveOptions)) {
				return finish();
			}

			return saveAssociations(finish);
		});
	};
	var savePersisted = function (saveOptions: InnerSaveOptions, data: FxOrmInstance.InstanceDataPayload, cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>) {
		var changes = <FxSqlQuerySql.DataToSet>{},
			conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};

		var next = function (saved: boolean) {
			var finish = function () {
				saveInstanceExtra(cb);
			}

			if(!saved && !shouldSaveAssocs(saveOptions)) {
				finish();
			} else {
				if (!shouldSaveAssocs(saveOptions)) {
					runAfterSaveActions(function () {
						finish();
					}, false);
				} else {
					saveAssociations(function (err: FxOrmError.ExtendedError, assocSaved: boolean) {
						if (saved || assocSaved) {
							runAfterSaveActions(function () {
								if (err) return cb(err);
								finish();
							}, false, err);
						} else {
							finish();
						}
					});
				}
			}
		}

		if (opts.changes.length === 0) {
			next(false);
		} else {
			for (let i = 0; i < opts.changes.length; i++) {
				changes[opts.changes[i]] = data[opts.changes[i]];
			}
			for (let i = 0; i < opts.keyProperties.length; i++) {
				const prop = opts.keyProperties[i];
				conditions[prop.mapsTo] = opts.originalKeyValues[prop.name];
			}
			changes = Utilities.transformPropertyNames(changes, Model.allProperties);

			opts.driver.update(opts.table, changes, conditions, function (err: FxOrmError.ExtendedError) {
				if (err) {
					return saveError(cb, err);
				}
				opts.changes.length = 0;
				rememberKeys();

				next(true);
			});
		}
	};
	var saveAssociations = function (cb: FxOrmNS.ExecutionCallback<boolean>) {
		var pending = 1, errored = false, i;
		var saveAssociation = function (accessor: string, instances: FxOrmInstance.Instance[]) {
			pending += 1;

			instance[accessor](instances, function (err: FxOrmError.ExtendedError) {
				if (err) {
					if (errored) return;

					errored = true;
					return cb(err, true);
				}

				if (--pending === 0) {
					return cb(null, true);
				}
			});
		};

		var _saveOneAssociation = function (assoc: FxOrmAssociation.InstanceAssociationItem) {
			if (!instance[assoc.name] || typeof instance[assoc.name] !== "object") return;
			if (assoc.reversed) {
				// reversed hasOne associations should behave like hasMany
				if (!Array.isArray(instance[assoc.name])) {
					instance[assoc.name] = [ instance[assoc.name] ];
				}
				for (let i = 0; i < instance[assoc.name].length; i++) {
					if (!instance[assoc.name][i].isInstance) {
						instance[assoc.name][i] = new assoc.model(instance[assoc.name][i]);
					}
					saveAssociation(assoc.setAccessor, instance[assoc.name][i]);
				}
				return;
			}
			if (!instance[assoc.name].isInstance) {
			  instance[assoc.name] = new assoc.model(instance[assoc.name]);
			}

			saveAssociation(assoc.setAccessor, instance[assoc.name]);
		};

		for (let i = 0; i < opts.one_associations.length; i++) {
			_saveOneAssociation(opts.one_associations[i]);
		}


		var _saveManyAssociation = function (assoc: FxOrmAssociation.InstanceAssociationItem) {
			var assocVal = instance[assoc.name];

			if (!Array.isArray(assocVal)) return;
			if (!opts.associations[assoc.name].changed) return;

			for (let j = 0; j < assocVal.length; j++) {
				if (!assocVal[j].isInstance) {
					assocVal[j] = new assoc.model(assocVal[j]);
				}
			}

			saveAssociation(assoc.setAccessor, assocVal);
		};

		for (let i = 0; i < opts.many_associations.length; i++) {
			_saveManyAssociation(opts.many_associations[i]);
		}

		if (--pending === 0) {
			return cb(null, false);
		}
	};
	var getNormalizedExtraDataInPropertyTime = function () {
		return opts.extra as FxOrmProperty.NormalizedPropertyHash
	};

	var saveInstanceExtra = function (cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>) {
		if (opts.extrachanges.length === 0) {
			if (cb) return cb(null, instance);
			else return;
		}

		var data: FxOrmInstance.InstanceDataPayload = {};
		var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};

		for (let i = 0; i < opts.extrachanges.length; i++) {
			if (!opts.data.hasOwnProperty(opts.extrachanges[i])) continue;

			if (getNormalizedExtraDataInPropertyTime()[opts.extrachanges[i]]) {
				data[opts.extrachanges[i]] = opts.data[opts.extrachanges[i]];
				if (opts.driver.propertyToValue) {
					data[opts.extrachanges[i]] = opts.driver.propertyToValue(data[opts.extrachanges[i]], getNormalizedExtraDataInPropertyTime()[opts.extrachanges[i]]);
				}
			} else {
				data[opts.extrachanges[i]] = opts.data[opts.extrachanges[i]];
			}
		}

		for (let i = 0; i < opts.extra_info.id.length; i++) {
			conditions[opts.extra_info.id_prop[i]] = opts.extra_info.id[i];
			conditions[opts.extra_info.assoc_prop[i]] = opts.data[opts.keys[i]];
		}

		opts.driver.update(opts.extra_info.table, data, conditions, function (err: FxOrmError.ExtendedError) {
			return cb(err);
		});
	};
	var removeInstance = function (cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>) {
		if (opts.is_new) {
			return cb(null);
		}

		var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
		for (let i = 0; i < opts.keys.length; i++) {
		    conditions[opts.keys[i]] = opts.data[opts.keys[i]];
		}

		Hook.wait(instance, opts.hooks.beforeRemove, function (err: FxOrmError.ExtendedError) {
			if (err) {
				emitEvent("remove", err, instance);
				if (typeof cb === "function") {
					cb(err, instance);
				}
				return;
			}

			emitEvent("beforeRemove", instance);

			opts.driver.remove(opts.table, conditions, function (err, data) {
				Hook.trigger(instance, opts.hooks.afterRemove, !err);

				emitEvent("remove", err, instance);

				if (typeof cb === "function") {
					cb(err, instance);
				}

				instance = undefined;
			});
		});
	};
	var saveInstanceProperty = function (key: string, value: any) {
		var changes: FxOrmInstance.InstanceDataPayload = {},
			conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
			changes[key] = value;

		if (Model.properties[key]) {
			if (opts.driver.propertyToValue) {
				changes[key] = opts.driver.propertyToValue(changes[key], Model.properties[key]);
			}
		}

		for (let i = 0; i < opts.keys.length; i++) {
			conditions[opts.keys[i]] = opts.data[opts.keys[i]];
		}

		Hook.wait(instance, opts.hooks.beforeSave, function (err: FxOrmError.ExtendedError) {
			if (err) {
				Hook.trigger(instance, opts.hooks.afterSave, false);
				emitEvent("save", err, instance);
				return;
			}

			opts.driver.update(opts.table, changes, conditions, function (err: FxOrmError.ExtendedError) {
				if (!err) {
					opts.data[key] = value;
				}
				Hook.trigger(instance, opts.hooks.afterSave, !err);
				emitEvent("save", err, instance);
			});
		});
	};
	var setInstanceProperty = function (key: string, value: any) {
		var prop = Model.allProperties[key] || getNormalizedExtraDataInPropertyTime()[key];

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
	var setPropertyByPath: FxOrmInstance.Instance['set'] = function (path, value) {
		if (typeof path == 'string') {
			path = path.split('.');
		} else if (!Array.isArray(path)) {
			return;
		}

		var propName = path.shift();
		var prop = Model.allProperties[propName] || getNormalizedExtraDataInPropertyTime()[propName];
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

	Object.defineProperty(instance, "on", {
		value: function (event: string, cb: FxOrmNS.VoidCallback) {
			if (!events.hasOwnProperty(event)) {
				events[event] = [];
			}
			events[event].push(cb);

			return this;
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(instance, "save", {
		value: function () {
			var arg = null, objCount = 0;
			var data: FxOrmInstance.InstanceDataPayload = {},
					saveOptions = {},
					cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance> = null;

			while (arguments.length > 0) {
				arg = Array.prototype.shift.call(arguments);

				switch (typeof arg) {
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
					case 'function':
						cb = arg;
						break;
					default:
					    const err: FibOrmNS.ExtensibleError = new Error("Unknown parameter type '" + (typeof arg) + "' in Instance.save()");
					    err.model = Model.table;
					    throw err;
				}
			}

			for (let k in data) {
				if (data.hasOwnProperty(k)) {
					this[k] = data[k];
				}
			}

			saveInstance(saveOptions, function (err: FxOrmError.ExtendedError) {
				if (!cb) return;
				if (err) return cb(err);

				return cb(null, instance);
			});

			return this;
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(instance, "saved", {
		value: function () {
			return opts.changes.length === 0;
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(instance, "remove", {
		value: function (cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>) {
			removeInstance(cb);

			return this;
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(instance, "set", {
		value: setPropertyByPath,
		enumerable: false,
		writable: true
	});
	Object.defineProperty(instance, "markAsDirty", {
		value: function (propName: string) {
			if (propName != undefined) {
				opts.changes.push(propName);
			}
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(instance, "dirtyProperties", {
		get: function () { return opts.changes; },
		enumerable: false
	});
	Object.defineProperty(instance, "isInstance", {
		value: true,
		enumerable: false
	});
	Object.defineProperty(instance, "isPersisted", {
		value: function () {
			return !opts.is_new;
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(instance, "isShell", {
		value: function () {
			return opts.isShell;
		},
		enumerable: false
	});
	Object.defineProperty(instance, "validate", {
		value: function (cb: FxOrmNS.GenericCallback<FxOrmError.ExtendedError|false>) {
			handleValidations(function (errors: FxOrmError.ExtendedError) {
				cb(null, errors || false);
			});
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(instance, "__singleton_uid", {
		value: function () {
			return opts.uid;
		},
		enumerable: false
	});
	Object.defineProperty(instance, "__opts", {
		value: opts,
		enumerable: false
	});
	Object.defineProperty(instance, "model", {
		value: function () {
			return Model;
		},
		enumerable: false
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