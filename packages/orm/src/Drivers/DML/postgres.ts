/// <reference lib="es2015" />

import type { FxDbDriverNS, IDbDriver } from "@fxjs/db-driver";
import type { FxOrmDMLDriver } from "../../Typo/DMLDriver";
import type { FxOrmDb } from "../../Typo/Db";
import type { FxOrmCommon } from "../../Typo/_common";

import util = require("util");

import shared = require("./_shared");
import DDL = require("./_ddl-sql");
import Sync = require("@fxjs/sql-ddl-sync");
import { FxSqlQuery, Query }	from "@fxjs/sql-query";
import utils = require("./_utils");
import * as Utilities from "../../Utilities";
import Database from "../DB/postgres";

export const Driver: FxOrmDMLDriver.DMLDriverConstructor = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL,
	config: FxDbDriverNS.DBConnectionConfig,
	connection: FxOrmDb.DatabaseBase_PostgreSQL,
	opts: FxOrmDMLDriver.DMLDriverOptions
) {
	this.dialect = 'postgresql';
	this.opts = opts || <FxOrmDMLDriver.DMLDriverOptions>{};
	
	this.customTypes = {};

	Object.defineProperty(this, 'db', {
		value: connection || new Database(config),
		writable: false
	});
	
	Object.defineProperty(this, 'sqlDriver', {
		value: this.db,
		writable: false
	});

	Object.defineProperty(this, 'config', {
		value: this.db.config,
		writable: false
	});
	if (!this.config.timezone) this.config.timezone = "local";

	Object.defineProperty(this, 'ddlSync', {
		value: Sync.dialect(this.dialect),
		writable: false
	});
	Object.defineProperty(this, 'query', {
		value: new Query({ dialect: this.dialect, timezone: this.config.timezone }),
		writable: false
	});

	utils.setCouldPool(this);
	utils.getKnexInstance(this);

	this.aggregate_functions = [
		"ABS", "CEIL", "FLOOR", "ROUND",
		"AVG", "MIN", "MAX",
		"LOG", "EXP", "POWER",
		"ACOS", "ASIN", "ATAN", "COS", "SIN", "TAN",
		"RANDOM", "RADIANS", "DEGREES",
		"SUM", "COUNT",
		"DISTINCT"
	];
} as any as FxOrmDMLDriver.DMLDriverConstructor;

util.extend(Driver.prototype, shared, DDL);

Driver.prototype.ping = function<T = any> (this: FxOrmDMLDriver.DMLDriver_PostgreSQL, cb: FxOrmCommon.SuccessCallback<T>) {
	this.execSimpleQuery("SELECT * FROM pg_stat_activity LIMIT 1", function () {
		return cb?.();
	});

	return this;
};

Driver.prototype.on = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL, ev: string, cb?: FxOrmCommon.VoidCallback
) {
	if (ev == "error") {
		this.db.eventor.on("error", cb);
		this.db.eventor.on("unhandledError", cb);
	}
	return this;
};

Driver.prototype.connect = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL, cb?: FxOrmCommon.GenericCallback<IDbDriver>
) {
	const syncResponse = Utilities.catchBlocking(() => {
		return this.db.connect()
	})

	Utilities.takeAwayResult(syncResponse, { callback: cb });

	return syncResponse.result;
};

Driver.prototype.reconnect = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL,
	cb?: any
) {
	const connOpts = this.config.href || this.config;

	this.db = new Database(connOpts);

	const syncResponse = Utilities.catchBlocking(() => {
		return this.connect()
	})

	if (typeof cb === 'function')
		cb(null, syncResponse.result);

	return syncResponse.result;
};

Driver.prototype.close = function<T = any> (cb: FxOrmCommon.VoidCallback<T>) {
	const errResults = Utilities.catchBlocking(
		() => this.db.close()
	)

	Utilities.takeAwayResult(errResults, { no_throw: !!cb, callback: cb });
	return errResults.result;
};

Driver.prototype.getQuery = function (this: FxOrmDMLDriver.DMLDriver_PostgreSQL) {
	return this.query;
};

Driver.prototype.execSimpleQuery = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL, query, cb
) {
	if (this.opts.debug) {
		require("../../Debug").sql('postgresql', query);
	}
	return this.db.query(query, cb);
};

Driver.prototype.find = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL,
	fields, table, conditions, opts, cb: FxOrmCommon.GenericCallback<any>
) {
	const { from_tuple, pure_table, alias } = Utilities.parseTableInputForSelect(table);
	const q = this.query.select().from(from_tuple).select(fields);

	if (opts.offset) {
		q.offset(opts.offset);
	}
	if (typeof opts.limit == "number") {
		q.limit(opts.limit);
	}
	if (opts.order) {
		for (let i = 0; i < opts.order.length; i++) {
			q.order(opts.order[i][0], opts.order[i][1]);
		}
	}
	
	utils.buildBaseConditionsToQuery.apply(this, [q, pure_table, conditions]);
	utils.buildOrderToQuery.apply(this, [q, opts.order]);
	utils.buildMergeToQuery.apply(this, [q, opts.merge, conditions]);
	utils.buildExistsToQuery.apply(this, [q, alias, opts.exists]);

	return this.execSimpleQuery(q.build(), cb);
};

