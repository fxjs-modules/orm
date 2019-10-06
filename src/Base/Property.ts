import util = require('util')

import * as DecoratorsProperty from '../Decorators/property';

import { getDataStoreTransformer } from '../Utils/transfomers';

function getPropertyConfig (
    overwrite?: Fibjs.AnyObject
): FxOrmProperty.NormalizedProperty {
    const {
        name: pname = '',
        mapsTo = pname,
        enumerable = true,
    } = overwrite || {} as any

    let {
        defaultValue = undefined
    } = overwrite || {} as any

    if (util.isFunction(defaultValue) || util.isSymbol(defaultValue))
        defaultValue = undefined
    
    return {
        type: '',
        size: 0,

        key: false,
        unique: false,
        index: false,
        serial: false,
        primary: false,
        required: false,

        unsigned: false,
        rational: false,

        time: false,
        big: false,
        values: null,
        lazyload: false,
        
        ...overwrite,

        defaultValue,
        lazyname: pname,
        enumerable,
        name: pname,
        mapsTo: mapsTo,
    }
}

const PROPERTIES_KEYS = Object.keys(getPropertyConfig())

function filterProperty (
    input: FxOrmModel.ComplexModelPropertyDefinition,
    pname?: string
): FxOrmProperty.NormalizedProperty {
    if (!pname)
        pname = (input as any).name || (input as any).mapsTo || null
        
    // built-in types
    switch (input) {
        case Boolean:
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'boolean',
            })
        case String:
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'text',
                size: 255,
            })
        case Number:
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'integer',
                size: 4,

                unsigned: true,
            })
        case Date:
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'date',
                time: true,
            })
        case Buffer:
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'binary',
                big: false,
            })
        case 'password':
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'text',
            })
        case 'uuid':
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'text'
            })
    }

    if (Array.isArray(input))
        return getPropertyConfig({
            name: pname,
            mapsTo: pname,
            type: 'enum',
            values: input
        })

    if (!input || typeof input !== 'object')
        throw new Error('property must be valid descriptor or built-in type')
    
    if (input instanceof Function)
        throw new Error(`invalid property type 'function'`)
    
    return getPropertyConfig({
        name: pname,
        mapsTo: (input as any).mapsTo || pname,
        ...input,
    });
}

/**
 * @from @fxjs/sql-ddl-sync Utils.ts `filterPropertyDefaultValue`
 * 
 * @param property 
 * @param ctx 
 */
function filterDefaultValue (
    property: FxOrmSqlDDLSync__Column.Property,
    ctx: {
        collection: string,
        property: FxOrmSqlDDLSync__Column.Property,
        driver: FxDbDriverNS.Driver
    }
) {
    let _dftValue
    if (property.hasOwnProperty('defaultValue'))
        if (typeof property.defaultValue === 'function')
            _dftValue = property.defaultValue(ctx)
        else
            _dftValue = property.defaultValue

    return _dftValue
}

export default class Property<ConnType = any> implements FxOrmProperty.Class_Property {
    static filterProperty = filterProperty;
    static filterDefaultValue = filterDefaultValue;

    $storeType: FxDbDriverNS.Driver<ConnType>['type'];

    customType?: FxOrmProperty.CustomPropertyType

    /* meta :start */
    type: FxOrmProperty.Class_Property['type']

    key: FxOrmProperty.Class_Property['key']
    mapsTo: FxOrmProperty.Class_Property['mapsTo']

    unique: FxOrmProperty.Class_Property['unique']
    index: FxOrmProperty.Class_Property['index']

    serial: FxOrmProperty.Class_Property['serial']
    unsigned: FxOrmProperty.Class_Property['unsigned']
    primary: FxOrmProperty.Class_Property['primary']
    required: FxOrmProperty.Class_Property['required']

    defaultValue: FxOrmProperty.Class_Property['defaultValue']
    size: FxOrmProperty.Class_Property['size']
    rational: FxOrmProperty.Class_Property['rational']
    time: FxOrmProperty.Class_Property['time']
    big: FxOrmProperty.Class_Property['big']
    values: FxOrmProperty.Class_Property['values']

    name: FxOrmProperty.Class_Property['name']
    lazyload: FxOrmProperty.Class_Property['lazyload']
    lazyname: FxOrmProperty.Class_Property['lazyname']
    enumerable: FxOrmProperty.Class_Property['enumerable']
    /* meta :end */
    
    @DecoratorsProperty.buildDescriptor({ configurable: false, enumerable: false })
    $orig: FxOrmProperty.NormalizedProperty

    get transformer () {
        return getDataStoreTransformer(this.$storeType)
    }

    fromStoreValue (storeValue: any) {
        return this.transformer.valueToProperty(
            storeValue, this,
            this.customType ? {[this.$orig.type]: this.customType} : {}
        )
    }

    toStoreValue (value: any) {
        return this.transformer.propertyToValue(
            value, this,
            this.customType ? {[this.$orig.type]: this.customType} : {}
        )
    }

    static New (input: FxOrmModel.ComplexModelPropertyDefinition, opts: { name?: string, storeType: FxOrmProperty.Class_Property['$storeType'] }) {
        return new Property(input, opts);
    }

    constructor (
        input: FxOrmModel.ComplexModelPropertyDefinition,
        opts: {
            name?: string,
            storeType: FxOrmProperty.Class_Property['$storeType']
        }) {
        const { name, storeType } = opts || {};
        if (!storeType)
            throw new Error(`[Property] storeType is required!`)

        this.$storeType = storeType
        this.$orig = <Property['$orig']>filterProperty(input, name);
        
        const self = this as any
        PROPERTIES_KEYS.forEach((k: any) => self[k] = this.$orig[k])
    }

    deKeys () {
        const raw = {...this.toJSON()}
        raw.unique = false,
        raw.index = false
        raw.big = false
        raw.key = false
        raw.serial = false
        raw.primary = false

        if (raw.type === 'serial') raw.type = 'integer'

        return raw
    }

    renameTo ({ name, mapsTo = name, lazyname = name }: FxOrmTypeHelpers.FirstParameter<FxOrmProperty.Class_Property['renameTo']>) {
        const newVal = Property.New({
            ...this.toJSON(),
            name,
            mapsTo,
            lazyname
        }, { storeType: this.$storeType })

        return newVal
    }

    isKeyProperty () {
        return (this.key || this.primary || this.serial)
    }

    toJSON () {
        return this.$orig
    }
}