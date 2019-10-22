import coroutine = require('coroutine')
import events = require('events')
const EventEmitter = events.EventEmitter;

import FxDbDriver = require('@fxjs/db-driver');

import * as ORMRuntime from '../Decorators/orm-runtime';

import Setting from './Setting';
import Model from './Model';
import * as QueryGrammers from './Query/QueryGrammar';
import { arraify } from '../Utils/array';
import { configurable } from '../Decorators/accessor';
import { buildDescriptor } from '../Decorators/property';
import { getDML } from '../DXL/DML';
import { getDDL } from '../DXL/DDL';
import QueryNormalizer from './Query/Normalizer';

class ORM<ConnType = any> extends EventEmitter implements FxOrmNS.Class_ORM {
    static Op = QueryGrammers.Ql.Operators
    static Opf = QueryGrammers.Qlfn.Operators
    static Ql = QueryGrammers.Ql
    static Qlfn = QueryGrammers.Qlfn

    static create (connection: string | FxDbDriverNS.ConnectionInputArgs) {
        const dbdriver = FxDbDriver.create(connection);
        const orm = new ORM(dbdriver);

        ORMRuntime.validProtocol()(orm);

        return orm;
    }

    static connect (connection: string | FxDbDriverNS.DBConnectionConfig) {
        const orm = ORM.create(connection);

        orm.driver.open();

        return orm;
    }

    static parseHQL (...args: FxOrmTypeHelpers.Parameters<(typeof FxOrmNS.Class_ORM)['parseHQL']>): FxOrmQueries.Class_QueryNormalizer {
        return new QueryNormalizer(...args);
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

    private _models: {[k: string]: FxOrmModel.Class_Model} = {};
    @configurable(false)
    get models (): {[k: string]: FxOrmModel.Class_Model} {
        return this._models;
    };

    @buildDescriptor({ configurable: false, enumerable: false })
    $dml: FxOrmTypeHelpers.InstanceOf<FxOrmTypeHelpers.ReturnType<typeof getDML>>;
    @buildDescriptor({ configurable: false, enumerable: false })
    $ddl: FxOrmTypeHelpers.InstanceOf<FxOrmTypeHelpers.ReturnType<typeof getDDL>>;

    driver: FxDbDriverNS.Driver<ConnType>;

    constructor (driver: FxDbDriverNS.Driver<ConnType> | string | FxDbDriverNS.ConnectionInputArgs) {
        super();
        if (typeof driver === 'string')
            driver = FxDbDriver.create(driver);
        else if (typeof driver === 'object' && !(driver instanceof FxDbDriver))
            driver = FxDbDriver.create(driver);

        this.driver = driver;

        const DML = getDML(this.driver.type)
        this.$dml = new DML({ dbdriver: this.driver as any });

        const DDL = getDDL(this.driver.type)
        this.$ddl = new DDL({ dbdriver: this.driver as any });
    }

    /**
     * @description load plugin, affect all models.
     * @param pluginConfig
     */
    use (pluginConfig: string | FxORMPlugin.PluginOptions) {}

    define (
        name: string,
        properties: Fibjs.AnyObject,
        config: FxOrmModel.Class_ModelDefinitionOptions = {}
    ) {
        const filteredProps = properties as FxOrmProperty.NormalizedPropertyHash;

        return this.models[name] = new Model({
            name,
            properties: filteredProps,
            keys: config.keys ? arraify(config.keys) : (config.keys === false ? false : undefined),

            orm: this as any,
            settings: this.settings.clone(),

            collection: config.collection || name,
            indexes: [],

            autoSave: false,
            autoFetch: config.autoFetch,
            cascadeRemove: config.cascadeRemove,

            methods: {},
            validations: {},
        });
    }

    defineFromHQLQuery (
      hql: string
    ) {
      return null as any
    }

    /**
     * @description sync all model in this.models to remote endpoints
     */
    sync () {
        Object.values(this.models).forEach(model => model.sync())
    }

    /**
     * @description sync all model in this.models from remote endpoints
     */
    drop () {
        Object.values(this.models).forEach(model => model.drop())
    }

    close (): void {
        this.driver.close()
    }
}

export default ORM;
