import util           = require("util");
import events         = require("events");
import uuid			  = require('uuid')

import SqlQuery       = require("@fxjs/sql-query");
import ormPluginSyncPatch from './Patch/plugin'

import { Model }      from "./Model";
import DriverAliases  = require("./Drivers/aliases");
import adapters       = require("./Adapters");
import ORMError       = require("./Error");
import Utilities      = require("./Utilities");
import Helpers      = require("./Helpers");

import Enforces   	  = require("@fibjs/enforce");
// Deprecated, use enforce
import validators 	  = require("./Validators");

import Settings       = require("./Settings");
import singleton      = require("./Singleton");


const SettingsInstance = Settings.Container(Settings.defaults());

import Property   = require("./Property");

const use: FxOrmNS.ExportModule['use'] = function (connection, proto, opts, cb) {
	if (DriverAliases[proto]) {
		proto = DriverAliases[proto];
	}
	if (typeof opts === "function") {
		cb = opts;
		opts = <FxOrmNS.IUseOptions>{};
	}

	try {
		const Driver   = adapters.get(proto);
		const settings = Settings.Container(SettingsInstance.get('*'));
		const driver   = new Driver(null, connection, {
			debug    : (opts.query && opts.query.debug === 'true'),
			settings : settings
		});

		return cb(null, new ORM(proto, driver, settings));
	} catch (err) {
		return cb(err);
	}
};

const FALLBACK_CONNECT_CFG = {
	protocol: '',
	user: '',
	password: '',
	host: '',
	query: {},
	database: ''
}

function isOrmLikeErrorEmitter (parsedDBConfig: FxOrmNS.IDBConnectionConfig | FxOrmNS.ORMLike): parsedDBConfig is FxOrmNS.ORMLike {
	return !parsedDBConfig.hasOwnProperty('host') && parsedDBConfig instanceof events.EventEmitter
}

const connectSync: FxOrmNS.ExportModule['connectSync'] = function (opts) {
	Helpers.selectArgs(arguments, function (type, arg) {
		switch (type) {
			default:
				opts = arg;
				break
		}
	});

	const cfg = Helpers.parseDbConfig(opts);

	if (isOrmLikeErrorEmitter(cfg)) {
        const errWaitor = Utilities.getErrWaitor(true);
        cfg.on('connect', (err: FxOrmError.ExtendedError) => {
            errWaitor.err = err;
            errWaitor.evt.set();
        });
        errWaitor.evt.wait();
        
        if (errWaitor.err)
            throw errWaitor.err;

        return cfg;
	}
	
	let proto  = cfg.protocol.replace(/:$/, '');
	let orm: FxOrmNS.ORM;
	if (DriverAliases[proto]) {
		proto = DriverAliases[proto];
	}

	const syncResult = Utilities.exposeErrAndResultFromSyncMethod(() => {
		const Driver = adapters.get(proto);
		const settings = Settings.Container(SettingsInstance.get('*'));
		const driver   = new Driver(cfg, null, {
			debug    : 'debug' in cfg.query ? cfg.query.debug : settings.get("connection.debug"),
			pool     : 'pool'  in cfg.query ? cfg.query.pool  : settings.get("connection.pool"),
			settings : settings
		});

		driver.connect();

		orm = new ORM(proto, driver, settings);

		return orm;
	});

	if (syncResult.error && Utilities.isDriverNotSupportedError(syncResult.error)) {
		syncResult.error = new ORMError("Connection protocol not supported - have you installed the database driver for " + proto + "?", 'NO_SUPPORT');
	}

	Utilities.throwErrOrCallabckErrResult(syncResult, { no_throw: false });

	return orm;
}

const connect: FxOrmNS.ExportModule['connect'] = function () {
	let cb: FxOrmNS.IConnectionCallback;

	let args = Array.prototype.slice.apply(arguments);
	Helpers.selectArgs(args, function (type, arg) {
		switch (type) {
			case 'function':
				cb = arg;
				break
		}
	});
	args = args.filter((x: any) => x !== cb);

	const syncResponse = Utilities.exposeErrAndResultFromSyncMethod<FxOrmNS.ORMLike>(connectSync, args);

	let orm: FxOrmNS.ORMLike = null;
	if (syncResponse.error)
		orm = Utilities.ORM_Error(syncResponse.error, cb);
	else
		orm = syncResponse.result;

	Utilities.throwErrOrCallabckErrResult(syncResponse, {
		// no throw it, it could be processed with event handler
		no_throw: true,
		callback: cb
	});

	process.nextTick(() => {
		orm.emit("connect", syncResponse.error, !syncResponse.error ? orm : null);
	});

	return orm;
};

