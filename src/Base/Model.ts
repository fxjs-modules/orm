import util = require('util');
import coroutine = require('coroutine');

import DDLSync = require('@fxjs/sql-ddl-sync');

import Class_QueryBuilder from './QueryBuilder';
import Instance from './Instance';

import * as SYMBOLS from '../Utils/symbols';
import { snapshot } from "../Utils/clone";
import Property from './Property';
import { configurable } from '../Decorators/accessor';

import { arraify, deduplication, isEmptyArray } from '../Utils/array';
import { normalizeCollectionColumn, parseCollColumn } from '../Utils/endpoints';

function isProperty (input: any): input is FxOrmProperty.Class_Property {
  return input instanceof Property
}

/**
 * @description Model is meta definition about database-like remote endpoints.
 *
 * ```javascript
 * var ORM = require('@fxjs/orm')
 * var endpoint = ORM.create('mysql://localhost:3306/schema')
 *
 * var User = function (endpoint) {
 *      endpoint.define('user', {
 *          username: String,
 *          // built-in property type name
 *          password: 'password'
 *      })
 * }
 *
 * var Role = function (endpoint) {
 *      endpoint.define('role', {
 *          name: String,
 *          description: {
 *              type: 'string'
 *              size: 256
 *          }
 *      })
 * }
 *
 * var Jack = endpoint.New('user')
 * var Administrator = endpoint.New('role')
 * // or
 * var Jack = endpoint.Find('user').where({ username: 'jack' })
 * var Administrator = endpoint.Create('user')
 *  .set('name', 'administrator')
 *  .set('description', `One Site administrator`)
 * ```
 */

const DFLT_ID_DEF = {
    name: 'id',
    type: 'serial',
    key: true
}
const DFLT_KEYS = ['id']
function normalizeKeysInConfig (
    keys: FxOrmModel.Class_ModelConstructOptions['keys'] = DFLT_KEYS
) {
    if (keys === false) return false

    if (!Array.isArray(keys)) keys = DFLT_KEYS

    return keys.filter(x => !!x)
}

class Model extends Class_QueryBuilder implements FxOrmModel.Class_Model {
    name: FxOrmModel.Class_Model['name']
    collection: FxOrmModel.Class_Model['collection']

    @configurable(false)
    get isMergeModel () { return false }

    properties: FxOrmModel.Class_Model['properties'] = {};
    /**
     * @description all properties names
     */
    @configurable(false)
    get propertyNames (): string[] {
        return Object.keys(this.properties)
    }
    /**
     * @description all properties
     */
    @configurable(false)
    get propertyList () {
        return Object.values(this.properties)
    }

    associations: FxOrmModel.Class_Model['associations'] = {};
    /**
     * @description all association names
     */
    @configurable(false)
    get associationNames (): string[] {
        return Object.keys(this.associations)
    }

    settings: any

    @configurable(false)
    get id (): string | undefined {
        return Object.keys(this.keyProperties)[0] || undefined
    }
    @configurable(false)
    get ids (): string[] {
        const _ids = []
        if (this.id)
            _ids.push(this.id)

        return _ids
    }
    @configurable(false)
    get idPropertyList () {
        return this.ids.map(id => this.properties[id])
    }

    keyProperties: FxOrmModel.Class_Model['properties'] = {};
    /**
     * @description all key field properties
     */
    @configurable(false)
    get keyPropertyNames (): string[] {
        return Object.keys(this.keyProperties)
    }/**
     * @description all key field properties
     */
    @configurable(false)
    get keyPropertyList () {
        return Object.values(this.keyProperties)
    }

    @configurable(false)
    get keys (): string[] {
        return Object.keys(this.keyProperties);
    }
    @configurable(false)
    get noKey () { return !this.keyPropertyNames.length }

    orm: FxOrmModel.Class_Model['orm']

    get storeType () { return this.orm.driver.type }

    private get dbdriver(): FxDbDriverNS.Driver {
        return this.orm.driver as any;
    }

    @configurable(false)
    get _symbol () { return SYMBOLS.Model };

    get $dml (): FxOrmModel.Class_Model['$dml'] { return this.orm.$dml };
    get $ddl (): FxOrmModel.Class_Model['$ddl'] { return this.orm.$ddl };
    get schemaBuilder () { return this.$ddl.sqlQuery.knex.schema }
    get queryBuilder () { return this.$ddl.sqlQuery.knex.queryBuilder() }
    get sqlQuery (): FxSqlQuery.Class_Query {
      switch (this.$ddl.dbdriver.type) {
          case 'mysql':
          case 'sqlite':
              return this.$ddl.sqlQuery
      }
    }

