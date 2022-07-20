/// <reference types="@fibjs/types" />
import { FxOrmAssociation } from "./assoc";
import { FxOrmDMLDriver } from "./DMLDriver";
import type { FxOrmHook } from "./hook";
import type { FxOrmModel } from "./model";
import type { FxOrmProperty } from "./property";
import { FxOrmValidators } from "./Validators";
import { FxOrmCommon } from "./_common";
import { FxOrmSynchronous } from "./synchronous";
export declare namespace FxOrmInstance {
    interface InstanceDataPayload {
        [key: string]: any;
    }
    interface CreateOptions {
        autoFetch?: boolean;
        autoFetchLimit?: number;
        cascadeRemove?: boolean;
        uid?: string;
        is_new?: boolean;
        isShell?: boolean;
        autoSave?: boolean;
        extra?: InstanceConstructorOptions['extra'];
        extra_info?: InstanceConstructorOptions['extra_info'];
    }
    interface SaveOptions {
        saveAssociations?: boolean;
    }
    type InstanceChangeRecords = string[];
    interface InstanceConstructorOptions {
        table: string;
        keys?: FxOrmModel.ModelConstructorOptions['keys'];
        originalKeyValues?: InstanceDataPayload;
        data?: InstanceDataPayload;
        changes?: InstanceChangeRecords;
        extra?: string[] | Record<string, FxOrmProperty.NormalizedProperty>;
        extra_info?: {
            table: string;
            id: string[];
            id_prop: string[];
            assoc_prop: string[];
        };
        is_new?: boolean;
        isShell?: boolean;
        autoSave?: FxOrmModel.ModelConstructorOptions['autoSave'];
        methods?: FxOrmModel.ModelConstructorOptions['methods'];
        /**
         * @description all key properties of the instance, determined by the model
         */
        keyProperties: FxOrmProperty.NormalizedProperty[];
        validations: FxOrmValidators.IValidatorHash;
        hooks: FxOrmModel.ModelConstructorOptions['hooks'];
        one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[];
        many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[];
        extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[];
        association_properties: string[];
        uid: FxOrmDMLDriver.DriverUidType;
        driver: FxOrmDMLDriver.DMLDriver;
        setupAssociations: {
            (instance: Instance): void;
        };
        fieldToPropertyMap: FxOrmProperty.FieldToPropertyMapType;
        events?: {
            [k: string]: FxOrmCommon.GenericCallback<any>;
        };
    }
    interface InnerInstanceOptions extends InstanceConstructorOptions {
        associations?: {
            [key: string]: FxOrmAssociation.InstanceAssociationItemInformation;
        };
        extrachanges: InstanceChangeRecords;
    }
    type InstanceConstructor = new (model: FxOrmModel.Model, opts: InstanceConstructorOptions) => FxOrmInstance.Instance;
    type InstanceEventType = 'ready' | 'save' | 'beforeRemove' | 'remove';
    interface Instance extends FxOrmSynchronous.SynchronizedInstance {
        saved(): boolean;
        remove(callback: FxOrmCommon.VoidCallback): Instance;
        validate: {
            (callback: FxOrmCommon.ValidatorCallback): void;
        };
        on(event: InstanceEventType | string, callback: FxOrmCommon.GenericCallback<any>): Instance;
        $on: Class_EventEmitter['on'];
        $off: Class_EventEmitter['off'];
        $emit: Class_EventEmitter['emit'];
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
        set: (path: string | string[], value: any) => void;
        markAsDirty: (propName: string) => void;
        dirtyProperties: {
            [key: string]: any;
        };
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
        model(): FxOrmModel.Model;
        /**
         * @warn only valid in corresponding hook
         */
        readonly $hookRef: {
            create: {
                instance: Instance;
                useChannel: FxOrmHook.HookChannel;
            };
            save: {
                instance: Instance;
                useChannel: FxOrmHook.HookChannel;
            };
            remove: {
                instance: Instance;
                useChannel: FxOrmHook.HookChannel;
            };
        };
        [extraProperty: string]: any;
    }
}
