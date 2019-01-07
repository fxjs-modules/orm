/// <reference types="fibjs" />
/// <reference types="@fibjs/enforce" />
/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />

/// <reference path="3rd.d.ts" />

/// <reference path="connect.d.ts" />
/// <reference path="settings.d.ts" />

/// <reference path="query.d.ts" />
/// <reference path="model.d.ts" />
/// <reference path="instance.d.ts" />
/// <reference path="assoc.d.ts" />
/// <reference path="patch.d.ts" />

/// <reference path="Error.d.ts" />
/// <reference path="Adapter.d.ts" />
/// <reference path="Validators.d.ts" />
/// <reference path="DMLDriver.d.ts" />

// fix fibjs types' missing
// declare var console: any

declare namespace FxOrmNS {
    interface ExtensibleError extends Error {
        [extensibleProperty: string]: any
    }

    interface TransformFibOrmModel2InstanceOptions extends FxOrmModel.ModelOptions {}

    type FibORM = ORM
    // bad annotation but 'db' is used as like 'orm' ever, so we use 'FibOrmDB' to substitute FibORM
    type FibOrmDB = ORM

    interface FibORMIConnectionOptions extends IConnectionOptions {
        timezone: string;
    }

    // for compability
    type InstanceOptions = FxOrmInstance.InnerInstanceOptions

    type OrigAggreteGenerator = (...args: any[]) => FxOrmQuery.IAggregated

    interface FibOrmFindLikeQueryObject {
        [key: string]: any;
    }

    interface FibOrmFixedModelInstanceFn {
        (model: FxOrmModel.Model, opts: object): FxOrmInstance.Instance
        new (model: FxOrmModel.Model, opts: object): FxOrmInstance.Instance
    }

    interface FibOrmPatchedSyncfiedInstantce extends FxOrmPatch.PatchedSyncfiedInstanceWithDbWriteOperation, FxOrmPatch.PatchedSyncfiedInstanceWithAssociations {
    }

    interface IChainFibORMFind extends FxOrmPatch.PatchedSyncfiedModelOrInstance, FxSqlQuery.ChainBuilder__Select {
        only(args: string | string[]): IChainFibORMFind;
        only(...args: string[]): IChainFibORMFind;
        // order(...order: string[]): IChainFibORMFind;
    }
    /* Orm About Patch :end */

    /* instance/model computation/transform about :start */
    interface ModelAutoFetchOptions {
        autoFetchLimit?: number
        autoFetch?: boolean
    }

    interface InstanceAutoFetchOptions extends ModelAutoFetchOptions {
    }

    interface ModelExtendOptions {

    }
    interface InstanceExtendOptions extends ModelExtendOptions {

    }
    /* instance/model computation/transform about :end */

    /**
    * Parameter Type Interfaces
    **/
    // just for compatible
    type FibOrmFixedModel = FxOrmModel.Model
    // patch the missing field defined in orm/lib/Instance.js (such as defined by Object.defineProperty)
    type FibOrmFixedModelInstance = FxOrmInstance.Instance 

    interface PluginOptions {
        [key: string]: any
    }
    interface PluginConstructor {
        new (orm: ORM, opts?: PluginOptions)
    }
    interface Plugin {
        // (connection: FibORM, proto: any, opts: any, cb: Function): any
        beforeDefine?: {
            (name: string, properties: FxOrmModel.ModelPropertyDefinitionHash, opts: FxOrmModel.ModelOptions)
        }
        define?: {
            (model: FxOrmModel.Model, orm?: ORM)
        }
    }

    interface ORMConstructor {
        (driver_name: string, driver: FxOrmDMLDriver.DMLDriver, settings: FxOrmSettings.SettingInstance): void
        prototype: ORM
    }

    class ORM extends Class_EventEmitter {
        validators: FxOrmValidators.ValidatorModules;
        enforce: FxOrmValidators.FibjsEnforce;
        settings: FxOrmSettings.SettingInstance;
        driver_name: string;
        driver: FxOrmPatch.PatchedDMLDriver;
        tools: FxSqlQueryComparator.ComparatorHash;
        models: { [key: string]: FxOrmModel.Model };
        plugins: Plugin[];
        customTypes: { [key: string]: FxOrmProperty.CustomPropertyType };

        use(plugin: PluginConstructor, options?: PluginOptions): ORM;

        define(name: string, properties: FxOrmModel.ModelPropertyDefinitionHash, opts?: FxOrmModel.ModelOptions): FxOrmModel.Model;
        defineType(name: string, type: FxOrmProperty.CustomPropertyType): this;
        ping(callback: FxOrmNS.VoidCallback): this;
        close(callback: FxOrmNS.VoidCallback): this;
        load(file: string, callback: FxOrmNS.VoidCallback): any;
        sync(callback: FxOrmNS.VoidCallback): this;
        drop(callback: FxOrmNS.VoidCallback): this;
        serial: {
            (...chains: any[]): {
                get: {
                    (callback?: FibOrmNS.GenericCallback<any[]>): ORM
                }
            }
        }
        /* all fixed: end */

        /* memeber patch: start */
        // begin: () => any
        // commit: () => any
        // rollback: () => any
        // trans: (func: Function) => any

        syncSync(): void;

        [extraMember: string]: any;
    }

    interface SingletonOptions {
        identityCache?: boolean;
        saveCheck?: boolean;
    }

    export class singleton {
        static clear(key?: string): singleton;
        static get(key: string, opts: SingletonOptions, createCb: Function, returnCb: Function);
    }
    
    export class PropertyModule {
        static normalize(property: string, settings: FxOrmSettings.SettingInstance): any;
        static validate(value: any, property: string): any;
    }

    interface IUseOptions {
        query?: {
            /**
             * debug key from connection options or connction url's querystring
             * @example query.debug: 'false'
             * @example mysql://127.0.0.1:3306/schema?debug=true
             */
            debug?: string
        }
    }

    interface ExportModule extends 
        /* deprecated :start */
        // just use require('@fxjs/sql-query').comparators.xxx plz
        FxSqlQueryComparator.ComparatorHash
        /* deprecated :end */
    {
        validators: FxOrmValidators.ValidatorModules
        Settings: FxOrmSettings.Settings
        settings: FxOrmSettings.SettingInstance
        singleton: any
        Property: PropertyModule
        enforce: FxOrmValidators.FibjsEnforce
        ErrorCodes: FxOrmNS.PredefineErrorCodes
        addAdapter: FxOrmNS.AddAdapatorFunction

        /* deprecated :start */
        Text: FxSqlQuery.TypedQueryObjectWrapper<'text'>;
        /* deprecated :end */

        use(connection: FxOrmDb.DatabaseBase, protocol: string, options: IUseOptions, callback: (err: Error, db?: FxOrmNS.ORM) => void): any;
        connect: IConnectFunction;
        connectSync(opts: FibORMIConnectionOptions | string): FibORM;

        [extra: string]: any
    }
}
