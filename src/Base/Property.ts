import util = require('util')
import uuid = require('uuid')

import * as DecoratorsProperty from '../Decorators/property';

import { getDataStoreTransformer } from '../Utils/transformers';

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
        type = 'text',
        joinNode
    } = overwrite || {} as any

    if (defaultValue !== undefined && typeof defaultValue !== 'function') {
        const value = defaultValue
        defaultValue = () => value
        defaultValue = defaultValue.bind(null)
    }

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

    if (!joinNode) joinNode = {refColumn: ''}
    else {
        joinNode = {refColumn: joinNode.refColumn, refCollection: joinNode.refCollection}
    }

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
        joinNode,
        // @deprecated: just compute it rather than allowing it in input
        serial: isSerial,
    }
}

const PROPERTY_META_KEYS = Object.keys(getNormalizedProperty({name: 'fake'}))

function filterComplexPropertyDefinition (
    input: any,
    /**
     * @description property key name in properties dictionary
     */
    prop_name: string
): FxOrmProperty.NormalizedProperty {
    if (input && typeof input === 'object')
        if (Property.isProperty(input))
            input = input.toJSON()
        else if (Array.isArray(input))
            input = Array.from(input)
        else
            input = {...input}

    const normalized = <FxOrmProperty.NormalizedProperty>{ name: prop_name }

    // built-in types
    switch (input) {
        case null:
        case undefined:
            return getNormalizedProperty({
                ...normalized,
                type: 'text',
                defaultValue: null
            })
        case Boolean:
            return getNormalizedProperty({
                ...normalized,
                type: 'boolean'
            })
        case Symbol:
            return filterComplexPropertyDefinition(input.toString(), prop_name)
        case String:
            return getNormalizedProperty({
                ...normalized,
                type: 'text',
                size: 0,
            })
        case Number:
            return getNormalizedProperty({
                ...normalized,
                type: 'number',
                size: 4
            })
        case Date:
            return getNormalizedProperty({
                ...normalized,
                type: 'date',
                time: true,
            })
        case Object:
            return getNormalizedProperty({
                ...normalized,
                type: 'object'
            })
        case Buffer:
            return getNormalizedProperty({
                ...normalized,
                type: 'binary',
                big: false,
                lazyload: true
            })
        case Array:
            throw new Error(`[filterComplexPropertyDefinition] invalid property definition Array, maybe you wanna give one non-empty plain array used as enum values?`)
        case 'serial':
            return getNormalizedProperty({
                ...normalized,
                type: 'serial'
            })
        case 'uuid':
            return getNormalizedProperty({
                ...normalized,
                type: 'text',
                unique: true,
                serial: false,
                defaultValue: () => uuid.snowflake().hex()
            })
        case 'point':
            return getNormalizedProperty({
                ...normalized,
                type: 'point'
            })
    }

    if (Array.isArray(input))
        return getNormalizedProperty({
            ...normalized,
            type: 'enum',
            values: input,
            defaultValue: input[0] || undefined
        })

    if (!input || typeof input !== 'object')
        throw new Error(`property must be valid descriptor or built-in type, got "${typeof input}"`)
    else if (input.type !== undefined && typeof input.type !== 'string')
        throw new Error(`customized type must be non-empty string type! but ${typeof input.type} given`)

    if (input instanceof Function)
        throw new Error(`invalid property type 'function'`)

    return getNormalizedProperty({
        ...normalized,
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
    {
        property,
        collection,
        driver
    }: {
        property: FxOrmSqlDDLSync__Column.Property,
        collection: string,
        driver: FxDbDriverNS.Driver
    }
) {
    let _dftValue
    if (property.hasOwnProperty('defaultValue'))
        if (typeof property.defaultValue === 'function')
            _dftValue = property.defaultValue({ collection, property, driver })
        else
            _dftValue = property.defaultValue

    return _dftValue
}

export default class Property<T_CTX extends FxOrmModel.Class_Model['propertyContext'] = any> implements FxOrmProperty.Class_Property<T_CTX> {
    static isProperty (input: any): input is FxOrmProperty.Class_Property {
        return input instanceof Property
    }
    static normalize = filterComplexPropertyDefinition

    $storeType: FxDbDriverNS.Driver<any>['type'];
    $ctx: FxOrmProperty.Class_Property<T_CTX>['$ctx'];

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
    joinNode: FxOrmProperty.Class_Property['joinNode'] = { refColumn: '' }
    /* meta :end */

    @DecoratorsProperty.buildDescriptor({ configurable: false, enumerable: false })
    $definition: FxOrmProperty.NormalizedProperty

    transformer: FxOrmProperty.Class_Property['transformer'] = {}

    constructor (...args: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmProperty.Class_Property>) {
        const [ input, opts ] = args

        const {
            storeType = 'unknown',
            propertyName = '',
            $ctx = undefined
        } = opts || {};

        if (!storeType) throw new Error(`[Property] storeType is required!`)
        if (!propertyName) throw new Error(`[Property] propertyName is required!`)

        this.$ctx = $ctx

        this.$storeType = storeType

        const $definition = this.$definition = <Property<T_CTX>['$definition']>filterComplexPropertyDefinition(
            input,
            propertyName
        );

        const self = this as any
        PROPERTY_META_KEYS.forEach((k: any) => self[k] = $definition[k])

        if (input && util.isObject(input)) {
            const { valueToProperty, propertyToStoreValue } = util.pick(
                input || {}, [ 'valueToProperty', 'propertyToStoreValue' ]
            );

            if (util.isFunction(valueToProperty)) this.transformer.valueToProperty = valueToProperty
            if (util.isFunction(propertyToStoreValue)) this.transformer.propertyToStoreValue = propertyToStoreValue
        }

        return new Proxy(this, {
            set (target: any, setKey: string, value: any) {
                if (setKey === '$definition')
                    return false

                if (PROPERTY_META_KEYS.includes(setKey))
                    $definition[setKey] = value
                else
                    target[setKey] = value

                return true
            },
            get (target: any, getKey: string, receiver) {
                if (getKey === '$definition')
                    return false

                if (PROPERTY_META_KEYS.includes(getKey))
                    return $definition[getKey]

                return target[getKey]
            },
            deleteProperty (target: any, delKey:string) {
                if (delKey === '$definition' || PROPERTY_META_KEYS.includes(delKey))
                    // never allow delete it
                    return false
                else
                    delete target[delKey]

                return true
            },
            ownKeys () {
                return PROPERTY_META_KEYS
            },
        })
    }

    fromInputValue (storeValue: any): any {
        if (typeof this.transformer.valueToProperty === 'function')
            return this.transformer.valueToProperty(storeValue, this)

        return getDataStoreTransformer(this.$storeType).valueToProperty(storeValue, this, {})
    }

    toStoreValue (value: any): any {
        if (typeof this.transformer.propertyToStoreValue === 'function')
            return this.transformer.propertyToStoreValue(value, this)

        return getDataStoreTransformer(this.$storeType).propertyToStoreValue(value, this, {})
    }

    useDefaultValue (ctx: Parameters<FxOrmProperty.Class_Property<T_CTX>['useDefaultValue']>[0]) {
        return filterDefaultValue({
            property: this,
            collection: ctx.model.collection,
            driver: ctx.model.orm.driver
        })
    }

    deKeys ({ removeIndexes = true } = {}) {
        const json = this.toJSON()
        if (removeIndexes) {
            json.unique = false
            json.index = false
        }
        json.big = false
        json.key = false
        json.primary = false
        json.serial = false

        if (json.type === 'serial') json.type = 'integer'

        return json
    }

    setMeta (...args: FxOrmTypeHelpers.Parameters<FxOrmProperty.Class_Property['setMeta']>) {
        const [metaKey, metaValue] = args
        if (!PROPERTY_META_KEYS.includes(<any>metaKey))
            throw new Error(`[Property::set] metaKey must be one of ${PROPERTY_META_KEYS.join(', ')}`)

        ;(<any>this)[metaKey] = metaValue

        return this
    }

    rebuildTo ({ name, mapsTo = name, lazyname = name }: FxOrmTypeHelpers.FirstParameter<FxOrmProperty.Class_Property['rebuildTo']>) {
        if (!name)
            throw new Error('[Property::rebuildTo] new name is required')

        const newVal = new Property<T_CTX>({
            ...this.toJSON(),
            name,
            mapsTo,
            lazyname,

            valueToProperty: this.transformer.valueToProperty,
            propertyToStoreValue: this.transformer.propertyToStoreValue,
        }, {
            propertyName: name,
            storeType: this.$storeType,
            $ctx: this.$ctx
        })

        return newVal
    }

    isKeyProperty () {
        return (this.key || this.primary || this.isSerial())
    }

    isSerial () {
        return this.type === 'serial'
    }

    isIncrementable () {
        return this.type === 'serial' || this.type === 'integer'
    }

    useAsJoinColumn (opts: FxOrmTypeHelpers.FirstParameter<FxOrmProperty.Class_Property['useAsJoinColumn']>) {
        this.required = false

        if (Property.isProperty(opts)) {
            this.joinNode.refColumn = opts.name
            delete this.joinNode.refCollection
        } else {
            const { column, collection } = opts

            this.joinNode.refColumn = column
            this.joinNode.refCollection = collection
        }

        if (!this.joinNode.refColumn)
            throw new Error(`[Property::useAsJoinColumn] useAsJoinColumn didn't make this property has valid 'joinNode.name', check your input.`)

        return this
    }

    isJoinProperty () {
        return !!this.joinNode && !!this.joinNode.refColumn
    }

    toJSON () {
        const kvs = <FxOrmProperty.NormalizedProperty>{}
        PROPERTY_META_KEYS.forEach(k => {
            kvs[k] = (<any>this)[k]
        });

        kvs.name = this.name
        kvs.joinNode = this.joinNode

        return kvs;
    }
}
