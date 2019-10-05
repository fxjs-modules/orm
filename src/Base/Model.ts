import util = require('util');
import coroutine = require('coroutine');

import DDLSync = require('@fxjs/sql-ddl-sync');

import QueryChain from './QueryChain';
import { getInstance } from './Instance';

import * as SYMBOLS from '../Utils/symbols';
import { snapshot } from "../Utils/clone";
import Property from './Property';
import { configurable } from '../Decorators/accessor';
import { fillStoreDataToProperty, filterPropertyToStoreData } from '../DXL/DML/_utils';
import { filterAssociationKey } from './Association';
import { arraify } from '../Utils/array';

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

class Model implements FxOrmModel.Class_Model {
    name: FxOrmModel.Class_Model['name']
    collection: FxOrmModel.Class_Model['collection']

    properties: {[k: string]: Property} = {};
    associations: FxOrmModel.Class_Model['associations'] = {};
    
    associationProperties: FxOrmAssociation.Class_AssociationProperty[] = [];

    settings: any

    /**
     * @description id property name
     */
    @configurable(false)
    get id (): string | undefined {
        return Object.keys(this.keyProperties)[0] || undefined
    }
    /**
     * @description all key field properties
     */
    @configurable(false)
    get ids (): string[] {
        const _ids = []
        if (this.id)
            _ids.push(this.id)
        
        return _ids
    }

