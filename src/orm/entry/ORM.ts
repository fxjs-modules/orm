import util           = require("util");
import events         = require("events");
import url            = require("url");
import hat            = require("hat");
import Query          = require("@fxjs/sql-query");
import _              = require("lodash");

import { Model }      from "./Model";
import DriverAliases  = require("./Drivers/aliases");
import adapters       = require("./Adapters");
import ORMError       = require("./Error");
import Utilities      = require("./Utilities");

import Enforces   = require("@fibjs/enforce");
// Deprecated, use enforce
import validators = require("./Validators");

import Settings       = require("./Settings");
import singleton      = require("./Singleton");


const SettingsInstance = Settings.Container(Settings.defaults());

import Property   = require("./Property");

function use (connection, proto, opts, cb) {
	if (DriverAliases[proto]) {
		proto = DriverAliases[proto];
	}
	if (typeof opts === "function") {
		cb = opts;
		opts = {};
	}

	try {
		var Driver   = adapters.get(proto);
		var settings = Settings.Container(SettingsInstance.get('*'));
		var driver   = new Driver(null, connection, {
			debug    : (opts.query && opts.query.debug === 'true'),
			settings : settings
		});

		return cb(null, new ORM(proto, driver, settings));
	} catch (ex) {
		return cb(ex);
	}
};

function connect () {
	let opts = arguments[0],
		cb = arguments[1]
	if (arguments.length === 0 || !opts) {
		return ORM_Error(new ORMError("CONNECTION_URL_EMPTY", 'PARAM_MISMATCH'), cb);
	}
	if (typeof opts == 'string') {
		if (opts.trim().length === 0) {
			return ORM_Error(new ORMError("CONNECTION_URL_EMPTY", 'PARAM_MISMATCH'), cb);
		}
		opts = url.parse(opts, true);
	} else if (typeof opts == 'object') {
		opts = _.cloneDeep(opts);
	}

	opts.query = opts.query || {};

	for(var k in opts.query) {
		opts.query[k] = queryParamCast(opts.query[k]);
		opts[k] = opts.query[k];
	}

	if (!opts.database) {
		// if (!opts.pathname) {
		// 	return cb(new Error("CONNECTION_URL_NO_DATABASE"));
		// }
		opts.database = (opts.pathname ? opts.pathname.substr(1) : "");
	}
	if (!opts.protocol) {
		return ORM_Error(new ORMError("CONNECTION_URL_NO_PROTOCOL", 'PARAM_MISMATCH'), cb);
	}
	// if (!opts.host) {
	// 	opts.host = opts.hostname = "localhost";
	// }
	if (opts.auth) {
		opts.user = opts.auth.split(":")[0];
		opts.password = opts.auth.split(":")[1];
	}
	if (!opts.hasOwnProperty("user")) {
		opts.user = "root";
	}
	if (!opts.hasOwnProperty("password")) {
		opts.password = "";
	}
	if (opts.hasOwnProperty("hostname")) {
		opts.host = opts.hostname;
	}

	var proto  = opts.protocol.replace(/:$/, '');
	var db;
	if (DriverAliases[proto]) {
		proto = DriverAliases[proto];
	}

	try {
		var Driver   = adapters.get(proto);
		var settings = Settings.Container(SettingsInstance.get('*'));
		var driver   = new Driver(opts, null, {
			debug    : 'debug' in opts.query ? opts.query.debug : settings.get("connection.debug"),
			pool     : 'pool'  in opts.query ? opts.query.pool  : settings.get("connection.pool"),
			settings : settings
		});

		db = new ORM(proto, driver, settings);

		driver.connect(function (err) {
			if (typeof cb === "function") {
				if (err) {
					return cb(err);
				} else {
					return cb(null, db);
				}
			}

			db.emit("connect", err, !err ? db : null);
		});
	} catch (ex) {
		if (ex.code === "MODULE_NOT_FOUND" || ex.message.indexOf('find module') > -1) {
			return ORM_Error(new ORMError("Connection protocol not supported - have you installed the database driver for " + proto + "?", 'NO_SUPPORT'), cb);
		}
		return ORM_Error(ex, cb);
	}

	return db;
};

const addAdapter = adapters.add;

