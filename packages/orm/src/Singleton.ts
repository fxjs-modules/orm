import type { FxOrmNS } from "./Typo/ORM";
import type { FxOrmModel } from "./Typo/model";

import * as Helpers from "./Helpers";
import coroutine = require("coroutine");

/**
 * refactor this module with LRUCache
 */
const models: {[driver_table_uid: string]: FxOrmModel.Model} = {};

export const clear: FxOrmNS.SingletonModule['clear'] = function (key?: string) {
	let driver_table_uid2 = '';
	if (key && typeof key === 'string')
		driver_table_uid2 = Helpers.parseDriverUidAndTableNameFromUID(key).driver_table_uid;

	Object.values(models).forEach(model => {
		const { driver_table_uid: driver_table_uid1 } = Helpers.parseDriverUidAndTableNameFromUID(model.uid);

		if (driver_table_uid2 && driver_table_uid2 !== driver_table_uid1)
			return 

		modelClear(model, key)
	});
	return this;
};

export const modelClear: FxOrmNS.SingletonModule['modelClear'] = function (model: FxOrmModel.Model, key?: string) {
	if (key && typeof key === "string") {
		model.caches.delete(key);
	} else {
		model.caches.clear();
	}
	return this;
};

// synchronous get
export const get: FxOrmNS.SingletonModule['get'] = function (key, opts, reFetchSync) {
	const { driver_table_uid } = Helpers.parseDriverUidAndTableNameFromUID(key);
	
	return modelGet(models[driver_table_uid], key, opts, reFetchSync);
};

export const modelGet: FxOrmNS.SingletonModule['modelGet'] = function (model, key, opts, reFetchSync) {
	if (opts.identityCache === false)
		return reFetchSync();

	var value = model.caches.get(key);

	if (value !== undefined)
	{
		if (opts && opts.saveCheck && typeof value.saved === "function" && !value.saved())
			// if not saved, don't return it, fetch original from db
			return reFetchSync();
	}else
	{
		value = reFetchSync();
		model.caches.set(key, value);
	}
		
	const expected_expire = typeof opts.identityCache === "number" ? (opts.identityCache * 1000) : model.caches.timeout;
	const expire_expection_delta = expected_expire - model.caches.timeout;

	if (expire_expection_delta > 0) {
		coroutine.start(() => {
			while (true) {
				// quit when cached key-value has not been here
				if (!model.caches.has(key))
					break ;
				
				model.caches.set(key, value);
				if (expected_expire > Date.now()) {
					model.caches.delete(key)
					break
				}
			}
		});

	} else if (expire_expection_delta < 0) {
		setTimeout(() => model.caches.delete(key), expected_expire);
	}

	return value;
}
