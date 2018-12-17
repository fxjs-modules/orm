export = function ChainInstance(chain: FibOrmNS.IChainFindInstance, cb: Function): FibOrmNS.IChainFindInstance|any {
	let instances = null;
	let loading   = false;
	const queue: {hwd: Function, args?: any}[] = [];

	var load = function () {
		loading = true;
		chain.run(function (err, items) {
			instances = items;

			return next();
		});
	};
	var promise = function(hwd: Function) {
		return function (...args: any[]) {
			if (!loading) {
				load();
			}

			queue.push({ hwd: hwd, args });

			return calls;
		};
	};
	var next = function () {
		if (queue.length === 0) return;

		var item = queue.shift();

		item.hwd.apply(calls, item.args);
	};
	var calls = {
		_each: promise(function (cb: Function) {
			instances.forEach(cb);

			return next();
		}),
		filter: promise(function (cb: Function) {
			instances = instances.filter(cb);

			return next();
		}),
		sort: promise(function (cb: Function) {
			instances.sort(cb);

			return next();
		}),
		count: promise(function (cb: Function) {
			cb(instances.length);

			return next();
		}),
		get: promise(function (cb: Function) {
			cb(instances);

			return next();
		}),
		save: promise(function (cb: Function) {
			var saveNext = function (i: number) {
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

	if (typeof cb === "function") {
		return calls._each(cb);
	}
	return calls;
}
