/// <reference types="@fxjs/sql-ddl-sync" />

declare namespace FxOrmNS {
    type IdType = string | number
    
    interface VoidCallback {
        (err?: FxOrmError.ExtendedError|null): any
    }

    interface ExecutionCallback<T> {
        (err: string|FxOrmError.ExtendedError|null, result?: T): any
    }

    interface GenericCallback<T> {
        (err: FxOrmError.ExtendedError|null, result?: T): any
    }

    interface SuccessCallback<T> {
        (result?: T): any
    }

    interface ValidatorCallback {
        (errors: Error[]): void
    }

    type Nilable<T> = null | T
}