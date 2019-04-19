import util = require('util')
import * as Utilities from '../../Utilities';

export function execQuery <T = any>(
	this: FxOrmDMLDriver.DMLDriver,
) {
	var query: string, cb: FxOrmNS.GenericCallback<T>;
	const args = Array.prototype.slice.apply(arguments);

	if (typeof util.last(args) === 'function')
		cb = args.pop();

	query = this.query.escape.apply(this.query, args);
	return this.execSimpleQuery(query, cb);
}

export function eagerQuery<T = any> (
	this: FxOrmDMLDriver.DMLDriver,
	association: FxOrmAssociation.InstanceAssociationItem,
	opts: FxOrmQuery.ChainFindOptions,
	keys: string[],
	cb: FibOrmNS.ExecutionCallback<T>
) {
	var desiredKey = Object.keys(association.field);
	var assocKey = Object.keys(association.mergeAssocId);

	var where = <{[k: string]: string[]}>{};
	// TODO: what if $p has composite association keys?
	where[desiredKey[0]] = keys;

	var query = this.query.select()
		.from(association.model.table)
		.select(opts.only)
		.from(association.mergeTable, assocKey, opts.keys)
		.select(desiredKey).as("$p")
		.where(association.mergeTable, where)
		.build();

	return this.execSimpleQuery(query, cb);
}

export const poolQuery: FxOrmDMLDriver.DMLDriver['poolQuery'] = function (
	this: FxOrmDMLDriver.DMLDriver, query, cb?
) {
	return this.db.query(query, cb);
};

export function execQuerySync(
    this: FxOrmDMLDriver.DMLDriver,
    query: string,
    opt: FxSqlQuerySql.SqlEscapeArgType[]
) {
    if (arguments.length == 2)
        query = this.query.escape(query, opt);

    return this.db.execute(query);
}