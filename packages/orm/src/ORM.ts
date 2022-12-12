import util           = require("util");
import events         = require("events");
import uuid			  = require('uuid')

import SqlQuery       = require("@fxjs/sql-query");
import ormPluginSyncPatch from './Patch/plugin'

import { Model }      from "./Model";
import ORMError from "./Error";
import Utilities      = require("./Utilities");
import Enforces = require("@fibjs/enforce");

import type { FxOrmNS } from "./Typo/ORM";
import type { FxOrmError } from "./Typo/Error";
import type { FxOrmCommon } from "./Typo/_common";
import type { FxOrmDMLDriver } from "./Typo/DMLDriver";
import type { FxOrmCoreCallbackNS } from "@fxjs/orm-core";
import type { FxOrmModel } from "./Typo/model";
import type { FxOrmProperty } from "./Typo/property";
import type { FxOrmSettings } from "./Typo/settings";

import * as validators from "./Validators";

import * as Settings from "./Settings";

export class ORM extends events.EventEmitter implements FxOrmNS.ORM {
	validators: FxOrmNS.ORM['validators'];
	enforce: FxOrmNS.ORM['enforce'];
	settings: FxOrmNS.ORM['settings'];
	driver_name: FxOrmNS.ORM['driver_name'];
	driver: FxOrmNS.ORM['driver'];
	comparators: FxOrmNS.ORM['comparators'];
	models: FxOrmNS.ORM['models'];
	plugins: FxOrmNS.ORM['plugins'];
	customTypes: FxOrmNS.ORM['customTypes'];

	constructor (
		driver_name: string,
		driver: FxOrmDMLDriver.DMLDriver,
		settings: FxOrmSettings.SettingInstance
	) {
		super();

		this.validators  = validators;
		this.enforce     = Enforces;
		this.settings    = settings;
		this.driver_name = driver_name;
		this.driver      = driver;
		this.driver.uid  = uuid.node().hex();
		this.comparators       = {...SqlQuery.comparators};
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
	}

	use (...[
		plugin_const,
		opts
	]: Parameters<FxOrmNS.ORM['use']>) {
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
	define (...[
		name, properties, opts
	]: Parameters<FxOrmNS.ORM['define']>) {
		properties = properties || {};
		opts       = opts || <FxOrmModel.ModelDefineOptions>{};
	
		for (let i = 0; i < this.plugins.length; i++) {
			// TODO: only pass normalized properties to beforeDefine
			if (typeof this.plugins[i].beforeDefine === "function") {
				this.plugins[i].beforeDefine(name, properties, opts);
			}
		}
	
		const m_settings = opts.useSelfSettings ? Settings.Container(this.settings.get('*')) : this.settings;

		const virtualView = Utilities.normalizeVirtualViewOption(opts.virtualView, this.driver.knex);

		const modelTable = opts.table || opts.collection || ((m_settings.get("model.namePrefix") || "") + name);

		const generateSqlSelect = Utilities.__wrapTableSourceAsGneratingSqlSelect(
			{
				virtualView,
				customSelect: opts.customSelect,
				generateSqlSelect: opts.generateSqlSelect,
			}, {
				dialect: this.driver.query.Dialect,
				modelTable,
			}
		);

		this.models[name] = new Model({
			name		   	: name,
			db             	: this,
			settings       	: m_settings,
			driver_name    	: this.driver_name,
			driver         	: this.driver,
			table          	: opts.table || opts.collection || ((m_settings.get("model.namePrefix") || "") + name),
			tableComment   	: opts.tableComment || '',
			virtualView		: virtualView,
			generateSqlSelect,
			// not standard Record<string, FxOrmProperty.NormalizedProperty> here, but we should pass it firstly
			properties     	: properties as Record<string, FxOrmProperty.NormalizedProperty>,
			__for_extension	: opts.__for_extension || false,
			indexes        	: opts.indexes || [],
			identityCache  	: opts.hasOwnProperty("identityCache") ? opts.identityCache : m_settings.get("instance.identityCache"),
			keys           	: opts.id,
			autoSave       	: opts.hasOwnProperty("autoSave") ? opts.autoSave : m_settings.get("instance.autoSave"),
			autoFetch      	: opts.hasOwnProperty("autoFetch") ? opts.autoFetch : m_settings.get("instance.autoFetch"),
			autoFetchLimit 	: opts.autoFetchLimit || m_settings.get("instance.autoFetchLimit"),
			cascadeRemove  	: opts.hasOwnProperty("cascadeRemove") ? opts.cascadeRemove : m_settings.get("instance.cascadeRemove"),
			hooks          	: opts.hooks || {},
			methods        	: opts.methods || {},
			validations    	: opts.validations || {},
			ievents		   	: opts.ievents || {},
	
			instanceCacheSize : opts.hasOwnProperty("instanceCacheSize") ? opts.instanceCacheSize : m_settings.get("instance.cacheSize"),
		});
	
		for (let i = 0; i < this.plugins.length; i++) {
			if (typeof this.plugins[i].define === "function") {
				this.plugins[i].define(this.models[name], this);
			}
		}

		return this.models[name] as any;
	};

	defineType (...[name, opts]: Parameters<FxOrmNS.ORM['defineType']>) {
		this.customTypes[name] = opts;
		this.driver.customTypes[name] = opts;
		return this;
	};

	pingSync () {
		this.driver.ping();
	};

	ping (...[cb]: Parameters<FxOrmNS.ORM['ping']>) {
		this.driver.ping(cb);
	
		return this;
	};

	closeSync () {
		this.driver.close()
	}
	close (...[cb]: Parameters<FxOrmNS.ORM['close']>) {
		const syncResponse = Utilities.catchBlocking(this.closeSync, [], { thisArg: this});
		Utilities.takeAwayResult(syncResponse, { callback: cb });
		return this;
	};
	load () {
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
	syncSync (): void {
		var modelIds = Object.keys(this.models);
	
		if (modelIds.length === 0)
			return ;
			
		modelIds.forEach(modelId => {
			this.models[modelId].syncSync()
		})
	};
	
	sync (...[cb]: Parameters<FxOrmNS.ORM['sync']>) {
		const syncResponse = Utilities.catchBlocking(this.syncSync, [], { thisArg: this })
		Utilities.takeAwayResult(syncResponse, { no_throw: !!cb, callback: cb })
	
		return this;
	};
	dropSync (): void {
		var modelIds = Object.keys(this.models);
	
		if (modelIds.length === 0)
			return ;
			
		modelIds.forEach(modelId => {
			this.models[modelId].dropSync()
		})
	};

	drop (...[cb]: Parameters<FxOrmNS.ORM['drop']>) {
		const syncResponse = Utilities.catchBlocking(this.dropSync, [], { thisArg: this })
		Utilities.takeAwayResult(syncResponse, { no_throw: !!cb, callback: cb })
	
		return this;
	};

	queryParamCastserial (...chains: any[]) {
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

	begin () {
		return this.driver.db.connection.begin();	
	};
	commit () {
		return this.driver.db.connection.commit();	
	};
	rollback () {
		return this.driver.db.connection.rollback();	
	};
	trans<T> (func: FxOrmCoreCallbackNS.ExecutionCallback<T>) {
		const connection = this.driver.db.connection;
		return connection.trans(func.bind(connection));	
	};
}