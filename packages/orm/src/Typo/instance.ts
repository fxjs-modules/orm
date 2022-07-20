import { FxOrmAssociation } from "./assoc"
import { FxOrmDMLDriver } from "./DMLDriver"
import type { FxOrmHook } from "./hook"
import type { FxOrmModel } from "./model"
import type { FxOrmProperty } from "./property"
import { FxOrmValidators } from "./Validators"
import { FxOrmCommon } from "./_common"
import { FxOrmSynchronous } from "./synchronous"

export namespace FxOrmInstance {
    export interface InstanceDataPayload {
        [key: string]: any
    }

    export interface CreateOptions {
        autoFetch?: boolean
        autoFetchLimit?: number
        cascadeRemove?: boolean
        uid?: string
        is_new?: boolean
        isShell?: boolean
        autoSave?: boolean
        extra?: InstanceConstructorOptions['extra']
        extra_info?: InstanceConstructorOptions['extra_info']
    }
    export interface SaveOptions {
        saveAssociations?: boolean
    }

    export type InstanceChangeRecords = string[]

    export interface InstanceConstructorOptions {
        table: string
        keys?: FxOrmModel.ModelConstructorOptions['keys']
        originalKeyValues?: InstanceDataPayload

        data?: InstanceDataPayload
        changes?: InstanceChangeRecords
        extra?: string[] | Record<string, FxOrmProperty.NormalizedProperty>
        extra_info?: {
            table: string
            id: string[]
            id_prop: string[]
            assoc_prop: string[]
        }

        is_new?: boolean
        isShell?: boolean
        autoSave?: FxOrmModel.ModelConstructorOptions['autoSave']
        methods?: FxOrmModel.ModelConstructorOptions['methods']

        /**
         * @description all key properties of the instance, determined by the model
         */
        keyProperties: FxOrmProperty.NormalizedProperty[]
        validations: FxOrmValidators.IValidatorHash
        hooks: FxOrmModel.ModelConstructorOptions['hooks']

        one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[]
        many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[]
        extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[]
        // collection of assoc property's key
        association_properties: string[]

        uid: FxOrmDMLDriver.DriverUidType
        driver: FxOrmDMLDriver.DMLDriver

        setupAssociations: {
            (instance: Instance): void
        }
        fieldToPropertyMap: FxOrmProperty.FieldToPropertyMapType
        events?: {
            [k: string]: FxOrmCommon.GenericCallback<any>
        }
    }

    export interface InnerInstanceOptions extends InstanceConstructorOptions {
        associations?: {
            [key: string]: FxOrmAssociation.InstanceAssociationItemInformation
        }
        extrachanges: InstanceChangeRecords
    }

    export type InstanceConstructor = new (model: FxOrmModel.Model, opts: InstanceConstructorOptions) => FxOrmInstance.Instance

    export type InstanceEventType = 
        'ready' | 'save' | 'beforeRemove' | 'remove'
    export interface Instance extends FxOrmSynchronous.SynchronizedInstance {
        saved(): boolean;
        remove(callback: FxOrmCommon.VoidCallback): Instance;
        validate: {
            (callback: FxOrmCommon.ValidatorCallback): void
        };
        on(event: InstanceEventType | string, callback: FxOrmCommon.GenericCallback<any>): Instance;
        $on: Class_EventEmitter['on']
        $off: Class_EventEmitter['off']
        $emit: Class_EventEmitter['emit']
        
        save(callback?: FxOrmCommon.VoidCallback): Instance;
        save(data: InstanceDataPayload, callback?: FxOrmCommon.VoidCallback): Instance;
        save(data: InstanceDataPayload, options: SaveOptions, callback?: FxOrmCommon.VoidCallback): Instance;
        saved(): boolean;
        remove(callback?: FxOrmCommon.VoidCallback): Instance;

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
        set: (path: string|string[], value: any) => void;
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

        /**
         * @warn only valid in corresponding hook
         */
        readonly $hookRef: {
            // for beforeCreate/afterCreate
            create: {
                instance: Instance,
                useChannel: FxOrmHook.HookChannel
            },
            // for beforeSave/afterSave
            save: {
                instance: Instance,
                useChannel: FxOrmHook.HookChannel
            },
            // for beforeRemove/afterRemove
            remove: {
                instance: Instance,
                useChannel: FxOrmHook.HookChannel
            },
        }

        [extraProperty: string]: any;
    }
}