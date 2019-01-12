/// <reference types="@fxjs/sql-query" />
/// <reference path="Validators.d.ts" />
/// <reference path="patch.d.ts" />
/// <reference path="hook.d.ts" />
/// <reference path="instance.d.ts" />
/// <reference path="settings.d.ts" />
/// <reference path="query.d.ts" />

declare namespace FxOrmModel {
    type ModelInstanceConstructorOptions = (string | number | FxOrmInstance.InstanceDataPayload)[]

    interface ModelInstanceConstructor {
        (): FxOrmInstance.Instance;
        new(): FxOrmInstance.Instance;
        (...data: ModelInstanceConstructorOptions): FxOrmInstance.Instance;
        new(...data: ModelInstanceConstructorOptions): FxOrmInstance.Instance;
    }

    interface Model extends ModelInstanceConstructor, ModelHooks, FxOrmSynchronous.SynchronizedModel {
        properties: FxOrmProperty.NormalizedPropertyHash;
        settings: FxOrmSettings.SettingInstance;

        table: string;
        id: string[];
        /* @nonenum */
        uid: string;

        allProperties: FxOrmProperty.NormalizedPropertyHash

        /* property operation :start */
        addProperty: {
            (
                propIn: FxOrmProperty.NormalizedProperty, /* ModelPropertyDefinition */
                options?: {
                    name?: string
                    klass?: 'primary' | 'hasOne'
                } | false
            )
        }
        /* property operation :end */

        sync(callback?: FxOrmNS.GenericCallback<FxOrmSqlDDLSync.SyncResult>): Model;
        drop(callback?: FxOrmNS.VoidCallback): Model;

        /**
         * methods used to add associations
         */
        hasOne: {
            (assoc_name: string, ext_model: Model, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasOne): FxOrmModel.Model
            (assoc_name: string, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasOne): FxOrmModel.Model
        }
        hasMany: {
            (assoc_name: string, ext_model: Model, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasMany): FxOrmModel.Model
            (assoc_name: string, ext_model: Model, assoc_props: ModelPropertyDefinitionHash, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasMany): FxOrmModel.Model
        }
        extendsTo: (...args: any[]) => Model;

        /* data operation api :start */
        create: {
            (data: FxOrmInstance.InstanceDataPayload): Model;
            (data: FxOrmInstance.InstanceDataPayload, callback: ModelMethodCallback__CreateItem): Model;
        }
        clear: {
            (...args: any[]): Model;
        }
        get: {
            (...ids: any[]): Model; // this model is from its return
        }

        find: {
            (conditions?: ModelQueryConditions__Find): FxOrmQuery.IChainFind
            (conditions: ModelQueryConditions__Find, callback: ModelMethodCallback__Find): Model
            (conditions: ModelQueryConditions__Find, id: FxOrmNS.IdType): FxOrmQuery.IChainFind
            (conditions: ModelQueryConditions__Find, id: FxOrmNS.IdType, callback: ModelMethodCallback__Get): Model
            (conditions: ModelQueryConditions__Find, options?: ModelOptions__Find): FxOrmQuery.IChainFind
            (conditions: ModelQueryConditions__Find, options: ModelOptions__Find, callback: ModelMethodCallback__Find): Model
            (conditions: ModelQueryConditions__Find, limit: number, order?: string[]): FxOrmQuery.IChainFind
            (conditions: ModelQueryConditions__Find, limit: number, callback: ModelMethodCallback__Find): Model
            (conditions: ModelQueryConditions__Find, limit: number, order: string[], callback: ModelMethodCallback__Find): Model
        }

        all: Model['find']
        where: Model['find']

