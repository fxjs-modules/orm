import { getDataStoreTransformer } from "../../Utils/transfomers";

export function filterPropertyToStoreData (
	unFilteredPropertyValues: Fibjs.AnyObject,
	model: any
) {
	// console.log('unFilteredPropertyValues', unFilteredPropertyValues);
	// console.log('Object.keys(model.properties)', Object.keys(model.properties));
	// console.log('Object.values(model.properties)', Object.values(model.properties));
	const transformer = getDataStoreTransformer(model.dbdriver.type);
	
	const filteredKvs = <typeof unFilteredPropertyValues>{};
	Object.values(model.properties).forEach((prop: FxOrmProperty.NormalizedProperty) => {
		if (unFilteredPropertyValues.hasOwnProperty(prop.name))
			filteredKvs[prop.mapsTo] = transformer.propertyToValue(
				unFilteredPropertyValues[prop.name],
				prop, {}
			)
		else if (unFilteredPropertyValues.hasOwnProperty(prop.mapsTo))
			filteredKvs[prop.mapsTo] = transformer.propertyToValue(
				unFilteredPropertyValues[prop.mapsTo],
				prop, {}
			)
	})

	return filteredKvs
}
export function fillStoreDataToProperty (
	storeData: Fibjs.AnyObject,
	model: any,
	targetProps: Fibjs.AnyObject = {}
) {
	const transformer = getDataStoreTransformer(model.dbdriver.type);

	Object.values(model.properties).forEach((prop: FxOrmProperty.NormalizedProperty) => {
		if (storeData.hasOwnProperty(prop.mapsTo))
			targetProps[prop.name] = transformer.valueToProperty(
				storeData[prop.mapsTo],
				prop,
				{}
			)
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