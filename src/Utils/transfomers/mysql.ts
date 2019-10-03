import util = require('util')

export function valueToProperty (
    value: any,
    property: FxOrmProperty.NormalizedProperty,
    customTypes: FxOrmDMLDriver.DMLDriver['customTypes']
) {
	var customType;

	switch (property.type) {
		case "date":
			if (util.isNumber(value) || util.isString(value))
            	value = new Date(value);
			break;
		case "boolean":
			value = !!value;
			break;
		case "object":
			if (typeof value == "object" && !Buffer.isBuffer(value)) {
				break;
			}
			try {
				value = JSON.parse(value);
			} catch (e) {
				value = null;
			}
			break;
		default:
			customType = customTypes[property.type];
			if(customType && 'valueToProperty' in customType) {
				value = customType.valueToProperty(value);
			}
	}
	return value;
};

export function propertyToValue (
    value: any,
    property: FxOrmProperty.NormalizedProperty,
    customTypes: FxOrmDMLDriver.DMLDriver['customTypes']
) {
	switch (property.type) {
		case "date":
			if (util.isNumber(value) || util.isString(value))
            	value = new Date(value);
			break;
		case "boolean":
			value = (value) ? 1 : 0;
			break;
		case "object":
			if (value !== null) {
				value = JSON.stringify(value);
			}
			break;
		case "point":
			return function() { return 'POINT(' + value.x + ', ' + value.y + ')'; };
		default:
			const customType = customTypes[property.type];
			if(customType && 'propertyToValue' in customType) {
				value = customType.propertyToValue(value);
			}
	}
	return value;
};