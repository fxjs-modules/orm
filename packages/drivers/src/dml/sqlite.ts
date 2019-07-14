import util = require('util')

import sqlite3 		= require("../DB/sqlite3");
import shared  		= require("./_shared");
import DDL     		= require("../DDL/SQL");
import { Query }	from "@fxjs/sql-query";
import utils		= require("./_utils");
import * as Utilities from '../../Utilities';

export const Driver: FxOrmDMLDriver.DMLDriverConstructor_SQLite = function(
	this: FxOrmDMLDriver.DMLDriver_SQLite, config: FxOrmNS.IDBConnectionConfig, connection: FxOrmDb.DatabaseBase_SQLite, opts: FxOrmDMLDriver.DMLDriverOptions
) {
	this.dialect = 'sqlite';
	this.config = config || <FxOrmNS.IDBConnectionConfig>{};
	this.opts   = opts || <FxOrmDMLDriver.DMLDriverOptions>{};

	if (!this.config.timezone) {
		this.config.timezone = "local";
	}

	this.query  = new Query({ dialect: this.dialect, timezone: this.config.timezone });
	utils.setCouldPool(this);
	utils.getKnexInstance(this);

	this.customTypes = {};

	if (connection) {
		this.db = connection;
	} else {
		// on Windows, paths have a drive letter which is parsed by
		// url.parse() as the hostname. If host is defined, assume
		// it's the drive letter and add ":"
		if (process.platform == "win32" && config.host && config.host.match(/^[a-z]$/i)) {
			this.db = new sqlite3.Database(decodeURIComponent((config.host ? config.host + ":" : "") + (config.pathname || "")) || ':memory:');
		} else {
			this.db = new sqlite3.Database(decodeURIComponent((config.host ? config.host : "") + (config.pathname || "")) || ':memory:');
		}
	}

	this.aggregate_functions = [ "ABS", "ROUND",
	                             "AVG", "MIN", "MAX",
	                             "RANDOM",
	                             "SUM", "COUNT",
	                             "DISTINCT" ];
} as any as FxOrmDMLDriver.DMLDriverConstructor_SQLite;

util.extend(Driver.prototype, shared, DDL);

Driver.prototype.ping = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, cb?
) {
	Utilities.throwErrOrCallabckErrResult({ error: null }, { callback: cb, use_tick: true });
	return this;
};

Driver.prototype.on = function (this: FxOrmDMLDriver.DMLDriver_SQLite, 
	ev, cb?
) {
	if (ev == "error") {
		this.db.on("error", cb);
	}
	return this;
};

Driver.prototype.connect = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, cb?: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>
) {
	return this.db.connect(cb);
};

Driver.prototype.close = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, cb?
) {
	return this.db.close(cb);
};

Driver.prototype.getQuery = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, 
) {
	return this.query;
};

Driver.prototype.execSimpleQuery = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, query, cb?
) {
	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', query);
	}
	return this.db.all(query, cb);
};

Driver.prototype.find = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, fields, table, conditions, opts, cb?
) {
	var q = this.query.select()
	                  .from(table)
					  .select(fields);

	if (opts.offset) {
		q.offset(opts.offset);
	}
	if (typeof opts.limit == "number") {
		q.limit(opts.limit);
	} else if (opts.offset) {
		// OFFSET cannot be used without LIMIT so we use the biggest INTEGER number possible
		q.limit('9223372036854775807');
	}
	
	utils.buildOrderToQuery.apply(this, [q, opts.order]);
	q = utils.buildMergeToQuery.apply(this, [q, opts.merge, conditions]);
	utils.buildExistsToQuery.apply(this, [q, table, opts.exists]);

	return this.execSimpleQuery(q.build(), cb);
};

Driver.prototype.count = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, table, conditions, opts, cb?
) {
	var q = this.query.select()
	                  .from(table)
	                  .count(null, 'c');

	q = utils.buildMergeToQuery.apply(this, [q, opts.merge, conditions]);
	utils.buildExistsToQuery.apply(this, [q, table, opts.exists]);

	return this.execSimpleQuery(q.build(), cb);
};

Driver.prototype.insert = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, table, data, keyProperties, cb?
) {
	var q = this.query.insert()
	                  .into(table)
	                  .set(data)
	                  .build();

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', q);
	}

	const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(() => {
		const info = this.execSimpleQuery<FxOrmQuery.InsertResult>(q);

        if (!keyProperties) return null;

        var ids: {[k: string]: any} = {},
            prop;

        if (keyProperties.length == 1 && keyProperties[0].type == 'serial') {
            ids[keyProperties[0].name] = info.insertId;
        } else {
            for (let i = 0; i < keyProperties.length; i++) {
                prop = keyProperties[i];
                // Zero is a valid value for an ID column
                ids[prop.name] = data[prop.mapsTo] !== undefined ? data[prop.mapsTo] : null;
            }
        }

		return ids;
	});
	Utilities.throwErrOrCallabckErrResult(syncResponse, { callback: cb });

	return syncResponse.result
};

Driver.prototype.update = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, table, changes, conditions, cb?
) {
	var q = this.query.update()
	                  .into(table)
	                  .set(changes)
	                  .where(conditions)
	                  .build();

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', q);
	}
	return this.execSimpleQuery(q, cb);
};

Driver.prototype.remove = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, table, conditions, cb?
) {
	var q = this.query.remove()
	                  .from(table)
	                  .where(conditions)
	                  .build();

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', q);
	}
	return this.execSimpleQuery(q, cb);
};

Driver.prototype.clear = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, table, cb?
) {
	const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(() => {
		this.execQuery(
			this.query.remove()
	                  .from(table)
					  .build()
		);
		
		this.execQuery(
			this.query.remove()
	                  .from(table)
					  .where({ name: 'sqlite_sequence' })
					  .build()
		);
	})
	Utilities.throwErrOrCallabckErrResult(syncResponse, { callback: cb });

	return syncResponse.result;
};

Driver.prototype.valueToProperty = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, value, property
) {
	var v, customType;

	switch (property.type) {
		case "boolean":
			value = !!value;
			break;
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
		case "date":
			if (util.isNumber(value) || util.isString(value))
            	value = new Date(value);

			break;
		default:
			customType = this.customTypes[property.type];
			if(customType && 'valueToProperty' in customType) {
				value = customType.valueToProperty(value, property);
			}
	}
	return value;
};

Driver.prototype.propertyToValue = function (
	this: FxOrmDMLDriver.DMLDriver_SQLite, value, property
) {
	switch (property.type) {
		case "boolean":
			value = (value) ? 1 : 0;
			break;
		case "object":
			if (value !== null) {
				value = JSON.stringify(value);
			}
			break;
		case "date":
			if (util.isNumber(value) || util.isString(value))
            	value = new Date(value);
			break;
		default:
			const customType = this.customTypes[property.type];
			if(customType && 'propertyToValue' in customType) {
				value = customType.propertyToValue(value);
			}
	}
	return value;
};

Object.defineProperty(Driver.prototype, "isSql", {
    value: true
});

function convertTimezone(tz: FxSqlQuery.FxSqlQueryTimezone) {
	if (tz == "Z") return 0;

	var m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);
	if (m) {
		return (m[1] == '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
	}
	return false;
}
