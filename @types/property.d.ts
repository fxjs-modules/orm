declare namespace FxOrmProperty {
    interface CustomProperty {
        datastoreType?: {
            (
                prop?: FxOrmProperty.Class_Property,
                opts?: {
                    collection: string
                    driver: FxDbDriverNS.Driver<any>
                }
            ): string
        }
        valueToProperty?: {
            (value?: any, prop?: FxOrmProperty.Class_Property): any
        }
        propertyToStoreValue?: {
            (propertyValue?: any, prop?: FxOrmProperty.Class_Property): any
        }
    }

    /**
     * @description useful when pass property's option(such as type, big, ...etc) internally, useless for exposed api.
     */
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

        /**
         * @description if joinNode is not empty, which means this property is used as join key between
         * collections
         */
        joinNode: {
            /**
             * @description column name of this property refered
             */
            refColumn: string
            /**
             * @description if refCollection if empty, (maybe) this property was used in where its located
             */
            refCollection?: string
        }

        // klass?: KlassType
        // alwaysValidate?: boolean
        [ext_k: string]: any
    }

    class Class_Property<
      T_CTX extends FxOrmModel.Class_Model['propertyContext'] = any
    > implements NormalizedProperty {
        $storeType: FxDbDriverNS.Driver<any>['type']
        $ctx: T_CTX

        name: string

        type: NormalizedProperty['type']

        key: NormalizedProperty['key']
        mapsTo: NormalizedProperty['mapsTo']

        unique: NormalizedProperty['unique']
        index: NormalizedProperty['index']

        serial: NormalizedProperty['serial']
        unsigned: NormalizedProperty['unsigned']
        primary: NormalizedProperty['primary']
        required: NormalizedProperty['required']

        defaultValue: NormalizedProperty['defaultValue']
        size: NormalizedProperty['size']
        rational: NormalizedProperty['rational']
        time: NormalizedProperty['time']
        big: NormalizedProperty['big']
        values: NormalizedProperty['values']

        lazyload: NormalizedProperty['lazyload']
        lazyname: NormalizedProperty['lazyname']
        enumerable: NormalizedProperty['enumerable']

        customType?: FxOrmProperty.CustomProperty
        /**
         * @description if joinNode is not empty, which means this property is used as join key between
         * collections
         */
        joinNode: FxOrmProperty.NormalizedProperty['joinNode']

        static filterDefaultValue (
            property: FxOrmSqlDDLSync__Column.Property,
            ctx: {
                collection: string,
                property: FxOrmSqlDDLSync__Column.Property,
                driver: FxDbDriverNS.Driver
            }
        ): any
        static isProperty (input: any): input is FxOrmProperty.Class_Property
        static normalize (
            input: any,
            /**
             * @description property key name in properties dictionary
             */
            prop_name: string
        ): NormalizedProperty

        // static create (...args: FxOrmTypeHelpers.ConstructorParams<Class_Property>): Class_Property
        constructor (
            input: any,
            opts?:
            {
                propertyName: string
                storeType: FxOrmProperty.Class_Property['$storeType']
                customType?: FxOrmProperty.Class_Property['customType']
                valueToProperty?: FxOrmProperty.Class_Property['customType']['valueToProperty']
                propertyToStoreValue?: FxOrmProperty.Class_Property['customType']['propertyToStoreValue']
                $ctx?: FxOrmProperty.Class_Property['$ctx']
            }
        )

        readonly transformer: {
            valueToProperty: FxOrmDTransformer.Transformer['valueToProperty']
            propertyToStoreValue: FxOrmDTransformer.Transformer['propertyToStoreValue']
        }

        fromInputValue (storeValue: any): any
        toStoreValue (value: any): any

        /**
         * @description get one normalized non-key property snapshot
         */
        deKeys(opts?: { removeIndexes?: boolean }): NormalizedProperty
        /**
         * @description if this is one key-property, which is:
         * `property.key === true`
         * or `property.primary === true`
         * or `property.type === 'serial'`
         */
        isKeyProperty(): boolean
        isSerial(): boolean
        isIncrementable(): boolean

        setMeta (metaKey: keyof NormalizedProperty, metaValue: any): this
        renameTo (opts: {
            name: Class_Property['name'],
            mapsTo?: Class_Property['mapsTo'],
            lazyname?: Class_Property['lazyname']
        }): Class_Property

        useAsJoinColumn(
            opts: Class_Property | { column: string, collection?: string }
        ): this
        isJoinProperty (): boolean


        toJSON(): NormalizedProperty
    }

    interface NormalizedPropertyHash {
        [key: string]: NormalizedProperty
    }

    interface FieldToPropertyMapType {
        [f_name: string]: NormalizedProperty
    }
}
