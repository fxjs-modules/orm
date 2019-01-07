/// <reference path="model.d.ts" />

declare namespace FxOrmAssociation {
    type AssociationKeyComputation = Function | string
    interface AssociationDefinitionOptions {
        name?: string;
        model?: FxOrmModel.Model;
        // field?: FxOrmModel.ModelPropertyDefinitionHash
        field?: FxOrmProperty.NormalizedFieldOptionsHash

        // is the association is extendsTo
        extension?: boolean;
        required?: boolean;
        reversed?: boolean;
        accessor?: string;
        reverseAccessor?: string;
        autoFetch?: boolean;
        autoFetchLimit?: number;
    }

    interface AssociationDefinitionOptions_ExtendsTo extends AssociationDefinitionOptions {
        table?: string;
        
        getAccessor?: string;
        setAccessor?: string;
        hasAccessor?: string;
        delAccessor?: string;
        addAccessor?: string;
    }
    interface AssociationDefinitionOptions_HasOne extends AssociationDefinitionOptions {
        reverse?: string;
    }
    interface AssociationDefinitionOptions_HasMany extends AssociationDefinitionOptions {
        reverse?: string;
        // is association property a primary key
        key?: boolean
        mergeId?: FxOrmProperty.NormalizedFieldOptionsHash
        mergeAssocId?: FxOrmProperty.NormalizedFieldOptionsHash
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
        field: string | FxOrmProperty.NormalizedFieldOptionsHash
        
        extension?: boolean

        mergeId?: FxOrmProperty.NormalizedFieldOptionsHash
        mergeAssocId?: FxOrmProperty.NormalizedFieldOptionsHash
        mergeTable?: string

        getAccessor: string
        setAccessor: string
        hasAccessor: string
        delAccessor: string
        addAccessor?: string

        // model: FxOrmModel.Model
        reversed?: boolean
        autoFetch: boolean
        autoFetchLimit: number
        
        mapsTo?: FxOrmModel.ModelPropertyDefinition['mapsTo']
    }

    interface InstanceAssociatedInstance extends FxOrmInstance.Instance {
    }

    interface InstanceAssociationItem_ExtendTos extends InstanceAssociationItem {
        table: string;
    }

    interface InstanceAssociationItem_HasOne extends InstanceAssociationItem {
        reverse?: string;
        // template name
        accessor?: string;
        reverseAccessor?: string;

        addAccessor?: string;

        required?: boolean;
        extension?: boolean;
    }

    interface InstanceAssociationItem_HasMany extends InstanceAssociationItem {
        props: FxOrmProperty.NormalizedPropertyHash
        hooks: HasManyHooks

        mergeTable: string
        mergeId: FxOrmProperty.NormalizedFieldOptionsHash
        mergeAssocId: FxOrmProperty.NormalizedFieldOptionsHash

        getAccessor: string
        setAccessor: string
        hasAccessor: string
        delAccessor: string
        addAccessor: string
    }

    interface InstanceAssociationItemInformation {
        changed: boolean
        value?: InstanceAssociatedInstance
        data?: InstanceAssociationItem
    }

    interface ModelAssociationMethod__ComputationPayload__Merge {
        from: { table: string, field: string | string[] }
        to: { table: string, field: string | string[] }
        where: [string, FxOrmModel.ModelQueryConditions__Find]
        table?: string
    }

    interface ModelAssociationMethod__Options {
    }

    interface ModelAssociationMethod__FindOptions extends FxOrmModel.ModelOptions__Find, ModelAssociationMethod__Options {
    }

    interface ModelAssociationMethod__GetOptions extends FxOrmModel.ModelOptions__Find, ModelAssociationMethod__Options {
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
