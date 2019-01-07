/// <reference path="DMLDriver.d.ts" />

declare namespace FxOrmInstance {
    interface InstanceDataPayload {
        [key: string]: any
    }

    interface CreateOptions {
        extra?: FxOrmInstance.InstanceDataPayload
        autoFetch?: boolean
        autoFetchLimit?: number
        cascadeRemove?: boolean
        uid?: string
        is_new?: boolean
        isShell?: boolean
        autoSave?: boolean
        extra_info?
    }

    type InstanceChangeRecords = string[]

    interface InstanceConstructorOptions {
        table: string
        keys?: FxOrmModel.ModelConstructorOptions['keys']
        originalKeyValues?: InstanceDataPayload

        data?: InstanceDataPayload
        changes?: InstanceChangeRecords
        extra?: InstanceDataPayload
        extra_info

        is_new?: boolean
        isShell?: boolean
        autoSave?: FxOrmModel.ModelConstructorOptions['autoSave']
        methods?: FxOrmModel.ModelConstructorOptions['methods']

        keyProperties: FxOrmProperty.NormalizedProperty[]
        validations: FxOrmModel.ModelConstructorOptions['validations']
        hooks: FxOrmModel.ModelConstructorOptions['hooks']

        one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[]
        many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[]
        extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[]
        // collection of assoc property's key
        association_properties: string[]

        uid: FxOrmDMLDriver.DriverUidType
        driver: FxOrmDMLDriver.DMLDriver

        setupAssociations: {
            (instance: Instance)
        }
        fieldToPropertyMap: FxOrmProperty.FieldToPropertyMapType
    }

    interface InnerInstanceOptions extends InstanceConstructorOptions {
        associations?: {
            [key: string]: FxOrmAssociation.InstanceAssociationItemInformation
        }
        extrachanges: InstanceChangeRecords
    }

    interface InstanceConstructor {
        (model: FxOrmModel.Model, opts: InstanceConstructorOptions): void
    }

    interface Instance extends FxOrmSynchronous.SynchronizedInstance {
        on(event: string, callback): Instance;
        save(): Instance;
        save(data: { [property: string]: any; }, callback: FxOrmNS.VoidCallback): Instance;
        save(data: { [property: string]: any; }, options: any, callback: FxOrmNS.VoidCallback): Instance;
        saved(): boolean;
        remove(callback: FxOrmNS.VoidCallback): Instance;
        validate: {
            (callback: FxOrmNS.ValidatorCallback)
        };
        on(event: string, callback): Instance;
        save(callback?: FxOrmNS.VoidCallback): Instance;
        save(data: { [property: string]: any; }, callback?: FxOrmNS.VoidCallback): Instance;
        save(data: { [property: string]: any; }, options: any, callback?: FxOrmNS.VoidCallback): Instance;
        saved(): boolean;
        remove(callback?: FxOrmNS.VoidCallback): Instance;

        /**
         * @noenum
         */
        isInstance: boolean;
        /**
         * @noenum
         */
        isPersisted(): boolean;
        /**
         * @noenum
         */
        isShell(): boolean;

        /**
         * @noenum
         */
        set: Function;
        markAsDirty: (propName: string) => void;
        dirtyProperties: {[key: string]: any};

        /**
         * @noenum
         */
        __singleton_uid(): string | number;

        /**
         * @noenum
         */
        __opts?: InnerInstanceOptions;

        /**
         * @noenum
         */
        // model: Model;
        model(): FxOrmModel.Model;

        [extraProperty: string]: any;
    }
}