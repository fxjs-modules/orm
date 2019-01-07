import _merge = require('lodash.merge')
import { Sync } from "@fxjs/sql-ddl-sync";

export const sync: FxOrmDMLDriver.DMLDriver['sync'] = function (
	this: FxOrmDMLDriver.DMLDriver, opts, cb
) {
	var sync = new Sync({
		driver  : this,
		debug   : false // function (text) { console.log(text); }
	});

	var setIndex = function (p: FxOrmProperty.NormalizedPropertyHash, v: FxOrmProperty.NormalizedProperty, k: string) {
		v.index = true;
		p[k] = v;
	};
	var props: FxOrmProperty.NormalizedPropertyHash = {};

	if (this.customTypes) {
		for (var k in this.customTypes) {
			sync.defineType(k, this.customTypes[k]);
		}
	}

	sync.defineCollection(opts.table, opts.allProperties);

	for (var i = 0; i < opts.many_associations.length; i++) {
		props = {};

		_merge(props, opts.many_associations[i].mergeId);
		_merge(props, opts.many_associations[i].mergeAssocId);
		Object.entries(props).forEach(([k, v]) => setIndex(props, v, k))
		_merge(props, opts.many_associations[i].props);

		sync.defineCollection(opts.many_associations[i].mergeTable, props);
	}

	sync.sync(cb);

	return this;
};

export const drop: FxOrmDMLDriver.DMLDriver['drop'] = function (
	this: FxOrmDMLDriver.DMLDriver, opts, cb
) {
	var queries = [], pending: number;

	queries.push("DROP TABLE IF EXISTS " + this.query.escapeId(opts.table));

	for (let i = 0; i < opts.many_associations.length; i++) {
		queries.push("DROP TABLE IF EXISTS " + this.query.escapeId(opts.many_associations[i].mergeTable));
	}

	pending = queries.length;

	for (let i = 0; i < queries.length; i++) {
		this.execQuery(queries[i], function (err) {
			if (--pending === 0) {
				return cb(err);
			}
		});
	}

	return this;
};
