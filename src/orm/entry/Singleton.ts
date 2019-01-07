let map = {};

export function clear (key?: string) {
	if (typeof key === "string") {
		delete map[key];
	} else {
		map = {};
	}
	return this;
};

export function get (
	key: string,
	opts: FibOrmNS.SingletonOptions,
	createCb: FxOrmNS.SuccessCallback<FxOrmNS.GenericCallback<FxOrmInstance.Instance>>,
	returnCb: FxOrmNS.GenericCallback<FxOrmInstance.Instance>
) {
	/**
	 * @description when dont identity cache
	 */
	if (opts && opts.identityCache === false)
		return createCb(returnCb);

	if (map.hasOwnProperty(key)) {
		if (opts && opts.saveCheck && typeof map[key].o.saved === "function" && !map[key].o.saved()) {
			// if not saved, don't return it, fetch original from db
			return createCb(returnCb);
		} else if (map[key].t !== null && map[key].t <= Date.now()) {
			delete map[key];
		} else  {
			return returnCb(null, map[key].o);
		}
	}

	createCb(function (err: Error, value: any) {
		if (err) return returnCb(err);

		map[key] = {
			// object , timeout
			o : value,
			t : (opts && typeof opts.identityCache === "number" ? Date.now() + (opts.identityCache * 1000) : null)
		};
		return returnCb(null, map[key].o);
	});
};
