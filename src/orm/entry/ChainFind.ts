import util 			= require('util');
import coroutine 		= require('coroutine');

import Utilities     	= require("./Utilities");
import ChainInstance	= require("./ChainInstance");

var prepareConditions = function (opts: FxOrmQuery.ChainFindOptions) {
	return Utilities.transformPropertyNames(
		opts.conditions, opts.properties
	);
};

var prepareOrder = function (opts: FxOrmQuery.ChainFindOptions) {
	return Utilities.transformOrderPropertyNames(
		opts.order, opts.properties
	);
};

const MODEL_FUNCS = [
	"hasOne", "hasMany",
	"drop", "sync", "get", "clear", "create",
	"exists", "settings", "aggregate"
];

const ChainFind = function (
	this: void,
	Model: FxOrmModel.Model, opts: FxOrmQuery.ChainFindOptions
) {
	const merges = opts.merge = Utilities.combineMergeInfoToArray( opts.merge );

	const chainRun = function<T> (done: FxOrmNS.GenericCallback<T|T[]|FxOrmInstance.InstanceDataPayload[]>) {
		const conditions: FxSqlQuerySubQuery.SubQueryConditions = Utilities.transformPropertyNames(opts.conditions, opts.properties);
		const order = Utilities.transformOrderPropertyNames(opts.order, opts.properties);

		opts.driver.find(opts.only, opts.table, conditions, {
			limit  : opts.limit,
			order  : order,
			merge  : merges,
			offset : opts.offset,
			exists : opts.exists
		}, function (err: Error, dataItems: FxOrmInstance.InstanceDataPayload[]) {
			if (err) {
				return done(err);
			}
			if (dataItems.length === 0) {
				return done(null, []);
			}

			var eagerLoad = function (err: Error, items: FxOrmInstance.InstanceDataPayload[]) {
				var idMap: {[key: string]: number} = {};

				var keys = util.map(items, function (item: FxOrmInstance.InstanceDataPayload, index: number) {
					var key = item[opts.keys[0]];
					// Create the association arrays
					for (let i = 0, association: FxOrmAssociation.InstanceAssociationItem; association = opts.__eager[i]; i++) {
						item[association.name] = [];
					}
					idMap[key] = index;

					return key;
				});

				coroutine.parallel(opts.__eager, (association: FxOrmAssociation.InstanceAssociationItem) => {
					// if err exists, chainRun would finished before this fiber released
					if (err) return 
					
					const newInstanceSync = util.sync(function (association: FxOrmAssociation.InstanceAssociationItem, cb: FxOrmNS.ExecutionCallback<any>) {
						opts.driver.eagerQuery<FxOrmInstance.Instance>(association, opts, keys, function (eager_err, instances) {
							err = eager_err
	
							if (eager_err) {
								done(eager_err)
								cb(eager_err)
								return ;
							}
	
							for (let i = 0, instance: FxOrmInstance.Instance; instance = instances[i]; i++) {
								// Perform a parent lookup with $p, and initialize it as an instance.
								items[idMap[instance.$p]][association.name].push(association.model(instance));
							}

							cb(null, null);
						});
					});

					return newInstanceSync(association);
				});

				done(null, items);
			};

			const items = coroutine.parallel(dataItems, (dataItem: FxOrmInstance.InstanceDataPayload) => {
				const newInstanceSync = util.sync(function(obj: FxOrmInstance.InstanceDataPayload, cb: Function) {
					opts.newInstance(obj, function (err: Error, data: FxOrmInstance.Instance) {
						if (err) {
							done(err)
							cb(err)
							return ;
						}

						cb(null, data)
					})
				})

				return newInstanceSync(dataItem)
			});

			if (opts.__eager && opts.__eager.length)
				eagerLoad(null, items);
			else
				done(null, items);
		});
	}

	const chain: FxOrmQuery.IChainFind = {
		model: null,
		options: null,
		
		all: null,
		where: null,
		find: function <T>(...args: any[]) {
			var cb: FxOrmNS.GenericCallback<T> = null;

			opts.conditions = opts.conditions || {};

			if (typeof util.last(args) === "function") {
			    cb = args.pop() as FxOrmNS.GenericCallback<T>;
			}

			if (typeof args[0] === "object") {
				util.extend(opts.conditions, args[0]);
			} else if (typeof args[0] === "string") {
				opts.conditions.__sql = (opts.conditions.__sql || []) as FxSqlQuerySubQuery.UnderscoreSqlInput;
				opts.conditions.__sql.push(args as any);
			}

			if (cb) {
				chainRun(cb);
			}
			return this;
		},
		whereExists: function () {
			if (arguments.length && Array.isArray(arguments[0])) {
				opts.exists = arguments[0];
			} else {
				opts.exists = Array.prototype.slice.apply(arguments);
			}
			return this;
		},
		only: function () {
			if (arguments.length && Array.isArray(arguments[0])) {
				opts.only = arguments[0];
			} else {
				opts.only = Array.prototype.slice.apply(arguments);
			}
			return this;
		},
		omit: function () {
			var omit = null;

			if (arguments.length && Array.isArray(arguments[0])) {
				omit = arguments[0];
			} else {
				omit = Array.prototype.slice.apply(arguments);
			}
			this.only(util.difference(Object.keys(opts.properties), omit));
			return this;
		},
		limit: function (limit) {
			opts.limit = limit;
			return this;
		},
		skip: function (offset) {
			return this.offset(offset);
		},
		offset: function (offset) {
			opts.offset = offset;
			return this;
		},
		order: function (...orders: FxOrmQuery.OrderSeqRawTuple) {
			if (!Array.isArray(opts.order)) {
				opts.order = [];
			}
			opts.order = opts.order.concat(Utilities.standardizeOrder(orders));

			return this;
		},
		orderRaw: function (str, args?) {
			if (!Array.isArray(opts.order)) {
				opts.order = [];
			}
			args = args || [];

			opts.order.push([ str, args ]);
			return this;
		},
		count: function (cb) {
			opts.driver.count(opts.table, prepareConditions(opts), {
				merge  : merges
			}, function (err, data) {
				if (err || data.length === 0) {
					return cb(err);
				}
				return cb(null, data[0].c);
			});
			return this;
		},
		remove: function (cb) {
			var keys = opts.keyProperties.map((x: FxOrmProperty.NormalizedProperty) => x.mapsTo); // util.map(opts.keyProperties, 'mapsTo');

			opts.driver.find(keys, opts.table, prepareConditions(opts), {
				limit  : opts.limit,
				order  : prepareOrder(opts),
				merge  : merges,
				offset : opts.offset,
				exists : opts.exists
			}, function (err, data) {
				if (err) {
					return cb(err);
				}
				if (data.length === 0) {
					return cb(null);
				}

				var conditions: FxSqlQuerySubQuery.SubQueryConditions = {};
				var or: FxSqlQueryComparator.SubQueryInput;

				conditions.or = [];

				for (let i = 0; i < data.length; i++) {
					or = {};
					for (var j = 0; j < opts.keys.length; j++) {
						or[keys[j]] = data[i][keys[j]];
					}
					conditions.or.push(or);
				}

				return opts.driver.remove(opts.table, conditions, cb);
			});
			return this;
		},
		first: function <T>(cb: FxOrmNS.ExecutionCallback<T>) {
			return this.run(function (err: Error, items: T[]) {
				return cb(err, items && items.length > 0 ? items[0] : null);
			});
		},
		last: function <T>(cb: FxOrmNS.ExecutionCallback<T>) {
			return this.run(function (err: Error, items: T[]) {
				return cb(err, items && items.length > 0 ? items[items.length - 1] : null);
			});
		},
		each: function (cb?: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>) {
			return ChainInstance(this, cb);
		},
		run: function<T> (cb: FxOrmNS.ExecutionCallback<T>) {
			chainRun(cb);
			return this;
		},
		eager: function () {
			// This will allow params such as ("abc", "def") or (["abc", "def"])
			var associations: string[] = util.flatten(arguments);

			// TODO: Implement eager loading for Mongo and delete this.
			if (opts.driver.config.protocol == "mongodb:") {
				throw new Error("MongoDB does not currently support eager loading");
			}

			opts.__eager = opts.associations.filter(function (association) {
				return ~associations.indexOf(association.name);
			});

			return this;
		}
	};
	chain.all = chain.where = chain.find;

	if (opts.associations) {
		for (let i = 0; i < opts.associations.length; i++) {
			addChainMethod(chain, opts.associations[i], opts);
		}
	}
	for (let k in Model) {
		if (MODEL_FUNCS.indexOf(k) >= 0) {
			continue;
		}
		if (typeof Model[k] !== "function" || chain[k]) {
			continue;
		}

		chain[k] = Model[k];
	}
	chain.model   = Model;
	chain.options = opts as FxOrmQuery.ChainFindInstanceOptions;

	return chain
} as any as FxOrmQuery.ChainFindGenerator;

