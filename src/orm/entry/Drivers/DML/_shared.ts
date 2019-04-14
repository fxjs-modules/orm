export function execQuery <T = any>(
	this: FxOrmDMLDriver.DMLDriver,
) {
	var query: string, cb: FxOrmNS.GenericCallback<T>;
	if (arguments.length == 2) {
		query = arguments[0];
		cb    = arguments[1];
	} else if (arguments.length == 3) {
		query = this.query.escape(arguments[0], arguments[1]);
		cb    = arguments[2];
	}
	return this.execSimpleQuery(query, cb);
}

export function eagerQuery<T = any> (
	this: FxOrmDMLDriver.DMLDriver,
	association: FxOrmAssociation.InstanceAssociationItem,
	opts: FxOrmQuery.ChainFindOptions,
	keys: string[],
	cb: FibOrmNS.ExecutionCallback<T>
) {
	var desiredKey = Object.keys(association.field as FxOrmProperty.NormalizedPropertyHash);
	var assocKey = Object.keys(association.mergeAssocId);

	var where = <{[k: string]: string[]}>{};
	// TODO: how about composite association keys?
	desiredKey.forEach((dk) => {
		where[dk] = keys;
	});

	var query = this.query.select()
		.from(association.model.table)
		.select(opts.only)
		.from(association.mergeTable, assocKey, opts.keys)
		.select(desiredKey).as("$p")
		.where(association.mergeTable, where)
		.build();

	return this.execSimpleQuery(query, cb);
}
