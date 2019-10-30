import coroutine = require('coroutine')
import events = require('events')
const EventEmitter = events.EventEmitter;

import FxDbDriver = require('@fxjs/db-driver');

import * as ORMRuntime from '../Decorators/orm-runtime';

import Setting from './Setting';
import Model from './Model';
import * as QueryGrammers from './Query/QueryGrammar';
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

    static create (connection: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmNS.Class_ORM>[0]) {
        const orm = new ORM(connection);

        return orm;
    }

    static connect (connection: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmNS.Class_ORM>[0]) {
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
            required                  : false
        },
        instance   : {
            cascadeRemove             : true,
            saveAssociationsByDefault : true
        },
        connection : {
            reconnect                 : true,
            pool                      : false,
            debug                     : false
        }
    });

    @buildDescriptor({ configurable: false, enumerable: false })
    models: FxOrmNS.Class_ORM['models'] = {}

    @buildDescriptor({ configurable: false, enumerable: false })
    modelDefinitions: FxOrmNS.Class_ORM['modelDefinitions'] = {}

    @buildDescriptor({ configurable: false, enumerable: false })
    $dml: FxOrmTypeHelpers.InstanceOf<ReturnType<typeof getDML>>;
    @buildDescriptor({ configurable: false, enumerable: false })
    $ddl: FxOrmTypeHelpers.InstanceOf<ReturnType<typeof getDDL>>;

    driver: FxOrmNS.Class_ORM['driver']
    connection: FxOrmNS.Class_ORM['connection']

    constructor (...args: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmNS.Class_ORM>) {
        super();

        let [driver, opts] = args

        if (typeof driver === 'string')
            driver = FxDbDriver.create(driver);
        else if (typeof driver === 'object' && !(driver instanceof FxDbDriver))
            driver = FxDbDriver.create(driver);

        this.driver = <FxDbDriverNS.Driver<ConnType>>driver;

        ORMRuntime.validProtocol()(this);

        const { ddl = null, dml = null, connection = null } = opts || {}

        this.connection = connection || driver.getConnection()

        const DDL = getDDL(this.driver.type)
        this.$ddl = ddl instanceof DDL ? ddl : new DDL({ dialect: this.driver.type, connection: this.connection });

        const DML = getDML(this.driver.type)
        this.$dml = dml instanceof DML ? dml : new DML({ dialect: this.driver.type, connection: this.connection });
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
    ): FxOrmModel.Class_Model {
        const settings = this.settings.clone()

        const def: FxOrmNS.Class_ORM['modelDefinitions'][any] = (orm) => {
            orm.models[name] = new Model({
                name,
                properties: <FxOrmProperty.NormalizedPropertyHash>properties,
                keys: config.keys,
    
                orm,
                settings: settings.clone(),
    
                collection: config.collection || name,
                indexes: [],

                howToCheckExistenceWhenNoKeys: config.howToCheckExistenceWhenNoKeys || undefined,
    
                cascadeRemove: config.cascadeRemove,
    
                methods: {},
                validations: {},
            })

            orm.modelDefinitions[name] = def

            return orm.models[name]
        };

        return def(this)
    }

    useTrans (callback: (orm: FxOrmNS.Class_ORM) => void) {
        if (typeof callback !== 'function')
            throw new Error(`[ORM::useTrans] callback must be function`)

        /**
         * @TODO: check why `this.modelDefinitions` is not correct in `.useTrans` callback?
         */
        const modelDefinitions = this.modelDefinitions

        this.driver.useTrans((conn) => {
            const orm = new ORM(this.driver, {
                connection: conn,
                ddl: <any>this.$ddl.fromNewConnection(conn),
                dml: <any>this.$dml.fromNewConnection(conn),
            })
        
            // get one fresh orm
            Object.values(modelDefinitions).forEach(def => def(orm))
    
            callback(orm)
        })
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
