import util = require('util')
import events = require('events')
const EventEmitter = events.EventEmitter;

import FxDbDriver = require('@fxjs/db-driver');

import * as ORMRuntime from '../Decorators/orm-runtime';

import Setting from './Setting';
import Model from './Model';
import { arraify } from '../Utils/array';
import { snapshot } from '../Utils/clone';
import { configurable } from '../Decorators/accessor';

class ORM<ConnType = any> extends EventEmitter {
    /**
     * @description create one orm, but never do any real connection
     */
    static create (connection: string | FxDbDriverNS.ConnectionInputArgs) {
        const dbdriver = FxDbDriver.create(connection);
        const orm = new ORM(dbdriver);

        ORMRuntime.validProtocol()(orm);

        return orm;
    }

    /**
     * @description create orm and connect it
     */
    static connect (connection: string | FxDbDriverNS.DBConnectionConfig) {
        const orm = ORM.create(connection);

        orm.driver.open();

        return orm;
    }

    settings = new Setting({
        model      : {
            namePrefix				  : '',
            repair_column  		  	  : false,
            /**
             * @dangerous
             */
            allow_drop_column  		  : false,
        },
        properties : {
            primary_key               : "id",
            association_key           : "{name}_{field}",
            required                  : false
        },
        instance   : {
            defaultFindLimit          : 1000,
            cascadeRemove             : true,
            saveAssociationsByDefault : true
        },
        connection : {
            reconnect                 : true,
            pool                      : false,
            debug                     : false
        }
    });

    private _models: {[k: string]: Model} = {};
    @configurable(false)
    get models (): {[k: string]: Model} {
        return this._models;
    };

    driver: FxDbDriverNS.Driver<ConnType>;

    constructor (driver: FxDbDriverNS.Driver<ConnType> | string | FxDbDriverNS.ConnectionInputArgs) {
        super();
        if (typeof driver === 'string')
            driver = FxDbDriver.create(driver);
        else if (typeof driver === 'object' && !(driver instanceof FxDbDriver))
            driver = FxDbDriver.create(driver);

        this.driver = driver;
    }

    /**
     * @description load plugin, affect all models.
     * @param pluginConfig 
     */
    use (pluginConfig: string | FxORMPlugin.PluginOptions) {

    }

    /**
     * @description define one model with modelName(name) and properties(props)
     * 
     * @param name 
     * @param props 
     * @param config 
     */
    define (
        name: string,
        properties: FxOrmModel.ModelPropertyDefinitionHash,
        config: FxOrmModel.ModelDefineOptions
    ) {
        const filteredProps = properties as FxOrmProperty.NormalizedPropertyHash;

        return this.models[name] = new Model({
            name,
            properties: filteredProps,
            keys: arraify(config.id),

            orm: this as any,
            settings: new Setting(snapshot(this.settings)) as any,

            collection: config.collection || name,
            indexes: [],


            autoSave: false,
            autoFetch: config.autoFetch,
            autoFetchLimit: config.autoFetchLimit,
            cascadeRemove: config.cascadeRemove,
            
            methods: {},
            validations: {},
            ievents: {},
        });
    }

    /**
     * @description create one model's instance from model with (modelName)
     * 
     * @param modelName 
     */
    New (modelName: string) {
        
    }

    close (): void {
        this.driver.close()
    }
}

export default ORM;