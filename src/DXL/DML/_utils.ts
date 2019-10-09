import util = require('util');

import { Operators } from '../../Base/Query/Operator';
import { arraify } from '../../Utils/array';

export function filterPropertyToStoreData (
	unFilteredPropertyValues: Fibjs.AnyObject,
	properties: any,
	targetDataSet: Fibjs.AnyObject = {}
) {
	Object.values(properties).forEach((prop: FxOrmProperty.NormalizedProperty) => {
		if (unFilteredPropertyValues.hasOwnProperty(prop.name))
			targetDataSet[prop.mapsTo] = prop.toStoreValue(unFilteredPropertyValues[prop.name])
		else if (unFilteredPropertyValues.hasOwnProperty(prop.mapsTo))
			targetDataSet[prop.mapsTo] = prop.toStoreValue(unFilteredPropertyValues[prop.mapsTo])
	})

	return targetDataSet
}
export function fillStoreDataToProperty (
	storeData: Fibjs.AnyObject,
	properties: any,
	targetProps: Fibjs.AnyObject = {}
) {
	Object.values(properties).forEach((prop: FxOrmProperty.NormalizedProperty) => {
		if (storeData.hasOwnProperty(prop.mapsTo))
			targetProps[prop.name] = prop.fromStoreValue(storeData[prop.mapsTo])
	})

	return targetProps
}

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

    // if (where[Operators.or])

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
                    case Operators.eq:
                        builder.where(fieldName, '=', v[Operators.eq])
                        break
                    case Operators.ne:
                        // builder.whereNot(fieldName, '<>', v[Operators.ne])
                        builder.whereNot(fieldName, '=', v[Operators.ne])
                        break
                    case Operators.gt:
                        builder.where(fieldName, '>', v[Operators.gt])
                        break
                    case Operators.gte:
                        builder.where(fieldName, '>=', v[Operators.gte])
                        break
                    case Operators.lt:
                        builder.where(fieldName, '<', v[Operators.lt])
                        break
                    case Operators.lte:
                        builder.where(fieldName, '<=', v[Operators.lte])
                        break
                    case Operators.is:
                        builder.where(fieldName, v[Operators.is])
                        break
                    case Operators.not:
                        builder.whereNot(fieldName, v[Operators.not])
                        break
                    case Operators.in:
                        builder.whereIn(fieldName, v[Operators.in])
                        break
                    case Operators.notIn:
                        builder.whereNotIn(fieldName, v[Operators.notIn])
                        break
                    case Operators.between:
                        builder.whereBetween(fieldName, v[Operators.between])
                        break
                    case Operators.notBetween:
                        builder.whereNotBetween(fieldName, v[Operators.notBetween])
                        break
                    case Operators.like:
                        builder.where(fieldName, 'like', v[Operators.like])
                        break
                    case Operators.startsWith:
                        builder.where(fieldName, 'like', `${v[Operators.like]}%`)
                        break
                    case Operators.endsWith:
                        builder.where(fieldName, 'like', `%${v[Operators.like]}`)
                        break
                    case Operators.substring:
                        builder.where(fieldName, 'like', `%${v[Operators.like]}%`)
                        break
                    case Operators.notLike:
                        builder.whereNot(fieldName, 'like', v[Operators.notLike])
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