import util           = require("util");
import events         = require("events");
import uuid			  = require('uuid')

import { FxDbDriverNS, IDbDriver } from "@fxjs/db-driver";

import SqlQuery       = require("@fxjs/sql-query");
import ormPluginSyncPatch from './Patch/plugin'

import { Model }      from "./Model";
import adapters       = require("./Adapters");
import ORMError       = require("./Error");
import Utilities      = require("./Utilities");

import type { FxOrmNS } from "./Typo/ORM";
import type { FxOrmDb } from "./Typo/Db";
import type { FxOrmError } from "./Typo/Error";
import type { FxOrmCommon } from "./Typo/_common";
import type { FxOrmDMLDriver } from "./Typo/DMLDriver";
import type { FxOrmCoreCallbackNS } from "@fxjs/orm-core";
import type { FxOrmModel } from "./Typo/model";
import type { FxOrmProperty } from "./Typo/property";
import type { FxOrmSettings } from "./Typo/settings";


export import Helpers      = require("./Helpers");

import Enforces   	  = require("@fibjs/enforce");
/**
 * @deprecated
 */
export import validators 	  = require("./Validators");

export import Settings       = require("./Settings");
export import singleton      = require("./Singleton");

// @deprecated : start
export const Text = SqlQuery.Text;
export const between = SqlQuery.comparators.between;
export const not_between = SqlQuery.comparators.not_between;
export const like = SqlQuery.comparators.like;
export const not_like = SqlQuery.comparators.not_like;
export const eq = SqlQuery.comparators.eq;
export const ne = SqlQuery.comparators.ne;
export const gt = SqlQuery.comparators.gt;
export const gte = SqlQuery.comparators.gte;
export const lt = SqlQuery.comparators.lt;
export const lte = SqlQuery.comparators.lte;
module.exports.in = SqlQuery.comparators.in;
export const not_in = SqlQuery.comparators.not_in;
// @deprecated : end

export const enforce = Enforces;

const SettingsInstance = Settings.Container(Settings.defaults());
export const settings = SettingsInstance;

export import Property   = require("./Property");

export function use(
	connection: FxOrmDb.Database,
	proto: string,
	opts: FxOrmNS.IUseOptions,
	cb: (err: Error, db?: FxOrmNS.ORM) => void
): any {
	if (typeof opts === "function") {
		cb = opts;
		opts = <FxOrmNS.IUseOptions>{};
	}

	try {
		const DMLDriver   = adapters.get(proto);
		const settings = Settings.Container(SettingsInstance.get('*'));
		const driver   = new DMLDriver(null, connection, {
			debug    : (opts.query && opts.query.debug === 'true'),
			settings : settings
		});

		return cb(null, new ORM(proto, driver, settings));
	} catch (err) {
		return cb(err);
	}
};

function isOrmLikeErrorEmitter (parsedDBDriver: IDbDriver | FxOrmNS.ORMLike): parsedDBDriver is FxOrmNS.ORMLike {
	return !parsedDBDriver.hasOwnProperty('host') && parsedDBDriver instanceof events.EventEmitter
}

export function connectSync(opts?: string | FxDbDriverNS.DBConnectionConfig): FxOrmNS.ORMLike {
	Helpers.selectArgs(arguments, function (type, arg) {
		switch (type) {
			default:
				opts = arg;
				break
		}
	});

	const dbdriver = Helpers.buildDbDriver(opts);

	/**
	 * @pointless
	 */
	if (isOrmLikeErrorEmitter(dbdriver)) {
        const errWaitor = Utilities.getErrWaitor(true);
        dbdriver.on('connect', (err: FxOrmError.ExtendedError) => {
            errWaitor.err = err;
            errWaitor.evt.set();
        });
        errWaitor.evt.wait();
        
        if (errWaitor.err)
            throw errWaitor.err;

        return dbdriver;
	}
	
	let adapterName = dbdriver.config.protocol.replace(/:$/, '');
	let orm: FxOrmNS.ORM;

	const syncResult = Utilities.catchBlocking(() => {
		const DMLDriver = adapters.get(adapterName);
		const settings = Settings.Container(SettingsInstance.get('*'));
		const driver   = new DMLDriver(dbdriver.uri as any, null, {
			debug    : dbdriver.extend_config.debug ? dbdriver.extend_config.debug : settings.get("connection.debug"),
			pool     : dbdriver.extend_config.pool ? dbdriver.extend_config.pool  : settings.get("connection.pool"),
			settings : settings
		});

		driver.connect();

		orm = new ORM(adapterName, driver, settings);

		return orm;
	});

	if (syncResult.error && Utilities.isDriverNotSupportedError(syncResult.error)) {
		syncResult.error = new ORMError("Connection protocol not supported - have you installed the database driver for " + adapterName + "?", 'NO_SUPPORT');
	}

	Utilities.takeAwayResult(syncResult, { no_throw: false });

	return orm;
}

