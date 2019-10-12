/// <reference types="@fxjs/sql-query" />
/// <reference path="_common.d.ts" />
/// <reference path="Validators.d.ts" />
/// <reference path="assoc.d.ts" />
/// <reference path="patch.d.ts" />
/// <reference path="hook.d.ts" />
/// <reference path="instance.d.ts" />
/// <reference path="settings.d.ts" />
/// <reference path="query.d.ts" />
/// <reference path="Queries.d.ts" />

declare namespace FxOrmModel {
    type ModelInstanceConstructorOptions = (string | number | FxOrmInstance.InstanceDataPayload)[]

    interface ModelInstanceConstructor {
        (): FxOrmInstance.Instance;
        new(): FxOrmInstance.Instance;
        (...data: ModelInstanceConstructorOptions): FxOrmInstance.Instance;
        new(...data: ModelInstanceConstructorOptions): FxOrmInstance.Instance;
    }

    type OrderListOrLimitOffer = number | string | string[]

    class ModelNG {
        
    }

    interface Model extends ModelInstanceConstructor, ModelHooks, FxOrmSynchronous.SynchronizedModel {
        name: string;
        properties: FxOrmProperty.NormalizedPropertyHash;
        settings: FxOrmSettings.SettingInstance;

        table: string;
        id: string[];
        /* @nonenum */
        uid: string;

        caches: Class_LruCache;

        keys: string[];

        allProperties: FxOrmProperty.NormalizedPropertyHash

        /* property operation :start */
        addProperty: {
            (
                propIn: FxOrmProperty.NormalizedProperty, /* ModelPropertyDefinition */
                options?: {
                    name?: string
                    klass?: FxOrmProperty.KlassType
                } | false
            ): FxOrmProperty.NormalizedProperty
        }
        /* property operation :end */

        sync(callback?: FxOrmNS.GenericCallback<FxOrmSqlDDLSync.SyncResult>): Model;
        drop(callback?: FxOrmNS.VoidCallback): Model;

        /**
         * methods used to add associations
         */
        /* association about api :start */
        hasOne: {
            (assoc_name: string, ext_model?: Model, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasOne): FxOrmModel.Model
        }
        hasMany: {
            (assoc_name: string, ext_model: Model, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasMany): FxOrmModel.Model
            (assoc_name: string, ext_model: Model, assoc_props: ModelPropertyDefinitionHash, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasMany): FxOrmModel.Model
        }
        extendsTo: {
            (name: string, properties: ModelPropertyDefinitionHash, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_ExtendsTo): Model
        };

        associations: {
            [k: string]: {
                type: 'hasOne'
                association: FxOrmAssociation.InstanceAssociationItem_HasOne
            } | {
                type: 'hasMany'
                association: FxOrmAssociation.InstanceAssociationItem_HasMany
            } | {
                type: 'extendsTo'
                association: FxOrmAssociation.InstanceAssociationItem_ExtendTos
            }
        }
        findBy: {
            <T = any>(
                association_name: ModelFindByDescriptorItem['association_name'],
                conditions?: ModelFindByDescriptorItem['conditions'],
                options?: ModelFindByDescriptorItem['options'],
                cb?: FxOrmNS.ExecutionCallback<T>
            ): FxOrmQuery.IChainFind
            <T = any>(
                list: ModelFindByDescriptorItem[],
                self_conditions: FxOrmModel.ModelQueryConditions__Find,
                cb?: FxOrmNS.ExecutionCallback<T>
            ): FxOrmQuery.IChainFind
        }
        /* association about api :end */

        /* data operation api :start */
        create: {
            (data: FxOrmInstance.InstanceDataPayload, callback?: ModelMethodCallback__CreateItem): Model;
            (data: FxOrmInstance.InstanceDataPayload, options?: ModelOptions__Create, callback?: ModelMethodCallback__CreateItem): Model;
        }
        clear: {
            (...args: any[]): Model;
        }
        get: {
            (...ids: any[]): Model; // this model is from its return
        }
        
