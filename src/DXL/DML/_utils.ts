import util = require('util');

import * as QueryGrammers from '../../Base/Query/QueryGrammar';
import { arraify } from '../../Utils/array';

export function filterKnexBuilderBeforeQuery (
	builder: any,
	beforeQuery: Function | Function[],
	ctx?: any
) {
	if (Array.isArray(beforeQuery)) {
		beforeQuery.forEach(bQ => {
			builder = filterKnexBuilderBeforeQuery(builder, bQ, ctx)
		})

		return builder
	}

	if (typeof beforeQuery === 'function') {
		const kqbuilder = beforeQuery(builder, ctx)

		if (kqbuilder)
			builder = kqbuilder
	}

	return builder
}

export function filterWhereToKnexActions (
    opts: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>
) {
    if (!opts) return
    const { where = null } = opts || {}
    if (!where) return

    const flattenedWhere: {[k: string]: Exclude<any, symbol>} = {};

    const bQList = (opts.beforeQuery ? arraify(opts.beforeQuery) : []).filter(x => typeof x === 'function')

    opts.beforeQuery = bQList

    // @todo: deal with case fieldName is symbol, which woudnt' read by Object.keys(where)
    Object.keys(where).forEach((fieldName: string) => {
        if (!util.isObject(where[fieldName])) {
            flattenedWhere[fieldName] = where[fieldName];
            return ;
        }
        // @todo: deal with array-type where[fieldName]
        if (Array.isArray(where[fieldName])) {
            const values = where[fieldName];
            bQList.push((builder) => {
                builder.whereIn(fieldName, values)
            })
            return
        }

        /**
         * @notice all non-operator symbol-index(string, number) would be ignored
         */
        const fieldOpSyms = Object.getOwnPropertySymbols(where[fieldName])

        const v = where[fieldName];

        // const oldBeforeQuery = opts.beforeQuery
        bQList.push(function (builder, ctx) {
            // if (typeof oldBeforeQuery === 'function') oldBeforeQuery.apply(null, arguments)

            fieldOpSyms.forEach(symbol => {
                switch (symbol) {
                    case QueryGrammers.Ql.Operators.eq:
                        builder.where(fieldName, '=', v[QueryGrammers.Ql.Operators.eq])
                        break
                    case QueryGrammers.Ql.Operators.ne:
                        // builder.whereNot(fieldName, '<>', v[QueryGrammers.Ql.Operators.ne])
                        builder.whereNot(fieldName, '=', v[QueryGrammers.Ql.Operators.ne])
                        break
                    case QueryGrammers.Ql.Operators.gt:
                        builder.where(fieldName, '>', v[QueryGrammers.Ql.Operators.gt])
                        break
                    case QueryGrammers.Ql.Operators.gte:
                        builder.where(fieldName, '>=', v[QueryGrammers.Ql.Operators.gte])
                        break
                    case QueryGrammers.Ql.Operators.lt:
                        builder.where(fieldName, '<', v[QueryGrammers.Ql.Operators.lt])
                        break
                    case QueryGrammers.Ql.Operators.lte:
                        builder.where(fieldName, '<=', v[QueryGrammers.Ql.Operators.lte])
                        break
                    case QueryGrammers.Ql.Operators.is:
                        builder.where(fieldName, v[QueryGrammers.Ql.Operators.is])
                        break
                    case QueryGrammers.Ql.Operators.not:
                        builder.whereNot(fieldName, v[QueryGrammers.Ql.Operators.not])
                        break
                    case QueryGrammers.Ql.Operators.in:
                        builder.whereIn(fieldName, v[QueryGrammers.Ql.Operators.in])
                        break
                    case QueryGrammers.Ql.Operators.notIn:
                        builder.whereNotIn(fieldName, v[QueryGrammers.Ql.Operators.notIn])
                        break
                    case QueryGrammers.Ql.Operators.between:
                        builder.whereBetween(fieldName, v[QueryGrammers.Ql.Operators.between])
                        break
                    case QueryGrammers.Ql.Operators.notBetween:
                        builder.whereNotBetween(fieldName, v[QueryGrammers.Ql.Operators.notBetween])
                        break
                    case QueryGrammers.Ql.Operators.like:
                        builder.where(fieldName, 'like', v[QueryGrammers.Ql.Operators.like])
                        break
                    case QueryGrammers.Ql.Operators.startsWith:
                        builder.where(fieldName, 'like', `${v[QueryGrammers.Ql.Operators.like]}%`)
                        break
                    case QueryGrammers.Ql.Operators.endsWith:
                        builder.where(fieldName, 'like', `%${v[QueryGrammers.Ql.Operators.like]}`)
                        break
                    case QueryGrammers.Ql.Operators.substring:
                        builder.where(fieldName, 'like', `%${v[QueryGrammers.Ql.Operators.like]}%`)
                        break
                    case QueryGrammers.Ql.Operators.notLike:
                        builder.whereNot(fieldName, 'like', v[QueryGrammers.Ql.Operators.notLike])
                        break
                }
            });
        })
    });

    opts.where = flattenedWhere
}

export function getFindOptionValueIfNotFunc (optValue: Function | any) {
	if (typeof optValue === 'function')
		return optValue.apply(null, [])

	return optValue
}

export function filterResultAfterQuery (
	result: any,
	afterQuery: Function
) {
	if (typeof afterQuery === 'function') {
		result = afterQuery(result)
	}

	return result
}