const ORM = function (
	this: FxOrmNS.ORM, driver_name: string, driver: FxOrmDMLDriver.DMLDriver, settings: FxOrmSettings.SettingInstance
) {
	this.validators  = validators;
	this.enforce     = Enforces;
	this.settings    = settings;
	this.driver_name = driver_name;
	this.driver      = driver;
	this.driver.uid  = uuid.node().hex();
	this.tools       = {...SqlQuery.comparators};
	this.models      = {};
	this.plugins     = [];
	this.customTypes = {};

	events.EventEmitter.call(this);

	var onError = function (err: Error) {
		if (this.settings.get("connection.reconnect")) {
			if (typeof this.driver.reconnect === "undefined") {
				return this.emit("error", new ORMError("Connection lost - driver does not support reconnection", 'CONNECTION_LOST'));
			}
			this.driver.reconnect(function () {
				this.driver.on("error", onError);
			}.bind(this));

			if (this.listeners("error").length === 0) {
				// since user want auto reconnect,
				// don't emit without listeners or it will throw
				return;
			}
		}
		this.emit("error", err);
	}.bind(this);

	driver.on("error", onError);

	this.use(ormPluginSyncPatch);
} as any as FxOrmNS.ORMConstructor;

util.inherits(ORM, events.EventEmitter);

ORM.prototype.use = function (
	this: FxOrmNS.ORM,
	plugin_const,
	opts
) {
	if (typeof plugin_const === "string") {
		try {
			plugin_const = require(Utilities.getRealPath(plugin_const));
		} catch (e) {
			throw e;
		}
	}

	var plugin: FxOrmNS.Plugin = plugin_const(this, opts || {});

	if (typeof plugin.define === "function") {
		for (let k in this.models) {
			plugin.define(this.models[k], this);
		}
	}

	this.plugins.push(plugin);

	return this;
};
ORM.prototype.define = function (
	this: FxOrmNS.ORM,
	name, properties, opts
) {
	properties = properties || {};
	opts       = opts || <FxOrmModel.ModelOptions>{};

	for (let i = 0; i < this.plugins.length; i++) {
		if (typeof this.plugins[i].beforeDefine === "function") {
			this.plugins[i].beforeDefine(name, properties, opts);
		}
	}

	this.models[name] = new Model({
		name		   : name,
		db             : this,
		settings       : this.settings,
		driver_name    : this.driver_name,
		driver         : this.driver,
		table          : opts.table || opts.collection || ((this.settings.get("model.namePrefix") || "") + name),
		// not standard FxOrmProperty.NormalizedPropertyHash here, but we should pass it firstly
		properties     : properties as FxOrmProperty.NormalizedPropertyHash,
		__for_extension: opts.__for_extension || false,
		indexes        : opts.indexes || [],
		identityCache  : opts.hasOwnProperty("identityCache") ? opts.identityCache : this.settings.get("instance.identityCache"),
		keys           : opts.id,
		autoSave       : opts.hasOwnProperty("autoSave") ? opts.autoSave : this.settings.get("instance.autoSave"),
		autoFetch      : opts.hasOwnProperty("autoFetch") ? opts.autoFetch : this.settings.get("instance.autoFetch"),
		autoFetchLimit : opts.autoFetchLimit || this.settings.get("instance.autoFetchLimit"),
		cascadeRemove  : opts.hasOwnProperty("cascadeRemove") ? opts.cascadeRemove : this.settings.get("instance.cascadeRemove"),
		hooks          : opts.hooks || {},
		methods        : opts.methods || {},
		validations    : opts.validations || {},
		ievents		   : opts.ievents || {},

		instanceCacheSize : opts.hasOwnProperty("instanceCacheSize") ? opts.instanceCacheSize : this.settings.get("instance.cacheSize"),
	});

	for (let i = 0; i < this.plugins.length; i++) {
		if (typeof this.plugins[i].define === "function") {
			this.plugins[i].define(this.models[name], this);
		}
	}

	return this.models[name];
};
ORM.prototype.defineType = function (
	this: FxOrmNS.ORM,
	name, opts
) {
	this.customTypes[name] = opts;
	this.driver.customTypes[name] = opts;
	return this;
};

