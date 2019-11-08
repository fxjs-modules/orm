module MongoDB {
    export const storeType = 'sqlite'

    export function valueToProperty(
        value: any,
        property: FxOrmProperty.NormalizedProperty,
        customTypes: FxOrmDTransformer.CustomTypes
    ) {
        return value;
    }
    export function propertyToStoreValue(
        value: any,
        property: FxOrmProperty.NormalizedProperty,
        customTypes: FxOrmDTransformer.CustomTypes
    ) {
        return value;
    }
}

export = MongoDB as FxOrmDTransformer.Transformer
