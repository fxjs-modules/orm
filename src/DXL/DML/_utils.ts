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

export function filterResultAfterQuery (
	result: any,
	afterQuery: Function
) {
	if (typeof afterQuery === 'function') {
		result = afterQuery(result)
	}

	return result
}