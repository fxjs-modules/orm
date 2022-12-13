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
        mergeId?: string | Record<string, FxOrmModel.ModelPropertyDefinition>
        mergeAssocId?: string | Record<string, FxOrmModel.ModelPropertyDefinition>
        reverseAssociation?: string

        hooks?: InstanceAssociationItem['hooks'] & {
            beforeAdd?: FxOrmHook.HookActionWithCtxCallback<FxOrmInstance.Instance, __AssocHooksCtx>
            afterAdd?: FxOrmHook.HookRetOnlyPayloadCallback<FxOrmInstance.Instance, __AssocHooksCtx>
            /** @deprecated */
            beforeSave?: {
                (next?: FxOrmHook.HookActionNextor): void;
                (extra: any, next?: FxOrmHook.HookActionNextor): void;
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
            (func: FxOrmHook.HookActionCallback, opts?: FxOrmHook.HookPatchOptions & Record<string, any>): any
        }
        afterSet?: {
            (func: FxOrmHook.HookResultCallback, opts?: FxOrmHook.HookPatchOptions & Record<string, any>): any
        }
        beforeRemove?: {
            (func: FxOrmHook.HookActionCallback, opts?: FxOrmHook.HookPatchOptions & Record<string, any>): any
        }
        afterRemove?: {
            (func: FxOrmHook.HookResultCallback, opts?: FxOrmHook.HookPatchOptions & Record<string, any>): any
        }

        beforeAdd?: {
            (func: FxOrmHook.HookActionCallback, opts?: FxOrmHook.HookPatchOptions & Record<string, any>): any
        }
        afterAdd?: {
            (func: FxOrmHook.HookResultCallback, opts?: FxOrmHook.HookPatchOptions & Record<string, any>): any
        }
    }

    /** @internal */
    export type __AssocHooksCtx = {
        instance?: FxOrmInstance.Instance
        association?: FxOrmInstance.Instance
        associations?: (FxOrmInstance.Instance)[]
        association_ids?: any[]
        removeConditions?: Record<string, any>
        useChannel?: () => FxOrmHook.HookChannelResults<Function>
        $ref?: {
            instance?: __AssocHooksCtx['instance']
            association?: __AssocHooksCtx['association']
            associations?: __AssocHooksCtx['associations']
            association_ids?: __AssocHooksCtx['association_ids']
            removeConditions?: __AssocHooksCtx['removeConditions']
            useChannel?: __AssocHooksCtx['useChannel']
        }
    }

    export interface InstanceAssociationItem extends InstanceAssociationItemHooks {
        name: string
        model: FxOrmModel.Model
        field: string /* | string[] */ | Record<string, FxOrmProperty.NormalizedProperty>
        hooks: {
            beforeSet?: FxOrmCommon.Arraible<FxOrmHook.HookActionWithCtxCallback<FxOrmInstance.Instance, __AssocHooksCtx>>
            afterSet?: FxOrmCommon.Arraible<FxOrmHook.HookRetOnlyPayloadCallback<FxOrmInstance.Instance, __AssocHooksCtx>>
            beforeRemove?: FxOrmCommon.Arraible<FxOrmHook.HookActionWithCtxCallback<FxOrmInstance.Instance, __AssocHooksCtx>>
            afterRemove?: FxOrmCommon.Arraible<FxOrmHook.HookRetOnlyPayloadCallback<FxOrmInstance.Instance, __AssocHooksCtx>>

            [k: string]: FxOrmCommon.Arraible<
                FxOrmHook.HookActionWithCtxCallback<FxOrmInstance.Instance, __AssocHooksCtx>
                | FxOrmHook.HookRetOnlyPayloadCallback<FxOrmInstance.Instance, __AssocHooksCtx>
            >
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

    export type InstanceAssociatedInstance = FxOrmInstance.Instance;

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

    /**
     * @description information collected from code like:
     * 
     * ```js
     * Host.hasMany(Other, {
     *  mergeTable: 'merge_table',
     *  mergeId: ['host_id'], // optional,
     *  mergeAssocId: ['other_id']
     * })
     * ```
     */
    export interface InstanceAssociationItem_HasMany extends InstanceAssociationItem {
        props: Record<string, FxOrmProperty.NormalizedProperty>
        // hooks: HasManyHooks

        mergeTable: string
        /**
         * @description associated properties linked to Host on merge table
         */
        mergeId: Record<string, FxOrmProperty.NormalizedProperty>
        /**
         * @description associated properties linked to Other on merge table
         */
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

    export interface ModelAssociationMethod__Options {
        // only valid for hasMany assoc :start
        /** @internal */
        join_where?: FxOrmModel.ModelFindByDescriptorItem['join_where']
        extra?: FxOrmModel.ModelOptions__Find['extra']
        extra_info?: {
            table: string
            id: FxOrmModel.Model['id']
            id_prop: string[]
            assoc_prop: string[]
        }
        // only valid for hasMany assoc :start
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
