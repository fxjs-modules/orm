import util = require('util')
import uuid = require('uuid')

import * as DecoratorsProperty from '../Decorators/property';

import { getDataStoreTransformer } from '../Utils/transfomers';

function getNormalizedProperty (
    overwrite?: Fibjs.AnyObject
): FxOrmProperty.NormalizedProperty {
    let {
        name: name = '',
    } = overwrite || {} as any

    let {
        mapsTo = name,
        lazyname = name,
    } = overwrite || {} as any

    if (!name) name = mapsTo || lazyname

    if (!name)
        throw new Error(`no name given! check your property definition input: \n ${overwrite}`)

    let {
        defaultValue = undefined,
        enumerable = true,
        required = false,
        size = 0,
        type = 'text'
    } = overwrite || {} as any

    if (util.isFunction(defaultValue) || util.isSymbol(defaultValue))
        defaultValue = undefined

    let isPrimary = !!overwrite.primary
    const isSerial = type === 'serial'
    
    let isUnsigned = !!overwrite.unsigned
    
    let isUnique = !!overwrite.unique

    // TODO: should use serial always primary?
    if (isSerial) {
        isUnsigned = isPrimary = isUnique = true
        defaultValue = undefined
    }

    if (!size && isSerial) size = 4

    if (isPrimary || isSerial) required = true
    
    return {
        key: false,
        index: false,

        rational: false,
        time: false,
        big: false,
        values: null,
        lazyload: false,
        
        ...overwrite,
        type,
        name,
        size,
        required,

        defaultValue,
        lazyname,
        enumerable,
        mapsTo: mapsTo,
        primary: isPrimary,
        unsigned: isUnsigned,
        unique: isUnique,
        // @deprecated: just compute it rather than allowing it in input
        serial: isSerial,
    }
}

const PROPERTIES_KEYS = Object.keys(getNormalizedProperty({name: 'fake'}))