        chain: {
            (conditions?: FxOrmModel.ModelQueryConditions__Find, ...args: (FxOrmModel.ModelOptions__Find | OrderListOrLimitOffer)[]): FxOrmQuery.IChainFind;
        }

        find: {
            (conditions?: ModelQueryConditions__Find): FxOrmQuery.IChainFind
            (callback: ModelMethodCallback__Find): Model
            (conditions: ModelQueryConditions__Find, callback: ModelMethodCallback__Find): Model
            
            (conditions: ModelQueryConditions__Find, options: ModelOptions__Find): FxOrmQuery.IChainFind
            (conditions: ModelQueryConditions__Find, options: ModelOptions__Find, callback: ModelMethodCallback__Find): Model

            (conditions: ModelQueryConditions__Find, limit_order?: OrderListOrLimitOffer, limit_order2?: OrderListOrLimitOffer): FxOrmQuery.IChainFind
            
            (conditions: ModelQueryConditions__Find, limit_order: OrderListOrLimitOffer, callback: ModelMethodCallback__Find): Model
            (conditions: ModelQueryConditions__Find, limit_order: OrderListOrLimitOffer, limit_order2: OrderListOrLimitOffer, callback: ModelMethodCallback__Find): Model
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
            (callback: ModelMethodCallback__Get): Model;
            (conditions: ModelQueryConditions__Find, callback: ModelMethodCallback__Get): Model;
            (conditions: ModelQueryConditions__Find, options: ModelOptions__Find, callback: ModelMethodCallback__Get): Model;
            (conditions: ModelQueryConditions__Find, order: string[], callback: ModelMethodCallback__Get): Model;
            (conditions: ModelQueryConditions__Find, limit: number, callback: ModelMethodCallback__Get): Model;
        }

        count: {
            (callback: ModelMethodCallback__Count): Model;
            (conditions: ModelQueryConditions__Find, callback: ModelMethodCallback__Count): Model;
        }

        exists: {
            (...conditions: (FibOrmNS.IdType | FxSqlQuerySubQuery.SubQueryConditions | FxOrmNS.ExecutionCallback<boolean>)[]): FxOrmQuery.IChainFind
        }

        aggregate: {
            (conditions: ModelQueryConditions__Find): FxOrmQuery.IAggregated;
            (properties: string[]): FxOrmQuery.IAggregated;
            (conditions: ModelQueryConditions__Find, properties: string[]): FxOrmQuery.IAggregated;
        }
        /* data operation api :end */

        prependValidation: {
            (key: string, validation: FibjsEnforce.IValidator): void
        }

        [property: string]: any;
    }

    type FindByListStyleFunctionArgs<T = any> = [
        FxOrmModel.ModelFindByDescriptorItem[],
        FxOrmModel.ModelQueryConditions__Find,
        FxOrmModel.ModelOptions__Find,
        FxOrmNS.ExecutionCallback<T>
    ]

    type FindByItemStyleFunctionArgs<T = any> = [
        FxOrmModel.ModelFindByDescriptorItem['association_name'],
        FxOrmModel.ModelFindByDescriptorItem['conditions'],
        FxOrmModel.ModelFindByDescriptorItem['options'],
        FxOrmNS.ExecutionCallback<T>
    ]

    type ModelConstructor = new (opts: ModelConstructorOptions) => Model
    // interface ModelConstructor {
    //     (opts: ModelConstructorOptions): void
    //     prototype: Model
    // }

    interface ModelFindByDescriptorItem {
        // association name
        association_name: string,
        // findby conditions 
        conditions?: ModelQueryConditions__Find,
        // findby options
        options?: FxOrmAssociation.ModelAssociationMethod__FindByOptions,

        // extra where conditions fields for hasmany-assoc
        join_where?: FxOrmModel.ModelQueryConditions__Find
        // extra select fields for hasmany-assoc
        extra_select?: string[]
    }

