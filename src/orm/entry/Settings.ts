/// <reference path="../../../@types/index.d.ts" />

import _cloneDeep = require('lodash.clonedeep');

const default_settings = {
	properties : {
		primary_key               : "id",
		association_key           : "{name}_{field}",
		required                  : false
	},
	instance   : {
		defaultFindLimit          : 1000,
		identityCache             : false,
		identityCacheSaveCheck    : true,
		autoSave                  : false,
		autoFetch                 : false,
		autoFetchLimit            : 1,
		cascadeRemove             : true,
		returnAllErrors           : false,
		saveAssociationsByDefault : true
	},
	hasOne     : {
		// allowRemoveReverse		  : false,
	},
	hasMany    : {
		// Makes the foreign key fields a composite key
		key                       : false
	},
	extendsTo  : {
		// would default as false in the future
		throwWhenNotFound		  : true,
	},
	connection : {
		reconnect                 : true,
		pool                      : false,
		debug                     : false
	}
};

export const defaults = function () {
	return default_settings;
};

export const Container: FxOrmSettings.SettingsContainerGenerator = function (settings) {
	return {
		set: function (key: string, value: any) {
			set(key, value, settings);

			return this;
		},
		get: function (key, def) {
			const v = get(key, def, settings)

			if (v instanceof Function) {
				return v;
			} else {
				return _cloneDeep(v);
			}
		},
		unset: function () {
			for (let i = 0; i < arguments.length; i++) {
				if (typeof arguments[i] === "string") {
					unset(arguments[i], settings);
				}
			}

			return this;
		}
	};
}

function set (key: string, value: any, obj: {[k: string]: any}): any {
	const p = key.indexOf(".");

	if (p === -1) {
		return obj[key] = value;
	}

	if (!obj.hasOwnProperty(key.substr(0, p))) {
		obj[key.substr(0, p)] = {};
	}

	return set(key.substr(p + 1), value, obj[key.substr(0, p)]);
}

function get(key: string, def: any, obj: {[k: string]: any}): any {
	const p = key.indexOf(".");

	if (p === -1) {
		if (key === '*') {
			return obj;
		}
		return obj.hasOwnProperty(key) ? obj[key] : def;
	}

	if (!obj.hasOwnProperty(key.substr(0, p))) {
		return def;
	}

	return get(key.substr(p + 1), def, obj[key.substr(0, p)]);
}

function unset(key: string, obj: any) {
	const p = key.indexOf(".");

	if (p === -1) {
		if (key === '*') {
			return 'reset';
		} else {
			delete obj[key];
		}
		return;
	}

	if (!obj.hasOwnProperty(key.substr(0, p))) {
		return;
	}

	if (unset(key.substr(p + 1), obj[key.substr(0, p)]) === 'reset') {
		obj[key.substr(0, p)] = {};
	}
}
