/// <reference types="@fibjs/types" />
import type { FxOrmHook } from "./hook";
import type { FxOrmModel } from "./model";
import type { FxOrmProperty } from "./property";
import type { FxOrmCommon } from "./_common";
import type { FxOrmInstance } from "./instance";
import type { FxOrmQuery } from "./query";
export declare namespace FxOrmAssociation {
    type AssociationType = 'extendsTo' | 'hasOne' | 'hasMany';
    /**
     * @type.function: (model_name: string, idkey: string) => string
     *
     * @string.default: `{model_name}_${idkey}`
     */
    type AssociationKeyComputation = ((model_name: string, idkey: string) => string) | string;
    interface AssociationDefinitionOptions {
        /**
         * it's also accessor base for `extendsTo`, `hasOne`, `hasMany`,
         *
         * @notice fallback from `acessor` for `hasOne`, `hasMany`
         */
        name?: string;
        model?: FxOrmModel.Model;
        field?: string | Record<string, FxOrmProperty.NormalizedProperty>;
        __for_extension?: boolean;
        required?: boolean;
        reversed?: boolean;
        /**
         * accessor base for `hasOne`, `hasMany`
         */
        accessor?: string;
        /**
         * accessor base for `hasOne`
         */
        reverseAccessor?: string;
        autoFetch?: boolean;
        autoFetchLimit?: number;
        getAccessor?: string;
        setAccessor?: string;
        hasAccessor?: string;
        delAccessor?: string;
        addAccessor?: string;
        modelFindByAccessor?: string;
        hooks?: InstanceAssociationItem['hooks'];
    }
    interface AssociationDefinitionOptions_ExtendsTo extends AssociationDefinitionOptions {
        table?: string;
        reverse?: string;
        reverseHooks?: InstanceAssociationItem_HasOne['hooks'];
    }
    interface AssociationDefinitionOptions_HasOne extends AssociationDefinitionOptions {
        reverse?: string;
        reverseHooks?: InstanceAssociationItem_HasOne['hooks'];
    }
    interface AssociationDefinitionOptions_HasMany extends AssociationDefinitionOptions {
        reverse?: string;
        reverseHooks?: AssociationDefinitionOptions_HasMany['hooks'];
        key?: boolean;
        mergeId?: string | FxOrmModel.DetailedPropertyDefinitionHash;
        mergeAssocId?: string | FxOrmModel.DetailedPropertyDefinitionHash;
        reverseAssociation?: string;
        hooks?: InstanceAssociationItem['hooks'] & {
            /**
             * @_1st_arg { associations: [] }
             */
            beforeAdd?: FxOrmHook.HookActionCallback;
            afterAdd?: FxOrmHook.HookResultCallback;
            beforeSave?: {
                (next?: Function): void;
                (extra: any, next?: Function): void;
            };
        };
        mergeTable?: string;
        association?: string;
        getAccessor?: string;
        setAccessor?: string;
        hasAccessor?: string;
        delAccessor?: string;
        addAccessor?: string;
    }
    interface InstanceAssociationItemHooks {
        beforeSet?: {
            (func: FxOrmHook.HookActionCallback, opts?: FxOrmHook.HookPatchOptions & Fibjs.AnyObject): any;
        };
        afterSet?: {
            (func: FxOrmHook.HookResultCallback, opts?: FxOrmHook.HookPatchOptions & Fibjs.AnyObject): any;
        };
        beforeRemove?: {
            (func: FxOrmHook.HookActionCallback, opts?: FxOrmHook.HookPatchOptions & Fibjs.AnyObject): any;
        };
        afterRemove?: {
            (func: FxOrmHook.HookResultCallback, opts?: FxOrmHook.HookPatchOptions & Fibjs.AnyObject): any;
        };
        beforeAdd?: {
            (func: FxOrmHook.HookActionCallback, opts?: FxOrmHook.HookPatchOptions & Fibjs.AnyObject): any;
        };
        afterAdd?: {
            (func: FxOrmHook.HookResultCallback, opts?: FxOrmHook.HookPatchOptions & Fibjs.AnyObject): any;
        };
    }
    interface InstanceAssociationItem extends InstanceAssociationItemHooks {
        name: string;
        model: FxOrmModel.Model;
        field: string | Record<string, FxOrmProperty.NormalizedProperty>;
        hooks: {
            beforeSet?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback>;
            afterSet?: FxOrmCommon.Arraible<FxOrmHook.HookResultCallback>;
            beforeRemove?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback>;
            afterRemove?: FxOrmCommon.Arraible<FxOrmHook.HookResultCallback>;
            [k: string]: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback | FxOrmHook.HookResultCallback>;
        };
        __for_extension?: boolean;
        getAccessor: string;
        getSyncAccessor: string;
        setAccessor: string;
        setSyncAccessor: string;
        hasAccessor: string;
        hasSyncAccessor: string;
        delAccessor: string;
        delSyncAccessor: string;
        addAccessor?: string;
        addSyncAccessor?: string;
        modelFindByAccessor?: string;
        modelFindBySyncAccessor?: string;
        reversed?: boolean;
        autoFetch: boolean;
        autoFetchLimit: number;
        mapsTo?: FxOrmModel.ModelPropertyDefinition['mapsTo'];
        [k: string]: any;
    }
    interface InstanceAssociatedInstance extends FxOrmInstance.Instance {
    }
    interface InstanceAssociationItem_ExtendTos extends InstanceAssociationItem {
        table: string;
        reverse?: string;
        modelFindByAccessor: string;
    }
    interface InstanceAssociationItem_HasOne extends InstanceAssociationItem {
        field: Record<string, FxOrmProperty.NormalizedProperty>;
        reverse?: string;
        reverseHooks?: InstanceAssociationItem_HasOne['hooks'];
        accessor?: string;
        reverseAccessor?: string;
        modelFindByAccessor: string;
        required?: boolean;
        __for_extension?: boolean;
    }
    interface InstanceAssociationItem_HasMany extends InstanceAssociationItem {
        props: Record<string, FxOrmProperty.NormalizedProperty>;
        mergeTable: string;
        mergeId: Record<string, FxOrmProperty.NormalizedProperty>;
        mergeAssocId: Record<string, FxOrmProperty.NormalizedProperty>;
        getAccessor: string;
        setAccessor: string;
        hasAccessor: string;
        delAccessor: string;
        addAccessor: string;
        modelFindByAccessor?: string;
        hooks: AssociationDefinitionOptions_HasMany['hooks'];
    }
    interface InstanceAssociationItemInformation {
        changed: boolean;
        value?: InstanceAssociatedInstance;
        data?: InstanceAssociationItem;
    }
    type ModelAssociationMethod__ComputationPayload__Merge = FxOrmQuery.ChainFindMergeInfo;
    interface ModelAssociationMethod__Options {
        join_where?: FxOrmModel.ModelFindByDescriptorItem['join_where'];
        extra?: FxOrmModel.ModelOptions__Find['extra'];
        extra_info?: {
            table: string;
            id: FxOrmModel.Model['id'];
            id_prop: string[];
            assoc_prop: string[];
        };
    }
    interface ModelAssociationMethod__FindOptions extends FxOrmModel.ModelOptions__Find, ModelAssociationMethod__Options {
    }
    interface ModelAssociationMethod__GetOptions extends FxOrmModel.ModelOptions__Find, ModelAssociationMethod__Options {
    }
    interface ModelAssociationMethod__FindByOptions extends FxOrmModel.ModelOptions__Findby, ModelAssociationMethod__Options {
    }
    interface AccessorOptions_has {
    }
    type AccessorOptions_get = FxOrmCommon.IdType | FxOrmModel.ModelQueryConditions__Find;
    interface AutoFetchInstanceOptions {
        autoFetch?: boolean;
        autoFetchLimit?: number;
    }
}
