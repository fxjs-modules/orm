import util 			= require('util');

import Utilities     	= require("./Utilities");
import ChainInstance	= require("./ChainInstance");

import type { FxOrmQuery } from './Typo/query';
import type { FxOrmModel } from './Typo/model';
import type { FxOrmInstance } from './Typo/instance';
import type { FxOrmAssociation } from './Typo/assoc';
import type { FxOrmCommon } from './Typo/_common';
import type { FxOrmProperty } from './Typo/property';

import type {
	FxSqlQueryComparator,
	FxSqlQuerySql,
	FxSqlQuerySubQuery
} from '@fxjs/sql-query';

const MODEL_FUNCS = [
	"hasOne", "hasMany",
	"drop", "sync", "get", "clear", "create",
	"exists", "settings", "aggregate"
];

const ChainFind = function (
	this: void,
	Model: FxOrmModel.Model,
	opts: FxOrmQuery.ChainFindOptions
) {
	const merges = opts.merge = Utilities.combineMergeInfoToArray( opts.merge );

	const chainRunSync = function (): FxOrmInstance.Instance[] {
		let conditions: FxSqlQuerySubQuery.SubQueryConditions = util.omit(opts.conditions, Model.virtualProperties);

		conditions = Utilities.transformPropertyNames(conditions, opts.properties);
		Utilities.filterWhereConditionsInput(conditions, { properties: Model.allProperties });

		const order = Utilities.transformOrderPropertyNames(opts.order, opts.properties);

		let foundItems: FxOrmInstance.InstanceDataPayload[];

		const vFields = Object.keys(Model.virtualProperties);
		const { tableConditions, topConditions } = Utilities.extractSelectTopConditions(conditions, vFields);
		foundItems = opts.driver.find(opts.only, opts.table, tableConditions, {
			limit  : Utilities.coercePositiveInt(opts.limit, undefined),
			order  : order,
			merge  : merges,
			offset : Utilities.coercePositiveInt(opts.offset, undefined),
			exists : opts.exists.map(existCond => {
				const maybeAssoc = Object.values(Model.associations).find(({ association }) => association.mergeTable === existCond.table)?.association;
				const mergeProps = maybeAssoc?.props || null;

				if (mergeProps) {
					existCond.conditions = util.omit(existCond.conditions, vFields);
					existCond.conditions = Utilities.transformPropertyNames(existCond.conditions, mergeProps);
					Utilities.filterWhereConditionsInput(existCond.conditions, { properties: mergeProps });
				}

				return existCond;
			}),
			topConditions,
			selectVirtualFields: vFields,
			generateSqlSelect: opts.generateSqlSelect,
		});
		
		if (foundItems.length === 0) {
			return [];
		}
		
		/**
		 * only valid for related table based on single foreign key
		 * @param err 
		 * @param items 
		 */
		const eagerLoadSync = function (items: FxOrmInstance.InstanceDataPayload[]) {
			const associationKey_Item_Map: {[key: string]: typeof items[any]} = {};

			const self_key_field = opts.keys[0];

			const keys = items.map(function (item: FxOrmInstance.InstanceDataPayload) {
				const key = item[self_key_field];
				associationKey_Item_Map[key] = item;

				return key;
			});

			Utilities.parallelQueryIfPossible(
				opts.driver.isPool,
				opts.__eager,
				(association: FxOrmAssociation.InstanceAssociationItem) => {
					let instances: FxOrmInstance.Instance[] = [];
					
					instances = opts.driver.eagerQuery<FxOrmInstance.Instance[]>(association, opts, keys);

					const association_name = association.name;

					for (
						let idx = 0, instance: FxOrmInstance.Instance, item = null;
						instance = instances[idx];
						idx++
					) {
						item = associationKey_Item_Map[instance.$p];

						// Create the association arrays
						if (!item[association_name])
							item[association_name] = []

						item[association_name].push(instance);
					}
				}
			)
		};

		const items = foundItems.map<FxOrmInstance.Instance>((dataItem: FxOrmInstance.InstanceDataPayload) => {
			const newInstanceSync = opts.newInstanceSync;

			return newInstanceSync(dataItem);
		});

		if (opts.__eager && opts.__eager.length)
			eagerLoadSync(items);

		return items;
	}

	const chainRun = function<T> (done?: FxOrmCommon.GenericCallback<T|T[]|FxOrmInstance.InstanceDataPayload[]>) {
		const syncResponse = Utilities.catchBlocking(chainRunSync);
		Utilities.takeAwayResult(syncResponse, { no_throw: true, callback: done, use_tick: true });
	}

	const chain: FxOrmQuery.IChainFind = {
		model: null,
		options: null,
		
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
			let omit = null;

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
		},
		
		/* methods to ChainInstance :start */
		each: function (cb) {
			return ChainInstance(this, cb);
		},
		/* methods to ChainInstance :end */
		
		/* sync, callback-as-run style methods :start */
		all: null,
		allSync: null,
		where: null,
		whereSync: null,

		find: function (...args: any[]) {
			var cb: FxOrmCommon.GenericCallback<FxOrmInstance.Instance[]> = null;

			opts.conditions = opts.conditions || {};

			if (typeof util.last(args) === "function") {
			    cb = args.pop() as FxOrmCommon.GenericCallback<FxOrmInstance.Instance[]>;
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

		findSync: function (...args: any[]) {
			opts.conditions = opts.conditions || {};

			if (typeof args[0] === "object") {
				util.extend(opts.conditions, args[0]);
			} else if (typeof args[0] === "string") {
				opts.conditions.__sql = (opts.conditions.__sql || []) as FxSqlQuerySubQuery.UnderscoreSqlInput;
				opts.conditions.__sql.push(args as any);
			}

			return chainRunSync() as any;
		},

		count: function (cb?) {
			process.nextTick(() => {
				const syncResult = Utilities.catchBlocking<number>(chain.countSync)
				Utilities.takeAwayResult<number>(syncResult, { callback: cb });
			});
			return this;
		},
		
		countSync: function () {
			const data: FxOrmQuery.CountResult[] = opts.driver.count(
				opts.table,
				Utilities.transformPropertyNames(opts.conditions, opts.properties),
				{
					merge  : merges
				});

			if (data.length === 0)
				return 0;
				 
			return data[0].c
		},

		remove: function (cb?) {
			process.nextTick(() => {
				const syncResult = Utilities.catchBlocking<FxOrmQuery.RemoveResult>(chain.removeSync)
				Utilities.takeAwayResult(syncResult, { callback: cb });
			})
			return this;
		},

		// TODO: add test case about `.removeSync()`
		removeSync: function () {
			const keys = opts.keyProperties.map((x: FxOrmProperty.NormalizedProperty) => x.mapsTo);
			
			const data = opts.driver.find(
				keys,
				opts.table,
				Utilities.transformPropertyNames(opts.conditions, opts.properties),
				{
					limit  : opts.limit,
					order  : Utilities.transformOrderPropertyNames(
						opts.order, opts.properties
					),
					merge  : merges,
					offset : opts.offset,
					exists : opts.exists,
				});

			if (data.length === 0) {
				return null;
			}

			const conditions: FxSqlQuerySubQuery.SubQueryConditions = {};
			let or: FxSqlQueryComparator.SubQueryInput;

			conditions.or = [];

			for (let i = 0; i < data.length; i++) {
				or = {};
				for (let j = 0; j < keys.length; j++) {
					or[keys[j]] = data[i][keys[j]];
				}
				conditions.or.push(or);
			}

			return opts.driver.remove(opts.table, conditions);
		},

		first: function (cb?) {
			return this.run(function (err: Error, items: FxOrmInstance.Instance[]) {
				return cb(err, items && items.length > 0 ? items[0] : null);
			});
		},
		firstSync: function () {
			const items = this.runSync();

			return items && items.length > 0 ? items[0] : null
		},
		last: function (cb?) {
			return this.run(function (err: Error, items: FxOrmInstance.Instance[]) {
				return cb(err, items && items.length > 0 ? items[items.length - 1] : null);
			});
		},
		lastSync: function () {
			const items = this.runSync();

			return items && items.length > 0 ? items[items.length - 1] : null
		},
		run: function (cb?) {
			chainRun(cb);
			return this;
		},
		runSync: function () {
			return chainRunSync() as any;
		},
		/* sync, callback-as-run style methods :end */
	};

	chain.allSync = chain.whereSync = chain.findSync;
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
