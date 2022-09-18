import _merge = require('lodash.merge')
import { Sync } from "@fxjs/sql-ddl-sync";
import * as Utilities from '../../Utilities';

import { FxOrmProperty } from '../../Typo/property';
import { FxOrmDMLDriver } from '../../Typo/DMLDriver';
import { FxOrmError } from '../../Typo/Error';

function setIndex (p: Record<string, FxOrmProperty.NormalizedProperty>, v: FxOrmProperty.NormalizedProperty, k: string) {
	v.index = true;
	p[k] = v;
};

export const doSync: FxOrmDMLDriver.DMLDriver['doSync'] = function (
	this: FxOrmDMLDriver.DMLDriver,
	opts,
) {
	const syncInstance = new Sync({
		...opts.allow_drop_column && { suppressColumnDrop: false },
		dbdriver: this.db,
		debug: function (text: string) {
			process.env.DEBUG_SQLDDLSYNC && (global as any).console.log("> %s", text);
		}
	});

	if (opts.repair_column)
		syncInstance.strategy = 'mixed'

	if (this.customTypes) {
		for (let k in this.customTypes) {
			syncInstance.defineType(k, this.customTypes[k]);
		}
	}

	syncInstance.defineCollection(opts.table, opts.allProperties);

	for (
		let i = 0, props = <Record<string, FxOrmProperty.NormalizedProperty>>{};
		i < opts.many_associations.length;
		i++
	) {
		props = {};

		_merge(props, opts.many_associations[i].mergeId);
		_merge(props, opts.many_associations[i].mergeAssocId);
		Object.entries(props).forEach(([k, v]) => setIndex(props, v, k))
		_merge(props, opts.many_associations[i].props);

		syncInstance.defineCollection(
			opts.many_associations[i].mergeTable,
			props
		);
	}

	syncInstance.sync();

	return this;
};

export const doDrop: FxOrmDMLDriver.DMLDriver['doDrop'] = function (
	this: FxOrmDMLDriver.DMLDriver, opts
) {
	let drop_queries = [], pending: number, err: FxOrmError.ExtendedError;

	drop_queries.push(`DROP TABLE IF EXISTS ${this.query.escapeId(opts.table)}`);

	for (let i = 0; i < opts.many_associations.length; i++) {
		drop_queries.push(`DROP TABLE IF EXISTS ${this.query.escapeId(opts.many_associations[i].mergeTable)}`);
	}

	pending = drop_queries.length;

	for (let i = 0; i < drop_queries.length; i++) {
		err = Utilities.catchBlocking(this.execQuery, [drop_queries[i]], { thisArg: this }).error
		if (err || --pending === 0)
			break
	}

	return this;
};