function filterComplexPropertyDefinition (
    input: any,
    /**
     * @description property key name in properties dictionary
     */
    prop_name: string
): FxOrmProperty.NormalizedProperty {
    if (input && typeof input === 'object')
        input = Array.isArray(input) ? Array.from(input) : {...input}

    const normalizedNameStruct = <FxOrmProperty.NormalizedProperty>{ name: prop_name }

    // built-in types
    switch (input) {
        case null:
        case undefined:
            return getNormalizedProperty({
                ...normalizedNameStruct,
                type: 'text',
                defaultValue: null
            })
        case Boolean:
            return getNormalizedProperty({
                ...normalizedNameStruct,
                type: 'boolean',
                defaultValue: false
            })
        case Symbol:
            return filterComplexPropertyDefinition(input.toString(), prop_name)
        case String:
            return getNormalizedProperty({
                ...normalizedNameStruct,
                type: 'text',
                size: 0,
            })
        // @TODO: make it more meaningful
        case Number:
            return getNormalizedProperty({
                ...normalizedNameStruct,
                type: 'integer',
                size: 4
            })
        case Date:
            return getNormalizedProperty({
                ...normalizedNameStruct,
                type: 'date',
                time: true,
            })
        case Buffer:
            return getNormalizedProperty({
                ...normalizedNameStruct,
                type: 'binary',
                big: false,
                lazyload: true
            })
        case Array:
            throw new Error(`[filterComplexPropertyDefinition] invalid property definition Array, maybe you wanna give one non-empty plain array used as enum values??`)
        case 'serial':
            return getNormalizedProperty({
                ...normalizedNameStruct,
                type: 'serial'
            })
        case 'uuid':
            return getNormalizedProperty({
                ...normalizedNameStruct,
                type: 'text',
                unique: true,
                serial: false,
                defaultValue: () => uuid.snowflake().hex()
            })
    }

    if (Array.isArray(input))
        return getNormalizedProperty({
            ...normalizedNameStruct,
            type: 'enum',
            values: input,
            defaultValue: input[0] || undefined
        })

    if (!input || typeof input !== 'object')
        throw new Error('property must be valid descriptor or built-in type')
    
    if (input instanceof Function)
        throw new Error(`invalid property type 'function'`)
    
    return getNormalizedProperty({
        ...normalizedNameStruct,
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
    static filterDefaultValue = filterDefaultValue;

    $storeType: FxDbDriverNS.Driver<ConnType>['type'];

    customType?: FxOrmProperty.CustomPropertyType

    /* meta :start */
    name: FxOrmProperty.Class_Property['name']

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

    lazyload: FxOrmProperty.Class_Property['lazyload']
    lazyname: FxOrmProperty.Class_Property['lazyname']
    enumerable: FxOrmProperty.Class_Property['enumerable']
    /* meta :end */
    
    @DecoratorsProperty.buildDescriptor({ configurable: false, enumerable: false })
    $definition: FxOrmProperty.NormalizedProperty
    
    // @DecoratorsProperty.buildDescriptor({ configurable: false, enumerable: false })
    // $remote: FxOrmProperty.NormalizedProperty

    get transformer () {
        return getDataStoreTransformer(this.$storeType)
    }

    fromStoreValue (storeValue: any) {
        return this.transformer.valueToProperty(
            storeValue, this,
            this.customType ? {[this.$definition.type]: this.customType} : {}
        )
    }

    toStoreValue (value: any) {
        return this.transformer.propertyToValue(
            value, this,
            this.customType ? {[this.$definition.type]: this.customType} : {}
        )
    }

    static New (
        ...args: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmProperty.Class_Property>
    ) {
        return new Property(...args);
    }

    constructor (
        input: any,
        opts: {
            propertyName: string
            storeType: FxOrmProperty.Class_Property['$storeType']
        }
    ) {
        const { storeType = 'unknown', propertyName = '' } = opts || {};
        if (!storeType) throw new Error(`[Property] storeType is required!`)
        if (!propertyName) throw new Error(`[Property] propertyName is required!`)

        this.$storeType = storeType

        const $definition = this.$definition = <Property['$definition']>filterComplexPropertyDefinition(input, propertyName);
        
        const self = this as any
        PROPERTIES_KEYS.forEach((k: any) => self[k] = $definition[k])

        return new Proxy(this, {
            set (target: any, setKey: string, value: any) {
                if (setKey === '$definition')
                    return false

                if (PROPERTIES_KEYS.includes(setKey))
                    $definition[setKey] = value
                else
                    target[setKey] = value

                return true
            },
            get (target: any, getKey: string, receiver) {
                if (getKey === '$definition')
                    return false

                if (PROPERTIES_KEYS.includes(getKey))
                    return $definition[getKey]

                return target[getKey]
            },
            deleteProperty (target: any, delKey:string) {
                if (delKey === '$definition' || PROPERTIES_KEYS.includes(delKey))
                    // never allow delete it
                    return false
                else
                    delete target[delKey]

                return true
            },
            ownKeys () {
                return PROPERTIES_KEYS
            },
        })
    }

    deKeys () {
        const raw = this.toJSON()
        raw.unique = false
        raw.index = false
        raw.big = false
        raw.key = false
        raw.primary = false
        raw.serial = false

        if (raw.type === 'serial') raw.type = 'integer'

        return raw
    }

    renameTo ({ name, mapsTo = name, lazyname = name }: FxOrmTypeHelpers.FirstParameter<FxOrmProperty.Class_Property['renameTo']>) {
        if (!name)
            throw new Error('[Property::renameTo] new name is required')

        const newVal = Property.New({
            ...this.toJSON(),
            name,
            mapsTo,
            lazyname
        }, {
            propertyName: name,
            storeType: this.$storeType
        })

        return newVal
    }

    isKeyProperty () {
        return (this.key || this.primary || this.isSerial())
    }

    isSerial () {
        return this.type === 'serial'
    }

    useForAssociationMatch () {
        this.required = false

        return this
    }

    toJSON () {
        const kvs = <FxOrmProperty.NormalizedProperty>{}
        const self = this as any
        PROPERTIES_KEYS.forEach(k => {
            kvs[k] = self[k]
        });

        kvs.name = this.name

        return kvs;
    }
}