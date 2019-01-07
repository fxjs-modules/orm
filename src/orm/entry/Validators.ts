import enforce = require("@fibjs/enforce");
import util    = require("util");

export const required       : enforce.enforcementValidation = enforce.required
export const notEmptyString : enforce.enforcementValidation = enforce.notEmptyString

export const rangeNumber    : enforce.enforcementValidation = enforce.ranges.number
export const rangeLength    : enforce.enforcementValidation = enforce.ranges.length

export const insideList     : enforce.enforcementValidation = enforce.lists.inside
export const outsideList    : enforce.enforcementValidation = enforce.lists.outside

export const password       : enforce.enforcementValidation = enforce.security.password

export const patterns       : enforce.enforcementsContainer = enforce.patterns

/**
 * Check if a value is the same as a value
 * of another property (useful for password
 * checking).
 **/
export function equalToProperty (name: string, msg?: string): enforce.ValidationCallback {
	return function (v, next) {
		if (v === this[name]) {
			return next();
		}
		return next(msg || 'not-equal-to-property');
	};
};

/**
 * Check if a property is unique in the collection.
 * This can take a while because a query has to be made against the Model.
 *
 * Due to the async nature of node, and concurrent web server environments,
 * an index on the database column is the only way to gurantee uniqueness.
 *
 * For sensibility's sake, undefined and null values are ignored for uniqueness
 * checks.
 *
 * Options:
 *   ignoreCase: for postgres; mysql ignores case by default.
 *   scope: (Array) scope uniqueness to listed properties
 **/
export function unique (
	opts: {
		ignoreCase?: boolean,
		scope?: string[]
	} = {},
	msg: string = null
): enforce.ValidationCallback {
	for (let k in arguments) {
		const arg = arguments[k];
		if (typeof arg === "string") {
			msg = arg;
		} else if (typeof arg === "object") {
			opts = arg;
		}
	}

	return function (v, next, ctx) {
		if (typeof v === "undefined" || v === null) {
			return next();
		}

		// Cannot process on database engines which don't support SQL syntax
		if (!ctx.driver.isSql) {
			return next('not-supported');
		}

		var chain: FxOrmQuery.IChainFind = ctx.model.find();

		var chainQuery = function (prop, value) {
			var query: string | FxOrmModel.ModelQueryConditions__Find = null;

			if (opts.ignoreCase === true && ctx.model.properties[prop] && ctx.model.properties[prop].type === 'text') {
				query = util.format('LOWER(%s.%s) LIKE LOWER(?)',
					ctx.driver.query.escapeId(ctx.model.table), ctx.driver.query.escapeId(prop)
				);
				chain.where(query, [value]);
			} else {
				query = {};
				query[prop] = value;
				chain.where(query);
			}
		};

		var handler = function (err: Error, records: FxOrmInstance.Instance) {
			if (err) {
				return next();
			}
			if (!records || records.length === 0) {
				return next();
			}
			if (records.length === 1 && records[0][ctx.model.id] === this[ctx.model.id]) {
				return next();
			}
			return next(msg || 'not-unique');
		}.bind(this);

		chainQuery(ctx.property, v);

		if (opts.scope) {
			for (let s in opts.scope) {
				let scopeProp = opts.scope[s];

				// In SQL unique index land, NULL values are not considered equal.
				if (typeof ctx.instance[scopeProp] == 'undefined' || ctx.instance[scopeProp] === null) {
					return next();
				}

				chainQuery(scopeProp, ctx.instance[scopeProp]);
			}
		}

		chain.all(handler);
	};
};
