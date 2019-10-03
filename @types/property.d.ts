declare namespace FxOrmProperty {
    // /**
    //  * @description key linked association type
    //  *  - 'primary': means this property is for column defined as 'primary'
    //  *  - 'hasOne': means this property is for column used as asscociated key in 'hasOne' assciation
    //  */
    // type KlassType = 'primary' | 'hasOne'

    interface CustomPropertyType extends FxOrmSqlDDLSync__Driver.CustomPropertyType {
        datastoreType: {
            (prop?: FxOrmProperty.NormalizedProperty): string
        }
        valueToProperty?: {
            (value?: any, prop?: FxOrmProperty.NormalizedProperty): any
        }
        propertyToValue?: {
            (value?: any, prop?: FxOrmProperty.NormalizedProperty): any
        }
        datastoreGet?: {
            (prop?: FxOrmProperty.NormalizedProperty, helper?: FxSqlQuery.Class_Query): any
        }
    }
    
    /**
     * @description useful when pass property's option(such as type, big, ...etc) internally, useless for exposed api.
     */
    // interface NormalizedProperty extends FxOrmModel.ModelPropertyDefinition {
    interface NormalizedProperty extends FxOrmSqlDDLSync__Column.Property {
        // all fields inherited from `FxOrmModel.ModelPropertyDefinition` are still optional

        name: string
        
        key?: boolean
        lazyload?: boolean
        lazyname?: string

        // klass?: KlassType
        // alwaysValidate?: boolean
    }

    interface NormalizedPropertyHash {
        [key: string]: NormalizedProperty
    }

    interface FieldToPropertyMapType {
        [f_name: string]: NormalizedProperty
    }
}