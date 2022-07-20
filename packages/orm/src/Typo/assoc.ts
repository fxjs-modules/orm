import type { FxOrmHook } from "./hook"
import type { FxOrmModel } from "./model"
import type { FxOrmProperty } from "./property"
import type { FxOrmCommon } from "./_common"
import type { FxOrmInstance } from "./instance"
import type { FxOrmQuery } from "./query"

export namespace FxOrmAssociation {
    export type AssociationType = 'extendsTo' | 'hasOne' | 'hasMany'

    /**
     * @type.function: (model_name: string, idkey: string) => string
     * 
     * @string.default: `{model_name}_${idkey}`
     */
    export type AssociationKeyComputation = ((model_name: string, idkey: string) => string) | string
    export interface AssociationDefinitionOptions {
        /**
         * it's also accessor base for `extendsTo`, `hasOne`, `hasMany`,
         * 
         * @notice fallback from `acessor` for `hasOne`, `hasMany`
         */
        name?: string;
        model?: FxOrmModel.Model;
        field?: string/*  | string[] */ | Record<string, FxOrmProperty.NormalizedProperty>

        // is the association is for extendsTo
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

        hooks?: InstanceAssociationItem['hooks']
    }

    export interface AssociationDefinitionOptions_ExtendsTo extends AssociationDefinitionOptions {
        table?: string;

        reverse?: string;
        reverseHooks?: InstanceAssociationItem_HasOne['hooks'];
    }
    export interface AssociationDefinitionOptions_HasOne extends AssociationDefinitionOptions {
        reverse?: string;
        reverseHooks?: InstanceAssociationItem_HasOne['hooks'];
    }
    export interface AssociationDefinitionOptions_HasMany extends AssociationDefinitionOptions {
        reverse?: string;
        reverseHooks?: AssociationDefinitionOptions_HasMany['hooks']
        // is association property a primary key
        key?: boolean
        mergeId?: string | FxOrmModel.DetailedPropertyDefinitionHash
        mergeAssocId?: string | FxOrmModel.DetailedPropertyDefinitionHash
        reverseAssociation?: string

        hooks?: InstanceAssociationItem['hooks'] & {
            /**
             * @_1st_arg { associations: [] }
             */
            beforeAdd?: FxOrmHook.HookActionCallback
            afterAdd?: FxOrmHook.HookResultCallback
            // @deprecated
            beforeSave?: {
                (next?: Function): void;
                (extra: any, next?: Function): void;
            }
        }
        mergeTable?: string

        association?: string

        getAccessor?: string;
        setAccessor?: string;
        hasAccessor?: string;
        delAccessor?: string;
        addAccessor?: string;
    }

    export interface InstanceAssociationItemHooks {
        beforeSet?: {
            (func: FxOrmHook.HookActionCallback, opts?: FxOrmHook.HookPatchOptions & Fibjs.AnyObject): any
        }
        afterSet?: {
            (func: FxOrmHook.HookResultCallback, opts?: FxOrmHook.HookPatchOptions & Fibjs.AnyObject): any
        }
        beforeRemove?: {
            (func: FxOrmHook.HookActionCallback, opts?: FxOrmHook.HookPatchOptions & Fibjs.AnyObject): any
        }
        afterRemove?: {
            (func: FxOrmHook.HookResultCallback, opts?: FxOrmHook.HookPatchOptions & Fibjs.AnyObject): any
        }

        beforeAdd?: {
            (func: FxOrmHook.HookActionCallback, opts?: FxOrmHook.HookPatchOptions & Fibjs.AnyObject): any
        }
        afterAdd?: {
            (func: FxOrmHook.HookResultCallback, opts?: FxOrmHook.HookPatchOptions & Fibjs.AnyObject): any
        }
    }

