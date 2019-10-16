import util = require('util');
import coroutine = require('coroutine');

import DDLSync = require('@fxjs/sql-ddl-sync');

import Class_QueryBuilder from './QueryBuilder';
import Instance from './Instance';

import * as SYMBOLS from '../Utils/symbols';
import { snapshot } from "../Utils/clone";
import Property from './Property';
import { configurable } from '../Decorators/accessor';

import { arraify } from '../Utils/array';
import Class_QueryNormalizer from './Query/Normalizer';

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
    get noKey () { return !this.keyPropertyList.length }

    orm: FxOrmModel.Class_Model['orm']

    get Op () { return (<any>this.orm.constructor).Op }
    get OpFns () { return (<any>this.orm.constructor).OpFns }

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

    get propertyContext() {
        return {
            model: this,
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

    sync (): void {
        if (!this.dbdriver.isSql) return ;

        const syncor = new DDLSync.Sync({
            dbdriver: this.dbdriver,
            syncStrategy: 'mixed'
        });

        /**
         * some db cannot add column(such as sqlite), so we try best to
         * create table once
         */
        syncor.defineCollection(this.collection, this.properties)

        syncor.sync()

        /* avoid loop */
        if (!this.hasOwnProperty('associationInfo'))
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

    create (kvItem: Fibjs.AnyObject | Fibjs.AnyObject[]): any {
        if (Array.isArray(kvItem))
            return coroutine.parallel(kvItem, (kv: Fibjs.AnyObject) => {
                return this.create(kv);
            })

        const isMultiple = Array.isArray(kvItem);
        const instances = arraify(new Instance(this, snapshot(kvItem)))
            .map(x => x.$save(kvItem));

        // console.log(require('@fibjs/chalk')`{bold.yellow.inverse instance.$kvs [1]}`, kvItem, instance.$kvs);

        return !isMultiple ? instances[0] : instances;
    }

    remove (opts?: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['remove']>) {
        const { where = null } = opts || {};

        return this.$dml.remove(this.collection, { where })
    }

    clear (): void {
        this.$dml.clear(this.collection)
    }

    hasOne (...args: FxOrmTypeHelpers.Parameters<FxOrmModel.Class_Model['hasOne']>) {
        const [ targetModel = this, opts ] = args;

        const {
            as: asKey = `${targetModel.collection}`,
        } = opts || {}

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
            matchKeys: {
                source: `${asKey}_id`,
                target: targetModel.id,
                comparator: '='
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
        const [ targetModel, opts ] = args;

        const { as: asKey = '' } = opts || {}

        if (!asKey) throw new Error(`[o2m] association name is required`)

        const {
            matchKeys = {
                source: this.id,
                target: `${this.collection}_id`,
                comparator: '='
            }
        } = opts || {}

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
            matchKeys: matchKeys,

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

        const mergeModel: MergeModel = new MergeModel({
            name: asKey,
            collection: collection,
            /**
             * @import pass {keys: false} to disable auto-fill id key
             */
            // keys: false,
            orm: this.orm,
            properties: {},
            settings: this.settings.clone(),
            matchKeys: matchKeys,

            mergeCollection: collection,
            type: 'm2m',
            source: this,
            target: targetModel,
        })

        targetModel.associations[asKey] = mergeModel

        return mergeModel
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

    normalizeDataToProperties (storeData: Fibjs.AnyObject = {}, target: Fibjs.AnyObject = {}) {
        this.propertyList.forEach((prop: FxOrmProperty.NormalizedProperty) => {
            if (storeData.hasOwnProperty(prop.mapsTo))
                target[prop.name] = prop.fromStoreValue(storeData[prop.mapsTo])
        })

        return target
    }

    normlizePropertyData (dataset: Fibjs.AnyObject = {}, kvs: Fibjs.AnyObject = {}) {
        this.propertyList.forEach(property => {
            if (dataset.hasOwnProperty(property.name)) kvs[property.name] = dataset[property.name]
        })

        return kvs
    }

    normlizeAssociationData (dataset: Fibjs.AnyObject = {}, refs: Fibjs.AnyObject = {}) {
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

    buildQueryNormalizer(
        opts: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['buildQueryNormalizer']>
    ): FxOrmTypeHelpers.ReturnType<FxOrmModel.Class_Model['buildQueryNormalizer']> {
        return new Class_QueryNormalizer(this.collection, opts)
    }

    defineMergeModel (opts: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['defineMergeModel']>) {
        return null as any
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
            mergeCollection, source, target, matchKeys,
            sourceJoinKey, targetJoinKey,
            /**
             * @description for MergeModel, deal with options.keys alone to avoid parent `Model`'s processing
             */
            keys,
            ...restOpts
        } = opts

        restOpts.collection = restOpts.collection || mergeCollection
        super({...restOpts, keys: false})

        this.type = opts.type
        this.associationInfo = { collection: mergeCollection, andMatchKeys: matchKeys }

        this.sourceModel = source
        this.targetModel = target

        // generate associated properties
        ;(() => {
            switch (this.type) {
                /**
                 * for o2o,
                 * - this mergeModel has all properties in sourceModel
                 */
                case 'o2o':
                    /**
                     * @whatif use lonely merge Table
                     */
                    ;(() => {
                        const tProperty = this.targetModel.properties[matchKeys.target]
                        if (!tProperty)
                            throw new Error(`[MergetModel::constructor/o2o] no target property "${matchKeys.target}" in target model, check your definition about 'andMatchKeys'`)

                        this.addProperty(
                            matchKeys.source,
                            tProperty
                                .renameTo({ name: matchKeys.source })
                                .useForAssociationMatch()
                                .deKeys()
                        )

                        this.sourceModel.propertyList.forEach(sProperty => {
                            if (this.fieldInfo(sProperty.name)) return ;

                            this.addProperty(
                                sProperty.name,
                                sProperty
                                    .renameTo({ name: sProperty.name })
                                    .useForAssociationMatch()
                                    .deKeys()
                            )
                        })
                    })();
                /**
                 * for o2m,
                 * - this mergeModel has all properties in targetModel
                 */
                case 'o2m':
                    /**
                     * @whatif use lonely merge Table
                     */
                    ;(() => {
                        if (this.targetModel.fieldInfo(matchKeys.target))
                            return ;

                        const sProperty = this.sourceModel.properties[matchKeys.source]
                        if (!sProperty)
                            throw new Error(`[MergetModel::constructor/o2m] no src property "${matchKeys.source}" in source model, check your definition about 'andMatchKeys'`)

                        this.addProperty(
                            matchKeys.target,
                            sProperty
                                .renameTo({ name: matchKeys.target })
                                .useForAssociationMatch()
                                .deKeys()
                        )

                        this.targetModel.propertyList.forEach(tProperty => {
                            if (this.fieldInfo(tProperty.name)) return ;

                            this.addProperty(
                                tProperty.name,
                                tProperty
                                    .renameTo({ name: tProperty.name })
                                    .useForAssociationMatch()
                                    .deKeys()
                            )
                        })
                    })();
                    break
                case 'm2m':
                    ;(() => {
                        if (!(this.sourceJoinKey = sourceJoinKey))
                            if (this.sourceModel.ids.length > 1)
                                return new Error(
                                    `[MergetModel::constructor/m2m] source model(collection: ${this.sourceModel.collection})`
                                    + `has more than one id properties, you must specify sourceJoinKey`,
                                )
                            else if (!this.sourceModel.ids.length)
                                return new Error(
                                    `[MergetModel::constructor/m2m] source model(collection: ${this.sourceModel.collection})`
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
                                    `[MergetModel::constructor/m2m] target model(collection: ${this.targetModel.collection})`
                                    + `has more than one id properties, you must specify targetJoinKey`,
                                )
                            else if (!this.targetModel.ids.length)
                                return new Error(
                                    `[MergetModel::constructor/m2m] target model(collection: ${this.sourceModel.collection})`
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

    saveForSource ({
        targetDataSet = {},
        sourceInstance = null
    }: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_MergeModel['saveForSource']>) {
        let inputs = <FxOrmInstance.Class_Instance[]>[]
        let targetInstances = []
        const matchCond = this.associationInfo.andMatchKeys

        switch (this.type) {
            case 'o2o':
                coroutine.parallel(
                    [util.last(
                        arraify(targetDataSet)
                    )],
                    (targetInst: typeof targetDataSet) => {
                        if (!targetInst.$isInstance) targetInst = this.targetModel.New(targetInst)

                        targetInst.$save()

                        const mergeInst = this.New(sourceInstance.toJSON())

                        mergeInst[matchCond.source] = targetInst[matchCond.target]

                        mergeInst.$save();

                        sourceInstance[this.name] = targetInst
                    }
                )
                break
            case 'o2m':
                inputs = arraify(this.New(targetDataSet));
                // don't change it it no inputs
                if (inputs && inputs.length)
                    sourceInstance[this.name] = sourceInstance[this.name] || []

                targetInstances = coroutine.parallel(
                    inputs,
                    (targetInst: FxOrmInstance.Class_Instance) => {
                        if (!sourceInstance[matchCond.source]) return ;
                        targetInst[matchCond.target] = sourceInstance[matchCond.source]

                        this.targetModel.propertyList.forEach(property => {
                            // targetInst[property.name] = sourceInstance[property.name]
                        })

                        targetInst.$save()

                        return targetInst.toJSON()
                    }
                )

                sourceInstance[this.name] = this.targetModel.New(targetInstances)
                break
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
        sourceInstance = null
    }: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_MergeModel['saveForSource']>) {
        const whereCond = <any>{};
        const matchCond = this.associationInfo.andMatchKeys

        switch (this.type) {
            case 'o2o':
                const mergeInst = this.New({
                    [this.sourceModel.id]: sourceInstance[this.sourceModel.id]
                });

                mergeInst.$fetch();

                const targetInst = this.targetModel.New({
                    [this.targetModel.id]: this[this.targetModel.id]
                });

                if (mergeInst[matchCond.source] === null) {
                    sourceInstance[this.name] = null;
                    break
                }

                targetInst[matchCond.target] = mergeInst[matchCond.source]
                targetInst.$fetch();

                sourceInstance[this.name] = targetInst;
                break
            default:
                break
        }

        return sourceInstance
    }

    removeForSource ({
        sourceInstance = null
    }: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_MergeModel['saveForSource']>) {
        const whereCond = <any>{};
        const matchCond = this.associationInfo.andMatchKeys

        switch (this.type) {
            case 'o2o':
                const mergeInst = this.New({
                    [this.sourceModel.id]: sourceInstance[this.sourceModel.id]
                });

                mergeInst.$fetch();
                mergeInst.$set(matchCond.source, null).$save();

                sourceInstance[this.name] = null;
                break
            default:
                break
        }

        return sourceInstance
    }
}

export default Model