    get propertyContext() {
        return {
            model: this,
            sqlQuery: this.sqlQuery,
            knex: this.$ddl.sqlQuery.knex
        }
    }

    constructor (config: FxOrmModel.Class_ModelConstructOptions) {
        super()

        Object.defineProperty(this, 'name', { value: config.name })
        this.collection = config.collection;
        this.orm = config.orm;
        this.settings = config.settings;

        // normalize it
        ;(() => {
            const specKeyPropertyNames = normalizeKeysInConfig(config.keys)

            /**
             * @todo check if there are more than one serial properties
             */
            Object.keys(config.properties)
                .forEach((prop: string) => {
                    const property = this.properties[prop] = new Property(
                        config.properties[prop],
                        { propertyName: prop, storeType: this.storeType, $ctx: this.propertyContext }
                    );

                    if (specKeyPropertyNames)
                        if (property.isKeyProperty() || specKeyPropertyNames.includes(prop))
                            this.keyProperties[prop] = property;
                });

            if (specKeyPropertyNames && this.ids.length === 0) {
                this.keyProperties[DFLT_ID_DEF.name] = this.properties[DFLT_ID_DEF.name] = new Property(
                    {...DFLT_ID_DEF},
                    {
                        propertyName: DFLT_ID_DEF.name,
                        storeType: this.storeType,
                        $ctx: this.propertyContext
                    }
                )
            }
        })();
    }

    isPropertyName (name: string): boolean {
        return this.properties.hasOwnProperty(name);
    }
    isAssociationName (name: string): boolean {
        return this.associations.hasOwnProperty(name);
    }
    isInstance (input: any): input is FxOrmInstance.Class_Instance {
        return (input instanceof Instance) && input.$model === <any>this
    }
    prop (propname: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['prop']>): ReturnType<FxOrmModel.Class_Model['prop']> {
      if (isProperty(propname)) {
        if (this.prop(propname.name) === propname) return propname
        throw new Error(`[Model::prop] given argument(name: ${propname.name}) is one property instance, but not this model(collection: ${this.collection})'s property! check your input.`)
      }

      if (!this.isPropertyName(propname))
          throw new Error(`[${this.isMergeModel ? 'MergeModel' : 'Model'}:prop] property ${propname} doesn't exist in model(collection: ${this.collection})`)

      return this.properties[propname]
    }
    assoc (assocname: string): ReturnType<FxOrmModel.Class_Model['assoc']> {
        if (!this.isAssociationName(assocname))
            throw new Error(`[${this.isMergeModel ? 'MergeModel' : 'Model'}:assoc] association ${assocname} doesn't exist in model(collection: ${this.collection})`)

        return this.associations[assocname]
    }


    sync (): void {
        if (!this.dbdriver.isSql) return ;

        const syncor = new DDLSync.Sync({
            dbdriver: this.dbdriver,
            syncStrategy: 'mixed',
            debug: function (...args: any[]) {
                if (process.env.ORM_DEBUG) console.log.apply(console, args)
            }
        });

        syncor.defineCollection(this.collection, this.properties)

        syncor.sync()

        /* avoid loop */
        if (!this.isMergeModel)
            // synchronize
            Object.values(this.associations)
                .forEach((association) => association.sync())
    }
    drop (): void {
        this.$ddl.dropCollection(this.collection)
    }

    // TODO: migrate to ddl
    hasPropertyRemotely (property: string | FxOrmProperty.Class_Property): boolean {
        if (this.dbdriver.isNoSql) return true;

        let colname: string
        if (typeof property === 'string') {
            if (this.properties[property]) colname = this.properties[property].mapsTo
            else colname = property
        } else {
            colname = property.mapsTo
        }

        const dialect = DDLSync.dialect(this.storeType as any)

        return dialect.hasCollectionColumnsSync(this.dbdriver, this.collection, colname)
    }

