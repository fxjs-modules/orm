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
    interface NormalizedProperty {
        name: string

        type: FxOrmSqlDDLSync__Column.Property['type']

        key: FxOrmSqlDDLSync__Column.Property['key']
        mapsTo: FxOrmSqlDDLSync__Column.Property['mapsTo']

        unique: FxOrmSqlDDLSync__Column.Property['unique']
        index: FxOrmSqlDDLSync__Column.Property['index']

        serial: FxOrmSqlDDLSync__Column.Property['serial']
        unsigned: FxOrmSqlDDLSync__Column.Property['unsigned']
        primary: FxOrmSqlDDLSync__Column.Property['primary']
        required: FxOrmSqlDDLSync__Column.Property['required']

        defaultValue: FxOrmSqlDDLSync__Column.Property['defaultValue']
        size: FxOrmSqlDDLSync__Column.Property['size']
        rational: FxOrmSqlDDLSync__Column.Property['rational']
        time: FxOrmSqlDDLSync__Column.Property['time']
        big: FxOrmSqlDDLSync__Column.Property['big']
        values: FxOrmSqlDDLSync__Column.Property['values']
        
        lazyload: boolean
        lazyname: string
        enumerable: boolean

        // klass?: KlassType
        // alwaysValidate?: boolean
        [ext_k: string]: any
    }

    class Class_Property implements NormalizedProperty {
        $storeType: FxDbDriverNS.Driver<any>['type']

        name: string

        type: FxOrmSqlDDLSync__Column.Property['type']

        key: FxOrmSqlDDLSync__Column.Property['key']
        mapsTo: FxOrmSqlDDLSync__Column.Property['mapsTo']

        unique: FxOrmSqlDDLSync__Column.Property['unique']
        index: FxOrmSqlDDLSync__Column.Property['index']

        serial: FxOrmSqlDDLSync__Column.Property['serial']
        unsigned: FxOrmSqlDDLSync__Column.Property['unsigned']
        primary: FxOrmSqlDDLSync__Column.Property['primary']
        required: FxOrmSqlDDLSync__Column.Property['required']

        defaultValue: FxOrmSqlDDLSync__Column.Property['defaultValue']
        size: FxOrmSqlDDLSync__Column.Property['size']
        rational: FxOrmSqlDDLSync__Column.Property['rational']
        time: FxOrmSqlDDLSync__Column.Property['time']
        big: FxOrmSqlDDLSync__Column.Property['big']
        values: FxOrmSqlDDLSync__Column.Property['values']
        
        lazyload: boolean
        lazyname: string
        enumerable: boolean

        static filterProperty (
            input: FxOrmModel.ComplexModelPropertyDefinition,
            pname?: string
        ): FxOrmProperty.NormalizedProperty

        static filterDefaultValue (
            property: FxOrmSqlDDLSync__Column.Property,
            ctx: {
                collection: string,
                property: FxOrmSqlDDLSync__Column.Property,
                driver: FxDbDriverNS.Driver
            }
        ): any

        static New (...args: FxOrmTypeHelpers.ConstructorParams<Class_Property>): Class_Property
        constructor (
            input: FxOrmModel.ComplexModelPropertyDefinition,
            opts?: {
                propertyName: string,
                storeType: FxOrmProperty.Class_Property['$storeType']
            }
        )

        readonly transformer: {
            valueToProperty(
                value: any,
                property: FxOrmProperty.NormalizedProperty,
                customTypes: FxOrmDMLDriver.DMLDriver['customTypes']
            ): any
            propertyToValue (
                value: any,
                property: FxOrmProperty.NormalizedProperty,
                customTypes: FxOrmDMLDriver.DMLDriver['customTypes']
            ): any
        }

        fromStoreValue (storeValue: any): any
        toStoreValue (value: any): any

        /**
         * @description get one normalized non-key property snapshot
         */
        deKeys(): NormalizedProperty
        /**
         * @description if this is one key-property, which is:
         * `property.key === true`
         * or `property.primary === true`
         * or `property.type === 'serial'`
         */
        isKeyProperty(): boolean
        isSerial(): boolean

        renameTo (opts: {
            name: Class_Property['name'],
            mapsTo?: Class_Property['mapsTo'],
            lazyname?: Class_Property['lazyname']
        }): Class_Property

        useForAssociationMatch(): this

        toJSON(): NormalizedProperty
    }

    interface NormalizedPropertyHash {
        [key: string]: NormalizedProperty
    }

    interface FieldToPropertyMapType {
        [f_name: string]: NormalizedProperty
    }
}