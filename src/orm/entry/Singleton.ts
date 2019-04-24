/**
 * refactor this module with LRUCache
 */

let map: {[k: string]: any} = {};

export const clear: FxOrmNS.SingletonModule['clear'] = function (key?: string) {
	if (typeof key === "string") {
		delete map[key];
	} else {
		map = {};
	}
	return this;
};

// syncify
export const get: FxOrmNS.SingletonModule['get'] = function (key, opts, reFetchSync) {
	/**
	 * @description when don't identity cache
	 */
	if (opts && opts.identityCache === false)
		return reFetchSync();

	if (map.hasOwnProperty(key)) {
		if (opts && opts.saveCheck && typeof map[key].o.saved === "function" && !map[key].o.saved())
			// if not saved, don't return it, fetch original from db
			return reFetchSync();
		
		if (map[key].t !== null && map[key].t <= Date.now()) {
			delete map[key];
		} else {
			return map[key].o;
		}
	}

	map[key] = {
		// object
		o : reFetchSync(),
		// timeout
		t : (opts && typeof opts.identityCache === "number" ? Date.now() + (opts.identityCache * 1000) : null)
	};
	return map[key].o;
};
