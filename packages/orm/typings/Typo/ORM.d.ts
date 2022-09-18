/// <reference types="@fibjs/types" />
/// <reference types="@fibjs/enforce" />
import type { FxOrmModel } from "./model";
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
import type { FxSqlQueryComparator, FxSqlQueryChainBuilder } from '@fxjs/sql-query';
export type { FxSqlAggregation, FxSqlQueryComparator, FxSqlQueryComparatorFunction, FxSqlQueryDialect, FxSqlQueryColumns, FxSqlQueryHelpler, FxSqlQueryChainBuilder, FxSqlQuery, FxSqlQuerySql, FxSqlQuerySubQuery, } from '@fxjs/sql-query';
export declare namespace FxOrmNS {
    type Model = FxOrmModel.Model;
    type IChainFind = FxOrmQuery.IChainFind;
    type Instance = FxOrmInstance.Instance;
    type Hooks = FxOrmModel.Hooks;
    type FibOrmFixedExtendModel = FxOrmModel.Model;
    type ModelPropertyDefinition = FxOrmModel.ModelPropertyDefinition;
    type OrigDetailedModelProperty = FxOrmModel.OrigDetailedModelProperty;
    type OrigDetailedModelPropertyHash = FxOrmModel.OrigDetailedModelPropertyHash;
    type OrigModelPropertyDefinition = FxOrmModel.ComplexModelPropertyDefinition;
    /**
     * @deprecated
     */
    type ModelPropertyDefinitionHash = {
        [key: string]: ComplexModelPropertyDefinition;
    };
    type ModelOptions = FxOrmModel.ModelOptions;
    type OrigHooks = FxOrmModel.Hooks;
    type ComplexModelPropertyDefinition = FxOrmModel.ComplexModelPropertyDefinition;
    type FibOrmFixedModelOptions = FxOrmModel.ModelOptions;
    type PatchedSyncfiedModelOrInstance = FxOrmPatch.PatchedSyncfiedModelOrInstance;
    type PatchedSyncfiedInstanceWithDbWriteOperation = FxOrmPatch.PatchedSyncfiedInstanceWithDbWriteOperation;
    type PatchedSyncfiedInstanceWithAssociations = FxOrmPatch.PatchedSyncfiedInstanceWithAssociations;
    type SettingInstance = FxOrmSettings.SettingInstance;
    type ModelOptions__Find = FxOrmModel.ModelOptions__Find;
    type ModelQueryConditions__Find = FxOrmModel.ModelQueryConditions__Find;
    type ModelMethodCallback__Find = FxOrmModel.ModelMethodCallback__Find;
    type ModelMethodCallback__Count = FxOrmModel.ModelMethodCallback__Count;
    type InstanceDataPayload = FxOrmInstance.InstanceDataPayload;
    type InstanceAssociationItem_HasMany = FxOrmAssociation.InstanceAssociationItem_HasMany;
    type InstanceAssociationItem_HasOne = FxOrmAssociation.InstanceAssociationItem_HasOne;
    type InstanceAssociationItem_ExtendTos = FxOrmAssociation.InstanceAssociationItem_ExtendTos;
    type QueryConditionInTypeType = FxOrmQuery.QueryConditionInTypeType;
    type QueryCondition_SimpleEq = FxOrmQuery.QueryCondition_SimpleEq;
    type QueryCondition_eq = FxOrmQuery.QueryCondition_eq;
    type QueryCondition_ne = FxOrmQuery.QueryCondition_ne;
    type QueryCondition_gt = FxOrmQuery.QueryCondition_gt;
    type QueryCondition_gte = FxOrmQuery.QueryCondition_gte;
    type QueryCondition_lt = FxOrmQuery.QueryCondition_lt;
    type QueryCondition_lte = FxOrmQuery.QueryCondition_lte;
    type QueryCondition_like = FxOrmQuery.QueryCondition_like;
    type QueryCondition_not_like = FxOrmQuery.QueryCondition_not_like;
    type QueryCondition_between = FxOrmQuery.QueryCondition_between;
    type QueryCondition_not_between = FxOrmQuery.QueryCondition_not_between;
    type QueryCondition_in = FxOrmQuery.QueryCondition_in;
    type QueryCondition_not_in = FxOrmQuery.QueryCondition_not_in;
    type QueryConditionAtomicType = FxOrmQuery.QueryConditionAtomicType;
    type QueryConditions = FxOrmQuery.QueryConditions;
    interface ExtensibleError extends Error {
        [extensibleProperty: string]: any;
    }
    interface TransformFibOrmModel2InstanceOptions extends FxOrmModel.ModelOptions {
    }
    type FibORM = ORM;
    type FibOrmDB = ORM;
    interface FibORMIConnectionOptions extends FxDbDriverNS.ConnectionInputArgs {
        timezone: string;
    }
    type InstanceOptions = FxOrmInstance.InnerInstanceOptions;
    type OrigAggreteGenerator = (...args: any[]) => FxOrmQuery.IAggregated;
    interface FibOrmFindLikeQueryObject {
        [key: string]: any;
    }
    interface FibOrmFixedModelInstanceFn {
        (model: FxOrmModel.Model, opts: object): FxOrmInstance.Instance;
        new (model: FxOrmModel.Model, opts: object): FxOrmInstance.Instance;
    }
    interface FibOrmPatchedSyncfiedInstantce extends FxOrmPatch.PatchedSyncfiedInstanceWithDbWriteOperation, FxOrmPatch.PatchedSyncfiedInstanceWithAssociations {
    }
    interface IChainFibORMFind extends FxOrmPatch.PatchedSyncfiedModelOrInstance, FxSqlQueryChainBuilder.ChainBuilder__Select {
        only(args: string | string[]): IChainFibORMFind;
        only(...args: string[]): IChainFibORMFind;
    }
    interface ModelAutoFetchOptions {
        autoFetchLimit?: number;
        autoFetch?: boolean;
    }
    interface InstanceAutoFetchOptions extends ModelAutoFetchOptions {
    }
    interface ModelExtendOptions {
    }
    interface InstanceExtendOptions extends ModelExtendOptions {
    }
    /**
    * Parameter Type Interfaces
    **/
    type FibOrmFixedModel = FxOrmModel.Model;
    type FibOrmFixedModelInstance = FxOrmInstance.Instance;
    interface PluginOptions {
        [key: string]: any;
    }
    type PluginConstructFn<T2 = PluginOptions, T1 extends ORM = ORM> = (orm: T1, opts: T2) => Plugin;
    interface Plugin {
        beforeDefine?: {
            (name?: string, properties?: Record<string, ModelPropertyDefinition>, opts?: FxOrmModel.ModelOptions): void;
        };
        define?: {
            (model?: FxOrmModel.Model, orm?: ORM): void;
        };
        beforeHasOne?: {
            (model?: FxOrmModel.Model, opts?: {
                association_name?: string;
                ext_model?: Model;
                assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasOne;
            }): void;
        };
        beforeHasMany?: {
            (model?: FxOrmModel.Model, opts?: {
                association_name?: string;
                ext_model?: Model;
                assoc_props?: Record<string, ModelPropertyDefinition>;
                assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_HasMany;
            }): void;
        };
        beforeExtendsTo?: {
            (model?: FxOrmModel.Model, opts?: {
                association_name?: string;
                properties?: FxOrmModel.DetailedPropertyDefinitionHash;
                assoc_options?: FxOrmAssociation.AssociationDefinitionOptions_ExtendsTo;
            }): void;
        };
    }
    interface ORMConstructor {
        new (driver_name: string, driver: FxOrmDMLDriver.DMLDriver, settings: FxOrmSettings.SettingInstance): ORM;
        prototype: ORM;
    }
    interface ORMLike extends Class_EventEmitter {
        use: {
            (plugin: PluginConstructFn, options?: PluginOptions): ThisType<ORMLike>;
        };
        define: Function;
        sync: Function;
        load: Function;
        driver?: FxOrmDMLDriver.DMLDriver;
        [k: string]: any;
    }
    interface ORM extends ORMLike, FxOrmSynchronous.SynchronizedORMInstance {
        validators: FxOrmValidators.ValidatorModules;
        enforce: FibjsEnforce.ExportModule;
        settings: FxOrmSettings.SettingInstance;
        driver_name: string;
        driver: FxOrmDMLDriver.DMLDriver;
        tools: FxSqlQueryComparator.ComparatorHash;
        models: {
            [key: string]: FxOrmModel.Model;
        };
        plugins: Plugin[];
        customTypes: {
            [key: string]: FxOrmProperty.CustomPropertyType;
        };
        define(name: string, properties: Record<string, ModelPropertyDefinition>, opts?: FxOrmModel.ModelOptions): FxOrmModel.Model;
        defineType(name: string, type: FxOrmProperty.CustomPropertyType): this;
        load(file: string, callback: FxOrmCommon.VoidCallback): any;
        ping(callback: FxOrmCommon.VoidCallback): this;
        close(callback: FxOrmCommon.VoidCallback): this;
        sync(callback: FxOrmCommon.VoidCallback): this;
        drop(callback: FxOrmCommon.VoidCallback): this;
        syncSync(): void;
        begin: FxDbDriverNS.SQLDriver['begin'];
        commit: FxDbDriverNS.SQLDriver['commit'];
        rollback: FxDbDriverNS.SQLDriver['rollback'];
        trans: FxDbDriverNS.SQLDriver['trans'];
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
            debug?: string;
        };
    }
    interface SingletonModule {
        modelClear: {
            (model: FxOrmModel.Model, key?: string): SingletonModule;
        };
        clear: {
            (key?: string): SingletonModule;
        };
        modelGet: {
            <T = any>(model: FxOrmModel.Model, key: string, opts: SingletonOptions, reFetchSync: () => FxOrmInstance.Instance): FxOrmInstance.Instance;
        };
        get: {
            <T = any>(key: string, opts: SingletonOptions, reFetchSync: () => FxOrmInstance.Instance): FxOrmInstance.Instance;
        };
    }
}