    interface ModelConstructorOptions {
        name: string
        orm: FxOrmNS.ORM
        settings: FxOrmSettings.SettingInstance
        collection: string
        properties: FxOrmProperty.NormalizedPropertyHash
        indexes: string[]
        
        keys: string[]
        
        autoSave: boolean
        autoFetch: boolean
        autoFetchLimit: number
        cascadeRemove: boolean
        methods: {[method_name: string]: Function}
        validations: FxOrmValidators.IValidatorHash
        ievents: FxOrmInstance.InstanceConstructorOptions['events']
    }
    
    interface ModelDefineOptions {
        collection?: ModelConstructorOptions['collection']

        indexes?: ModelConstructorOptions['indexes']
        // keys composition, it's array-like
        id?: ModelConstructorOptions['keys']
        autoSave?: ModelConstructorOptions['autoSave']
        autoFetch?: ModelConstructorOptions['autoFetch']
        validations?: ModelConstructorOptions['validations']
        methods?: { [name: string]: Function };
        cascadeRemove?: ModelConstructorOptions['cascadeRemove']

        [extensibleProperty: string]: any;
    }
    type ModelOptions = ModelDefineOptions

    interface Hooks {
        beforeValidation?: FxOrmNS.Arraible<FxOrmHook.HookActionCallback>;
        beforeCreate?: FxOrmNS.Arraible<FxOrmHook.HookActionCallback>;
        afterCreate?: FxOrmNS.Arraible<FxOrmHook.HookResultCallback>;
        beforeSave?: FxOrmNS.Arraible<FxOrmHook.HookActionCallback>;
        afterSave?: FxOrmNS.Arraible<FxOrmHook.HookResultCallback>;
        afterLoad?: FxOrmNS.Arraible<FxOrmHook.HookActionCallback>;
        afterAutoFetch?: FxOrmNS.Arraible<FxOrmHook.HookActionCallback>;
        beforeRemove?: FxOrmNS.Arraible<FxOrmHook.HookActionCallback>;
        afterRemove?: FxOrmNS.Arraible<FxOrmHook.HookResultCallback>;
    }
    type keyofHooks = keyof Hooks

    interface ModelHookPatchOptions extends FxOrmHook.HookPatchOptions {
    }

    interface ModelHooks {
        beforeValidation?: {
            (func: FxOrmHook.HookActionCallback, opts?: ModelHookPatchOptions): any
        };
        beforeCreate?: {
            (func: FxOrmHook.HookActionCallback, opts?: ModelHookPatchOptions): any
        };
        afterCreate?: {
            (func: FxOrmHook.HookActionCallback, opts?: ModelHookPatchOptions): any
        };
        beforeSave?: {
            (func: FxOrmHook.HookActionCallback, opts?: ModelHookPatchOptions): any
        };
        afterSave?: {
            (func: FxOrmHook.HookResultCallback, opts?: ModelHookPatchOptions): any
        };
        afterLoad?: {
            (func: FxOrmHook.HookResultCallback, opts?: ModelHookPatchOptions): any
        };
        afterAutoFetch?: {
            (func: FxOrmHook.HookActionCallback, opts?: ModelHookPatchOptions): any
        };
        beforeRemove?: {
            (func: FxOrmHook.HookActionCallback, opts?: ModelHookPatchOptions): any
        };
        afterRemove?: {
            (func: FxOrmHook.HookResultCallback, opts?: ModelHookPatchOptions): any
        };
    }

    interface ModelPropertyDefinition extends FxOrmSqlDDLSync__Column.Property {
        key?: boolean
        // klass?: FxOrmProperty.KlassType
        alwaysValidate?: boolean
        enumerable?: boolean
        // whether lazyload property, if it is, it can be loaded only by its accessor
        lazyload?: boolean
    }