    keyProperties: FxOrmModel.Class_Model['properties'] = {};
    /**
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
        // return Object.values(this.associations).map(x => x.sourceKey);
        return []
    }

    orm: FxOrmModel.Class_Model['orm']

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
        Object.defineProperty(this, 'name', { value: config.name })
        this.collection = config.collection;
        this.orm = config.orm;
        this.settings = config.settings;

        const specKeyPropertyNames = normalizeKeysInConfig(config.keys)

        // normalize it
        Object.keys(config.properties)
            .forEach((prop: string) => {
                const property = this.properties[prop] = Property.New(
                    config.properties[prop],
                    { name: prop, storeType: this.storeType }
                );
                
                if (specKeyPropertyNames)
                    if (property.isKeyProperty() || specKeyPropertyNames.includes(prop))
                        this.keyProperties[prop] = property;
            });

        if (specKeyPropertyNames && this.ids.length === 0) {
            this.keyProperties['id'] = this.properties['id'] = Property.New(DFLT_ID_DEF, { storeType: this.storeType })
        }
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
        this.$ddl.dropTable(this.collection)
    }

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
            
        const instance = getInstance(this, snapshot(kvItem));

        // console.log(require('@fibjs/chalk')`{bold.yellow.inverse instance.$kvs [1]}`, kvItem, instance.$kvs);
        instance.save(kvItem);

        return instance;
    }

    clear (): void {
        this.$dml.clear(this.collection)
    }

    hasOne: FxOrmModel.Class_Model['hasOne'] = function (this: FxOrmModel.Class_Model, name, opts?) {
        return null as any
    }

    hasMany: FxOrmModel.Class_Model['hasMany'] = function (this: FxOrmModel.Class_Model, name, opts?) {
        const { type = 'o2m', reverse, ...restOpts } = opts || {} as typeof opts;
        const reverseKey = typeof reverse === 'string' ? reverse : `${this.name}s`

        let assoc = null

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

    o2o: FxOrmModel.Class_Model['o2o'] = function (this: FxOrmModel.Class_Model, name, opts?) {
        return null as any
    }

    o2m: FxOrmModel.Class_Model['o2m'] = function (this: FxOrmModel.Class_Model, name, opts?) {
        if (!name) throw new Error(`[o2m] association name is required`)

        const { model: targetModel = this } = opts || {}
        const {
            matchKeys = {
                source: this.id,
                target: `${this.collection}_id`,
                comparator: '='
            }
        } = opts || {}

        const mergeModel = new MergeModel({
            name: name,
            collection: targetModel.collection,
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

        // const association = Association.build({
        //     name, type: 'o2m', source: this, target: targetModel,
        //     matchKeys: arraify(matchKeys)
        //     // associationKey: filterAssociationKey(associationKey, { sourceModel: this, targetModel, association })
        // })

        // this.associations[name] = association;

        // return association
    }

    m2m: FxOrmModel.Class_Model['m2m'] = function (this: FxOrmModel.Class_Model, name, opts?) {
        return null as any
    }

    m2o: FxOrmModel.Class_Model['m2o'] = function (this: FxOrmModel.Class_Model, name, opts?) {
        return null as any
    }

    New (base: Fibjs.AnyObject = {}) {
        return getInstance(this, base);
    }

    normalizeDataToProperties (data: Fibjs.AnyObject = {}, target: Fibjs.AnyObject = {}) {
        return fillStoreDataToProperty(data, this.properties, target)
    }

    normalizePropertiesToData (data: Fibjs.AnyObject = {}) {
        return filterPropertyToStoreData(data, this.properties)
    }

    filterAssociationProperties (): any {
        return {
            o2o: [],
            o2m: [],
            m2m: [],
            m2o: [],
        }
    }

    addProperty: FxOrmModel.Class_Model['addProperty'] = function (this: FxOrmModel.Class_Model, name, property) {
        if (this.fieldInfo(name))
            throw new Error(`[Model] property '${name}' existed in model '${this.name}'`)
        
        if ((property instanceof Property))
            return this.properties[name] = property
            
        return this.properties[name] = property = Property.New({...property, name}, { storeType: this.storeType })
    }

    fieldInfo: FxOrmModel.Class_Model['fieldInfo'] = function (this: FxOrmModel.Class_Model, propertyName) {
        if (this.properties.hasOwnProperty(propertyName))
            return {
                type: 'self',
                property: this.properties[propertyName]
            }
        if (this.associations.hasOwnProperty(propertyName))
            return {
                type: 'association',
                association: this.associations[propertyName]
            }

        return null
    }
}

util.inherits(Model, QueryChain)

class MergeModel extends Model implements FxOrmModel.Class_MergeModel {
    name: string
    type: 'o2o' | 'o2m' | 'm2o' | 'm2m'
    sourceModel: FxOrmModel.Class_Model
    get sourceKeys () { return this.sourceModel.keys }
    targetModel: FxOrmModel.Class_Model
    get targetKeys () { return this.targetModel.keys }
    
    associationInfo: FxOrmModel.Class_MergeModel['associationInfo']

    constructor (opts: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmModel.Class_MergeModel>[0]) {
        const {
            mergeCollection, source, target, matchKeys,
            ...restOpts
        } = opts
        super(restOpts)

        this.type = opts.type
        this.associationInfo = {
            collection: mergeCollection,
            andMatchKeys: matchKeys
        }

        this.sourceModel = source
        this.targetModel = target

        // _generateAssociatedProperties
        ;(() => {
            const matchKeys = this.associationInfo.andMatchKeys

            matchKeys.forEach(x => {            
                switch (this.type) {
                    case 'o2m':
                        // dont add property when it existed.
                        if (this.targetModel.fieldInfo(x.target))
                            return ;
                        
                        const srcProperty = this.sourceModel.properties[x.source]
                        if (!srcProperty)
                            throw new Error(`[Association::o2m] no src property ${x.source} in source model, check your definition about 'matchKeys'`)

                        this.addProperty(
                            x.target,
                            srcProperty
                                .renameTo({ name: x.target, mapsTo: x.target })
                                .deKeys()
                        )
                        break
                    case 'm2o':
                        break
                }
            })
        })();
    }

    isSourceModel (model: FxOrmModel.Class_Model): boolean {
        return model === this.sourceModel
    }
    isTarget (model: FxOrmModel.Class_Model): boolean {
        return model === this.targetModel
    }
}

export default Model