ORM.prototype.pingSync = function (
	this: FxOrmNS.ORM,
) {
	this.driver.ping();
}
ORM.prototype.ping = function (
	this: FxOrmNS.ORM,
	cb?
) {
	this.driver.ping(cb);

	return this;
};

ORM.prototype.closeSync = function (
	this: FxOrmNS.ORM,
) {
	this.driver.close()
}
ORM.prototype.close = function (
	this: FxOrmNS.ORM,
	cb?
) {
	const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(this.closeSync, [], { thisArg: this});
	Utilities.throwErrOrCallabckErrResult(syncResponse, { callback: cb });
	return this;
};

ORM.prototype.load = function (
	this: FxOrmNS.ORM
) {
	var files = util.flatten(Array.prototype.slice.apply(arguments));
	var cb    = function (err?: Error) {};

	if (typeof files[files.length - 1] == "function") {
		cb = files.pop();
	}

	var loadNext = function () {
		if (files.length === 0) {
			return cb(null);
		}

		var file = files.shift();

		try {
			return require(Utilities.getRealPath(file, 4))(this, function (err: FxOrmError.ExtendedError) {
				if (err) return cb(err);

				return loadNext();
			});
		} catch (ex) {
			return cb(ex);
		}
	}.bind(this);

	return loadNext();
};
ORM.prototype.syncSync = function (
	this: FxOrmNS.ORM,
): void {
	var modelIds = Object.keys(this.models);

	if (modelIds.length === 0)
		return ;
		
	modelIds.forEach(modelId => {
		this.models[modelId].syncSync()
	})
};
ORM.prototype.sync = function (
	this: FxOrmNS.ORM,
	cb?
) {
	const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(this.syncSync, [], { thisArg: this })
	Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: !!cb, callback: cb })

	return this;
};

ORM.prototype.dropSync = function (
	this: FxOrmNS.ORM,
): void {
	var modelIds = Object.keys(this.models);

	if (modelIds.length === 0)
		return ;
		
	modelIds.forEach(modelId => {
		this.models[modelId].dropSync()
	})
};
ORM.prototype.drop = function (
	this: FxOrmNS.ORM,
	cb?
) {
	const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(this.dropSync, [], { thisArg: this })
	Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: !!cb, callback: cb })

	return this;
};
ORM.prototype.queryParamCastserial = function (
	this: FxOrmNS.ORM,
	...chains: any[]
) {
	return {
		get: function (cb: FibOrmNS.GenericCallback<any[]>) {
			var params: any[] = [];
			var getNext = function () {
				if (params.length === chains.length) {
					params.unshift(null);
					return cb.apply(null, params);
				}

				chains[params.length].run(function (err: Error, instances: any[]) {
					if (err) {
						params.unshift(err);
						return cb.apply(null, params);
					}

					params.push(instances);
					return getNext();
				});
			};

			getNext();

			return this;
		}
	};
};
ORM.prototype.begin = function (
	this: FxOrmNS.ORM,
) {
	return this.driver.db.conn.begin();	
};
ORM.prototype.commit = function (
	this: FxOrmNS.ORM,
) {
	return this.driver.db.conn.commit();	
};
ORM.prototype.rollback = function (
	this: FxOrmNS.ORM,
) {
	return this.driver.db.conn.rollback();	
};
ORM.prototype.trans = function (
	this: FxOrmNS.ORM,
	func,
) {
	func = func.bind(this.driver.db.conn);
	return this.driver.db.conn.trans(func);	
};

const ORM_Module: FxOrmNS.ExportModule = {
	validators,
	Settings,
	singleton,
	Property,
	Helpers,

	Text: SqlQuery.Text,
	...SqlQuery.comparators,

	enforce: Enforces,
	settings: SettingsInstance,
	ErrorCodes: ORMError.codes,
	addAdapter: adapters.add,
	use,
	connect,
	connectSync
} as any

export = ORM_Module