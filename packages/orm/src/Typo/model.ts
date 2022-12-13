/// <reference types="@fxjs/sql-query" />

import type { FxOrmSqlDDLSync } from "@fxjs/sql-ddl-sync"
import { FxOrmAssociation } from "./assoc"
import { FxOrmInstance } from "./instance"
import { FxOrmProperty } from "./property"
import { FxOrmSettings } from "./settings"
import { FxOrmCommon } from "./_common"
import { FxOrmSynchronous } from "./synchronous"
import { FxOrmQuery } from "./query"
import { FxOrmDMLDriver } from "./DMLDriver"
import { FxOrmValidators } from "./Validators"
import { FxOrmHook } from "./hook"
import { FxOrmNS } from "./ORM"

import type {
    FxSqlQuerySubQuery,
    FxSqlQuerySql,
} from '@fxjs/sql-query';
import { FxOrmError } from "./Error"

export namespace FxOrmModel {
    export type ModelInstanceConstructorOptions = (string | number | FxOrmInstance.InstanceDataPayload)[]

    export type OrderListOrLimitOffer = number | string | string[]

    export interface Model<
        PropertyTypes extends Record<string, FxOrmInstance.FieldRuntimeType> = Record<string, FxOrmInstance.FieldRuntimeType>,
        Methods extends Record<string, (...args: any) => any> = Record<string, (...args: any) => any>,
    > extends ModelHooksModifier, FxOrmSynchronous.SynchronizedModel<PropertyTypes, Methods> {
        (): FxOrmInstance.Instance<PropertyTypes, Methods>;
        new(): FxOrmInstance.Instance<PropertyTypes, Methods>;
        (...data: ModelInstanceConstructorOptions): FxOrmInstance.Instance<PropertyTypes, Methods>;
        new(...data: ModelInstanceConstructorOptions): FxOrmInstance.Instance<PropertyTypes, Methods>;

        name: string;
        properties: Record<string, FxOrmProperty.NormalizedProperty>;
        settings: FxOrmSettings.SettingInstance;

        table: string;
        id: string[];
        /* @nonenum */
        uid: string;

        caches: Class_LruCache;

        keys: string[];

        allProperties: Record<string, FxOrmProperty.NormalizedProperty>

        /* property operation :start */
        addProperty(
            propIn: FxOrmProperty.NormalizedProperty,
            options?: {
                name?: string
                klass?: FxOrmProperty.KlassType
            } | false
        ): FxOrmProperty.NormalizedProperty
        /* property operation :end */

        sync(callback?: FxOrmCommon.GenericCallback<FxOrmSqlDDLSync.SyncResult>): Model;
        drop(callback?: FxOrmCommon.VoidCallback): Model;

        /**
         * methods used to add associations
         */
        /* association about api :start */
        hasOne: {
            (assoc_name: string, ext_model?: Model, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasOne): FxOrmModel.Model
        }
        hasMany: {
            (assoc_name: string, ext_model: Model, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasMany): FxOrmModel.Model
            (assoc_name: string, ext_model: Model, assoc_props: Record<string, ModelPropertyDefinition>, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasMany): FxOrmModel.Model
        }
        extendsTo: {
            (name: string, properties: Record<string, ModelPropertyDefinition>, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_ExtendsTo): Model
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
                cb?: FxOrmCommon.ExecutionCallback<T>
            ): FxOrmQuery.IChainFind
            <T = any>(
                list: ModelFindByDescriptorItem[],
                self_conditions: FxOrmModel.ModelQueryConditions__Find,
                cb?: FxOrmCommon.ExecutionCallback<T>
            ): FxOrmQuery.IChainFind
        }
        /* association about api :end */

        /* data operation api :start */
        create: {
            (data: FxOrmInstance.InstanceDataPayload, callback?: ModelMethodCallback__CreateItem): typeof data extends any[] ? FxOrmInstance.Instance<PropertyTypes, Methods>[] : FxOrmInstance.Instance<PropertyTypes, Methods>;
            (data: FxOrmInstance.InstanceDataPayload, options?: ModelOptions__Create, callback?: ModelMethodCallback__CreateItem): typeof data extends any[] ? FxOrmInstance.Instance<PropertyTypes, Methods>[] : FxOrmInstance.Instance<PropertyTypes, Methods>;
        }
        clear(...args: any[]): this
        get(...ids: any[]): this
        
