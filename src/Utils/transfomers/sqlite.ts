import util = require('util')

export function valueToProperty(
    value: any,
    property: FxOrmProperty.NormalizedProperty,
    customTypes: FxOrmDMLDriver.DMLDriver['customTypes']
) {
    let v, customType;

    if (typeof customTypes)
        customTypes = customTypes || {};

    switch (property.type) {
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
        case "number":
            if (typeof value === 'string') {
                switch (value.trim()) {
                    case 'Infinity':
                    case '-Infinity':
                    case 'NaN':
                        value = Number(value);
                        break;
                    default:
                        v = parseFloat(value);
                        if (Number.isFinite(v)) {
                            value = v;
                        }
                }
            }
            break;
        case "integer":
            if (typeof value === 'string') {
                v = parseInt(value);

                if (Number.isFinite(v)) {
                    value = v;
                }
            }
            break;
        case "date":
            if (util.isNumber(value) || util.isString(value))
                value = new Date(value);

            break;
        default:
            customType = customTypes[property.type];
            if (customType && typeof customType.valueToProperty === 'function') {
                value = customType.valueToProperty(value, property);
            }
    }
    return value;
}

export function propertyToValue (
    value: any,
    property: FxOrmProperty.NormalizedProperty,
    customTypes: FxOrmDMLDriver.DMLDriver['customTypes']
) {
	switch (property.type) {
		case "boolean":
			value = (value) ? 1 : 0;
			break;
		case "object":
			if (value !== null) {
				value = JSON.stringify(value);
			}
			break;
		case "date":
			if (util.isNumber(value) || util.isString(value))
            	value = new Date(value);
			break;
		default:
			const customType = customTypes[property.type];
            if (customType && typeof customType.propertyToValue === 'function') {
                value = customType.propertyToValue(value, property);
            }
	}
	return value;
}