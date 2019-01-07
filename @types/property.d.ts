declare namespace FxOrmProperty {
    interface CustomPropertyType extends FxOrmSqlDDLSync__Driver.CustomPropertyType {
        datastoreType: {
            (prop?: FxOrmProperty.NormalizedProperty): string
        }
        valueToProperty?: {
            (value?: any, prop?: FxOrmProperty.NormalizedProperty)
        }
        propertyToValue?: {
            (value?: any, prop?: FxOrmProperty.NormalizedProperty)
        }
        datastoreGet?: {
            (prop?: FxOrmProperty.NormalizedProperty, helper?: FxSqlQuery.Class_Query): any
        }
    }
    /**
     * @description useful when pass property's option(such as type, big, ...etc) internally, useless for exposed api.
     */
    interface NormalizedFieldOptions {
        key: boolean
        type: string

        size: number | string
        unsigned: boolean
        time: boolean
        big: boolean
        values: any[]
        required: boolean
        name: string
        mapsTo: FxOrmModel.ModelPropertyDefinition['mapsTo']
    }

    interface NormalizedFieldOptionsHash {
        [k: string]: FxOrmProperty.NormalizedFieldOptions
    }

    interface NormalizedProperty extends FxOrmModel.ModelPropertyDefinition {
        // all fields inherited from `FxOrmModel.ModelPropertyDefinition` are still optional

        rational?: boolean
        klass?: string
        lazyload?: boolean
        lazyname?: string
    }

    interface NormalizedPropertyHash {
        [key: string]: NormalizedProperty
    }

    interface FieldToPropertyMapType {
        [f_name: string]: NormalizedProperty
    }
}