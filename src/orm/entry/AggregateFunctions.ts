import ORMError   = require("./Error");
import Utilities  = require("./Utilities");

const AggregateFunctions: FxOrmQuery.AggregateConstructor = function (
	this: FxOrmQuery.IAggregated,
	opts: FxOrmQuery.AggregateConstructorOptions
) {
	if (typeof opts.driver.getQuery !== "function") {
		throw new ORMError('NO_SUPPORT', "This driver does not support aggregate functions");
	}
	if (!Array.isArray(opts.driver.aggregate_functions)) {
		throw new ORMError('NO_SUPPORT', "This driver does not support aggregate functions");
	}

	const aggregates: [ FxSqlQuerySql.SqlSelectFieldsDescriptor[] ]    = [ [] ];
	let group_by: string[]      = null;
	let used_distinct 			= false;

	const appendFunction = function (fun: string) {
		return function () {
			// select 1st array as aargs
			var args: string | '*' = (arguments.length && Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.apply(arguments));

			if (args.length > 0) {
				aggregates[aggregates.length - 1].push({ f: fun, a: args, alias: aggregateAlias(fun, args) });
				aggregates.push([]);
			} else {
				aggregates[aggregates.length - 1].push({ f: fun, alias: aggregateAlias(fun, args) });
			}

			if (fun === "distinct") {
				used_distinct = true;
			}

			return proto;
		};
	};
	const proto: FxOrmQuery.IAggregated = {
		groupBy: function (...columns: string[]) {
			group_by = columns;
			return this;
		},
		limit: function (offset: number, limit?: number) {
			if (typeof limit === "number") {
				opts.limit = [ offset, limit ];
			} else {
				opts.limit = [ 0, offset ]; // offset = limit
			}
			return this;
		},
		order: function (...orders: string[]) {
			opts.order = Utilities.standardizeOrder(orders);
			return this;
		},
		select: function (...columns: (string|string[])[]) {
			if (columns.length === 0) {
				throw new ORMError('PARAM_MISMATCH', "When using append you must at least define one property");
			}
			if (Array.isArray(columns[0])) {
				opts.propertyList = opts.propertyList.concat(columns[0] as string[]);
			} else {
				opts.propertyList = opts.propertyList.concat(Array.prototype.slice.apply(arguments));
			}
			return this;
		},
		as: function (alias) {
			if (!aggregates.length || (aggregates.length === 1 && aggregates[0].length === 0)) {
				throw new ORMError('PARAM_MISMATCH', "No aggregate functions defined yet");
			}

			var len = aggregates.length;

			aggregates[len - 1][
				aggregates[len - 1].length - 1
			].alias = alias;

			return this;
		},
		call: function (fun, args) {
			if (args && args.length > 0) {
				aggregates[aggregates.length - 1].push({ f: fun, a: args, alias: aggregateAlias(fun, args) });
				// aggregates.push([]);
			} else {
				aggregates[aggregates.length - 1].push({ f: fun, alias: aggregateAlias(fun, args) });
			}

			if (fun.toLowerCase() === "distinct") {
				used_distinct = true;
			}

			return this;
		},
		get: function <T>(cb: FxOrmNS.GenericCallback<T[]>) {
			if (typeof cb !== "function") {
				throw new ORMError('MISSING_CALLBACK', "You must pass a callback to Model.aggregate().get()");
			}
			if (aggregates[aggregates.length - 1].length === 0) {
				aggregates.length -= 1;
			}
			if (!aggregates.length) {
				throw new ORMError('PARAM_MISMATCH', "Missing aggregate functions");
			}

			const query = opts.driver.getQuery()
				.select()
				.from(opts.table)
				.select(opts.propertyList);

			for (let i = 0; i < aggregates.length; i++) {
				for (let j = 0; j < aggregates[i].length; j++) {
					query.fun(aggregates[i][j].f, aggregates[i][j].a, aggregates[i][j].alias);
				}
			}

			query.where(opts.conditions);

			if (group_by !== null) {
				query.groupBy.apply(query, group_by);
			}

			if (opts.order) {
				for (let i = 0; i < opts.order.length; i++) {
					query.order(opts.order[i][0], opts.order[i][1]);
				}
			}
			if (opts.limit) {
				query.offset(opts.limit[0]).limit(opts.limit[1]);
			}

			const q_str = query.build();

			opts.driver.execQuery<any>(q_str, function (err: Error, data: any) {
				if (err) {
					return cb(err);
				}

				if (group_by !== null) {
					return cb(null, data);
				}

				var items = [];

				if (used_distinct && aggregates.length === 1) {
					for (let i = 0; i < data.length; i++) {
						items.push(
							data[i][
								Object.keys(data[i]).pop()
							]
						);
					}

					return cb(null, items);
				}

				for (let i = 0; i < aggregates.length; i++) {
					for (let j = 0; j < aggregates[i].length; j++) {
						items.push(
							data[0][
								aggregates[i][j].alias
							] || null
						);
					}
				}

				items.unshift(null);

				return cb.apply(null, items);
			});
		}
	};

	for (let i = 0; i < opts.driver.aggregate_functions.length; i++) {
		addAggregate(proto, opts.driver.aggregate_functions[i], appendFunction);
	}

	return proto;
}

export = AggregateFunctions

function addAggregate(
	proto: FxOrmQuery.IAggregated, fun: string|string[], builder: Function
) {
	if (Array.isArray(fun)) {
		proto[fun[0].toLowerCase()] = builder((fun[1] || fun[0]).toLowerCase());
	} else {
		proto[fun.toLowerCase()] = builder(fun.toLowerCase());
	}
}

function aggregateAlias(fun, fields) {
	return fun + (fields && fields.length ? "_" + fields.join("_") : "");
}
