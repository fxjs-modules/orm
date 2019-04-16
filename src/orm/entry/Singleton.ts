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

export const get: FxOrmNS.SingletonModule['get'] = function (key, opts, createProcess, returnCb) {
	/**
	 * @description when dont identity cache
	 */
	if (opts && opts.identityCache === false)
		return createProcess(returnCb);

	if (map.hasOwnProperty(key)) {
		if (opts && opts.saveCheck && typeof map[key].o.saved === "function" && !map[key].o.saved()) {
			// if not saved, don't return it, fetch original from db
			return createProcess(returnCb);
		} else if (map[key].t !== null && map[key].t <= Date.now()) {
			delete map[key];
		} else {
			return returnCb(null, map[key].o);
		}
	}

	createProcess(function (err: Error, value: any) {
		if (err) return returnCb(err);

		map[key] = {
			// object , timeout
			o : value,
			t : (opts && typeof opts.identityCache === "number" ? Date.now() + (opts.identityCache * 1000) : null)
		};
		return returnCb(null, map[key].o);
	});
};