    New (
        input: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['New']>
    ): any {
        let base: Fibjs.AnyObject

        switch (typeof input) {
            case 'string':
            case 'number':
                if (this.ids.length >= 2)
                    throw new Error(`[Model::New] model '${this.name}' has more than one id-type properties: ${this.ids.join(', ')}`)

                base = { [this.id]: input }

                break
            case 'object':
                base = <Fibjs.AnyObject>input
                break
            case 'undefined':
                base = {}
                break
            default:
                throw new Error(`[Model::New] invalid input for model(collection: ${this.collection})!`)
        }

        // it also maybe array of instance.
        return new Instance(this, base);
    }

    create (
        kvItem: Fibjs.AnyObject | Fibjs.AnyObject[],
        {
            parallel = false
        } = {}
    ): any {
        if (Array.isArray(kvItem))
            if (parallel)
                return coroutine.parallel(kvItem, (kv: Fibjs.AnyObject) => this.create(kv))
            else
                return kvItem.map((item: Fibjs.AnyObject) => this.create(item))

        const isMultiple = Array.isArray(kvItem);
        const instances = arraify(new Instance(this, kvItem))
            .map(x => x.$save(kvItem));

        return !isMultiple ? instances[0] : instances;
    }

    remove (opts?: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['remove']>) {
        const { where = null } = opts || {};

        return this.$dml.remove(this.collection, { where })
    }

    clear (): void {
        this.$dml.clear(this.collection)
    }

    normalizePropertiesToData (inputdata: Fibjs.AnyObject = {}, target: Fibjs.AnyObject = {}) {
        this.propertyList.forEach((prop: FxOrmProperty.NormalizedProperty) => {
            if (inputdata.hasOwnProperty(prop.name))
                target[prop.mapsTo] = prop.toStoreValue(inputdata[prop.name])
            else if (inputdata.hasOwnProperty(prop.mapsTo))
                target[prop.mapsTo] = prop.toStoreValue(inputdata[prop.mapsTo])
        })

        return target
    }

    normalizeDataSetToWhere (dataset: Fibjs.AnyObject, target: Fibjs.AnyObject = {}) {
        Object.keys(dataset).forEach(dk => {
            const nk = normalizeCollectionColumn(dk, this.collection)
            target[nk] = dataset[dk]
        })

        return target
    }

    normalizeDataIntoInstance (
        storeData: Fibjs.AnyObject = {},
        opts?: FxOrmTypeHelpers.SecondParameter<FxOrmModel.Class_Model['normalizeDataIntoInstance']>
    ) {
        const {
            onPropertyField = undefined,
            onAssociationField = undefined,
        } = opts || {}
        const call_prop = typeof onPropertyField === 'function'
        const call_assoc = typeof onAssociationField === 'function'

        const target: Fibjs.AnyObject = {}
        this.propertyList.forEach((prop: FxOrmProperty.NormalizedProperty) => {
            if (storeData.hasOwnProperty(prop.mapsTo)) {
                target[prop.name] = prop.fromStoreValue(storeData[prop.mapsTo])
                if (call_prop) onPropertyField({
                    origValue: storeData[prop.mapsTo], transformedValue: target[prop.name],
                    fieldname: prop.name, mapsTo: prop.mapsTo
                })
            }
        })

        this.associationNames.forEach(assocName => {
            if (storeData.hasOwnProperty(assocName)) {
                target[assocName] = storeData[assocName]

                if (call_assoc) onAssociationField({
                    origValue: storeData[assocName], transformedValue: target[assocName],
                    fieldname: assocName
                })
            }
        })

        return target
    }

    normlizePropertyData (dataset: Fibjs.AnyObject = {}, kvs: Fibjs.AnyObject = {}) {
        this.propertyList.forEach(property => {
            if (dataset.hasOwnProperty(property.name)) kvs[property.name] = dataset[property.name]
        })

        return kvs
    }

    normalizeAssociationData (dataset: Fibjs.AnyObject = {}, refs: Fibjs.AnyObject = {}) {
        this.associationNames.forEach(assocName => {
            if (dataset.hasOwnProperty(assocName)) refs[assocName] = dataset[assocName]
        })

        return refs
    }

    filterOutAssociatedData (dataset: Fibjs.AnyObject = {}) {
        const kvs = []
        for (let assoc_name in this.associations) {
            const fInfo = this.fieldInfo(assoc_name)
            if (dataset.hasOwnProperty(assoc_name) && fInfo && fInfo.type === 'association')
                kvs.push({
                    association: fInfo.association,
                    dataset: dataset[assoc_name]
                })
        }

        return kvs
    }