    // @deprecated
    type OrigDetailedModelProperty = FxOrmProperty.NormalizedProperty
    type OrigDetailedModelPropertyHash = FxOrmProperty.NormalizedPropertyHash

    type PrimitiveConstructor = String | Boolean | Number | Date | Object | Class_Buffer
    type EnumTypeValues = any[]
    type PropTypeStrPropertyDefinition = string
    
    type ComplexModelPropertyDefinition = 
        ModelPropertyDefinition
        | (PrimitiveConstructor & {
            name: string
        })
        | EnumTypeValues
        | PropTypeStrPropertyDefinition

    type ModelPropertyDefinitionHash = {
        [key: string]: ComplexModelPropertyDefinition
    }

    interface DetailedPropertyDefinitionHash {
        [key: string]: ModelPropertyDefinition
    }

    interface ModelOptions__Find {
        chainfind_linktable?: string;
        
        only?: string[];
        limit?: number;
        order?: FxOrmQuery.OrderRawInput | FxOrmQuery.ChainFindOptions['order']
        // order?: FxOrmQuery.OrderRawInput
        offset?: number;
        identityCache?: boolean

        autoFetch?: boolean
        cascadeRemove?: boolean
        autoSave?: boolean
        autoFetchLimit?: number
        __merge?: FxOrmQuery.ChainFindOptions['merge']
        exists?: FxOrmQuery.ChainWhereExistsInfo[]

        // useless, just for compat
        extra?: FxOrmAssociation.InstanceAssociationItem_HasMany['props']

        // access dynamic findby options
        [k: string]: any
    }
    
    interface ModelOptions__Findby extends ModelOptions__Find {
        
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
    type ModelMethodCallback__BatchCreate = FxOrmNS.GenericCallback<FxOrmInstance.Instance[]>
    type ModelMethodCallback__BatchUpdate = FxOrmNS.GenericCallback<FxOrmInstance.Instance[]>

    type ModelMethodCallback__Count = FxOrmNS.GenericCallback<number>

    interface ModelOptions__Create {
        parallel?: boolean
    }

    interface Class_ModelDefinitionOptions {
        collection?: Class_ModelConstructOptions['collection']
        indexes?: Class_ModelConstructOptions['indexes']
        keys?: Class_ModelConstructOptions['keys']

        autoSave?: boolean
        autoFetch?: boolean
        cascadeRemove?: boolean
    }

    type Class_ModelConstructOptions = FxOrmTypeHelpers.ConstructorParams<typeof FxOrmModel.Class_Model>[0]
    class Class_Model extends FxOrmQueries.Class_QueryBuilder {
        name: string
        collection: string

        readonly orm: FxOrmNS.Class_ORM
        readonly Op: FxOrmQueries.Operators

        properties: {[k: string]: FxOrmProperty.Class_Property}
        readonly propertyNames: string[]
        readonly propertyList: FxOrmProperty.Class_Property[]
        
        associations: {[k: string]: FxOrmModel.Class_MergeModel}

        settings: any

        readonly storeType: FxOrmProperty.Class_Property['$storeType']
        readonly isMergeModel: boolean

        /* meta :start */
        /**
         * @description if this model has no key
         * @default false
         */
        readonly noKey: boolean
        /* meta :end */

        /**
         * @description id property name
         */
        readonly id: string
        /**
         * @description all id-type field property names
         */
        readonly ids: string[]
        /**
         * @description all id-type field properties
         */
        readonly idPropertyList: FxOrmProperty.Class_Property[]
        
        readonly keyPropertyNames: string[]
        readonly keyPropertyList: FxOrmProperty.Class_Property[]
        readonly keys: string[]

        readonly _symbol: Symbol
        readonly $dml: FxOrmDML.DMLDriver
        readonly $ddl: FxOrmDDL.DDLDriver
        readonly schemaBuilder: FXJSKnex.FXJSKnexModule.KnexInstance['schema']
        readonly queryBuilder: FxOrmTypeHelpers.ReturnType<FXJSKnex.FXJSKnexModule.KnexInstance['queryBuilder']>

