import type {
	FxSqlQueryChainBuilder,
	FxSqlQuerySubQuery
} from "@fxjs/sql-query";

import type { FxOrmDMLDriver } from "../../Typo/DMLDriver";

import { parseTableInputForSelect } from "../../Utilities";

export function buildBaseConditionsToQuery (
	this: FxOrmDMLDriver.DMLDriver,
	q: FxSqlQueryChainBuilder.ChainBuilder__Select,
	base_table: string,
	base_conditions: FxSqlQuerySubQuery.SubQueryConditions,
) {
	if (base_conditions && Object.keys(base_conditions).length) {
		q = q.where(base_table, base_conditions);
	}

	return q;
}

export function buildMergeToQuery (
	this: FxOrmDMLDriver.DMLDriver,
	q: FxSqlQueryChainBuilder.ChainBuilder__Select,
	merges: FxOrmDMLDriver.DMLDriver_FindOptions['merge'],
) {
	if (merges?.length) {			
		merges.forEach(merge => {
			/**
			 * you should always pass alias as `merge.from.table` --- it's need indicate where base_conditions;
			 * you dont need pass alias as `merge.to.table` --- it's dont need indicate where base_conditions;
			 */
			q
				.from(merge.from.table, merge.from.field, merge.to.table, merge.to.field)
				.select(merge.select);
			
			/**
			 * this means merge where base_conditions is not empty
			 * 
			 * merge.where[0] is aliased table name,
			 * merge.where[1] is where base_conditions
			 */
			if (merge.where && Object.keys(merge.where[1]).length) {
				q = q.where(merge.where[0], merge.where[1]);
			}			
		});
	}

	return q;
}

export function buildExistsToQuery (
	this: FxOrmDMLDriver.DMLDriver,
	q: FxSqlQueryChainBuilder.ChainBuilder__Select,
	table_alias: string,
	exists: FxOrmDMLDriver.DMLDriver_FindOptions['exists'],
) {
	if (exists) {
		for (let k in exists) {
			const exist_item = exists[k];
			q.whereExists(
				exist_item.table,
				table_alias,
				exist_item.link,
				exist_item.conditions
			);
		}
	}
}

export function buildOrderToQuery (
	this: FxOrmDMLDriver.DMLDriver,
	q: FxSqlQueryChainBuilder.ChainBuilder__Select,
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
		throw new Error(`[getKnexInstance] driver.query.knex must be init firstly!`);

	Object.defineProperty(driver, 'knex', {
		get () {
			return driver.getQuery().knex;
		},
		configurable: false,
	});
}

export function buildMergeToKnex (
	this: FxOrmDMLDriver.DMLDriver,
	knex: import ("@fxjs/knex").Knex,
	merges: FxOrmDMLDriver.DMLDriver_FindOptions['merge'],
	conditions: FxSqlQuerySubQuery.SubQueryConditions
) {
	
}

export function setCouldPool (
	driver: FxOrmDMLDriver.DMLDriver
) {
	Object.defineProperty(driver, 'isPool', {
		get () {
			return driver.db.isPool
		}
	});
}