/// <reference path="model.d.ts" />

declare namespace FxOrmAssociation {
    type AssociationType = 'extendsTo' | 'hasOne' | 'hasMany'

    type AssociationKeyComputation = Function | string
    interface AssociationDefinitionOptions {
        /**
         * it's also accessor base for `extendsTo`, `hasOne`, `hasMany`,
         * 
         * @notice fallback from `acessor` for `hasOne`, `hasMany`
         */
        name?: string;
        model?: FxOrmModel.Model;
        field?: FxOrmProperty.NormalizedPropertyHash

        // is the association is extendsTo
        extension?: boolean;
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
    }

    interface AssociationDefinitionOptions_ExtendsTo extends AssociationDefinitionOptions {
        table?: string;
    }
    interface AssociationDefinitionOptions_HasOne extends AssociationDefinitionOptions {
        reverse?: string;
    }
    interface AssociationDefinitionOptions_HasMany extends AssociationDefinitionOptions {
        reverse?: string;
        // is association property a primary key
        key?: boolean
        mergeId?: string | FxOrmModel.DetailedPropertyDefinitionHash
        mergeAssocId?: string | FxOrmModel.DetailedPropertyDefinitionHash
        reverseAssociation?: string

        hooks?: HasManyHooks
        mergeTable?: string

        association?: string

        getAccessor?: string;
        setAccessor?: string;
        hasAccessor?: string;
        delAccessor?: string;
        addAccessor?: string;
    }

    interface InstanceAssociationItem {
        name: string
        model: FxOrmModel.Model
        // is the association is extendsTo
        field: string | string[] | FxOrmProperty.NormalizedPropertyHash
        
        extension?: boolean

        mergeId?: FxOrmProperty.NormalizedPropertyHash
        mergeAssocId?: FxOrmProperty.NormalizedPropertyHash
        mergeTable?: string

        getAccessor: string
        setAccessor: string
        hasAccessor: string
        delAccessor: string

        addAccessor?: string
        modelFindByAccessor?: string

        // model: FxOrmModel.Model
        reversed?: boolean
        autoFetch: boolean
        autoFetchLimit: number
        
        mapsTo?: FxOrmModel.ModelPropertyDefinition['mapsTo']

        // *Accessor functions
        [k: string]: any
    }

    interface InstanceAssociatedInstance extends FxOrmInstance.Instance {
    }

    interface InstanceAssociationItem_ExtendTos extends InstanceAssociationItem {
        table: string;
        modelFindByAccessor: string
    }

    interface InstanceAssociationItem_HasOne extends InstanceAssociationItem {
        field: string | FxOrmProperty.NormalizedPropertyHash
        
        reverse?: string;
        // template name
        accessor?: string;
        reverseAccessor?: string;

        addAccessor?: string;

        modelFindByAccessor: string

        required?: boolean;
        extension?: boolean;
    }

    interface InstanceAssociationItem_HasMany extends InstanceAssociationItem {
        props: FxOrmProperty.NormalizedPropertyHash
        hooks: HasManyHooks

        mergeTable: string
        mergeId: FxOrmProperty.NormalizedPropertyHash
        mergeAssocId: FxOrmProperty.NormalizedPropertyHash

        getAccessor: string
        setAccessor: string
        hasAccessor: string
        delAccessor: string
        addAccessor: string

        modelFindByAccessor?: string
    }

    interface InstanceAssociationItemInformation {
        changed: boolean
        value?: InstanceAssociatedInstance
        data?: InstanceAssociationItem
    }

    type ModelAssociationMethod__ComputationPayload__Merge = FxOrmQuery.ChainFindMergeInfo

    interface ModelAssociationMethod__Options {
    }

    interface ModelAssociationMethod__FindOptions extends FxOrmModel.ModelOptions__Find, ModelAssociationMethod__Options {
    }

    interface ModelAssociationMethod__GetOptions extends FxOrmModel.ModelOptions__Find, ModelAssociationMethod__Options {
    }

    interface ModelAssociationMethod__FindByOptions extends FxOrmModel.ModelOptions__Findby, ModelAssociationMethod__Options {
    }

    interface HasManyHooks {
        beforeSave?: {
            (next?: Function): void;
            (extra: any, next?: Function): void;
        }
    }

    interface AccessorOptions_has {

    }

    type AccessorOptions_get = FxOrmNS.IdType | FxOrmModel.ModelQueryConditions__Find

    interface AutoFetchInstanceOptions {
        autoFetch?: boolean
        autoFetchLimit?: number
    }
}
