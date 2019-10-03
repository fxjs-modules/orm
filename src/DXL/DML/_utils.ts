export function buildOrderToQuery (
	q: FxSqlQuery.ChainBuilder__Select,
	order: FxOrmDMLDriver.DMLDriver_FindOptions['order'],
) {
	if (order) {
		for (let i = 0; i < order.length; i++) {
			q.order(order[i][0], order[i][1]);
		}
	}
}