export function connect <T extends IDbDriver.ISQLConn = any> (
	uri?: string | FxDbDriverNS.DBConnectionConfig,
	cb?: FxOrmCoreCallbackNS.ExecutionCallback<IDbDriver<T>>
): FxOrmNS.ORMLike {

	let args = Array.prototype.slice.apply(arguments);
	Helpers.selectArgs(args, function (type, arg) {
		switch (type) {
			case 'function':
				cb = arg;
				break
		}
	});
	args = args.filter((x: any) => x !== cb);

	const syncResponse = Utilities.catchBlocking<FxOrmNS.ORMLike>(connectSync, args);

	let orm: FxOrmNS.ORMLike = null;
	if (syncResponse.error)
		orm = Utilities.ORM_Error(syncResponse.error, cb);
	else
		orm = syncResponse.result;

	Utilities.takeAwayResult(syncResponse, {
		// no throw it, it could be processed with event handler
		no_throw: true,
		callback: cb
	});

	process.nextTick(() => {
		orm.emit("connect", syncResponse.error, !syncResponse.error ? orm : null);
	});

	return orm;
};

export const ORM = function (
	this: FxOrmNS.ORM,
	driver_name: string,
	driver: FxOrmDMLDriver.DMLDriver,
	settings: FxOrmSettings.SettingInstance
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

	var onError = (err: Error) => {
		if (this.settings.get("connection.reconnect")) {
			if (typeof this.driver.reconnect === "undefined") {
				return this.emit("error", new ORMError("Connection lost - driver does not support reconnection", 'CONNECTION_LOST'));
			}
			this.driver.reconnect(() => {
				this.driver.on("error", onError);
			});

			if (this.listeners("error").length === 0) {
				// since user want auto reconnect,
				// don't emit without listeners or it will throw
				return;
			}
		}
		this.emit("error", err);
	};

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

	const m_settings = opts.useSelfSettings ? Settings.Container(this.settings.get('*')) : this.settings;

	this.models[name] = new Model({
		name		   : name,
		db             : this,
		settings       : m_settings,
		driver_name    : this.driver_name,
		driver         : this.driver,
		table          : opts.table || opts.collection || ((m_settings.get("model.namePrefix") || "") + name),
		// not standard Record<string, FxOrmProperty.NormalizedProperty> here, but we should pass it firstly
		properties     : properties as Record<string, FxOrmProperty.NormalizedProperty>,
		__for_extension: opts.__for_extension || false,
		indexes        : opts.indexes || [],
		identityCache  : opts.hasOwnProperty("identityCache") ? opts.identityCache : m_settings.get("instance.identityCache"),
		keys           : opts.id,
		autoSave       : opts.hasOwnProperty("autoSave") ? opts.autoSave : m_settings.get("instance.autoSave"),
		autoFetch      : opts.hasOwnProperty("autoFetch") ? opts.autoFetch : m_settings.get("instance.autoFetch"),
		autoFetchLimit : opts.autoFetchLimit || m_settings.get("instance.autoFetchLimit"),
		cascadeRemove  : opts.hasOwnProperty("cascadeRemove") ? opts.cascadeRemove : m_settings.get("instance.cascadeRemove"),
		hooks          : opts.hooks || {},
		methods        : opts.methods || {},
		validations    : opts.validations || {},
		ievents		   : opts.ievents || {},

		instanceCacheSize : opts.hasOwnProperty("instanceCacheSize") ? opts.instanceCacheSize : m_settings.get("instance.cacheSize"),
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
	const syncResponse = Utilities.catchBlocking(this.closeSync, [], { thisArg: this});
	Utilities.takeAwayResult(syncResponse, { callback: cb });
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
	const syncResponse = Utilities.catchBlocking(this.syncSync, [], { thisArg: this })
	Utilities.takeAwayResult(syncResponse, { no_throw: !!cb, callback: cb })

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
	const syncResponse = Utilities.catchBlocking(this.dropSync, [], { thisArg: this })
	Utilities.takeAwayResult(syncResponse, { no_throw: !!cb, callback: cb })

	return this;
};
ORM.prototype.queryParamCastserial = function (
	this: FxOrmNS.ORM,
	...chains: any[]
) {
	return {
		get: function (cb: FxOrmCommon.GenericCallback<any[]>) {
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
	return this.driver.db.connection.begin();	
};
ORM.prototype.commit = function (
	this: FxOrmNS.ORM,
) {
	return this.driver.db.connection.commit();	
};
ORM.prototype.rollback = function (
	this: FxOrmNS.ORM,
) {
	return this.driver.db.connection.rollback();	
};
ORM.prototype.trans = function (
	this: FxOrmNS.ORM,
	func,
) {
	const connection = this.driver.db.connection;
	return connection.trans(func.bind(connection));	
};

export type ORMInstance = FxOrmNS.ORM

export const ErrorCodes = ORMError.codes;
export const addAdapter = adapters.add;