        /**
         * not like other methods, you must provide callback to those methods
         * - `one`
         * - `count`
         * - `exists`
         * 
         * that's maybe due to their purpose: always return Model rather than IChainFind
         */
        one: {
            (conditions: ModelQueryConditions__Find, callback: ModelMethodCallback__Get): Model;
            (conditions: ModelQueryConditions__Find, options: ModelOptions__Find, callback: ModelMethodCallback__Get): Model;
            (conditions: ModelQueryConditions__Find, order: string[], callback: ModelMethodCallback__Get): Model;
            // (conditions: ModelQueryConditions__Find, limit: number, callback: ModelMethodCallback__Get): Model;
        }

        count: {
            (callback: ModelMethodCallback__Count): Model;
            (conditions: ModelQueryConditions__Find, callback: ModelMethodCallback__Count): Model;
        }

        exists: {
            (...ids: FxOrmNS.IdType[]): FxOrmQuery.IChainFind;
        }

        aggregate: {
            (conditions: ModelQueryConditions__Find): FxOrmQuery.IAggregated;
            (properties: string[]): FxOrmQuery.IAggregated;
            (conditions: ModelQueryConditions__Find, properties: string[]): FxOrmQuery.IAggregated;
        }
        /* data operation api :end */

        prependValidation: {
            (key: string, validation: enforce.IValidator)
        }

        [property: string]: any;
    }

    interface ModelConstructor {
        (opts: ModelConstructorOptions): void
        prototype: Model
    }

    interface ModelConstructorOptions {
        db: FxOrmNS.ORM
        settings: FxOrmSettings.SettingInstance
        driver_name: string
        driver: FxOrmPatch.PatchedDMLDriver
        table: string
        properties: FxOrmProperty.NormalizedPropertyHash
        extension: boolean
        indexes: string[]
        identityCache: boolean
        keys: string[]
        autoSave: boolean
        autoFetch: boolean
        autoFetchLimit: number
        cascadeRemove: boolean
        hooks: Hooks
        methods: {[method_name: string]: Function}
        validations: FxOrmValidators.ValidationOptionHash
    }
    
    interface ModelDefineOptions {
        /**
         * pririoty: table > collection
         */
        table?: ModelConstructorOptions['table']
        collection?: ModelConstructorOptions['table']

        extension?: ModelConstructorOptions['extension']
        indexes?: ModelConstructorOptions['indexes']
        // keys composition, it's array-liket
        id?: ModelConstructorOptions['keys']
        autoSave?: ModelConstructorOptions['autoSave']
        autoFetch?: ModelConstructorOptions['autoFetch']
        autoFetchLimit?: ModelConstructorOptions['autoFetchLimit']
        hooks?: ModelConstructorOptions['hooks']
        validations?: ModelConstructorOptions['validations']
        methods?: { [name: string]: Function };
        identityCache?: ModelConstructorOptions['identityCache']
        cascadeRemove?: ModelConstructorOptions['cascadeRemove']

        [extensibleProperty: string]: any;
    }
    type ModelOptions = ModelDefineOptions

    interface Hooks {
        beforeValidation?: FxOrmHook.HookActionCallback;
        beforeCreate?: FxOrmHook.HookActionCallback;
        afterCreate?: FxOrmHook.HookResultCallback;
        beforeSave?: FxOrmHook.HookActionCallback;
        afterSave?: FxOrmHook.HookResultCallback;
        afterLoad?: FxOrmHook.HookActionCallback;
        afterAutoFetch?: FxOrmHook.HookActionCallback;
        beforeRemove?: FxOrmHook.HookActionCallback;
        afterRemove?: FxOrmHook.HookResultCallback;
    }

    interface ModelHooks {
        beforeValidation?: {
            (func: FxOrmHook.HookActionCallback): any
        };
        beforeCreate?: {
            (func: FxOrmHook.HookActionCallback): any
        };
        afterCreate?: {
            (func: FxOrmHook.HookActionCallback): any
        };
        beforeSave?: {
            (func: FxOrmHook.HookActionCallback): any
        };
        afterSave?: {
            (func: FxOrmHook.HookResultCallback): any
        };
        afterLoad?: {
            (func: FxOrmHook.HookResultCallback): any
        };
        afterAutoFetch?: {
            (func: FxOrmHook.HookActionCallback): any
        };
        beforeRemove?: {
            (func: FxOrmHook.HookActionCallback): any
        };
        afterRemove?: {
            (func: FxOrmHook.HookResultCallback): any
        };
    }

