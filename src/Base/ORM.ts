import events = require('events')
const EventEmitter = events.EventEmitter;

import FxDbDriver = require('@fxjs/db-driver');
import SqlQuery = require('@fxjs/sql-query');

import * as ORMRuntime from '../Decorators/orm-runtime';

import Setting from './Setting';
import Property from './Property';
import Model from './Model';
import * as QueryGrammers from './Query/QueryGrammar';
import { buildDescriptor } from '../Decorators/property';
import { getDML } from '../DXL/DML';
import { getDDL } from '../DXL/DDL';
import getNormalizedHQLObject from './Query/Normalizer';

class ORM<ConnType = any> extends EventEmitter implements FxOrmNS.Class_ORM {
    static Op = QueryGrammers.Ql.Operators
    static Opf = QueryGrammers.Qlfn.Operators
    static Ql = QueryGrammers.Ql
    static Qlfn = QueryGrammers.Qlfn

    static Property = Property

    static create (connection: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmNS.Class_ORM>[0]) {
        const orm = new ORM(connection);

        return orm;
    }

    static connect (connection: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmNS.Class_ORM>[0]) {
        const orm = ORM.create(connection);

        orm.driver.open();

        return orm;
    }

    static parseHQL (...args: FxOrmTypeHelpers.Parameters<(typeof FxOrmNS.Class_ORM)['parseHQL']>): FxOrmQueries.HqLNormalizer {
        return getNormalizedHQLObject(...args);
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
    customPropertyTypes: FxOrmNS.Class_ORM['customPropertyTypes'] = {}

    @buildDescriptor({ configurable: false, enumerable: false })
    $dml: FxOrmTypeHelpers.InstanceOf<ReturnType<typeof getDML>>;
    @buildDescriptor({ configurable: false, enumerable: false })
    $ddl: FxOrmTypeHelpers.InstanceOf<ReturnType<typeof getDDL>>;

    @buildDescriptor({ configurable: false, enumerable: false })
    $context: any = {};

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

        const sqlQuery = this.$context['_sqlQuery'] = new SqlQuery.Query({ dialect: <any>this.driver.type })

        const DDL = getDDL(this.driver.type)
        this.$ddl = ddl instanceof DDL ? ddl : new DDL({ dialect: this.driver.type, connection: this.connection, sqlQuery });

        const DML = getDML(this.driver.type)
        this.$dml = dml instanceof DML ? dml : new DML({ dialect: this.driver.type, connection: this.connection, sqlQuery });
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

    defineType (...args: Parameters<FxOrmNS.Class_ORM['defineType']>) {
        const [name, opts] = args
        if (!name) throw new Error(`[ORM::defineType] name is required!`)
        if (!opts) throw new Error(`[ORM::defineType] opts is required!`)

        return this.customPropertyTypes[name] = opts
    }

    useTrans (callback: (orm: FxOrmNS.Class_ORM) => void) {
        if (typeof callback !== 'function')
            throw new Error(`[ORM::useTrans] callback must be function`)

        /**
         * @TODO: check why `this.modelDefinitions` is not correct in `.useTrans` callback?
         */
        const modelDefinitions = this.modelDefinitions

        this.driver.useTrans((conn: any) => {
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
