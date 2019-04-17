import util = require("util")

import ORMError   = require("./Error");
import Utilities  = require("./Utilities");

const AggregateFunctions = function (
	this: FxOrmQuery.IAggregated,
	opts: FxOrmQuery.AggregateConstructorOptions
) {
	if (typeof opts.driver.getQuery !== "function") {
		throw new ORMError("This driver does not support aggregate functions", 'NO_SUPPORT');
	}
	if (!Array.isArray(opts.driver.aggregate_functions)) {
		throw new ORMError("This driver does not support aggregate functions", 'NO_SUPPORT');
	}

	const aggregates: FxOrmQuery.SqlSelectFieldsDescriptor[][]    = [ [] ];
	let group_by: string[]      = null;
	let used_distinct 			= false;

	const aggregationFunc = function (fun: string) {
		fun = fun.toLocaleLowerCase()

		return function () {
			// select 1st array as args
			var args: string[] = (arguments.length && Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.apply(arguments));
			
			if (args.length > 0) {
				aggregates[aggregates.length - 1].push({ func_name: fun, args: args, as: aggregateAlias(fun, args) });
				// aggregates.push([]);
			} else {
				aggregates[aggregates.length - 1].push({ func_name: fun, as: aggregateAlias(fun, args) });
			}

			if (fun === "distinct") {
				used_distinct = true;
			}

			return proto;
		};
	};

	const distinct_to_one_row = function () {
		return used_distinct && aggregates.length === 1;
	}

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
		order: function (...orders: FxOrmQuery.OrderSeqRawTuple) {
			if (!Array.isArray(opts.order)) {
				opts.order = [];
			}
			opts.order = Utilities.standardizeOrder(orders);
			return this;
		},
		select: function (...columns: (string|string[])[]) {
			if (columns.length === 0) {
				throw new ORMError("When using append you must at least define one property", 'PARAM_MISMATCH');
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
				throw new ORMError("No aggregate functions defined yet", 'PARAM_MISMATCH');
			}

			var len = aggregates.length;

			aggregates[len - 1][
				aggregates[len - 1].length - 1
			].as = alias;

			return this;
		},
		call: function (fun, args) {
			if (args && args.length > 0) {
				aggregates[aggregates.length - 1].push({ func_name: fun, args: args, as: aggregateAlias(fun, args) });
			} else {
				aggregates[aggregates.length - 1].push({ func_name: fun, as: aggregateAlias(fun, args) });
			}

			if (fun.toLowerCase() === "distinct") {
				used_distinct = true;
			}

			return this;
		},
		getSync: function <T>() {
			if (aggregates[aggregates.length - 1].length === 0) {
				aggregates.length -= 1;
			}
			if (!aggregates.length) {
				throw new ORMError("Missing aggregate functions", 'PARAM_MISMATCH');
			}

			const query = opts.driver.getQuery()
				.select()
				.from(opts.table)
				.select(opts.propertyList);

			for (let i = 0; i < aggregates.length; i++) {
				for (let j = 0; j < aggregates[i].length; j++) {
					query.fun(aggregates[i][j].func_name, aggregates[i][j].args, aggregates[i][j].as);
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
			
			const data: any = opts.driver.execQuery<any>(q_str);

			if (group_by !== null) {
				return data;
			}

			var items = [];

			if (distinct_to_one_row()) {
				for (let i = 0; i < data.length; i++) {
					items.push(
						data[i][
							Object.keys(data[i]).pop()
						]
					);
				}

				return items;
			}

			for (let i = 0; i < aggregates.length; i++) {
				for (let j = 0; j < aggregates[i].length; j++) {
					items.push(
						data[0][
							aggregates[i][j].as
						] || null
					);
				}
			}

			return items;
		}, 
		get: function <T>(cb?: FxOrmNS.ExecutionCallback<T[]>) {
			if (typeof cb !== "function") {
				throw new ORMError("You must pass a callback to Model.aggregate().get()", 'MISSING_CALLBACK');
			}

			const syncReponse = Utilities.exposeErrAndResultFromSyncMethod(proto.getSync, [], { thisArg: proto })
			Utilities.throwErrOrCallabckErrResult(
				syncReponse,
				{
					callback: cb && function (err, results) {
						if (err)
							return cb(err)
						
						if (distinct_to_one_row())
							return cb(null, results)


						/**
						 * when not used_distinct, support to spread results as callback's arguments
						 */
						results.unshift(null)
						return cb.apply(null, results)
					}
				}
			);
		}
	};

	opts.driver.aggregate_functions.forEach(aggregate_function => {
		addAggregate(
			proto,
			aggregate_function,
			aggregationFunc
		);
	})

	return proto;
} as any as FxOrmQuery.AggregateConstructor;

export = AggregateFunctions

function addAggregate(
	proto: FxOrmQuery.IAggregated,
	fun: FxOrmDb.AGGREGATION_METHOD_COMPLEX | FxOrmDb.AGGREGATION_METHOD_TUPLE__COMMON,
	builder: {
		(fun: FxOrmQuery.KeyOfIAggregated): FxOrmQuery.AggregationMethod
	}
) {
	let k: FxOrmQuery.KeyOfIAggregated
	if (Array.isArray(fun)) {
		k = fun[0].toLowerCase()
		proto[k] = builder( fun[1] || fun[0] );
	} else {
		k = fun.toLowerCase()
		proto[k] = builder( fun );
	}
}

function aggregateAlias(fun: string, fields?: string[]) {
	return fun + (fields && fields.length ? "_" + fields.join("_") : "");
}