    addProperty (name: string, property: FxOrmTypeHelpers.SecondParameter<FxOrmModel.Class_Model['addProperty']>) {
        if (this.fieldInfo(name))
            throw new Error(`[Model] property '${name}' existed in model '${this.name}'`)

        if ((property instanceof Property))
            return this.properties[name] = property

        return this.properties[name] = new Property({...property, name}, {
            propertyName: name,
            storeType: this.storeType,
            $ctx: this.propertyContext
        })
    }

    fieldInfo (propertyName: string) {
        if (this.properties.hasOwnProperty(propertyName))
            return {
                type: 'self' as 'self',
                property: this.properties[propertyName]
            }
        if (this.associations.hasOwnProperty(propertyName))
            return {
                type: 'association' as 'association',
                association: this.associations[propertyName]
            }

        return null
    }

    defineMergeModel (opts: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['defineMergeModel']>) {
        return null as any
    }

    hasOne (...args: FxOrmTypeHelpers.Parameters<FxOrmModel.Class_Model['hasOne']>) {
        const [ targetModel = this, opts ] = args;

        const {
            as: asKey = `${targetModel.collection}`,
        } = opts || {}

        const mergePropertyNameInSource = `${asKey}_id`
        if (this.fieldInfo(asKey))
            throw new Error(`[MergeModel::hasOne] source model(collection: ${targetModel.collection}) already has field "${asKey}", it's not allowed to add one associated field to it.`)

        const mergeModel: MergeModel = new MergeModel({
            name: asKey,
            collection: this.collection,
            /**
             * @import pass {keys: false} to disable auto-fill id key
             */
            // keys: false,
            orm: this.orm,
            properties: {},
            settings: this.settings.clone(),
            defineMergeProperties: ({ mergeModel }) => {
                const { targetModel, sourceModel } = mergeModel
                const tProperty = targetModel.properties[targetModel.id]
                if (!tProperty)
                    throw new Error(`[MergeModel::defineMergeProperties/o2o] no target property "${targetModel.id}" in target model, check your definition about 'defineMergeProperties'`)

                mergeModel.addProperty(
                    mergePropertyNameInSource,
                    tProperty
                        .renameTo({ name: mergePropertyNameInSource })
                        .useForAssociationMatch()
                        .deKeys()
                )

                sourceModel.propertyList.forEach(sProperty => {
                    if (mergeModel.fieldInfo(sProperty.name)) return ;

                    mergeModel.addProperty(
                        sProperty.name,
                        sProperty
                            .renameTo({ name: sProperty.name })
                            .useForAssociationMatch()
                            .deKeys()
                    )
                })
            },
            howToCheckExistenceForSource: ({ mergeModel, mergeInstance }) => {
                return mergeModel.sourceModel.idPropertyList.every(prop => mergeInstance.$isFieldFilled(prop.name))
            },
            howToSaveForSource: ({ mergeModel, targetDataSet, sourceInstance }) => {
                let targetInst = <FxOrmInstance.Class_Instance>util.last(arraify(targetDataSet))

                if (!targetInst.$isInstance) targetInst = mergeModel.targetModel.New(targetInst)

                targetInst.$save()

                const mergeInst = mergeModel.New(sourceInstance.toJSON())

                mergeInst[mergePropertyNameInSource] = targetInst[mergeModel.targetModel.id]

                mergeInst.$save();

                sourceInstance[mergeModel.name] = targetInst
            },
            howToCheckHasForSource: ({}) => {
                return null as any
            },
            howToFetchForSource: ({ mergeModel, sourceInstance }) => {
                const mergeInst = mergeModel.New({
                    [mergeModel.sourceModel.id]: sourceInstance[mergeModel.sourceModel.id]
                });

                mergeInst.$fetch();

                const targetInst = mergeModel.targetModel.New({
                    [mergeModel.targetModel.id]: this[mergeModel.targetModel.id]
                });

                if (mergeInst[mergePropertyNameInSource] === null) {
                    sourceInstance[mergeModel.name] = null;
                    return
                }

                targetInst[targetModel.id] = mergeInst[mergePropertyNameInSource]
                targetInst.$fetch();

                sourceInstance[mergeModel.name] = targetInst;
            },
            howToUnlinkForSource: ({ mergeModel, sourceInstance }) => {
                const mergeInst = mergeModel.New({
                    [mergeModel.sourceModel.id]: sourceInstance[mergeModel.sourceModel.id]
                });

                mergeInst.$fetch();
                mergeInst.$set(mergePropertyNameInSource, null).$save();

                sourceInstance[mergeModel.name] = null;
            },
            onFindByRef: ({ sourceModel, targetModel, mergeCollection }) => {
              return null as any
            },

            mergeCollection: this.collection,
            type: 'o2o',
            source: this,
            target: targetModel,
        })

        this.associations[asKey] = mergeModel

        return mergeModel
    }

