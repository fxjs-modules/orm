import * as Utilities from "./Utilities";
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
		model.caches.remove(key);
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
	const { driver_table_uid } = Helpers.parseDriverUidAndTableNameFromUID(key);

	if (!models[driver_table_uid])
		models[driver_table_uid] = model;
	
	if (opts.identityCache === false)
		return reFetchSync();

	if (model.caches.has(key))
		if (opts && opts.saveCheck && typeof model.caches.get(key).saved === "function" && !model.caches.get(key).saved())
			// if not saved, don't return it, fetch original from db
			return reFetchSync();
	
	const value = model.caches.get(key, function (_key: string) {
		const new_value = reFetchSync();
		model.caches.set(_key, new_value);

		return new_value;
	});
	
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
					model.caches.remove(key)
					break
				}
			}
		});

	} else if (expire_expection_delta < 0) {
		setTimeout(() => model.caches.remove(key), expected_expire);
	}

	return value;
}
