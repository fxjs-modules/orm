import * as DecoratorsProperty from '../Decorators/property';

import { getDataStoreTransformer } from '../Utils/transfomers';

function getPropertyConfig (overwrite?: Fibjs.AnyObject): FxOrmProperty.NormalizedProperty {
    const {
        name: pname = '',
        mapsTo = pname,
        enumerable = true
    } = overwrite || {} as any
    
    return {
        name: pname,
        type: '',
        size: 0,
        mapsTo: mapsTo,

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
        lazyname: pname,
        enumerable,

        defaultValue: () => null,
        ...overwrite
    }
}

const PROPERTIES_KEYS = Object.keys(getPropertyConfig())

function filterProperty (
    input: FxOrmModel.ComplexModelPropertyDefinition,
    pname?: string
): FxOrmProperty.NormalizedProperty {
    if (!pname && input)
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

export default class Property<ConnType = any> implements FxOrmProperty.Class_Property {
    static filterProperty = filterProperty;

    dbdriver: FxDbDriverNS.Driver<ConnType>;

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
        return getDataStoreTransformer(this.dbdriver.type)
    }

    fromStoreValue (storeValue: any) {
        return this.transformer.valueToProperty(
            storeValue, this.$orig, this.customType ? {[this.$orig.type]: this.customType} : {}
        )
    }

    toStoreValue (value: any) {
        return this.transformer.propertyToValue(
            value, this.$orig, this.customType ? {[this.$orig.type]: this.customType} : {}
        )
    }

    static New (input: FxOrmModel.ComplexModelPropertyDefinition, name?: string) {
        return new Property(input, name);
    }

    constructor (input: FxOrmModel.ComplexModelPropertyDefinition, name?: string) {
        this.$orig = <Property['$orig']>filterProperty(input, name);
        
        const self = this as any
        PROPERTIES_KEYS.forEach((k: any) => self[k] = this.$orig[k])
    }

    toJSON() { return this.$orig }
}