    hasMany (...args: FxOrmTypeHelpers.Parameters<FxOrmModel.Class_Model['hasMany']>) {
        return null as any
    }

    hasManyExclusively (...args: FxOrmTypeHelpers.Parameters<FxOrmModel.Class_Model['hasMany']>) {
        const [ targetModel, opts ] = args;

        const {
            as: asKey = `${targetModel.collection}s`,
            reverseAs = `of_${asKey}`,
        } = opts

        if (!asKey) throw new Error(`[hasManyExclusively] "as" is required for association name`)

        const mergePropertyNameInTarget = `${reverseAs}_id`

        const mergeModel: MergeModel = new MergeModel({
            name: asKey,
            collection: targetModel.collection,
            /**
             * @import pass {keys: false} to disable auto-fill id key
             */
            // keys: false,
            orm: this.orm,
            properties: {},
            settings: this.settings.clone(),
            defineMergeProperties: ({ mergeModel }) => {
                const { targetModel, sourceModel } = mergeModel

                if (targetModel.fieldInfo(mergePropertyNameInTarget))
                    return ;

                const sProperty = sourceModel.prop(sourceModel.id)

                mergeModel.addProperty(
                    mergePropertyNameInTarget,
                    sProperty
                        .renameTo({ name: mergePropertyNameInTarget })
                        .useForAssociationMatch()
                        .deKeys()
                )

                targetModel.propertyList.forEach(tProperty => {
                    if (mergeModel.fieldInfo(tProperty.name)) return ;

                    mergeModel.addProperty(
                        tProperty.name,
                        tProperty
                            .renameTo({ name: tProperty.name })
                            .useForAssociationMatch()
                            .deKeys()
                    )
                })
            },
            howToCheckExistenceForSource: ({ mergeModel, mergeInstance }) => {
                return mergeModel.targetModel.idPropertyList.every(prop => mergeInstance.$isFieldFilled(prop.name))
            },
            howToCheckHasForSource: ({ mergeModel, sourceInstance, targetInstances }) => {
                const { targetModel, sourceModel } = mergeModel

                const zeroChecking = {
                    is: !targetInstances || (Array.isArray(targetInstances) && !targetInstances.length),
                    existed: true
                }

                const results = <{[k: string]: boolean}>{};
                const targetIds = (targetInstances || []).map(x => {
                    results[x[targetModel.id]] = false;
                    return x[targetModel.id];
                })
                const alias = `${targetModel.collection}_${targetModel.id}`

                ;<FxOrmInstance.Class_Instance[]>(mergeModel.find({
                    select: (() => {
                        const ss = { [mergePropertyNameInTarget]: mergeModel.propIdentifier(mergePropertyNameInTarget) };
                        /**
                         * @todo reduce unnecesary property
                         */
                        ss[alias] = targetModel.propIdentifier(targetModel.id)

                        return ss
                    })(),
                    where: {
                        /**
                         * @todo support where default and
                         */
                        [targetModel.Op.and]: {
                            [mergePropertyNameInTarget]: sourceInstance[mergeModel.sourceModel.id],
                            ...targetIds.length && { [alias]: targetModel.Opf.in(targetIds) }
                        }
                    },
                    joins: [
                        mergeModel.leftJoin({
                            collection: sourceModel.collection,
                            on: {
                                [mergePropertyNameInTarget]: mergeModel.refTableCol({
                                    table: sourceModel.collection,
                                    column: sourceModel.id
                                }),
                            }
                        })
                    ],
                    filterQueryResult (_results) {
                        if (zeroChecking.is) zeroChecking.existed = !!_results.length

                        _results.forEach(({[alias]: alias_id}: any) => {
                            if (results.hasOwnProperty(alias_id)) results[alias_id] = true
                        })

                        return _results
                    }
                }))

                if (zeroChecking.is) return { final: zeroChecking.existed, ids: results }

                return {
                    final: targetIds.every(id => !!results[id]),
                    ids: results
                }
            },
            howToFetchForSource: ({ mergeModel, sourceInstance, findOptions }) => {
                const { targetModel, sourceModel } = mergeModel
                if (!findOptions) findOptions = {}

                /**
                 * @shouldit concat and dupcate it?
                 */
                sourceInstance[mergeModel.name] = <FxOrmInstance.Class_Instance[]>(mergeModel.find({
                    ...findOptions,
                    select: (() => {
                        const ss = { [mergePropertyNameInTarget]: mergeModel.propIdentifier(mergePropertyNameInTarget) };
                        targetModel.propertyList.forEach(property => {
                            ss[property.name] = targetModel.propIdentifier(property)
                        })
                        return ss
                    })(),
                    where: {
                        [mergePropertyNameInTarget]: sourceInstance[mergeModel.sourceModel.id]
                    },
                    joins: [
                        mergeModel.leftJoin({
                            collection: sourceModel.collection,
                            on: {
                                [mergeModel.Op.and]: [
                                    {
                                        [mergePropertyNameInTarget]: mergeModel.refTableCol({
                                            table: sourceModel.collection,
                                            column: sourceModel.id
                                        }),
                                    }
                                ]
                            }
                        })
                    ],
                })).map(x => x.$set(reverseAs, sourceInstance))
            },
            howToSaveForSource: ({ mergeModel, targetDataSet, sourceInstance, isAddOnly }) => {
                if (isEmptyArray(targetDataSet)) sourceInstance.$unlinkRef(mergeModel.name)

                const mergeInsts = arraify(mergeModel.New(targetDataSet));
                if (mergeInsts && mergeInsts.length)
                    sourceInstance[mergeModel.name] = sourceInstance[mergeModel.name] || []

                const mergeDataList = <Fibjs.AnyObject[]>coroutine.parallel(
                    mergeInsts,
                    (mergeInst: FxOrmInstance.Class_Instance) => {
                        if (!sourceInstance[mergeModel.sourceModel.id]) return ;
                        mergeInst[mergePropertyNameInTarget] = sourceInstance[mergeModel.sourceModel.id]

                        mergeInst.$save()

                        return mergeInst.toJSON()
                    }
                )

                if (!isAddOnly && Array.isArray(sourceInstance[mergeModel.name]))
                    sourceInstance[mergeModel.name].splice(0)

                sourceInstance[mergeModel.name] =
                    deduplication(
                        <FxOrmInstance.Class_Instance[]>(sourceInstance[mergeModel.name] || [])
                            .concat(mergeDataList),
                        (item) => item[targetModel.id]
                    )
                    .map((x: Fibjs.AnyObject) => mergeModel.New(x).$set(reverseAs, sourceInstance))

            },
            howToUnlinkForSource: ({ mergeModel, targetInstances, sourceInstance }) => {
                const { targetModel } = mergeModel

                const targetIds = <string[]>[];
                targetInstances.forEach(x => {
                    if (x.$isFieldFilled(targetModel.id)) targetIds.push(x[targetModel.id])
                })

                mergeModel.$dml.update(
                    mergeModel.collection,
                    {
                        [mergePropertyNameInTarget]: null
                    },
                    {
                        where: {
                            [mergePropertyNameInTarget]: sourceInstance[mergeModel.sourceModel.id],
                            ...targetIds.length && { [targetModel.id]: targetModel.Opf.in(targetIds) }
                        }
                    }
                )

                targetInstances.forEach(x => x.$set(reverseAs, null))
            },
            onFindByRef: ({ mergeModel, complexWhere, mergeModelFindOptions: findOptions }) => {
                const { targetModel, sourceModel } = mergeModel
                findOptions = {...findOptions}

                return sourceModel.find({
                    ...findOptions,
                    select: (() => {
                        // const ss = { [mergePropertyNameInTarget]: mergeModel.propIdentifier(mergePropertyNameInTarget) };
                        const ss = <Record<string, string>>{};
                        sourceModel.propertyList.forEach(property =>
                            ss[property.name] = sourceModel.propIdentifier(property)
                        )
                        return ss
                    })(),
                    where: complexWhere,
                    joins: [
                        <any>sourceModel.leftJoin({
                            collection: mergeModel.collection,
                            on: {
                                [sourceModel.Op.and]: [
                                    {
                                        [sourceModel.id]: mergeModel.refTableCol({
                                            table: mergeModel.collection,
                                            column: mergePropertyNameInTarget
                                        }),
                                    },
                                ]
                            }
                        })
                    ].concat(findOptions.joins ? arraify(findOptions.joins) : [])
                })
            },

            mergeCollection: targetModel.collection,
            type: 'o2m',
            source: this,
            target: targetModel,
        })

        this.associations[asKey] = mergeModel

        return mergeModel
    }