    export interface InstanceAssociationItem extends InstanceAssociationItemHooks {
        name: string
        model: FxOrmModel.Model
        field: string /* | string[] */ | Record<string, FxOrmProperty.NormalizedProperty>
        hooks: {
            beforeSet?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback>
            afterSet?: FxOrmCommon.Arraible<FxOrmHook.HookResultCallback>
            beforeRemove?: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback>
            afterRemove?: FxOrmCommon.Arraible<FxOrmHook.HookResultCallback>

            [k: string]: FxOrmCommon.Arraible<FxOrmHook.HookActionCallback | FxOrmHook.HookResultCallback>
        }
        
        // is the association is extendsTo
        __for_extension?: boolean

        getAccessor: string
        getSyncAccessor: string
        setAccessor: string
        setSyncAccessor: string
        hasAccessor: string
        hasSyncAccessor: string
        delAccessor: string
        delSyncAccessor: string

        addAccessor?: string
        addSyncAccessor?: string

        modelFindByAccessor?: string
        modelFindBySyncAccessor?: string

        // if the association is reversed association from other,
        // such as `hasOne` from host's `extendsTo`, or `hasMany` from host's `hasMany`
        reversed?: boolean
        autoFetch: boolean
        autoFetchLimit: number
        
        mapsTo?: FxOrmModel.ModelPropertyDefinition['mapsTo']

        // *Accessor functions
        [k: string]: any
    }

    export interface InstanceAssociatedInstance extends FxOrmInstance.Instance {
    }

    export interface InstanceAssociationItem_ExtendTos extends InstanceAssociationItem {
        table: string;
        reverse?: string;
        modelFindByAccessor: string
    }

    export interface InstanceAssociationItem_HasOne extends InstanceAssociationItem {
        field: Record<string, FxOrmProperty.NormalizedProperty>
        
        reverse?: string;
        reverseHooks?: InstanceAssociationItem_HasOne['hooks'];
        // template name
        accessor?: string;
        reverseAccessor?: string;

        // addAccessor?: string;

        modelFindByAccessor: string

        required?: boolean;
        __for_extension?: boolean;
    }

    export interface InstanceAssociationItem_HasMany extends InstanceAssociationItem {
        props: Record<string, FxOrmProperty.NormalizedProperty>
        // hooks: HasManyHooks

        mergeTable: string
        mergeId: Record<string, FxOrmProperty.NormalizedProperty>
        mergeAssocId: Record<string, FxOrmProperty.NormalizedProperty>

        getAccessor: string
        setAccessor: string
        hasAccessor: string
        delAccessor: string
        addAccessor: string

        modelFindByAccessor?: string

        hooks: AssociationDefinitionOptions_HasMany['hooks']
    }

    export interface InstanceAssociationItemInformation {
        changed: boolean
        value?: InstanceAssociatedInstance
        data?: InstanceAssociationItem
    }

    // @deprecated
    export type ModelAssociationMethod__ComputationPayload__Merge = FxOrmQuery.ChainFindMergeInfo

    export interface ModelAssociationMethod__Options {
        // only valid for hasMany assoc
        join_where?: FxOrmModel.ModelFindByDescriptorItem['join_where']
        extra?: FxOrmModel.ModelOptions__Find['extra']
        extra_info?: {
            table: string
            id: FxOrmModel.Model['id']
            id_prop: string[]
            assoc_prop: string[]
        }
    }

    export interface ModelAssociationMethod__FindOptions extends FxOrmModel.ModelOptions__Find, ModelAssociationMethod__Options {
    }

    export interface ModelAssociationMethod__GetOptions extends FxOrmModel.ModelOptions__Find, ModelAssociationMethod__Options {
    }

    export interface ModelAssociationMethod__FindByOptions extends FxOrmModel.ModelOptions__Findby, ModelAssociationMethod__Options {
    }

    export interface AccessorOptions_has {

    }

    export type AccessorOptions_get = FxOrmCommon.IdType | FxOrmModel.ModelQueryConditions__Find

    export interface AutoFetchInstanceOptions {
        autoFetch?: boolean
        autoFetchLimit?: number
    }
}
