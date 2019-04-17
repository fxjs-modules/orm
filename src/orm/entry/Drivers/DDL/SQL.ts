import _merge = require('lodash.merge')
import { Sync } from "@fxjs/sql-ddl-sync";
import * as Utilities from '../../Utilities';

export const sync: FxOrmDMLDriver.DMLDriver['sync'] = function (
	this: FxOrmDMLDriver.DMLDriver, opts, cb
) {
	var sync = new Sync({
		driver  : this,
		// debug   : false // function (text) { console.log(text); }
		debug: function (text: string) {
			(process.env as any).DEBUG_SQLDDLSYNC && (global as any).console.log("> %s", text);
		}
	});

	var setIndex = function (p: FxOrmProperty.NormalizedPropertyHash, v: FxOrmProperty.NormalizedProperty, k: string) {
		v.index = true;
		p[k] = v;
	};
	var props: FxOrmProperty.NormalizedPropertyHash = {};

	if (this.customTypes) {
		for (let k in this.customTypes) {
			sync.defineType(k, this.customTypes[k]);
		}
	}

	sync.defineCollection(opts.table, opts.allProperties);

	for (let i = 0; i < opts.many_associations.length; i++) {
		props = {};

		_merge(props, opts.many_associations[i].mergeId);
		_merge(props, opts.many_associations[i].mergeAssocId);
		Object.entries(props).forEach(([k, v]) => setIndex(props, v, k))
		_merge(props, opts.many_associations[i].props);

		sync.defineCollection(
			opts.many_associations[i].mergeTable,
			props as FxOrmSqlDDLSync__Collection.Collection['properties']
		);
	}

	sync.sync(cb);

	return this;
};

export const drop: FxOrmDMLDriver.DMLDriver['drop'] = function (
	this: FxOrmDMLDriver.DMLDriver, opts, cb?
) {
	let queries = [], pending: number, err: FxOrmError.ExtendedError;

	queries.push("DROP TABLE IF EXISTS " + this.query.escapeId(opts.table));

	for (let i = 0; i < opts.many_associations.length; i++) {
		queries.push("DROP TABLE IF EXISTS " + this.query.escapeId(opts.many_associations[i].mergeTable));
	}

	pending = queries.length;

	for (let i = 0; i < queries.length; i++) {
		err = Utilities.exposeErrAndResultFromSyncMethod(this.execQuery, [queries[i]], { thisArg: this }).error
		if (err || --pending === 0)
			break
	}
	Utilities.throwErrOrCallabckErrResult({ error: err }, { callback: cb });

	return this;
};
