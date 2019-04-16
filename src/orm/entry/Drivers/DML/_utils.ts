import { parseFallbackTableAlias } from "../../Utilities";

export function buildMergeToQuery (
	this: FxOrmDMLDriver.DMLDriver,
	q: FxSqlQuery.ChainBuilder__Select,
	merges: FxOrmDMLDriver.DMLDriver_FindOptions['merge'],
	conditions: FxSqlQuerySubQuery.SubQueryConditions
) {
	if (merges && merges.length) {			
		merges.forEach(merge => {
			/**
			 * you should always pass alias as `merge.from.table` --- it's need indicate where conditions;
			 * you dont need pass alias as `merge.to.table` --- it's dont need indicate where conditions;
			 */
			q
				.from(merge.from.table, merge.from.field, merge.to.table, merge.to.field)
				.select(merge.select);
			
			if (merge.where && Object.keys(merge.where[1]).length) {
				q = q.where(merge.where[0], merge.where[1], merge.table || null, conditions);
			} else {
				q = q.where(merge.table || null, conditions);
			}
		});
	} else {
		q = q.where(conditions);
	}

	return q;
}

export function buildExistsToQuery (
	this: FxOrmDMLDriver.DMLDriver,
	q: FxSqlQuery.ChainBuilder__Select,
	table: string,
	exists: FxOrmDMLDriver.DMLDriver_FindOptions['exists'],
) {
	if (exists) {
		for (let k in exists) {
			const exist_item = exists[k];
			q.whereExists(
				exist_item.table,
				parseFallbackTableAlias(table),
				exist_item.link,
				exist_item.conditions
			);
		}
	}
}

export function buildOrderToQuery (
	this: FxOrmDMLDriver.DMLDriver,
	q: FxSqlQuery.ChainBuilder__Select,
	order: FxOrmDMLDriver.DMLDriver_FindOptions['order'],
) {
	if (order) {
		for (let i = 0; i < order.length; i++) {
			q.order(order[i][0], order[i][1]);
		}
	}
}

export function getKnexInstance (
	driver: FxOrmDMLDriver.DMLDriver
) {
	if (!driver.query.knex)
		throw `driver.query.knex must be init firstly!`
	Object.defineProperty(driver, 'knex', {
		value: driver.knex,
		configurable: false,
		writable: false
	});
}

export function buildMergeToKnex (
	this: FxOrmDMLDriver.DMLDriver,
	knex: FXJSKnex.FXJSKnexModule.KnexInstance,
	merges: FxOrmDMLDriver.DMLDriver_FindOptions['merge'],
	conditions: FxSqlQuerySubQuery.SubQueryConditions
) {
	
}