function ORM(driver_name, driver, settings) {
	this.validators  = validators;
	this.enforce     = Enforces;
	this.settings    = settings;
	this.driver_name = driver_name;
	this.driver      = driver;
	this.driver.uid  = hat();
	this.tools       = {...Query.comparators};
	this.models      = {};
	this.plugins     = [];
	this.customTypes = {};

	events.EventEmitter.call(this);

	var onError = function (err) {
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
}

util.inherits(ORM, events.EventEmitter);

ORM.prototype.use = function (plugin_const, opts) {
	if (typeof plugin_const === "string") {
		try {
			plugin_const = require(Utilities.getRealPath(plugin_const));
		} catch (e) {
			throw e;
		}
	}

	var plugin = new plugin_const(this, opts || {});

	if (typeof plugin.define === "function") {
		for (var k in this.models) {
			plugin.define(this.models[k]);
		}
	}

	this.plugins.push(plugin);

	return this;
};
ORM.prototype.define = function (name, properties, opts) {
    var i;

	properties = properties || {};
	opts       = opts || {};

	for (i = 0; i < this.plugins.length; i++) {
		if (typeof this.plugins[i].beforeDefine === "function") {
			this.plugins[i].beforeDefine(name, properties, opts);
		}
	}

	this.models[name] = new Model({
		db             : this,
		settings       : this.settings,
		driver_name    : this.driver_name,
		driver         : this.driver,
		table          : opts.table || opts.collection || ((this.settings.get("model.namePrefix") || "") + name),
		properties     : properties,
		extension      : opts.extension || false,
		indexes        : opts.indexes || [],
		identityCache       : opts.hasOwnProperty("identityCache") ? opts.identityCache : this.settings.get("instance.identityCache"),
		keys           : opts.id,
		autoSave       : opts.hasOwnProperty("autoSave") ? opts.autoSave : this.settings.get("instance.autoSave"),
		autoFetch      : opts.hasOwnProperty("autoFetch") ? opts.autoFetch : this.settings.get("instance.autoFetch"),
		autoFetchLimit : opts.autoFetchLimit || this.settings.get("instance.autoFetchLimit"),
		cascadeRemove  : opts.hasOwnProperty("cascadeRemove") ? opts.cascadeRemove : this.settings.get("instance.cascadeRemove"),
		hooks          : opts.hooks || {},
		methods        : opts.methods || {},
		validations    : opts.validations || {}
	});

	for (i = 0; i < this.plugins.length; i++) {
		if (typeof this.plugins[i].define === "function") {
			this.plugins[i].define(this.models[name], this);
		}
	}

	return this.models[name];
};
ORM.prototype.defineType = function (name, opts) {
	this.customTypes[name] = opts;
	this.driver.customTypes[name] = opts;
	return this;
};
ORM.prototype.ping = function (cb) {
	this.driver.ping(cb);

	return this;
};
ORM.prototype.close = function (cb) {
	this.driver.close(cb);

	return this;
};
ORM.prototype.load = function () {
	var files = _.flatten(Array.prototype.slice.apply(arguments));
	var cb    = function (err?: Error) {};

	if (typeof files[files.length - 1] == "function") {
		cb = files.pop();
	}

	var loadNext = function () {
		if (files.length === 0) {
			return cb();
		}

		var file = files.shift();

		try {
			return require(Utilities.getRealPath(file, 4))(this, function (err) {
				if (err) return cb(err);

				return loadNext();
			});
		} catch (ex) {
			return cb(ex);
		}
	}.bind(this);

	return loadNext();
};
ORM.prototype.sync = function (cb) {
	var modelIds = Object.keys(this.models);
	var syncNext = function () {
		if (modelIds.length === 0) {
			return cb();
		}

		var modelId = modelIds.shift();

		this.models[modelId].sync(function (err) {
			if (err) {
				err.model = modelId;

				return cb(err);
			}

			return syncNext();
		});
	}.bind(this);

	if (arguments.length === 0) {
		cb = function () {};
	}

	syncNext();

	return this;
};
ORM.prototype.drop = function (cb) {
	var modelIds = Object.keys(this.models);
	var dropNext = function () {
		if (modelIds.length === 0) {
			return cb();
		}

		var modelId = modelIds.shift();

		this.models[modelId].drop(function (err) {
			if (err) {
				err.model = modelId;

				return cb(err);
			}

			return dropNext();
		});
	}.bind(this);

	if (arguments.length === 0) {
		cb = function () {};
	}

	dropNext();

	return this;
};
ORM.prototype.serial = function () {
	var chains = Array.prototype.slice.apply(arguments);

	return {
		get: function (cb) {
			var params = [];
			var getNext = function () {
				if (params.length === chains.length) {
					params.unshift(null);
					return cb.apply(null, params);
				}

				chains[params.length].run(function (err, instances) {
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

function ORM_Error(err, cb) {
	var Emitter: any = new events.EventEmitter();

	Emitter.use = Emitter.define = Emitter.sync = Emitter.load = function () {};

	if (typeof cb === "function") {
		cb(err);
	}

	process.nextTick(function () {
		Emitter.emit("connect", err);
	});

	return Emitter;
}

function queryParamCast (val) {
	if (typeof val == 'string')	{
		switch (val) {
			case '1':
			case 'true':
				return true;
			case '0':
			case 'false':
				return false;
		}
	}
	return val;
}

const mod: FxOrmNS.ExportModule = {
	validators,
	Settings,
	singleton,
	Property,

	Text: Query.Text,
	...Query.comparators,

	enforce: Enforces,
	settings: SettingsInstance,
	ErrorCodes: ORMError.codes,
	addAdapter: adapters.add,
	use,
	connect
}

export = mod