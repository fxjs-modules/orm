/// <reference types="@fxjs/sql-ddl-sync" />
/// <reference path="Error.d.ts" />

declare namespace FxOrmNS {
    type IdType = string | number
    type Arraible<T> = T | T[]
    
    interface VoidCallback<T_RESULT = any, T_THIS = any> {
        (this: T_THIS, err?: FxOrmError.ExtendedError | null): T_RESULT
    }

    interface ExecutionCallback<T, T_RESULT = any, T_THIS = any> {
        (this: T_THIS, err?: string | FxOrmError.ExtendedError | FxOrmError.ExtendedError[] | null, result?: T): T_RESULT
    }

    interface GenericCallback<T, T_RESULT = any, T_THIS = any> {
        (this: T_THIS, err: FxOrmError.ExtendedError | null, result?: T): T_RESULT
    }

    interface NextCallback<ERR_T = string, T_RESULT = any, T_THIS = any> {
        (this: T_THIS, err?: ERR_T): T_RESULT
    }

    interface SuccessCallback<T> {
        (result?: T): any
    }

    interface ValidatorCallback {
        (errors: Error[]): void
    }

    type Nilable<T> = null | T

    interface ExposedResult<T = any> {
        error: FxOrmError.ExtendedError,
        result?: T
    }

    interface SyncCallbackInputArags<T = any> {
        callback?: FxOrmNS.ExecutionCallback<T>,
        is_sync?: boolean
    }

    interface ValueWaitor<T = any> {
        evt?: Class_Event,
        value: T
    }

}

declare namespace FxOrmTypeHelpers {
    type Parameters<T> = T extends (...args: infer T) => any ? T : never; 
    type FirstParameter<T> = T extends (arg: infer T, ...args: any[]) => any ? T : never; 
    type SecondParameter<T> = T extends (arg1: any, arg: infer T, ...args: any[]) => any ? T : never; 
    type _3rdParameter<T> = T extends (arg1: any, arg2: any, arg: infer T, ...args: any[]) => any ? T : never; 

    type ReturnType<T> = T extends (...args: any[]) => infer T ? T : never; 

    type InstanceOf<T> = T extends new (...args: any[]) => infer T ? T : never;

    type ConstructorParams<T> = T extends {
        new (...args: infer U): any
    } ? U : never
}