    belongsToMany (...args: FxOrmTypeHelpers.Parameters<FxOrmModel.Class_Model['belongsToMany']>) {
        const [ targetModel = this, opts ] = args;

        const {
            as: asKey = `${targetModel.collection}`,
            collection = `${targetModel.collection}_${this.collection}s`
        } = opts || {}

        if (targetModel.fieldInfo(asKey))
            throw new Error(`[MergeModel::belongsToMany] target model(collection: ${targetModel.collection}) already has field "${asKey}", it's not allowed to add one associated field to it.`)

        const { matchKeys = undefined } = opts || {}

        const mergeModel: MergeModel = new MergeModel(<any>{
            name: asKey,
            collection: collection,
            /**
             * @import pass {keys: false} to disable auto-fill id key
             */
            // keys: false,
            orm: this.orm,
            properties: {},
            settings: this.settings.clone(),
            onFindByRef: ({ sourceModel, targetModel, mergeCollection }) => {
              return null as any
            },
            // matchKeys: matchKeys,

            mergeCollection: collection,
            type: 'm2m',
            source: this,
            target: targetModel,
        })

        targetModel.associations[asKey] = mergeModel

        return mergeModel
    }
}

// util.inherits(Model, Class_QueryBuilder)

class MergeModel extends Model implements FxOrmModel.Class_MergeModel {
    name: string
    type: 'o2o' | 'o2m' | 'm2o' | 'm2m'
    sourceModel: FxOrmModel.Class_Model
    sourceJoinKey: string
    get sourceKeys () { return this.sourceModel.keys }

