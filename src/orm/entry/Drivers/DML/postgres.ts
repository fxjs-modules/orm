/// <reference lib="es2015" />

import util       = require("util");

const pg 			= require("pg");
import shared  		= require("./_shared");
import DDL     		= require("../DDL/SQL");
import { Query }	from "@fxjs/sql-query";
import utils		= require("./_utils");

var switchableFunctions = {
	pool: {
		connect: function<T = any> (cb: FxOrmNS.GenericCallback<T>) {
			this.db.connect(this.config, function (err: FxOrmError.ExtendedError, client: any, done: Function) {
				if (!err) {
					done();
				}
				cb(err);
			});
		},
		execSimpleQuery: function<T extends {rows: any} = any> (query: string, cb: FxOrmNS.GenericCallback<T>) {
			if (this.opts.debug) {
				require("../../Debug").sql('postgres', query);
			}
			this.db.connect(this.config, function (err: FxOrmError.ExtendedError, client: any, done: Function) {
				if (err) {
					return cb(err);
				}

				client.query(query, function (err: FxOrmError.ExtendedError, result: T) {
					done();

					if (err) {
						cb(err);
					} else {
						cb(null, result.rows);
					}
				});
			});
			return this;
		},
		on: function<T = any> (ev: string, cb: FxOrmNS.GenericCallback<T>) {
			// Because `pg` is the same for all instances of this driver
			// we can't keep adding listeners since they are never removed.
			return this;
		}
	},
	client: {
		connect: function<T = any> (cb: FxOrmNS.GenericCallback<T>) {
			this.db.connect(cb);
		},
		execSimpleQuery: function<T extends {rows: any} = any> (query: string, cb: FxOrmNS.GenericCallback<T>) {
			if (this.opts.debug) {
				require("../../Debug").sql('postgres', query);
			}
			this.db.query(query, function (err: FxOrmError.ExtendedError, result: T) {
				if (err) {
					cb(err);
				} else {
					cb(null, result.rows);
				}
			});
			return this;
		},
		on: function<T = any> (ev: string, cb: FxOrmNS.GenericCallback<T>) {
			if (ev == "error") {
				this.db.on("error", cb);
			}
			return this;
		}
	}
};

export const Driver: FxOrmDMLDriver.DMLDriverConstructor = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL, config: FxOrmNS.IDBConnectionConfig, connection: FxOrmDb.DatabaseBase_PostgreSQL, opts: FxOrmDMLDriver.DMLDriverOptions
) {
	var functions = switchableFunctions.client;

	this.dialect = 'postgresql';
	this.config = config || <FxOrmNS.IDBConnectionConfig>{};
	this.opts   = opts || <FxOrmDMLDriver.DMLDriverOptions>{};

	if (!this.config.timezone) {
		this.config.timezone = "local";
	}

	this.query  = new Query({ dialect: this.dialect, timezone: this.config.timezone });

	this.customTypes = {};

	if (connection) {
		this.db = connection;
	} else {
		if (this.config.query && this.config.query.ssl) {
			config.ssl = true;
			this.config = util.extend(this.config, config);
		// } else {
		// 	this.config = util.extend(this.config, config);
		// 	this.config = config.href || config;
		}

		pg.types.setTypeParser(20, Number);

		if (opts.pool) {
			functions = switchableFunctions.pool;
			this.db = pg;
		} else {
			this.db = new pg.Client(this.config);
		}
	}

	util.extend(this.constructor.prototype, functions);

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

Driver.prototype.ping = function<T = any> (cb: FxOrmNS.SuccessCallback<T>) {
	this.execSimpleQuery("SELECT * FROM pg_stat_activity LIMIT 1", function () {
		return cb();
	});
	return this;
};

Driver.prototype.close = function<T = any> (cb: FxOrmNS.SuccessCallback<T>) {
	this.db.end();

	if (typeof cb == "function") cb();

	return;
};

Driver.prototype.getQuery = function () {
	return this.query;
};

Driver.prototype.execSimpleQuery = function (
	this: FxOrmDMLDriver.DMLDriver_PostgreSQL, query, cb
) {
	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', query);
	}
	return this.db.query(query, cb);
};

Driver.prototype.find = function (fields, table, conditions, opts, cb: FxOrmNS.GenericCallback<any>) {
	var q = this.query.select().from(table).select(fields);

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

	
	utils.buildOrderToQuery.apply(this, [q, opts.order]);
	q = utils.buildMergeToQuery.apply(this, [q, opts.merge, conditions]);
	utils.buildExistsToQuery.apply(this, [q, table, opts.exists]);

	q = q.build();

	this.execSimpleQuery(q, cb);
};

Driver.prototype.count = function (table, conditions, opts, cb) {
	var q = this.query.select().from(table).count(null, 'c');

	q = utils.buildMergeToQuery.apply(this, [q, opts.merge, conditions]);
	utils.buildExistsToQuery.apply(this, [q, table, opts.exists]);

	q = q.build();

	this.execSimpleQuery(q, cb);
};

Driver.prototype.insert = function (table, data, keyProperties, cb) {
	var q = this.query.insert().into(table).set(data).build();

	this.execSimpleQuery(q + " RETURNING *", function (err: FxOrmError.ExtendedError, results: any) {
		if (err) {
			return cb(err);
		}

		var ids: {[k: string]: any} = {},
			prop;

		if (keyProperties) {
			for (let i = 0; i < keyProperties.length; i++) {
				prop = keyProperties[i];
                                // Zero is a valid value for an ID column
				ids[prop.name] = results[0][prop.mapsTo] !== undefined ? results[0][prop.mapsTo] : null;
			}
		}
		return cb(null, ids);
	});
};

Driver.prototype.update = function (table, changes, conditions, cb) {
	var q = this.query.update().into(table).set(changes).where(conditions).build();

	this.execSimpleQuery(q, cb);
};

Driver.prototype.remove = function (table, conditions, cb) {
	var q = this.query.remove().from(table).where(conditions).build();

	this.execSimpleQuery(q, cb);
};

Driver.prototype.clear = function (table, cb) {
	var q = "TRUNCATE TABLE " + this.query.escapeId(table);

	this.execSimpleQuery(q, cb);
};

Driver.prototype.valueToProperty = function (value, property) {
	var customType, v;

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
				var m = value.match(/\((\-?[\d\.]+)[\s,]+(\-?[\d\.]+)\)/);

				if (m) {
					value = { x : parseFloat(m[1]) , y : parseFloat(m[2]) };
				}
			}
			break;
		case "date":
			if (util.isDate(value) && this.config.timezone && this.config.timezone != 'local') {
				var tz = convertTimezone(this.config.timezone);

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

Driver.prototype.propertyToValue = function (value, property) {
	var customType;

	switch (property.type) {
		case "object":
			if (value !== null && !Buffer.isBuffer(value)) {
				value = new Buffer(JSON.stringify(value));
			}
			break;
		case "date":
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