        constructor (config: {
            name: string
            orm: FxOrmNS.Class_ORM
            settings: any
            collection: string
            properties: FxOrmProperty.NormalizedPropertyHash
            
            indexes?: string[]
            /**
             * @description above priorities of properties' specification
             * 
             * if keys === false, all properties are not key
             */
            keys?: string[] | false
            
            autoSave?: boolean
            autoFetch?: boolean
            cascadeRemove?: boolean
            methods?: {[method_name: string]: Function}
            validations?: FxOrmValidators.IValidatorHash
            ievents?: FxOrmInstance.InstanceConstructorOptions['events']
        })

        /**
         * @description create one instance from data input
         * 
         * if input is just one instance, New() would create the new one rather than use old one
         * 
         * @param input dataset for create one instance
         */
        New: FxOrmTypeHelpers.ReturnItemOrArrayAccordingTo_1stParam<Fibjs.AnyObject | string | number, FxOrmInstance.Class_Instance>
        /* ddl about :start */

        /**
         * @description sync collection definition to remote endpoint
         */
        sync (): void

        /**
         * @description drop collection from remote endpoint
         */
        drop (): void

        /**
         * @description is property existed in remote endpoint
         * @warn only valid in sql-type dbdriver
         */
        hasPropertyRemotely (property: string | FxOrmProperty.Class_Property): boolean
        /* ddl about :end */

        /* dml about :end */
        /**
         * @description create one instance from this model
         */
        create: {
            (kvItem: Fibjs.AnyObject): FxOrmInstance.Class_Instance
            (kvItem: Fibjs.AnyObject[]): FxOrmInstance.Class_Instance[]
        }
        /**
         * @description remove items corresponding to conditions
         * 
         * @param opts.where
         * 
         * @return remove count
         */
        remove (
            opts?: {
                where: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>['where']
            }
        ): number
        /**
         * @description clear all data in remote endpoints
         */
        clear (): void
        /* dml about :end */

        /* utils :start */
        /**
         * @description
         *  filter out properties-about key-value in dataset only,
         *  and transform [key] to correspoding `mapsTo` field in property
         */
        normalizeDataToProperties (dataset: Fibjs.AnyObject, target?: Fibjs.AnyObject): any
        /**
         * @description
         *  filter out properties-about key-value in datastore only,
         *  and transform [key] to correspoding `name` field in property
         */
        normalizePropertiesToData (datastore: Fibjs.AnyObject, target?: Fibjs.AnyObject): any
        /**
         * @description
         *  filter out association-about key-value in dataset only,
         *  if no key-value about association, would return one empty array
         * 
         * @return []
         */
        filterOutAssociatedData (dataset: Fibjs.AnyObject, instanceDataSet?: Fibjs.AnyObject): {
            association: FxOrmModel.Class_Model['associations'][any],
            dataset: any,
        }[]
        addProperty(name: string, propertyDefinition: FxOrmProperty.Class_Property | FxOrmProperty.NormalizedProperty): typeof propertyDefinition

        fieldInfo(propertyName: string): {
            type: 'self'
            property: Class_Model['properties'][any]
        } | {
            type: 'association'
            association: Class_Model['associations'][any]
        } | null

        buildQueryNormalizer(opts: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmQueries.Class_QueryNormalizer>[1]): FxOrmQueries.Class_QueryNormalizer
        /* utils :end */

        hasOne(
            model: FxOrmModel.Class_Model,
            opts?: {
                as?: string,
                associationKey?: string | ((ctx: any) => string)
            }
        ): FxOrmTypeHelpers.ReturnType<FxOrmModel.Class_Model['o2m']>

