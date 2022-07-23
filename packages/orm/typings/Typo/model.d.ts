/// <reference types="@fibjs/types" />
/// <reference types="@fibjs/enforce" />
import type { FxOrmSqlDDLSync } from "@fxjs/sql-ddl-sync";
import { FxOrmAssociation } from "./assoc";
import { FxOrmInstance } from "./instance";
import { FxOrmProperty } from "./property";
import { FxOrmSettings } from "./settings";
import { FxOrmCommon } from "./_common";
import { FxOrmSynchronous } from "./synchronous";
import { FxOrmQuery } from "./query";
import { FxOrmDMLDriver } from "./DMLDriver";
import { FxOrmValidators } from "./Validators";
import { FxOrmHook } from "./hook";
import { FxOrmNS } from "./ORM";
import type { FxSqlQuerySubQuery, FxSqlQuerySql } from '@fxjs/sql-query';
export declare namespace FxOrmModel {
    export type ModelInstanceConstructorOptions = (string | number | FxOrmInstance.InstanceDataPayload)[];
    interface ModelInstanceConstructor {
        (): FxOrmInstance.Instance;
        new (): FxOrmInstance.Instance;
        (...data: ModelInstanceConstructorOptions): FxOrmInstance.Instance;
        new (...data: ModelInstanceConstructorOptions): FxOrmInstance.Instance;
    }
    export type OrderListOrLimitOffer = number | string | string[];
    export interface Model extends ModelInstanceConstructor, ModelHooks, FxOrmSynchronous.SynchronizedModel {
        name: string;
        properties: Record<string, FxOrmProperty.NormalizedProperty>;
        settings: FxOrmSettings.SettingInstance;
        table: string;
        id: string[];
        uid: string;
        caches: Class_LruCache;
        keys: string[];
        allProperties: Record<string, FxOrmProperty.NormalizedProperty>;
        addProperty(propIn: FxOrmProperty.NormalizedProperty, options?: {
            name?: string;
            klass?: FxOrmProperty.KlassType;
        } | false): FxOrmProperty.NormalizedProperty;
        sync(callback?: FxOrmCommon.GenericCallback<FxOrmSqlDDLSync.SyncResult>): Model;
        drop(callback?: FxOrmCommon.VoidCallback): Model;
        /**
         * methods used to add associations
         */
        hasOne: {
            (assoc_name: string, ext_model?: Model, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasOne): FxOrmModel.Model;
        };
        hasMany: {
            (assoc_name: string, ext_model: Model, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasMany): FxOrmModel.Model;
            (assoc_name: string, ext_model: Model, assoc_props: Record<string, ModelPropertyDefinition>, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasMany): FxOrmModel.Model;
        };
        extendsTo: {
            (name: string, properties: Record<string, ModelPropertyDefinition>, assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_ExtendsTo): Model;
        };
        associations: {
            [k: string]: {
                type: 'hasOne';
                association: FxOrmAssociation.InstanceAssociationItem_HasOne;
            } | {
                type: 'hasMany';
                association: FxOrmAssociation.InstanceAssociationItem_HasMany;
            } | {
                type: 'extendsTo';
                association: FxOrmAssociation.InstanceAssociationItem_ExtendTos;
            };
        };
        findBy: {
            <T = any>(association_name: ModelFindByDescriptorItem['association_name'], conditions?: ModelFindByDescriptorItem['conditions'], options?: ModelFindByDescriptorItem['options'], cb?: FxOrmCommon.ExecutionCallback<T>): FxOrmQuery.IChainFind;
            <T = any>(list: ModelFindByDescriptorItem[], self_conditions: FxOrmModel.ModelQueryConditions__Find, cb?: FxOrmCommon.ExecutionCallback<T>): FxOrmQuery.IChainFind;
        };
        create: {
            (data: FxOrmInstance.InstanceDataPayload, callback?: ModelMethodCallback__CreateItem): Model;
            (data: FxOrmInstance.InstanceDataPayload, options?: ModelOptions__Create, callback?: ModelMethodCallback__CreateItem): Model;
        };
        clear: {
            (...args: any[]): Model;
        };
        get: {
            (...ids: any[]): Model;
        };
        chain: {
            (conditions?: FxOrmModel.ModelQueryConditions__Find, ...args: (FxOrmModel.ModelOptions__Find | OrderListOrLimitOffer)[]): FxOrmQuery.IChainFind;
        };
        find: {
            (conditions?: ModelQueryConditions__Find): FxOrmQuery.IChainFind;
            (callback: ModelMethodCallback__Find): Model;
            (conditions: ModelQueryConditions__Find, callback: ModelMethodCallback__Find): Model;
            (conditions: ModelQueryConditions__Find, options: ModelOptions__Find): FxOrmQuery.IChainFind;
            (conditions: ModelQueryConditions__Find, options: ModelOptions__Find, callback: ModelMethodCallback__Find): Model;
            (conditions: ModelQueryConditions__Find, limit_order?: OrderListOrLimitOffer, limit_order2?: OrderListOrLimitOffer): FxOrmQuery.IChainFind;
            (conditions: ModelQueryConditions__Find, limit_order: OrderListOrLimitOffer, callback: ModelMethodCallback__Find): Model;
            (conditions: ModelQueryConditions__Find, limit_order: OrderListOrLimitOffer, limit_order2: OrderListOrLimitOffer, callback: ModelMethodCallback__Find): Model;
        };
        all: Model['find'];
        where: Model['find'];
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
        };
        count: {
            (callback: ModelMethodCallback__Count): Model;
            (conditions: ModelQueryConditions__Find, callback: ModelMethodCallback__Count): Model;
        };
        exists: {
            (...conditions: (FxOrmCommon.IdType | FxSqlQuerySubQuery.SubQueryConditions | FxOrmCommon.ExecutionCallback<boolean>)[]): FxOrmQuery.IChainFind;
        };
        aggregate: {
            (conditions: ModelQueryConditions__Find): FxOrmQuery.IAggregated;
            (properties: string[]): FxOrmQuery.IAggregated;
            (conditions: ModelQueryConditions__Find, properties: string[]): FxOrmQuery.IAggregated;
        };
        prependValidation: {
            (key: string, validation: FibjsEnforce.IValidator): void;
        };
        [property: string]: any;
    }
    export type FindByListStyleFunctionArgs<T = any> = [
        FxOrmModel.ModelFindByDescriptorItem[],
        FxOrmModel.ModelQueryConditions__Find,
        FxOrmModel.ModelOptions__Find,
        FxOrmCommon.ExecutionCallback<T>
    ];
    export type FindByItemStyleFunctionArgs<T = any> = [
        FxOrmModel.ModelFindByDescriptorItem['association_name'],
        FxOrmModel.ModelFindByDescriptorItem['conditions'],
        FxOrmModel.ModelFindByDescriptorItem['options'],
        FxOrmCommon.ExecutionCallback<T>
    ];
    export type ModelConstructor = new (opts: ModelConstructorOptions) => Model;
    export interface ModelFindByDescriptorItem {
        association_name: string;
        conditions?: ModelQueryConditions__Find;
        options?: FxOrmAssociation.ModelAssociationMethod__FindByOptions;
        join_where?: FxOrmModel.ModelQueryConditions__Find;
        extra_select?: string[];
    }
    export interface ModelConstructorOptions {
        name: string;
        db: FxOrmNS.ORM;
        settings: FxOrmSettings.SettingInstance;
        driver_name: string;
        driver: FxOrmDMLDriver.DMLDriver;
        table: string;
        properties: Record<string, FxOrmProperty.NormalizedProperty>;
        __for_extension: boolean;
        indexes: string[];
        identityCache: boolean;
        instanceCacheSize: number;
        keys: string[];
        autoSave: boolean;
        autoFetch: boolean;
        autoFetchLimit: number;
        cascadeRemove: boolean;
        hooks: Hooks;
        methods: {
            [method_name: string]: Function;
        };
        validations: FxOrmValidators.IValidatorHash;
        ievents: FxOrmInstance.InstanceConstructorOptions['events'];
    }
    export interface ModelDefineOptions {
        /**
         * pririoty: table > collection
         */
        table?: ModelConstructorOptions['table'];
        collection?: ModelConstructorOptions['table'];
        /**
         * @dirty would be deprecated
         */
        __for_extension?: ModelConstructorOptions['__for_extension'];
        indexes?: ModelConstructorOptions['indexes'];
        id?: ModelConstructorOptions['keys'];
        autoSave?: ModelConstructorOptions['autoSave'];
        autoFetch?: ModelConstructorOptions['autoFetch'];
        autoFetchLimit?: ModelConstructorOptions['autoFetchLimit'];
        hooks?: ModelConstructorOptions['hooks'];
        validations?: ModelConstructorOptions['validations'];
        methods?: {
            [name: string]: Function;
        };
        identityCache?: ModelConstructorOptions['identityCache'];
        cascadeRemove?: ModelConstructorOptions['cascadeRemove'];
        ievents?: ModelConstructorOptions['ievents'];
        useSelfSettings?: boolean;
        [extensibleProperty: string]: any;
    }
    export type ModelOptions = ModelDefineOptions;
    export interface Hooks {
        beforeValidation?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback>;
        beforeCreate?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback>;
        afterCreate?: FxOrmCommon.Arraible<FxOrmHook.HookResultCallback>;
        beforeSave?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback>;
        afterSave?: FxOrmCommon.Arraible<FxOrmHook.HookResultCallback>;
        afterLoad?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback>;
        afterAutoFetch?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback>;
        beforeRemove?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback>;
        afterRemove?: FxOrmCommon.Arraible<FxOrmHook.HookResultCallback>;
    }
    export type keyofHooks = keyof Hooks;
    export interface ModelHookPatchOptions extends FxOrmHook.HookPatchOptions {
    }
    export interface ModelHooks {
        beforeValidation?: {
            (func: FxOrmHook.HookActionCallback, opts?: ModelHookPatchOptions): any;
        };
        beforeCreate?: {
            (func: FxOrmHook.HookActionCallback, opts?: ModelHookPatchOptions): any;
        };
        afterCreate?: {
            (func: FxOrmHook.HookActionCallback, opts?: ModelHookPatchOptions): any;
        };
        beforeSave?: {
            (func: FxOrmHook.HookActionCallback, opts?: ModelHookPatchOptions): any;
        };
        afterSave?: {
            (func: FxOrmHook.HookResultCallback, opts?: ModelHookPatchOptions): any;
        };
        afterLoad?: {
            (func: FxOrmHook.HookResultCallback, opts?: ModelHookPatchOptions): any;
        };
        afterAutoFetch?: {
            (func: FxOrmHook.HookActionCallback, opts?: ModelHookPatchOptions): any;
        };
        beforeRemove?: {
            (func: FxOrmHook.HookActionCallback, opts?: ModelHookPatchOptions): any;
        };
        afterRemove?: {
            (func: FxOrmHook.HookResultCallback, opts?: ModelHookPatchOptions): any;
        };
    }
    export interface ModelPropertyDefinition extends FxOrmProperty.DataStoreProperty {
        key?: boolean;
        klass?: FxOrmProperty.KlassType;
        alwaysValidate?: boolean;
        enumerable?: boolean;
        lazyload?: boolean;
    }
    export type OrigDetailedModelProperty = FxOrmProperty.NormalizedProperty;
    export type OrigDetailedModelPropertyHash = Record<string, FxOrmProperty.NormalizedProperty>;
    export type PrimitiveConstructor = String | Boolean | Number | Date | Object | Class_Buffer;
    export type EnumTypeValues = any[];
    export type PropTypeStrPropertyDefinition = string;
    export type ComplexModelPropertyDefinition = ModelPropertyDefinition | (PrimitiveConstructor & {
        name: string;
    }) | EnumTypeValues | PropTypeStrPropertyDefinition;
    export interface DetailedPropertyDefinitionHash {
        [key: string]: ModelPropertyDefinition;
    }
    export interface ModelOptions__Find {
        chainfind_linktable?: string;
        only?: string[];
        limit?: number;
        order?: FxOrmQuery.OrderRawInput | FxOrmQuery.ChainFindOptions['order'];
        offset?: number;
        identityCache?: boolean;
        autoFetch?: boolean;
        cascadeRemove?: boolean;
        autoSave?: boolean;
        autoFetchLimit?: number;
        __merge?: FxOrmQuery.ChainFindOptions['merge'];
        exists?: FxOrmQuery.ChainWhereExistsInfo[];
        extra?: FxOrmAssociation.InstanceAssociationItem_HasMany['props'];
        [k: string]: any;
    }
    export interface ModelOptions__Findby extends ModelOptions__Find {
    }
    export interface ModelOptions__Get extends ModelOptions__Find {
    }
    export interface ModelQueryConditions__Find extends FxSqlQuerySubQuery.SubQueryConditions {
        [property: string]: any;
    }
    export type ModelQueryConditionsItem = FxSqlQuerySql.SqlFragmentStr | ModelQueryConditions__Find;
    export type ModelMethodOptions_Find = FxOrmCommon.IdType | ModelQueryConditions__Find;
    export type ModelMethodCallback__Boolean = FxOrmCommon.GenericCallback<Boolean>;
    export type ModelMethodCallback__Find = FxOrmCommon.GenericCallback<FxOrmInstance.Instance[]>;
    export type ModelMethodCallback__Get = FxOrmCommon.GenericCallback<FxOrmInstance.Instance>;
    export type ModelMethodCallback__CreateItem = FxOrmCommon.GenericCallback<FxOrmInstance.Instance>;
    export type ModelMethodCallback__UpdateItem = FxOrmCommon.GenericCallback<FxOrmInstance.Instance>;
    export type ModelMethodCallback__BatchCreate = FxOrmCommon.GenericCallback<FxOrmInstance.Instance[]>;
    export type ModelMethodCallback__BatchUpdate = FxOrmCommon.GenericCallback<FxOrmInstance.Instance[]>;
    export type ModelMethodCallback__Count = FxOrmCommon.GenericCallback<number>;
    export interface ModelOptions__Create {
        parallel?: boolean;
    }
    export {};
}
