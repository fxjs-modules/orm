import util = require('util')

import {
	FxSqlQuerySql,
	FxSqlQueryComparator,
} from '@fxjs/sql-query';
import { FxOrmInstance } from '../Typo/instance';
import { FxOrmModel } from '../Typo/model';
import { isModelConjunctionsKey } from './common';

function isNumbericDate(v: any) {
	if (isNaN(v)) return false;
	if (typeof v === 'number') return true;
	if (typeof v === 'string') {
		return !isNaN(parseInt(v))
	}

	return false;
}

const whereCondKeys = ['val', 'from', 'to'] as (keyof FxSqlQuerySql.DetailedQueryWhereCondition)[];
const queryComparators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte'] as (FxSqlQueryComparator.ComparatorNameType)[];
const ALL_FILTER_KEYS: (
	keyof FxSqlQuerySql.DetailedQueryWhereCondition
	| FxSqlQueryComparator.ComparatorNameType
)[] = [].concat(whereCondKeys).concat(queryComparators);
/**
 * filter the Date-Type SelectQuery Property corresponding item when call find-like executor ('find', 'get', 'where')
 * @TODO add test about i
 *  
 * @param conds 
 */
// value  | FxSqlQueryComparator.ComparatorNameType
export function filterDate(
	conds: FxOrmInstance.InstanceDataPayload,
	m: {
		properties: FxOrmModel.Model['allProperties']
	}
) {
	if (typeof conds !== 'object') {
        return ;
	}

	for (let k in conds) {
		if (isModelConjunctionsKey(k))
			Array.isArray(conds[k]) && conds[k].forEach((item: any) => filterDate(item, m));
		else {
			let p = m.properties[k];
			if (p && p.type === 'date') {
				let v: any = conds[k];

				if (!util.isDate(v)) {
					if (util.isNumber(v) || util.isString(v))
						conds[k] = new Date(isNumbericDate(v) ? parseInt(v) : v);
					else if (util.isObject(v)) {
						ALL_FILTER_KEYS.forEach(c => {
							let v1 = v[c];

							if (Array.isArray(v1)) {
								v1.forEach((v2: any, i) => {
									if (!util.isDate(v2))
										v1[i] = new Date(v2);
								});
							} else if (v1 !== undefined && !util.isDate(v1)) {
								v[c] = new Date(isNumbericDate(v1) ? parseInt(v1) : v1);
							}
						});
					}
				}
			}
		}
	}
}