export = ChainFind

function addChainMethod(
	chain: FxOrmQuery.IChainFind,
	association: FxOrmAssociation.InstanceAssociationItem,
	opts: FxOrmQuery.ChainFindOptions
) {
	chain[association.hasAccessor] = function<T = any> (value: T) {
		if (!opts.exists) {
			opts.exists = [];
		}
		var conditions: FxSqlQuerySubQuery.SubQueryConditions = {};

		var assocIds = Object.keys(association.mergeAssocId);
		var ids = association.model.id;
		function mergeConditions(source: FxOrmInstance.InstanceDataPayload) {
			for (let i = 0, cond_item; i < assocIds.length; i++) {
				if (typeof cond_item === "undefined") {
					conditions[assocIds[i]] = source[ids[i]];
				} else if (
					(cond_item = conditions[assocIds[i]])
					&& Array.isArray(cond_item)
				) {
					cond_item.push(source[ids[i]]);
					conditions[assocIds[i]] = cond_item
				} else {
					conditions[assocIds[i]] = [ cond_item, source[ids[i]] ];
				}
			}
		}

		if (Array.isArray(value)) {
			for (let i = 0; i < value.length; i++) {
				mergeConditions(value[i]);
			}
		} else {
			mergeConditions(value);
		}

		opts.exists.push({
			table      : association.mergeTable,
			link       : [ Object.keys(association.mergeId), association.model.id ] as FxSqlQuerySql.WhereExistsLinkTuple,
			conditions : conditions
		});

		return chain;
	};
}
