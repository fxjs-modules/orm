export function use_propertyToStoreValue (
    value: any,
    customType?: FxOrmProperty.CustomProperty
) {
    if (customType && typeof customType.propertyToStoreValue === 'function') {
        value = customType.propertyToStoreValue(value);
    }

    return value
}

export function use_valueToProperty (
    value: any,
    customType?: FxOrmProperty.CustomProperty
) {
    if (customType && typeof customType.valueToProperty === 'function') {
        value = customType.valueToProperty(value);
    }

    return value
}
