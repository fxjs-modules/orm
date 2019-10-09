import util = require('util');
import coroutine = require('coroutine');

import DDLSync = require('@fxjs/sql-ddl-sync');

import Class_QueryBuilder from './QueryBuilder';
import { getInstance } from './Instance';

import * as SYMBOLS from '../Utils/symbols';
import { snapshot } from "../Utils/clone";
import Property from './Property';
import { configurable } from '../Decorators/accessor';
import { fillStoreDataToProperty, filterPropertyToStoreData } from '../DXL/DML/_utils';

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

    properties: {[k: string]: Property} = {};
    /**
     * @description all properties names
     */
    @configurable(false)
    get propertyNames (): string[] {
        return Object.keys(this.properties)
    }
    /**
     * @description all field properties
     */
    @configurable(false)
    get propertyList (): FxOrmProperty.Class_Property[] {
        return Object.values(this.properties)
    }
    associations: FxOrmModel.Class_Model['associations'] = {};

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
    get keyPropertyList (): FxOrmProperty.Class_Property[] {
        return Object.values(this.keyProperties)
    }

    @configurable(false)
    get keys (): string[] {
        return Object.keys(this.keyProperties);
    }
    @configurable(false)
    get noKey () { return !this.keyPropertyList.length }

    @configurable(false)
    get associationKeys (): string[] {
        return Object.keys(this.associations);
    }

    orm: FxOrmModel.Class_Model['orm']

    get Op () { return (<any>this.orm.constructor).Op }

    get storeType () {
        return this.orm.driver.type
    }

    private get dbdriver(): FxDbDriverNS.Driver {
        return this.orm.driver as any;
    }

    @configurable(false)
    get _symbol () { return SYMBOLS.Model };
    
    get $dml () { return this.orm.$dml };
    get $ddl () { return this.orm.$ddl };
    get schemaBuilder () { return this.$ddl.sqlQuery.knex.schema }
    get queryBuilder () { return this.$ddl.sqlQuery.knex.queryBuilder() }

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
                    const property = this.properties[prop] = Property.New(
                        config.properties[prop],
                        { propertyName: prop, storeType: this.storeType }
                    );
                    
                    if (specKeyPropertyNames)
                        if (property.isKeyProperty() || specKeyPropertyNames.includes(prop))
                            this.keyProperties[prop] = property;
                });

            if (specKeyPropertyNames && this.ids.length === 0) {
                this.keyProperties[DFLT_ID_DEF.name] = this.properties[DFLT_ID_DEF.name] = Property.New(
                    {...DFLT_ID_DEF},
                    {
                        propertyName: DFLT_ID_DEF.name,
                        storeType: this.storeType
                    }
                )
            }
        })();
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
        /* avoid loop */
        if (!this.hasOwnProperty('associationInfo')) {
            let assocProperties: FxOrmModel.Class_MergeModel['properties'];
            Object.values(this.associations)
                .forEach(assoc => {
                    if (assoc.associationInfo.collection !== this.collection) return;

                    assocProperties = assocProperties || {};
                })

            if (assocProperties) syncor.defineCollection(this.collection, assocProperties)
        }

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

    create (kvItem: Fibjs.AnyObject | Fibjs.AnyObject[]): any {
        if (Array.isArray(kvItem))
            return coroutine.parallel(kvItem, (kv: Fibjs.AnyObject) => {
                return this.create(kv);
            })
        
        const isMultiple = Array.isArray(kvItem);
        const instances = arraify(getInstance(this, snapshot(kvItem)))
            .map(x => x.save(kvItem));

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
        return null as any
    }

    hasMany (...args: FxOrmTypeHelpers.Parameters<FxOrmModel.Class_Model['hasMany']>) {
        const [ name, model, opts ] = args || [];

        const { type = 'o2m', reverse, ...restOpts } = opts || {} as typeof opts;
        const reverseKey = typeof reverse === 'string' ? reverse : `${this.name}s`

        let assoc = null

        restOpts.model = model || this

        switch (type) {
            default:
            case 'o2m':
                assoc = this.o2m(name, restOpts)

                if (reverse && restOpts.model && restOpts.model !== this)
                    restOpts.model.m2o(reverseKey, { ...restOpts})
                break
            case 'm2m':
                assoc = this.m2m(name, restOpts)
                break
        }

        return assoc
    }

    o2o (name: string, opts?: FxOrmTypeHelpers.SecondParameter<FxOrmModel.Class_Model['o2o']>) {
        return null as any
    }

    m2o (name: string, opts?: FxOrmTypeHelpers.SecondParameter<FxOrmModel.Class_Model['m2o']>) {
        return null as any
    }

    o2m (name: string, opts?: FxOrmTypeHelpers.SecondParameter<FxOrmModel.Class_Model['o2m']>) {
        if (!name) throw new Error(`[o2m] association name is required`)

        const { model: targetModel = this } = opts || {}
        const {
            matchKeys = {
                source: this.id,
                target: `${this.collection}_id`,
                comparator: '='
            }
        } = opts || {}

        const mergeModel: MergeModel = new MergeModel({
            name: name,
            collection: targetModel.collection,
            /**
             * @import pass {keys: false} to disable auto-fill id key
             */
            // keys: false,
            orm: this.orm,
            properties: {},
            settings: this.settings.clone(),
            matchKeys: arraify(matchKeys),

            mergeCollection: targetModel.collection,
            type: 'o2m',
            source: this,
            target: targetModel,
        })

        this.associations[name] = mergeModel

        return mergeModel
    }

    m2m (name: string, opts?: FxOrmTypeHelpers.SecondParameter<FxOrmModel.Class_Model['m2m']>) {
        return null as any
    }

    New (input: FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['New']>) {
        let base: Fibjs.AnyObject

        switch (typeof input) {
            case 'string':
            case 'number':
                if (this.ids.length >= 2)
                    throw new Error(`[Model::New] model '${this.name}' has more than one id-type properties: ${this.ids.join(', ')}`)

                base = { [this.id]: input }
                
                break
            case 'object':
                base = input
                break
            default:
                throw new Error(`[Model::New] invalid input for [Model].New!`)
        }

        return getInstance(this, base);
    }

    normalizePropertiesToData (data: Fibjs.AnyObject = {}, target: Fibjs.AnyObject = {}) {
        return filterPropertyToStoreData(data, this.properties, target)
    }

    normalizeDataToProperties (data: Fibjs.AnyObject = {}, target: Fibjs.AnyObject = {}) {
        return fillStoreDataToProperty(data, this.properties, target)
    }

    filterOutAssociatedData (dataset: Fibjs.AnyObject = {}, instanceDataSet: Fibjs.AnyObject = {}) {
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

    filterAssociationProperties (): any {
        return {
            o2o: [],
            o2m: [],
            m2m: [],
            m2o: [],
        }
    }

    addProperty (name: string, property: FxOrmTypeHelpers.SecondParameter<FxOrmModel.Class_Model['addProperty']>) {
        if (this.fieldInfo(name))
            throw new Error(`[Model] property '${name}' existed in model '${this.name}'`)

        // if (name === 'name')
        //     console.notice('[add Property] property', property);

        if ((property instanceof Property))
            return this.properties[name] = property
            
        return this.properties[name] = property = Property.New({...property, name}, {
            propertyName: name,
            storeType: this.storeType
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
}

// util.inherits(Model, Class_QueryBuilder)

class MergeModel extends Model implements FxOrmModel.Class_MergeModel {
    name: string
    type: 'o2o' | 'o2m' | 'm2o' | 'm2m'
    sourceModel: FxOrmModel.Class_Model
    get sourceKeys () { return this.sourceModel.keys }
    targetModel: FxOrmModel.Class_Model
    get targetKeys () { return this.targetModel.keys }

    @configurable(false)
    get isMergeModel () { return true }

    @configurable(false)
    get ids (): string[] {
        let _ids

        switch (this.type) {
            case 'o2m':
                _ids = Array.from(
                    new Set(super.ids.concat(this.targetModel.ids))
                )
            default:
                break
        }

        return _ids
    }
    
    associationInfo: FxOrmModel.Class_MergeModel['associationInfo']

    constructor (opts: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmModel.Class_MergeModel>[0]) {
        const {
            mergeCollection, source, target, matchKeys,
            /**
             * @description for MergeModel, deal with options.keys alone to avoid parent `Model`'s processing
             */
            keys,
            ...restOpts
        } = opts
        
        super({...restOpts, keys: false})

        this.type = opts.type
        this.associationInfo = { collection: mergeCollection, andMatchKeys: matchKeys }

        this.sourceModel = source
        this.targetModel = target

        // generate associated properties
        ;(() => {
            switch (this.type) {
                /**
                 * for o2m, 
                 * - this mergeModel has all properties in targetModel
                 */
                case 'o2m':
                    this.associationInfo.andMatchKeys.forEach(x => {  
                        // don't add property when it existed.
                        if (this.targetModel.fieldInfo(x.target))
                            return ;
                        
                        const sProperty = this.sourceModel.properties[x.source]
                        if (!sProperty)
                            throw new Error(`[Association::o2m] no src property ${x.source} in source model, check your definition about 'andMatchKeys'`)

                        this.addProperty(
                            x.target,
                            sProperty
                                .renameTo({ name: x.target })
                                .useForAssociationMatch()
                                .deKeys()
                        )
                    })

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
                    break
                case 'm2o':
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
        associationDataSet = {},
        sourceInstance = null
    }) {
        switch (this.type) {
            case 'o2m':
                const inputs = arraify(this.New(associationDataSet));

                // don't change it it no inputs
                if (inputs && inputs.length)
                    sourceInstance[this.name] = sourceInstance[this.name] || []

                const assocs = coroutine.parallel(
                    inputs,
                    (assocInst: FxOrmInstance.Class_Instance) => {
                        this.associationInfo.andMatchKeys.forEach(matchCond => {
                            if (!sourceInstance[matchCond.source]) return ;
                            assocInst[matchCond.target] = sourceInstance[matchCond.source]
                        })

                        this.targetModel.propertyList.forEach(property => {
                            // assocInst[property.name] = sourceInstance[property.name]
                        })

                        assocInst.save()

                        return assocInst.toJSON()
                    }
                )

                sourceInstance[this.name] = this.targetModel.New(assocs)
                break
        }
    }
}

export default Model