    targetModel: FxOrmModel.Class_Model
    targetJoinKey: string
    get targetKeys () { return this.targetModel.keys }

    @configurable(false)
    get isMergeModel () { return true }

    @configurable(false)
    get ids (): string[] {
        let _ids = <string[]>[]

        switch (this.type) {
            case 'o2o':
                _ids = Array.from(new Set(super.ids.concat(this.targetModel.ids)))
                break
            case 'o2m':
                _ids = Array.from(new Set(super.ids.concat(this.targetModel.ids)))
                break
            case 'm2m':
                _ids = [this.sourceJoinKey, this.targetJoinKey]
                break
            default:
                break
        }

        return _ids
    }

    associationInfo: FxOrmModel.Class_MergeModel['associationInfo']

    @configurable(false)
    get associationKeys (): string[] {
        return Object.keys(this.associations);
    }

    constructor (opts: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmModel.Class_MergeModel>[0]) {
        const {
            mergeCollection, source, target, onFindByRef,
            sourceJoinKey, targetJoinKey,
            defineMergeProperties,
            howToCheckExistenceForSource,
            howToSaveForSource, howToFetchForSource, howToUnlinkForSource,
            howToCheckHasForSource,
            /**
             * @description for MergeModel, deal with options.keys alone to avoid parent `Model`'s processing
             */
            keys,
            ...restOpts
        } = opts

        restOpts.collection = restOpts.collection || mergeCollection
        super({...restOpts, keys: false})

        this.type = opts.type
        this.associationInfo = {
            collection: mergeCollection,
            onFindByRef: onFindByRef,
            howToCheckExistenceForSource,
            howToSaveForSource,
            howToFetchForSource,
            howToUnlinkForSource,
            howToCheckHasForSource
        }

        this.sourceModel = source
        this.targetModel = target

        // TODO: forbid changing source model here
        defineMergeProperties({
            sourceModel: source,
            targetModel: target,
            mergeModel: this
        })
        // generate associated properties
        ;false && (() => {
            switch (this.type) {
                case 'm2m':
                    ;(() => {
                        if (!(this.sourceJoinKey = sourceJoinKey))
                            if (this.sourceModel.ids.length > 1)
                                return new Error(
                                    `[MergeModel::constructor/m2m] source model(collection: ${this.sourceModel.collection})`
                                    + `has more than one id properties, you must specify sourceJoinKey`,
                                )
                            else if (!this.sourceModel.ids.length)
                                return new Error(
                                    `[MergeModel::constructor/m2m] source model(collection: ${this.sourceModel.collection})`
                                    + `has no any id property, you must specify sourceJoinKey`,
                                )

                        const sProperty = this.sourceModel.properties[this.sourceModel.id]
                        const sname = this.sourceJoinKey = `${this.sourceModel.collection}_id`

                        this.addProperty(
                            sname,
                            sProperty
                                .renameTo({ name: sname })
                                .useForAssociationMatch()
                                .deKeys()
                        )

                        if (!(this.targetJoinKey = targetJoinKey))
                            if (this.targetModel.ids.length > 1)
                                return new Error(
                                    `[MergeModel::constructor/m2m] target model(collection: ${this.targetModel.collection})`
                                    + `has more than one id properties, you must specify targetJoinKey`,
                                )
                            else if (!this.targetModel.ids.length)
                                return new Error(
                                    `[MergeModel::constructor/m2m] target model(collection: ${this.sourceModel.collection})`
                                    + `has no any id property, you must specify targetJoinKey`,
                                )

                        const tProperty = this.targetModel.properties[this.targetModel.id]
                        const tname = this.targetJoinKey = `${this.targetModel.collection}_id`

                        this.addProperty(
                            tname,
                            tProperty
                                .renameTo({ name: tname })
                                .useForAssociationMatch()
                                .deKeys()
                        )
                    })()
                    break
            }
        })();
    }

