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
	builer: any,
	beforeQuery: Function,
	ctx?: any
) {
	if (typeof beforeQuery === 'function') {
		const kqbuilder = beforeQuery(builer, ctx)

		if (kqbuilder)
			builer = kqbuilder
	}

	return builer
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