    interface ModelPropertyDefinition {
        /**
         * text | number | integer | boolean | date | enum | object | <del>point</del> | binary | serial
         * view details in https://github.com/dresende/node-orm2/wiki/Model-Properties
         */
        type: string
        // ?
        name?: string
        // has unique constrain
        unique?: boolean
        // is primary key
        key?: boolean
        // is required
        
        required?: boolean
        // whether building index for this field
        index?: boolean

        defaultValue?: any

        unsigned?: boolean
        size?: number
        values?: any[]
        time?: boolean
        big?: boolean

        mapsTo?: string

        alwaysValidate?: boolean
        enumerable?: boolean
        // whether lazyload property, if it is, it can be loaded only by its accessor
        lazyload?: boolean
    }

    // @deprecated
    type OrigDetailedModelProperty = FxOrmProperty.NormalizedProperty
    type OrigDetailedModelPropertyHash = FxOrmProperty.NormalizedPropertyHash

    type PrimitiveConstructor = String & Boolean & Number & Date & Class_Buffer & Object
    interface PrimitiveConstructorModelPropertyDefinition extends PrimitiveConstructor {
        name: string
    }
    type EumTypeValues = any[]
    type PropTypeStrPropertyDefinition = string
    
    type ComplexModelPropertyDefinition = ModelPropertyDefinition | PrimitiveConstructorModelPropertyDefinition | EumTypeValues | PropTypeStrPropertyDefinition

    type ModelPropertyDefinitionHash = {
        [key: string]: FxOrmModel.ModelDefineOptions
    }

    interface DetailedPropertyDefinitionHash {
        [key: string]: ModelPropertyDefinition
    }

    interface ModelOptions__Find {
        only?: string
        limit?: number;
        order?: any;
        offset?: number;
        identityCache?: boolean

        autoFetch?: boolean
        cascadeRemove?: boolean
        autoSave?: boolean
        autoFetchLimit?: number
        __merge?: FxOrmAssociation.ModelAssociationMethod__ComputationPayload__Merge
        exists?: FxOrmQuery.ChainWhereExistsInfo[]
        extra?: FxOrmModel.ModelPropertyDefinitionHash | any[]
        extra_info?: {
            table: string
            id: any
            id_prop
            assoc_prop
        }
    }

    interface ModelOptions__Get extends ModelOptions__Find {}

    interface ModelQueryConditions__Find extends FxSqlQuerySubQuery.SubQueryConditions {
        [property: string]: any
    }

    type ModelQueryConditionsItem = FxSqlQuerySql.SqlFragmentStr | ModelQueryConditions__Find

    type ModelMethodOptions_Find = FxOrmNS.IdType | ModelQueryConditions__Find

    type ModelMethodCallback__Boolean = FxOrmNS.GenericCallback<Boolean>
    type ModelMethodCallback__Find = FxOrmNS.GenericCallback<FxOrmInstance.Instance[]>
    type ModelMethodCallback__Get = FxOrmNS.GenericCallback<FxOrmInstance.Instance>
    type ModelMethodCallback__CreateItem = FxOrmNS.GenericCallback<FxOrmInstance.Instance>
    type ModelMethodCallback__UpdateItem = FxOrmNS.GenericCallback<FxOrmInstance.Instance>
    type ModelMethodCallback__BatchCreate = FxOrmNS.GenericCallback<FxOrmInstance.Instance>
    type ModelMethodCallback__BatchUpdate = FxOrmNS.GenericCallback<FxOrmInstance.Instance>

    type ModelMethodCallback__Count = FxOrmNS.GenericCallback<number>
}