        hasMany(
            name: string,
            model?: FxOrmModel.Class_Model,
            opts?: (FxOrmTypeHelpers.SecondParameter<FxOrmModel.Class_Model['o2m']>)
                & {
                    type: 'm2m' | 'o2m',
                    reverse?: boolean | string
                }
        ): FxOrmTypeHelpers.ReturnType<Class_Model['o2m']>

        belongsToMany(
            model: Class_Model,
            opts?: (FxOrmTypeHelpers.SecondParameter<FxOrmModel.Class_Model['o2m']>
                & FxOrmTypeHelpers.SecondParameter<FxOrmModel.Class_Model['o2m']>)
                & {
                    as?: string
                    collection: string
                    associationKey?: string | ((ctx: any) => string),
                    matchKeys?: FxOrmAssociation.AssociationMatchCondition | FxOrmAssociation.AssociationMatchCondition[]
                }
        ): FxOrmTypeHelpers.ReturnType<Class_Model['o2m']>

        o2m(
            name: string,
            opts?: {
                model?: FxOrmModel.Class_Model,
                associationKey?: string | ((ctx: any) => string),
                matchKeys?: FxOrmAssociation.AssociationMatchCondition | FxOrmAssociation.AssociationMatchCondition[]
            }
        ): Class_MergeModel

        defineMergeModel (
            opts: {
                source: {
                    model: Class_Model,
                    foreignKey: string | string[]
                },
                target: {
                    model: Class_Model
                    foreignKey: string | string[]
                },
                onFind: (
                    ctx: {
                        sourceModel: Class_Model,
                        sourceModelKeys: string[],
                        targetModel: Class_Model,
                        targetModelKeys: string[],
                        mergeModel: Class_MergeModel,
                    }
                ) => FxOrmTypeHelpers.FirstParameter<FxOrmModel.Class_Model['find']>,
                onSourceInstanceSave: ({
                    sourceModel: Class_Model,
                    sourceModelKeys: string[],
                    sourceInstance: FxOrmInstance.Class_Instance,

                    targetModel: Class_Model,
                    targetModelKeys: string[],
                    targetInstance: FxOrmInstance.Class_Instance,

                    mergeModel: Class_MergeModel,
                }),
            }
        ): Class_MergeModel
    }
    /**
     * @description generated on building association
     */
    class Class_MergeModel extends Class_Model {
        /**
         * @description association name
         */
        name: string
        /**
         * @description association type
         */
        type: 'o2o' | 'o2m' | 'm2o' | 'm2m'
        /**
         * @description name of collection which used as association table/collection in remote endpoints
         */
        sourceModel: FxOrmModel.Class_Model
        readonly sourceKeys: string[]
        sourceJoinKey: string

        targetModel: FxOrmModel.Class_Model
        readonly targetKeys: string[]
        targetJoinKey: string
        
        /**
         * @description this is fully determined by `options.matchKeys` in constructor
         */
        readonly associationKeys: string[]
        
        /**
         * @description
         *  association information, used to generate matching
         *  where query-conditions
         */
        associationInfo: {
            collection: string
            andMatchKeys: FxOrmAssociation.AssociationMatchCondition[]
        }
        
        constructor (opts: FxOrmModel.Class_ModelConstructOptions & {
            mergeCollection: string
            type: Class_MergeModel['type']
            
            source: Class_MergeModel['sourceModel']
            sourceJoinKey?: Class_MergeModel['sourceJoinKey']
            target: Class_MergeModel['targetModel']
            targetJoinKey?: Class_MergeModel['targetJoinKey']
            
            matchKeys: FxOrmAssociation.AssociationMatchCondition[]
        })

        isSourceModel (model: Class_Model): boolean
        isTarget (model: Class_Model): boolean

        saveForSource (opts: {
            targetDataSet: Fibjs.AnyObject | FxOrmInstance.Class_Instance,
            sourceInstance: FxOrmInstance.Class_Instance
        }): void
        // joinFind (): any
    }
    // next generation model :end
}
