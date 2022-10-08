import type { IProperty } from "@fxjs/orm-property";

// type Pop<T extends any[]> = 
//     T extends [...infer R, ...infer S]
//     ? S['length'] extends 1
//         ? S
//         : Pop<R>
//     : never;

// type SynchronousMethod<TThis = Record<string, any>, CBName extends keyof TThis = keyof TThis> = TThis[CBName] extends (...args: infer TArgs) => infer TReturn ? (...args: TArgs) => TReturn : never;

export namespace OrmInstance {
    type Arraible<T> = T | T[]

    interface HookActionNextFunction {
        (this: Instance, err?: Error|null): any
    }
    interface HookActionCallback<TPAYLOAD = any> {
        (this: Instance, next?: HookActionNextFunction): any
        (this: Instance, arg1?: TPAYLOAD, next?: HookActionNextFunction): any
    }
    interface HookResultCallback<TPAYLOAD = any> {
        (this: Instance, success?: boolean): any
        (this: Instance, arg1?: TPAYLOAD, success?: boolean): any
    }

    interface Hooks {
        beforeValidation?: Arraible<HookActionCallback>;
        beforeCreate?: Arraible<HookActionCallback>;
        afterCreate?: Arraible<HookResultCallback>;
        beforeSave?: Arraible<HookActionCallback>;
        afterSave?: Arraible<HookResultCallback>;
        afterLoad?: Arraible<HookActionCallback>;
        afterAutoFetch?: Arraible<HookActionCallback>;
        beforeRemove?: Arraible<HookActionCallback>;
        afterRemove?: Arraible<HookResultCallback>;
    }
    
    interface GenericCallback<T, T_RESULT = any, T_ERR = Error, T_THIS = any> {
        (this: T_THIS, err: T_ERR | null, result?: T): T_RESULT
    }
    interface VoidCallback<T_RESULT = any, T_ERR = Error, T_THIS = any> {
        (this: T_THIS, err?: T_ERR | null): T_RESULT
    }
    
    interface ValidatorCallback {
        (errors: Error[]): void
    }

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
        keys?: string[]
        originalKeyValues?: InstanceDataPayload

        data?: InstanceDataPayload
        changes?: InstanceChangeRecords
        extra?: string[] | Record<string, IProperty>
        extra_info?: {
            table: string
            id: string[]
            id_prop: string[]
            assoc_prop: string[]
        }

        is_new?: boolean
        isShell?: boolean
        autoSave?: boolean
        methods?: Record<string, Function>

        /**
         * @description all key properties of the instance, determined by the model
         */
        keyProperties: IProperty[]
        // hooks: FxOrmModel.ModelConstructorOptions['hooks']

        // one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[]
        // many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[]
        // extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[]
        // collection of assoc property's key
        association_properties: string[]

        uid: string
        // dbdriver: FxOrmDMLDriver.DMLDriver

        setupAssociations: {
            (instance: Instance): void
        }
        // fieldToPropertyMap: FxOrmProperty.FieldToPropertyMapType
        events?: {
            [k: string]: GenericCallback<any>
        }
    }

    export type EventType = 
        'ready' | 'save' | 'beforeRemove' | 'remove';

    export interface Instance {
        saved(): boolean;
        remove(callback: VoidCallback): Instance;
        validate(callback: ValidatorCallback): void;
        on(event: EventType, callback: GenericCallback<any>): Instance;
        $on: Class_EventEmitter['on']
        $off: Class_EventEmitter['off']
        $emit: Class_EventEmitter['emit']
        
        save(callback?: VoidCallback): Instance;
        save(data: InstanceDataPayload, callback?: VoidCallback): Instance;
        save(data: InstanceDataPayload, options: SaveOptions, callback?: VoidCallback): Instance;
        saved(): boolean;
        remove(callback?: VoidCallback): Instance;

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
    }
}