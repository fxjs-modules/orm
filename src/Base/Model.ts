import util = require('util');
import coroutine = require('coroutine');
;
import DDLSync = require('@fxjs/sql-ddl-sync');

import * as DecoratorsParameters from '../Decorators/parameter';
import * as DecoratorsProperty from '../Decorators/property';

import QueryChain from './QueryChain';
import { getInstance } from './Instance';

import * as SYMBOLS from '../Utils/symbols';
import { snapshot } from "../Utils/clone";
import { filterProperty } from '../Utils/property';
import { configurable } from '../Decorators/accessor';

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
    
    properties: FxOrmModel.ModelConstructorOptions['properties'] = {};

    keyProperties: FxOrmProperty.NormalizedPropertyHash = {};
    @configurable(false)
    get keys (): string[] {
        return Object.keys(this.keyProperties);
    }

    orm: FxOrmModel.ModelConstructorOptions['orm']

    @DecoratorsProperty.format("this is _modelName, %s")
    private _modelName: string

    private get dbdriver(): FxDbDriverNS.Driver {
        return this.orm.driver as any;
    }

    @configurable(false)
    get _symbol () { return SYMBOLS.Model };

    constructor (config: FxOrmModel.ModelConstructorOptions) {
        Object.defineProperty(this, 'name', { value: config.name })
        this.collection = config.collection;
        this.orm = config.orm;

        // normalize it
        Object.keys(config.properties)
            .forEach((prop: string) => {
                const property = this.properties[prop] = filterProperty(
                    config.properties[prop],
                    config.properties[prop].mapsTo || prop,
                );

                if (property.key)
                    this.keyProperties[prop] = property;
            });

        if (Object.keys(this.keyProperties).length === 0) {
            this.keyProperties['id'] = this.properties['id'] = filterProperty({
                type: 'serial',
                key: true
            }, 'id')
        }
    }

    logModelName (): void {
        let formatString = DecoratorsProperty.getFormat(this, '_modelName');
        console.log(formatString, this._modelName);
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
    drop (): void {}

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

    hasOne(
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