        chain: {
            (conditions?: FxOrmModel.ModelQueryConditions__Find, ...args: (FxOrmModel.ModelOptions__Find | OrderListOrLimitOffer)[]): FxOrmQuery.IChainFind;
        }

        find(conditions?: ModelQueryConditions__Find): FxOrmQuery.IChainFind<PropertyTypes, Methods>
        find(callback: ModelMethodCallback__Find): this
        find(conditions: ModelQueryConditions__Find, callback: ModelMethodCallback__Find): this
                    
        find(conditions: ModelQueryConditions__Find, options: ModelOptions__Find): FxOrmQuery.IChainFind<PropertyTypes, Methods>
        find(conditions: ModelQueryConditions__Find, options: ModelOptions__Find, callback: ModelMethodCallback__Find): this
        find(conditions: ModelQueryConditions__Find, limit_order?: OrderListOrLimitOffer, limit_order2?: OrderListOrLimitOffer): FxOrmQuery.IChainFind<PropertyTypes, Methods>
                    
        find(conditions: ModelQueryConditions__Find, limit_order: OrderListOrLimitOffer, callback: ModelMethodCallback__Find): this
        find(conditions: ModelQueryConditions__Find, limit_order: OrderListOrLimitOffer, limit_order2: OrderListOrLimitOffer, callback: ModelMethodCallback__Find): this

        all: this['find']
        where: this['find']

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
            (...conditions: (FxOrmCommon.IdType | FxSqlQuerySubQuery.SubQueryConditions | FxOrmCommon.ExecutionCallback<boolean>)[]): FxOrmQuery.IChainFind
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

    export type GetInstanceTypeFrom<T> = T extends Model<infer U, infer S> ? FxOrmInstance.Instance<U, S> : never

    export type FindByListStyleFunctionArgs<T = any> = [
        FxOrmModel.ModelFindByDescriptorItem[],
        FxOrmModel.ModelQueryConditions__Find,
        FxOrmModel.ModelOptions__Find,
        FxOrmCommon.ExecutionCallback<T>
    ]

    export type FindByItemStyleFunctionArgs<T = any> = [
        FxOrmModel.ModelFindByDescriptorItem['association_name'],
        FxOrmModel.ModelFindByDescriptorItem['conditions'],
        FxOrmModel.ModelFindByDescriptorItem['options'],
        FxOrmCommon.ExecutionCallback<T>
    ]

    export interface ModelFindByDescriptorItem {
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
    export interface ModelConstructorOptions<
        TProperties extends Record<string, FxOrmInstance.FieldRuntimeType> = Record<string, FxOrmInstance.FieldRuntimeType>
    > {
        name: string
        db: FxOrmNS.ORM
        settings: FxOrmSettings.SettingInstance
        driver_name: string
        driver: FxOrmDMLDriver.DMLDriver
        table: string
        properties: Record<keyof TProperties, FxOrmProperty.NormalizedProperty>
        __for_extension: boolean
        indexes: string[]
        
        identityCache: boolean
        instanceCacheSize: number
        
        keys: string[]
        autoSave: boolean
        autoFetch: boolean
        autoFetchLimit: number
        cascadeRemove: boolean
        hooks: Hooks<FxOrmInstance.Instance<TProperties>>
        methods: Record<string, (this: FxOrmInstance.Instance<TProperties>, ...args: any) => any>
        validations: FxOrmValidators.IValidatorHash
        ievents: FxOrmInstance.InstanceConstructorOptions['events']
    }
    
