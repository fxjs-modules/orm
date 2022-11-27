/// <reference types="@fibjs/types" />
import type { FxOrmAssociation } from "./assoc";
import type { FxOrmDMLDriver } from "./DMLDriver";
import type { FxOrmHook } from "./hook";
import type { FxOrmModel } from "./model";
import type { FxOrmProperty } from "./property";
import type { FxOrmValidators } from "./Validators";
import type { FxOrmCommon } from "./_common";
import type { FxOrmError } from "./Error";
export declare namespace FxOrmInstance {
    export interface InstanceDataPayload {
        [key: string]: any;
    }
    export interface CreateOptions {
        autoFetch?: boolean;
        autoFetchLimit?: number;
        cascadeRemove?: boolean;
        uid?: string;
        isNew?: boolean;
        isShell?: boolean;
        autoSave?: boolean;
        extra?: InstanceConstructorOptions['extra'];
        extra_info?: InstanceConstructorOptions['extra_info'];
    }
    export interface SaveOptions {
        saveAssociations?: boolean;
    }
    export interface InstanceConstructorOptions {
        table: string;
        keys?: FxOrmModel.ModelConstructorOptions['keys'];
        originalKeyValues?: InstanceDataPayload;
        data?: InstanceDataPayload;
        /**
         * @description changes records
         */
        changes?: string[];
        extra?: string[] | Record<string, FxOrmProperty.NormalizedProperty>;
        extra_info?: {
            table: string;
            id: string[];
            id_prop: string[];
            assoc_prop: string[];
        };
        isNew?: boolean;
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
        /**
         * @internal
         */
        __setupAssociations: (instance: Instance) => void;
        fieldToPropertyMap: FxOrmProperty.FieldToPropertyMapType;
        /**
         * @internal
         */
        events?: {
            [k: string]: FxOrmCommon.GenericCallback<any>;
        };
    }
    export interface InnerInstanceRuntimeData extends InstanceConstructorOptions {
        associations?: {
            [key: string]: FxOrmAssociation.InstanceAssociationItemInformation;
        };
        extrachanges: string[];
        /** @internal */
        __validationData: Record<string, FxOrmError.ExtendedError[]>;
    }
    type __AddThisToMethods<TMethods extends Record<string, (...args: any) => any>> = TMethods extends void ? {} : {
        [P in keyof TMethods]: (...args: Parameters<TMethods[P]>) => ReturnType<TMethods[P]>;
    };
    export type InstanceConstructor = new (model: FxOrmModel.Model, opts: InstanceConstructorOptions) => FxOrmInstance.Instance;
    export type InstanceEventType = 'ready' | 'save' | 'beforeRemove' | 'remove';
    export type Instance<TProperties extends Record<string, FieldRuntimeType> = Record<string, FieldRuntimeType>, Methods extends Record<string, (...args: any) => any> = any> = {
        on(event: InstanceEventType | string, callback: FxOrmCommon.GenericCallback<any>): Instance;
        $on: Class_EventEmitter['on'];
        $off: Class_EventEmitter['off'];
        $emit: Class_EventEmitter['emit'];
        validate(callback: FxOrmCommon.ValidatorCallback): void;
        validateSync(): false | FxOrmError.ExtendedError[];
        save(callback?: FxOrmCommon.VoidCallback): Instance;
        save(data: InstanceDataPayload, callback?: FxOrmCommon.VoidCallback): Instance;
        save(data: InstanceDataPayload, options: SaveOptions, callback?: FxOrmCommon.VoidCallback): Instance;
        saveSync(data?: FxOrmInstance.InstanceDataPayload, options?: FxOrmInstance.SaveOptions): FxOrmInstance.Instance;
        saved(): boolean;
        remove(callback?: FxOrmCommon.VoidCallback): Instance;
        removeSync(): void;
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
         * @internal
         * @noenum
         */
        __singleton_uid(): string | number;
        /**
         * @internal
         * @noenum
         */
        __instRtd?: InnerInstanceRuntimeData;
        /**
         * @noenum
         */
        model(): FxOrmModel.Model;
        /**
         * @internal
         *
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
    } & TProperties & __AddThisToMethods<Methods> & {
        [key: string]: any;
    };
    export type FieldRuntimeType = number | string | boolean | Date | object;
    export {};
}
