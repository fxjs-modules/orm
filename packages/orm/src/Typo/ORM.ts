/// <reference types="@fibjs/types" />
/// <reference types="@fibjs/enforce" />
/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />
/// <reference types="fib-pool" />

import type { FxOrmModel } from "./model"
import type { FxOrmInstance } from "./instance";
import type { FxOrmQuery } from "./query";
import type { FxOrmDMLDriver } from "./DMLDriver";
import type { FxOrmValidators } from "./Validators";
import type { FxOrmSettings } from "./settings";
import type { FxOrmPatch } from "./patch";
import type { FxOrmAssociation } from "./assoc";
import type { FxOrmSynchronous } from "./synchronous";
import type { FxOrmProperty } from "./property";
import type { FxOrmCommon } from "./_common";
import { FxDbDriverNS } from "@fxjs/db-driver";

import type {
    FxSqlQueryComparator,
    FxSqlQueryChainBuilder
} from '@fxjs/sql-query';

export type {
    FxSqlAggregation,
    FxSqlQueryComparator,
    FxSqlQueryComparatorFunction,
    FxSqlQueryDialect,
    FxSqlQueryColumns,
    FxSqlQueryHelpler,
    FxSqlQueryChainBuilder,
    FxSqlQuery,
    FxSqlQuerySql,
    FxSqlQuerySubQuery,
} from '@fxjs/sql-query';

export namespace FxOrmNS {
    /* compatible :start */
    export type Model = FxOrmModel.Model
    export type IChainFind = FxOrmQuery.IChainFind
    
    export type Instance = FxOrmInstance.Instance
    export type Hooks = FxOrmModel.Hooks
    export type FibOrmFixedExtendModel = FxOrmModel.Model

    export type ModelPropertyDefinition = FxOrmModel.ModelPropertyDefinition

    /** @deprecated */
    export type OrigDetailedModelProperty = FxOrmProperty.NormalizedProperty

    /** @deprecated */
    export type OrigDetailedModelPropertyHash = Record<string, FxOrmProperty.NormalizedProperty>
    /** @deprecated */
    export type OrigModelPropertyDefinition = FxOrmModel.ComplexModelPropertyDefinition

    /** @deprecated */
    export type ModelPropertyDefinitionHash = {
        [key: string]: ComplexModelPropertyDefinition
    }

    /** @deprecated */
    export type ModelOptions = FxOrmModel.ModelDefineOptions
    /** @deprecated */
    export type OrigHooks = FxOrmModel.Hooks
    
    export type ComplexModelPropertyDefinition = FxOrmModel.ComplexModelPropertyDefinition
    /** @deprecated */
    export type FibOrmFixedModelOptions = FxOrmModel.ModelDefineOptions
    
    export type PatchedSyncfiedModelOrInstance = FxOrmPatch.PatchedSyncfiedModelOrInstance
    export type PatchedSyncfiedInstanceWithDbWriteOperation = FxOrmPatch.PatchedSyncfiedInstanceWithDbWriteOperation
    export type PatchedSyncfiedInstanceWithAssociations = FxOrmPatch.PatchedSyncfiedInstanceWithAssociations

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
    
    export interface ExtensibleError extends Error {
        [extensibleProperty: string]: any
    }

    /** @deprecated */
    export interface TransformFibOrmModel2InstanceOptions extends FxOrmModel.ModelDefineOptions {}

    /** @deprecated */
    export type FibORM = ORM

    export interface FibORMIConnectionOptions extends FxDbDriverNS.ConnectionInputArgs {
        timezone: string;
    }

    export type OrigAggreteGenerator = (...args: any[]) => FxOrmQuery.IAggregated

    export interface FibOrmFindLikeQueryObject {
        [key: string]: any;
    }

    export interface FibOrmFixedModelInstanceFn {
        (model: FxOrmModel.Model, opts: object): FxOrmInstance.Instance
        new (model: FxOrmModel.Model, opts: object): FxOrmInstance.Instance
    }

    export interface FibOrmPatchedSyncfiedInstantce extends FxOrmPatch.PatchedSyncfiedInstanceWithDbWriteOperation, FxOrmPatch.PatchedSyncfiedInstanceWithAssociations {
    }

    export interface IChainFibORMFind extends FxOrmPatch.PatchedSyncfiedModelOrInstance, FxSqlQueryChainBuilder.ChainBuilder__Select {
        only(args: string | string[]): IChainFibORMFind;
        only(...args: string[]): IChainFibORMFind;
        // order(...order: string[]): IChainFibORMFind;
    }
    /* Orm About Patch :end */

    /* instance/model computation/transform about :start */
    export interface ModelAutoFetchOptions {
        autoFetchLimit?: number
        autoFetch?: boolean
    }

    export interface InstanceAutoFetchOptions extends ModelAutoFetchOptions {}
    export interface ModelExtendOptions {}
    export interface InstanceExtendOptions extends ModelExtendOptions {}
    /* instance/model computation/transform about :end */

    /**
    * Parameter Type Interfaces
    **/
    // just for compatible
    export type FibOrmFixedModel = FxOrmModel.Model
    // patch the missing field defined in orm/lib/Instance.js (such as defined by Object.defineProperty)
    export type FibOrmFixedModelInstance = FxOrmInstance.Instance 