    export interface ModelDefineOptions<
        TProperties extends Record<string, FxOrmInstance.FieldRuntimeType> = Record<string, FxOrmInstance.FieldRuntimeType>
    >{
        /**
         * pririoty: table > collection
         */
        table?: ModelConstructorOptions<TProperties>['table']
        collection?: ModelConstructorOptions<TProperties>['table']

        /**
         * @dirty would be deprecated
         */
        __for_extension?: ModelConstructorOptions<TProperties>['__for_extension']
        indexes?: ModelConstructorOptions<TProperties>['indexes']
        // keys composition, it's array-like
        id?: ModelConstructorOptions<TProperties>['keys']
        autoSave?: ModelConstructorOptions<TProperties>['autoSave']
        autoFetch?: ModelConstructorOptions<TProperties>['autoFetch']
        autoFetchLimit?: ModelConstructorOptions<TProperties>['autoFetchLimit']
        hooks?: ModelConstructorOptions<TProperties>['hooks']
        validations?: ModelConstructorOptions<TProperties>['validations']
        methods?: Record<string, (this: FxOrmInstance.Instance<TProperties>, ...args: any) => any>
        identityCache?: ModelConstructorOptions<TProperties>['identityCache']
        cascadeRemove?: ModelConstructorOptions<TProperties>['cascadeRemove']
        ievents?: ModelConstructorOptions<TProperties>['ievents']
        useSelfSettings?: boolean
        [extensibleProperty: string]: any;
    };

    export interface Hooks<TThis = FxOrmInstance.Instance> {
        beforeValidation?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback<TThis>>;
        afterValidation?: FxOrmCommon.Arraible<FxOrmHook.HookRetPayloadCallback<TThis, {
            errors: FxOrmError.ExtendedError[],
            setErrors: (errors: FxOrmError.ExtendedError[]) => void
        }>>
        beforeCreate?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback<TThis>>;
        afterCreate?: FxOrmCommon.Arraible<FxOrmHook.HookResultCallback<TThis>>;
        beforeSave?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback<TThis>>;
        afterSave?: FxOrmCommon.Arraible<FxOrmHook.HookResultCallback<TThis>>;
        afterLoad?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback<TThis>>;
        afterAutoFetch?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback<TThis>>;
        beforeRemove?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback<TThis>>;
        afterRemove?: FxOrmCommon.Arraible<FxOrmHook.HookResultCallback<TThis>>;
    }

    type __Item<T extends any> = T extends (infer U)[] ? U : T

    export interface ModelHookPatchOptions extends FxOrmHook.HookPatchOptions {
    }

    export interface ModelHooksModifier {
        beforeValidation?: (func: __Item<Hooks['beforeValidation']>, opts?: ModelHookPatchOptions) => any;
        afterValidation?: (func: __Item<Hooks['afterValidation']>, opts?: ModelHookPatchOptions) => void;
        beforeCreate?: (func: __Item<Hooks['beforeCreate']>, opts?: ModelHookPatchOptions) => any;
        afterCreate?: (func: __Item<Hooks['afterCreate']>, opts?: ModelHookPatchOptions) => any;
        beforeSave?: (func: __Item<Hooks['beforeSave']>, opts?: ModelHookPatchOptions) => any;
        afterSave?: (func: __Item<Hooks['afterSave']>, opts?: ModelHookPatchOptions) => any;
        afterLoad?: (func: __Item<Hooks['afterLoad']>, opts?: ModelHookPatchOptions) => any;
        afterAutoFetch?: (func: __Item<Hooks['afterAutoFetch']>, opts?: ModelHookPatchOptions) => any;
        beforeRemove?: (func: __Item<Hooks['beforeRemove']>, opts?: ModelHookPatchOptions) => any;
        afterRemove?: (func: __Item<Hooks['afterRemove']>, opts?: ModelHookPatchOptions) => any;
    }

    export interface ModelPropertyDefinition extends FxOrmProperty.DataStoreProperty {
        key?: boolean
        klass?: FxOrmProperty.KlassType
        alwaysValidate?: boolean
        enumerable?: boolean
        // whether lazyload property, if it is, it can be loaded only by its accessor
        lazyload?: boolean
    }

    export type PrimitiveConstructor =
        | StringConstructor
        | BooleanConstructor
        | NumberConstructor
        | DateConstructor
        | ObjectConstructor
    
