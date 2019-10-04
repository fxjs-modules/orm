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

class Model implements FxOrmModel.ModelNG {
    name: FxOrmModel.ModelConstructorOptions['name']
    collection: FxOrmModel.ModelConstructorOptions['collection']
    
    // properties: FxOrmModel.ModelConstructorOptions['properties'] = {};
    properties: {[k: string]: Property} = {};

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
    /**
     * @description all key field properties
     */
    @configurable(false)
    get keyPropertyList (): FxOrmProperty.NormalizedProperty[] {
        return Object.values(this.keyProperties)
    }

    keyProperties: Model['properties'] = {};
    @configurable(false)
    get keys (): string[] {
        return Object.keys(this.keyProperties);
    }

    orm: FxOrmModel.ModelConstructorOptions['orm']

    private get dbdriver(): FxDbDriverNS.Driver {
        return this.orm.driver as any;
    }

    @configurable(false)
    get _symbol () { return SYMBOLS.Model };
    
    get $dml () { return this.orm.$dml };
    get $ddl () { return this.orm.$ddl };

    constructor (config: FxOrmModel.ModelConstructorOptions) {
        Object.defineProperty(this, 'name', { value: config.name })
        this.collection = config.collection;
        this.orm = config.orm;

        // normalize it
        Object.keys(config.properties)
            .forEach((prop: string) => {
                const property = this.properties[prop] = Property.New(
                    config.properties[prop],
                    { name: prop, storeType: this.dbdriver.type }
                );
                if (property.key) this.keyProperties[prop] = property;
            });

        if (this.ids.length === 0) {
            this.keyProperties['id'] = this.properties['id'] = Property.New({
                name: 'id',
                type: 'serial',
                key: true
            }, { storeType: this.dbdriver.type })
        }
    }

    /**
     * @description sync collection definition to remote endpoint
     */
    sync (): void {
        const syncor = new DDLSync.Sync({
            dbdriver: this.dbdriver,
            syncStrategy: 'mixed'
        });

        syncor.defineCollection(
            this.collection,
            this.properties
        )

        syncor.sync()
    }

    /**
     * @description drop collection from remote endpoint
     */
    drop (): void {
        this.$ddl.dropTable(this.collection)
    }

    /**
     * @description create one instance from this model
     */
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

    /**
     * @description clear all data in remote endpoints
     */
    clear (): void {
        this.$dml.clear(this.collection)
    }

    hasOne(
        name: string,
        opts?: {
            model?: Model,
            config?: FxOrmAssociation.AssociationDefinitionOptions_HasOne
        }
    ): any {
        
    }

    hasMany(
        name: string,
        opts?: {
            model?: Model,
            config?: FxOrmAssociation.AssociationDefinitionOptions_HasOne
        }
    ): any {
        
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

    /**
     * @description define one2one object-relation between this with opts.model
     * 
     * @param name 
     * @param opts 
     */
    o2o(
        name: string,
        opts?: {
            model?: Model,
            config?: FxOrmAssociation.AssociationDefinitionOptions_HasOne
        }
    ): any {
        
    }

    o2m(
        name: string,
        opts?: {
            model?: Model,
            config?: FxOrmAssociation.AssociationDefinitionOptions_HasOne
        }
    ): any {
        
    }

    m2o(
        name: string,
        opts?: {
            model?: Model,
            config?: FxOrmAssociation.AssociationDefinitionOptions_HasOne
        }
    ): any {
        
    }

    m2m(
        name: string,
        opts?: {
            model?: Model,
            config?: FxOrmAssociation.AssociationDefinitionOptions_HasOne
        }
    ): any {
        
    }
}

util.inherits(Model, QueryChain)

export default Model