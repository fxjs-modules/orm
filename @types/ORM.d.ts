/// <reference types="fibjs" />
/// <reference types="@fibjs/enforce" />
/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />

/// <reference path="3rd.d.ts" />

/// <reference path="_common.d.ts" />
/// <reference path="connect.d.ts" />
/// <reference path="settings.d.ts" />

/// <reference path="query.d.ts" />
/// <reference path="model.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="instance.d.ts" />
/// <reference path="assoc.d.ts" />
/// <reference path="synchronous.d.ts" />
/// <reference path="patch.d.ts" />

/// <reference path="Db.d.ts" />
/// <reference path="Error.d.ts" />
/// <reference path="Adapter.d.ts" />
/// <reference path="Validators.d.ts" />
/// <reference path="DMLDriver.d.ts" />

// fix fibjs types' missing
// declare var console: any

declare namespace FxOrmNS {
    /* compatible :start */
    export type Model = FxOrmModel.Model
    export type IChainFind = FxOrmQuery.IChainFind
    
    export type Instance = FxOrmInstance.Instance
    export type Hooks = FxOrmModel.Hooks
    export type FibOrmFixedExtendModel = FxOrmModel.Model

    export type ModelPropertyDefinition = FxOrmModel.ModelPropertyDefinition
    export type OrigDetailedModelProperty = FxOrmModel.OrigDetailedModelProperty
    export type OrigDetailedModelPropertyHash = FxOrmModel.OrigDetailedModelPropertyHash
    export type OrigModelPropertyDefinition = FxOrmModel.ComplexModelPropertyDefinition
    export type ModelPropertyDefinitionHash = FxOrmModel.ModelPropertyDefinitionHash
    export type ModelOptions = FxOrmModel.ModelOptions
    export type OrigHooks = FxOrmModel.Hooks
    
    export type ComplexModelPropertyDefinition = FxOrmModel.ComplexModelPropertyDefinition
    export type FibOrmFixedModelOptions = FxOrmModel.ModelOptions
    export type ValidationOptionHash = FxOrmValidators.ValidationOptionHash
    export type PatchedSyncfiedModelOrInstance = FxOrmPatch.PatchedSyncfiedModelOrInstance
    export type PatchedSyncfiedInstanceWithDbWriteOperation = FxOrmPatch.PatchedSyncfiedInstanceWithDbWriteOperation
    export type PatchedSyncfiedInstanceWithAssociations = FxOrmPatch.PatchedSyncfiedInstanceWithAssociations

    export type SettingsContainerGenerator = FxOrmSettings.SettingsContainerGenerator
    export type SettingInstance = FxOrmSettings.SettingInstance

    export type ModelOptions__Find = FxOrmModel.ModelOptions__Find
    export type ModelQueryConditions__Find = FxOrmModel.ModelQueryConditions__Find
    export type ModelMethodCallback__Find = FxOrmModel.ModelMethodCallback__Find
    export type ModelMethodCallback__Count = FxOrmModel.ModelMethodCallback__Count
    
    export type InstanceDataPayload = FxOrmInstance.InstanceDataPayload
    export type InstanceAssociationItem_HasMany = FxOrmAssociation.InstanceAssociationItem_HasMany
    export type InstanceAssociationItem_HasOne = FxOrmAssociation.InstanceAssociationItem_HasOne
    export type InstanceAssociationItem_ExtendTos = FxOrmAssociation.InstanceAssociationItem_ExtendTos

    export type QueryConditionInTypeType = FxOrmQuery.QueryConditionInTypeType
    export type QueryCondition_SimpleEq = FxOrmQuery.QueryCondition_SimpleEq
    export type QueryCondition_eq = FxOrmQuery.QueryCondition_eq
    export type QueryCondition_ne = FxOrmQuery.QueryCondition_ne
    export type QueryCondition_gt = FxOrmQuery.QueryCondition_gt
    export type QueryCondition_gte = FxOrmQuery.QueryCondition_gte
    export type QueryCondition_lt = FxOrmQuery.QueryCondition_lt
    export type QueryCondition_lte = FxOrmQuery.QueryCondition_lte
    export type QueryCondition_like = FxOrmQuery.QueryCondition_like
    export type QueryCondition_not_like = FxOrmQuery.QueryCondition_not_like
    export type QueryCondition_between = FxOrmQuery.QueryCondition_between
    export type QueryCondition_not_between = FxOrmQuery.QueryCondition_not_between
    export type QueryCondition_in = FxOrmQuery.QueryCondition_in
    export type QueryCondition_not_in = FxOrmQuery.QueryCondition_not_in
    export type QueryConditionAtomicType = FxOrmQuery.QueryConditionAtomicType
    export type QueryConditions = FxOrmQuery.QueryConditions
    /* compatible :end */
    
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
    interface PluginDefineFunction {
        (orm?: ORM, opts?: PluginOptions): Plugin
    }
    interface PluginConstructor {
        new (orm?: ORM, opts?: PluginOptions)
    }
    interface Plugin {
        // (connection: FibORM, proto: any, opts: any, cb: Function): any
        beforeDefine?: {
            (name?: string, properties?: FxOrmModel.ModelPropertyDefinitionHash, opts?: FxOrmModel.ModelOptions)
        }
        define?: {
            (model?: FxOrmModel.Model, orm?: ORM)
        }
    }

    interface ORMConstructor {
        (driver_name: string, driver: FxOrmDMLDriver.DMLDriver, settings: FxOrmSettings.SettingInstance): void
        prototype: ORM
    }

    interface ORM extends Class_EventEmitter, FxOrmSynchronous.SynchronizedORMInstance, FxOrmPatch.PatchedORMInstance {
        validators: FxOrmValidators.ValidatorModules;
        enforce: FxOrmValidators.FibjsEnforce;
        settings: FxOrmSettings.SettingInstance;
        driver_name: string;
        driver: FxOrmPatch.PatchedDMLDriver;
        tools: FxSqlQueryComparator.ComparatorHash;
        models: { [key: string]: FxOrmModel.Model };
        plugins: Plugin[];
        customTypes: { [key: string]: FxOrmProperty.CustomPropertyType };

        use(plugin: PluginDefineFunction | PluginConstructor, options?: PluginOptions): ORM;

        define(name: string, properties: FxOrmModel.ModelPropertyDefinitionHash, opts?: FxOrmModel.ModelOptions): FxOrmModel.Model;
        defineType(name: string, type: FxOrmProperty.CustomPropertyType): this;
        
        load(file: string, callback: FxOrmNS.VoidCallback): any;
        
        ping(callback: FxOrmNS.VoidCallback): this;
        close(callback: FxOrmNS.VoidCallback): this;
        sync(callback: FxOrmNS.VoidCallback): this;
        drop(callback: FxOrmNS.VoidCallback): this;

        serial: {
            (...chains: any[]): {
                get: {
                    (callback?: FibOrmNS.GenericCallback<any[]>): ORM
                }
            }
        }

        syncSync(): void;

        [extraMember: string]: any;
    }

    interface SingletonOptions {
        identityCache?: boolean;
        saveCheck?: boolean;
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

    interface SingletonModule {
        clear: {
            (key?: string): SingletonModule
        };
        get: {
            (key: string, opts: SingletonOptions, createCb: Function, returnCb: Function)
        };
    }
    
    interface PropertyModule {
        normalize: {
            (opts: {
                prop: FxOrmModel.ComplexModelPropertyDefinition
                name: string
                customTypes: FxOrmNS.ORM['customTypes']
                settings: FxOrmNS.ORM['settings']
            }): FxOrmProperty.NormalizedProperty
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
