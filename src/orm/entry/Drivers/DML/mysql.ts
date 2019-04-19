import util    = require("util");

import mysql 		= require("../DB/mysql");
import shared  		= require("./_shared");
import DDL     		= require("../DDL/SQL");
import { Query }	from "@fxjs/sql-query";
import utils		= require("./_utils");
import * as Utilities from "../../Utilities";

export const Driver: FxOrmDMLDriver.DMLDriverConstructor_MySQL = function(
	this: FxOrmDMLDriver.DMLDriver_MySQL, config: FxOrmNS.IDBConnectionConfig, connection: FxOrmDb.DatabaseBase_MySQL, opts: FxOrmDMLDriver.DMLDriverOptions
) {
	this.dialect = 'mysql';
	this.config = config || <FxOrmNS.IDBConnectionConfig>{};
	this.opts   = opts || <FxOrmDMLDriver.DMLDriverOptions>{};
	this.customTypes = <{[key: string]: FxOrmProperty.CustomPropertyType}>{};

	if (!this.config.timezone) {
		this.config.timezone = "local";
	}

	this.query  = new Query({dialect: this.dialect, timezone: this.config.timezone });
	utils.setCouldPool(this);
	utils.getKnexInstance(this);

	this.reconnect(null, connection);

	this.aggregate_functions = [ "ABS", "CEIL", "FLOOR", "ROUND",
	                             "AVG", "MIN", "MAX",
	                             "LOG", "LOG2", "LOG10", "EXP", "POWER",
	                             "ACOS", "ASIN", "ATAN", "COS", "SIN", "TAN",
	                             "CONV", [ "RANDOM", "RAND" ], "RADIANS", "DEGREES",
	                             "SUM", "COUNT",
	                             "DISTINCT"];
} as any as FxOrmDMLDriver.DMLDriverConstructor_MySQL;

util.extend(Driver.prototype, shared, DDL);

Driver.prototype.ping = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, cb: FxOrmNS.VoidCallback
) {
	this.db.ping(cb);
	return this;
};

Driver.prototype.on = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, ev: string, cb?: FxOrmNS.VoidCallback
) {
	if (ev == "error") {
		this.db.on("error", cb);
		this.db.on("unhandledError", cb);
	}
	return this;
};

Driver.prototype.connect = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, cb?: FxOrmNS.GenericCallback<FxOrmNS.IDbConnection>
) {
	let conn: FxOrmNS.IDbConnection = null;

	const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(() => {
		return this.db.connect()
	})

	Utilities.throwErrOrCallabckErrResult(syncResponse, { callback: cb });

	return syncResponse.result;
};

Driver.prototype.reconnect = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, cb?, connection?: FxOrmDb.DatabaseBase_MySQL
) {
	var connOpts = this.config.href || this.config;

	// Prevent noisy mysql driver output
	if (typeof connOpts == 'object') {
		connOpts = util.omit(connOpts, 'debug') as any;
	} else if (typeof connOpts == 'string') {
		connOpts = connOpts.replace("debug=true", "debug=false");
	}

	this.db = (connection ? connection : mysql.createConnection(connOpts as any));

	const conn = this.connect();

	if (typeof cb === 'function')
		cb(null, conn);

	return conn;
};

Driver.prototype.close = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, cb: FxOrmNS.VoidCallback
) {
	this.db.end(cb);
};

Driver.prototype.getQuery = function 
(
	this: FxOrmDMLDriver.DMLDriver_MySQL
): FxSqlQuery.Class_Query {
	return this.query;
};

Driver.prototype.execSimpleQuery = function<T=any> (
	query: string, cb: FxOrmNS.GenericCallback<T>
) {
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', query);
	}
	
	return this.db.query(query, cb);
};

Driver.prototype.find = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, fields, table, conditions, opts, cb?
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
		// OFFSET cannot be used without LIMIT so we use the biggest BIGINT number possible
		q.limit('18446744073709551615');
	}
	
	utils.buildOrderToQuery.apply(this, [q, opts.order]);
	q = utils.buildMergeToQuery.apply(this, [q, opts.merge, conditions]);
	utils.buildExistsToQuery.apply(this, [q, table, opts.exists]);

	return this.execSimpleQuery(q.build(), cb);
};

Driver.prototype.count = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, table, conditions, opts, cb?
) {
	var q = this.query.select()
	                  .from(table)
	                  .count(null, 'c');

	q = utils.buildMergeToQuery.apply(this, [q, opts.merge, conditions]);
	utils.buildExistsToQuery.apply(this, [q, table, opts.exists]);

	return this.execSimpleQuery(q.build(), cb);
};

Driver.prototype.insert = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, table, data, keyProperties, cb?
) {
	const q = this.query.insert()
	                  .into(table)
	                  .set(data)
	                  .build();

	const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(() => {
		const info = this.execSimpleQuery(q);

		const ids: FxOrmQuery.InsertResult = {};

		if (keyProperties) {
			if (keyProperties.length == 1 && info.hasOwnProperty("insertId") && info.insertId !== 0 ) {
				ids[keyProperties[0].name] = info.insertId;
			} else {
				for(let i = 0, prop: FxOrmProperty.NormalizedProperty; i < keyProperties.length; i++) {
					prop = keyProperties[i];
					ids[prop.name] = data[prop.mapsTo];
				}
			}
		}

		return ids
	})

	Utilities.throwErrOrCallabckErrResult(syncResponse, { callback: cb });

	return syncResponse.result;
};

Driver.prototype.update = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, table, changes, conditions, cb?
) {
	var q = this.query.update()
	                  .into(table)
	                  .set(changes)
	                  .where(conditions)
	                  .build();

	return this.execSimpleQuery(q, cb);
};

Driver.prototype.remove = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, table, conditions, cb?
) {
	var q = this.query.remove()
	                  .from(table)
	                  .where(conditions)
	                  .build();

	return this.execSimpleQuery(q, cb);
};

Driver.prototype.clear = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, table, cb?
) {
	var q = "TRUNCATE TABLE " + this.query.escapeId(table);

	return this.execSimpleQuery(q, cb);
};

Driver.prototype.valueToProperty = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, value, property
) {
	var customType;

	switch (property.type) {
		case "date":
			if (util.isNumber(value) || util.isString(value))
            	value = new Date(value);
			break;
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
		default:
			customType = this.customTypes[property.type];
			if(customType && 'valueToProperty' in customType) {
				value = customType.valueToProperty(value, property);
			}
	}
	return value;
};

Driver.prototype.propertyToValue = function (
	this: FxOrmDMLDriver.DMLDriver_MySQL, value, property
) {
	switch (property.type) {
		case "date":
			if (util.isNumber(value) || util.isString(value))
            	value = new Date(value);
			break;
		case "boolean":
			value = (value) ? 1 : 0;
			break;
		case "object":
			if (value !== null) {
				value = JSON.stringify(value);
			}
			break;
		case "point":
			return function() { return 'POINT(' + value.x + ', ' + value.y + ')'; };
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