    export type ComplexModelPropertyDefinition = 
        ModelPropertyDefinition
        | (PrimitiveConstructor & {
            name?: string
        })
        | [...(string | number)[]]
        | (FxOrmProperty.NormalizedProperty['type'])

    export type GetPrimitiveFromConstructor<T extends PrimitiveConstructor = PrimitiveConstructor> =
        T extends StringConstructor ? string : 
        T extends NumberConstructor ? number :
        T extends BooleanConstructor ? boolean :
        T extends DateConstructor ? number | Date :
        T extends ObjectConstructor | typeof Class_Buffer ? any : never

    type GlobalModelType = FxOrmProperty.GlobalCustomModelType & {
        [P in FxOrmProperty.PropertyType]: FxOrmProperty.GetPrimitiveFromOrmPropertyType<P>
    }
    
    export type GetPropertiesTypeFromDefinition<T extends ComplexModelPropertyDefinition> = 
        T extends keyof GlobalModelType ? GlobalModelType[T]:
        T extends [...infer S] ? S[number] :
        T extends ModelPropertyDefinition ? 
            T['type'] extends 'enum' ? Exclude<T['values'], void>[number] :
            (T['type'] extends keyof GlobalModelType ? GlobalModelType[T['type']] : unknown) :
            // T['type'] extends PrimitiveConstructor ? GetPrimitiveFromConstructor<T['type']> :
        T extends PrimitiveConstructor ? GetPrimitiveFromConstructor<T>
        : unknown

    export type GetPropertiesType<T extends Record<string, ComplexModelPropertyDefinition>> = {
        [K in keyof T]: FxOrmModel.GetPropertiesTypeFromDefinition<T[K]>
    }

    export interface ModelOptions__Find {        
        only?: string[];
        limit?: number;
        order?: FxOrmQuery.OrderRawInput | FxOrmQuery.ChainFindOptions['order']
        offset?: number;
        identityCache?: boolean

        autoFetch?: boolean
        cascadeRemove?: boolean
        autoSave?: boolean
        autoFetchLimit?: number
        /** @internal */
        __merge?: FxOrmQuery.ChainFindOptions['merge']
        /** @internal */
        chainfind_linktable?: string;
        /** @internal */
        exists?: [FxOrmQuery.ChainWhereExistsInfo]

        // useless, just for compat
        extra?: FxOrmAssociation.InstanceAssociationItem_HasMany['props']

        // access dynamic findby options
        [k: string]: any
    }
    
    export interface ModelOptions__Findby extends ModelOptions__Find {
        
    }

    export interface ModelOptions__Get extends ModelOptions__Find {}

    export interface ModelQueryConditions__Find extends FxSqlQuerySubQuery.SubQueryConditions {
        [property: string]: any
    }

    export type ModelQueryConditionsItem = FxSqlQuerySql.SqlFragmentStr | ModelQueryConditions__Find

    export type ModelMethodOptions_Find = FxOrmCommon.IdType | ModelQueryConditions__Find

    export type ModelMethodCallback__Boolean = FxOrmCommon.GenericCallback<Boolean>
    export type ModelMethodCallback__Find = FxOrmCommon.GenericCallback<FxOrmInstance.Instance[]>
    export type ModelMethodCallback__Get = FxOrmCommon.GenericCallback<FxOrmInstance.Instance>
    export type ModelMethodCallback__CreateItem = FxOrmCommon.GenericCallback<FxOrmInstance.Instance>
    export type ModelMethodCallback__UpdateItem = FxOrmCommon.GenericCallback<FxOrmInstance.Instance>
    export type ModelMethodCallback__BatchCreate = FxOrmCommon.GenericCallback<FxOrmInstance.Instance[]>
    export type ModelMethodCallback__BatchUpdate = FxOrmCommon.GenericCallback<FxOrmInstance.Instance[]>

    export type ModelMethodCallback__Count = FxOrmCommon.GenericCallback<number>

    export interface ModelOptions__Create {
        parallel?: boolean
    }
}