Driver.prototype.count = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL,
	table,
	conditions,
	opts,
	cb
) {
	const { from_tuple, pure_table, alias } = Utilities.parseTableInputForSelect(table);
	const q = this.query.select().from(from_tuple).count(null, 'c');

	utils.buildBaseConditionsToQuery.apply(this, [q, pure_table, conditions]);
	utils.buildMergeToQuery.apply(this, [q, opts.merge, conditions]);
	utils.buildExistsToQuery.apply(this, [q, alias, opts.exists]);

	return this.execSimpleQuery(q.build(), cb);
};

Driver.prototype.insert = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL,
	table, data, keyProperties, cb
) {
	const q = this.query.insert().into(table).set(data).build();
	const syncResponse = Utilities.catchBlocking(() => {
		const results = this.execSimpleQuery(q + " RETURNING *");

		const ids: {[k: string]: any} = {};

		if (keyProperties) {
			for (let i = 0; i < keyProperties.length; i++) {
				const prop = keyProperties[i];
								// Zero is a valid value for an ID column
				ids[prop.name] = results[0][prop.mapsTo] !== undefined ? results[0][prop.mapsTo] : null;
			}
		}
		
		return ids;
	});

	Utilities.takeAwayResult(syncResponse, { callback: cb });

	return syncResponse.result;
};

Driver.prototype.update = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL,
	table, changes, conditions, cb
) {
	const q = this.query.update().into(table).set(changes).where(conditions).build();

	return this.execSimpleQuery(q, cb);
};

Driver.prototype.remove = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL,
	table, conditions, cb
) {
	const q = this.query.remove().from(table).where(conditions).build();

	return this.execSimpleQuery(q, cb);
};

Driver.prototype.clear = function (this: FxOrmDMLDriver.DMLDriver_PostgreSQL, table, cb) {
	const q = "TRUNCATE TABLE " + this.query.escapeId(table);

	return this.execSimpleQuery(q, cb);
};

Driver.prototype.valueToProperty = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL,
	value, property
) {
	let customType, v;

	switch (property.type) {
		case "object":
			if (typeof value == "object" && !Buffer.isBuffer(value)) {
				break;
			}
			try {
				value = JSON.parse(value);
			} catch (e) {
				value = null;
			}
			break;
		case "point":
			if (typeof value == "string") {
				const m = value.match(/\((\-?[\d\.]+)[\s,]+(\-?[\d\.]+)\)/);

				if (m) {
					value = { x : parseFloat(m[1]) , y : parseFloat(m[2]) };
				}
			}
			break;
		case "date":
			if ((util.isNumber(value) || util.isString(value)))
            	value = new Date(value);
			
			if (util.isDate(value) && this.config.timezone && this.config.timezone != 'local') {
				const tz = convertTimezone(this.config.timezone);

				// shift local to UTC
				value.setTime(value.getTime() - (value.getTimezoneOffset() * 60000));

				if (tz !== false) {
					// shift UTC to timezone
					value.setTime(value.getTime() - (tz * 60000));
				}
			}
			break;
		case "number":
			if (typeof value == 'string') {
				switch (value.trim()) {
					case 'Infinity':
					case '-Infinity':
					case 'NaN':
						value = Number(value);
						break;
					default:
						v = parseFloat(value);
						if (Number.isFinite(v)) {
							value = v;
						}
				}
			}
			break;
		case "integer":
			if (typeof value == 'string') {
				v = parseInt(value);

				if (Number.isFinite(v)) {
					value = v;
				}
			}
			break;
		default:
			customType = this.customTypes[property.type];

			if (customType && 'valueToProperty' in customType) {
				value = customType.valueToProperty(value, property);
			}
	}
	return value;
};

Driver.prototype.propertyToValue = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL,
	value, property
) {
	let customType;

	switch (property.type) {
		case "object":
			if (value !== null) {
				if (!Buffer.isBuffer(value)) 
					value = JSON.stringify(value);
			}
			break;
		case "date":
			if ((util.isNumber(value) || util.isString(value)))
            	value = new Date(value);

			if (util.isDate(value) && this.config.timezone && this.config.timezone != 'local') {
				var tz = convertTimezone(this.config.timezone);

				// shift local to UTC
				value.setTime(value.getTime() + (value.getTimezoneOffset() * 60000));
				if (tz !== false) {
					// shift UTC to timezone
					value.setTime(value.getTime() + (tz * 60000));
				}
			}
			break;
		case "point":
			return function() { return 'POINT(' + value.x + ', ' + value.y + ')'; };
		default:
			customType = this.customTypes[property.type];

			if (customType && 'propertyToValue' in customType) {
				value = customType.propertyToValue(value);
			}
	}
	return value;
};

Object.defineProperty(Driver.prototype, "isSql", {
    value: true
});

function convertTimezone(tz: FxSqlQuery.FxSqlQueryTimezone) {
	if (tz == "Z") {
		return 0;
	}

	var m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);

	if (m) {
		return (m[1] == '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
	}
	return false;
}