    isSourceModel (model: FxOrmModel.Class_Model): boolean {
        return model === this.sourceModel
    }
    isTarget (model: FxOrmModel.Class_Model): boolean {
        return model === this.targetModel
    }

    checkExistenceForSource ({
        mergeInstance
    }: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_MergeModel['checkExistenceForSource']>) {
        return this.associationInfo.howToCheckExistenceForSource({ mergeModel: this, mergeInstance })
    }

    checkHasForSource ({
        sourceInstance,
        targetInstances
    }: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_MergeModel['checkHasForSource']>
    ) {
        if (Array.isArray(targetInstances)) {
            const unfilledTargetInstance = targetInstances.find(inst => !inst.$isPersisted)

            if (unfilledTargetInstance) {
                throw new Error(`[MergeModel::checkHasForSource] there's id-unfull-filled instance, details: \n ${JSON.stringify(unfilledTargetInstance.toJSON())}`)
            }
        }

        return this.associationInfo.howToCheckHasForSource({ mergeModel: this, sourceInstance, targetInstances })
    }

    saveForSource ({
        targetDataSet,
        sourceInstance = null,
        isAddOnly = false
    }: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_MergeModel['saveForSource']>) {
        this.associationInfo.howToSaveForSource({
            mergeModel: this,
            sourceInstance,
            targetDataSet,
            isAddOnly
        })

        return sourceInstance

        let inputs = <FxOrmInstance.Class_Instance[]>[]
        let targetInstances = []

        switch (this.type) {
            case 'm2m':
                inputs = arraify(this.targetModel.New(targetDataSet));

                // don't change it it no inputs
                if (inputs && inputs.length)
                    sourceInstance[this.name] = sourceInstance[this.name] || []

                targetInstances = coroutine.parallel(
                    inputs,
                    // TODO: try to use trans here
                    (targetInst: FxOrmInstance.Class_Instance) => {
                        targetInst.$save()

                        const mergeInstance = this.New({
                            [this.sourceJoinKey]: sourceInstance[sourceInstance.$model.id],
                            [this.targetJoinKey]: targetInst[targetInst.$model.id],
                        })

                        if (!mergeInstance.$exists()) mergeInstance.$save()

                        return targetInst.toJSON()
                    }
                )

                sourceInstance[this.name] = this.targetModel.New(targetInstances)
                break
        }
    }

    findForSource ({
        sourceInstance = null,
        findOptions = undefined
    }: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_MergeModel['findForSource']>) {
        this.associationInfo.howToFetchForSource({ mergeModel: this, sourceInstance, findOptions })
        return sourceInstance
    }

    unlinkForSource ({
        targetInstances,
        sourceInstance = null
    }: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_MergeModel['unlinkForSource']>) {
        this.associationInfo.howToUnlinkForSource({ mergeModel: this, sourceInstance, targetInstances })
        return sourceInstance
    }
}

export default Model