    export interface PluginOptions {
        [key: string]: any
    }
    // export interface PluginConstructor {
    //     new (orm?: ORM, opts?: PluginOptions): Plugin
    //     prototype: Plugin
    // }
    export type PluginConstructFn<T2 = PluginOptions, T1 extends ORM = ORM> = (orm: T1, opts: T2) => Plugin
    export interface Plugin {
        beforeDefine?: {
            (name?: string, properties?: Record<string, ComplexModelPropertyDefinition>, opts?: FxOrmModel.ModelDefineOptions): void
        }
        define?: {
            (model?: FxOrmModel.Model, orm?: ORM): void
        }
        beforeHasOne?: {
            (
                model?: FxOrmModel.Model,
                opts?: {
                    association_name?: string,
                    ext_model?: Model,
                    assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasOne
                }
            ): void
        }
        beforeHasMany?: {
            (
                model?: FxOrmModel.Model,
                opts?: {
                    association_name?: string,
                    ext_model?: Model,
                    assoc_props?: Record<string, ModelPropertyDefinition>,
                    assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasMany
                }
            ): void
        }
        beforeExtendsTo?: {
            (
                model?: FxOrmModel.Model,
                opts?: {
                    association_name?: string,
                    properties?: FxOrmModel.DetailedPropertyDefinitionHash,
                    assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_ExtendsTo
                }
            ): void
        }
    }

    /** @deprecated */
    export interface ORMConstructor {
        new (driver_name: string, driver: FxOrmDMLDriver.DMLDriver, settings: FxOrmSettings.SettingInstance): ORM
        prototype: ORM
    }

    /**
     * @description leave here for augmention on consumer of this package,
     * 
     * all models declared here would be considered as memebers of `orm.models`, e.g.
     * 
     * ```ts
     * const User = orm.define('user', { ... });
     * 
     * declare module '@fxjs/orm' {
     *    export namespace FxOrmNS {
     *      export GlobalModels {
     *         users: typeof User
     *      }
     *    }
     * }
     * ```
     */
    export interface GlobalModels {
        [key: string]: FxOrmModel.Model
    }

    export interface ORMLike extends Class_EventEmitter {
        use: {
            (plugin: PluginConstructFn, options?: PluginOptions): ThisType<ORMLike>;
        }
        define: <
            T extends Record<string, ComplexModelPropertyDefinition>,
            U extends FxOrmModel.ModelDefineOptions<FxOrmModel.GetPropertiesType<T>>
        >(
            name: string,
            properties: T,
            opts?: U
        ) => FxOrmModel.Model<FxOrmModel.GetPropertiesType<T>, Exclude<U['methods'], void>>;
        sync(callback: FxOrmCommon.VoidCallback): this;
        syncSync(): void;
        load(file: string, callback: FxOrmCommon.VoidCallback): any;

        driver?: FxOrmDMLDriver.DMLDriver
        models: GlobalModels;

        [k: string]: any
    }

    export interface ORM extends ORMLike, FxOrmSynchronous.SynchronizedORMInstance {
        validators: FxOrmValidators.ValidatorModules;
        enforce: FibjsEnforce.ExportModule;
        settings: FxOrmSettings.SettingInstance;
        driver_name: string;
        driver: FxOrmDMLDriver.DMLDriver;
        /**
         * @deprecated use orm.comparators directly
         */
        tools: FxSqlQueryComparator.ComparatorHash;
        comparators: FxSqlQueryComparator.ComparatorHash;
        plugins: Plugin[];
        customTypes: { [key: string]: FxOrmProperty.CustomPropertyType };

        defineType(name: string, type: FxOrmProperty.CustomPropertyType): this;
        
        load(file: string, callback: FxOrmCommon.VoidCallback): any;
        
        ping(callback: FxOrmCommon.VoidCallback): this;
        close(callback: FxOrmCommon.VoidCallback): this;
        sync(callback: FxOrmCommon.VoidCallback): this;
        drop(callback: FxOrmCommon.VoidCallback): this;

        begin: FxDbDriverNS.SQLDriver['begin'];
        commit: FxDbDriverNS.SQLDriver['commit'];
        rollback: FxDbDriverNS.SQLDriver['rollback'];
        trans: FxDbDriverNS.SQLDriver['trans'];

        [extraMember: string]: any;
    }

    export interface SingletonOptions {
        identityCache?: boolean;
        saveCheck?: boolean;
    }

    export interface IUseOptions {
        query?: {
            /**
             * debug key from connection options or connction url's querystring
             * @example query.debug: 'false'
             * @example mysql://127.0.0.1:3306/schema?debug=true
             */
            debug?: string
        }
    }

    export interface SingletonModule {
        modelClear: {
            (model: FxOrmModel.Model, key?: string): SingletonModule
        }
        clear: {
            (key?: string): SingletonModule
        };
        modelGet: {
            <T = any>(
                model: FxOrmModel.Model,
                key: string,
                opts: SingletonOptions,
                reFetchSync: () => FxOrmInstance.Instance
            ): FxOrmInstance.Instance
        };
        get: {
            <T = any>(
                key: string,
                opts: SingletonOptions,
                reFetchSync: () => FxOrmInstance.Instance
            ): FxOrmInstance.Instance
        };
    }
}
