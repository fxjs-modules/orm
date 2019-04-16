/**
 * NOT SUPPORTED
 */
export = function ChainInstance(chain: FxOrmQuery.IChainFind, chain_cb: FxOrmQuery.IChainInstanceCallbackFn): FxOrmQuery.IChainInstance {
	let instances: FxOrmInstance.Instance[] = null;
	let loading   = false;
	const queue: {hwd: Function, args?: any[]}[] = [];

	const load = function () {
		loading = true;
		
		chain.run(function (err: FxOrmError.ExtendedError, items: FxOrmInstance.Instance[]) {
			instances = items;

			return next();
		});
	};
	
	const pushIterateeQueue = function<HDLR_TYPE>(hwd: (cb: HDLR_TYPE) => void): FxOrmQuery.IChainInstanceCallbackFn {
		return function (cb: HDLR_TYPE) {
			if (!loading) {
				load();
			}

			queue.push({ hwd: hwd, args: [cb] });

			return calls;
		};
	};
	const next = function () {
		if (queue.length === 0) return ;

		const item = queue.shift();

		return item.hwd.apply(calls, item.args);
	};
	const calls: FxOrmQuery.IChainInstance = {
		_each: pushIterateeQueue<FxOrmQuery.IChainInstanceCallbackFn>(function (cb) {
			instances.forEach(cb);

			return next();
		}),
		filter: pushIterateeQueue<FxOrmQuery.IChainInstanceCallbackFn>(function (cb) {
			instances = instances.filter(cb);

			return next();
		}),
		sort: pushIterateeQueue<(a: FxOrmInstance.Instance, b: FxOrmInstance.Instance) => number>(function (cb) {
			instances.sort(cb);

			return next();
		}),
		count: pushIterateeQueue<(count: number) => void>(function (cb) {
			cb(instances.length);

			return next();
		}),
		get: pushIterateeQueue<(instances: FxOrmInstance.Instance[]) => void>(function (cb) {
			cb(instances);

			return next();
		}),
		save: pushIterateeQueue<FxOrmNS.ExecutionCallback<FxOrmError.ExtendedError>>(function (cb) {
			const saveNext = function (i: number): any {
				if (i >= instances.length) {
					if (typeof cb === "function") {
						cb();
					}
					return next();
				}

				return instances[i].save(function (err) {
					if (err) {
						if (typeof cb === "function") {
							cb(err);
						}
						return next();
					}

					return saveNext(i + 1);
				});
			};

			return saveNext(0);
		})
	};

	if (typeof chain_cb === "function") {
		return calls._each(chain_cb);
	}
	return calls;
}
