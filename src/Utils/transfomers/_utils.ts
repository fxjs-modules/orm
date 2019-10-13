export function use_propertyToValue (
    value: any,
    customType?: FxOrmProperty.CustomPropertyType
) {
    if (customType && typeof customType.propertyToValue === 'function') {
        value = customType.propertyToValue(value);
    }

    return value
}

export function use_valueToProperty (
    value: any,
    customType?: FxOrmProperty.CustomPropertyType
) {
    if (customType && typeof customType.valueToProperty === 'function') {
        value = customType.valueToProperty(value);
    }

    return value
}