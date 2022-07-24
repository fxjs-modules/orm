export type __StringType<ENUM_T = string> = string | ENUM_T
export type ColumnType = __StringType

export interface IProperty {
    type: __StringType<PropertyType>

    key?: boolean
    mapsTo?: string

    unique?: boolean | string | string[]
    index?: boolean | string | string[]

    /* extra option :start */
    serial?: boolean
    unsigned?: boolean
    primary?: boolean
    required?: boolean
    defaultValue?: ((ctx?: ITransformCtx) => any) | any
    size?: number | string
    rational?: boolean // whether float type
    time?: boolean
    big?: boolean
    values?: any[] // values for enum type

    [ext_k: string]: any
}

/**
 * @description
 * all standard property types should be supported by transformer
 */
export type PropertyType = 
    'text'
    | 'integer'
    | 'number'
    | 'serial'
    | 'boolean'
    | 'date'
    | 'binary'
    | 'object'
    | 'enum'
    | 'point'

export type ICustomPropertyType = {
    datastoreType(
        prop: IProperty,
        ctx: ITransformCtx
    ): string
    // valueToProperty(value?: any, prop?: IProperty): any
    // propertyToValue(prop?: IProperty): any
}

export type ITransformCtx = {
    /**
     * @description database's type
     */
    type?: string

    /**
     * @description database's version
     */
    version?: string

    /**
     * @description collection name
     */
    collection?: string

    userOptions?: Record<string, any>
}

export interface IPropTransformer<TCol extends object> {
    /**
     * @description filter column information, some input data would be dirty.
     * 
     * e.g. the type of field in TCol is Class_Buffer, we need to convert it to string.
     * 
     */
    filterRawColumns?(column: TCol): TCol
    /**
     * @description transform database's type raw information to property
     */
    rawToProperty(column: TCol, ctx?: ITransformCtx): {
        raw: TCol,
        property: IProperty,
    }

    /**
     * @description transform property to database's type
     */
    toStorageType(property: IProperty, ctx: ITransformCtx & {
        /**
         * @description custom types
         */
        customTypes?: Record<string, ICustomPropertyType>

        escapeVal(val: any): string
    }): {
        isCustom: boolean
        property: IProperty
        typeValue: string
    }
}

export type ExtractColumnInfo<T extends any> = T extends IPropTransformer<infer U> ? U : never