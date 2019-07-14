/// <reference types="@fibjs/types" />

/// <reference path="error.d.ts" />
/// <reference path="callback.d.ts" />

declare namespace FxOrmCoreNS {
    interface ExposedResult<T = any> {
        error: FxOrmCoreError.ExtendedError,
        result?: T
    }

    interface SyncCallbackInputArags<T = any> {
        callback?: FxOrmCoreCallbackNS.ExecutionCallback<T>,
        is_sync?: boolean
    }
    
    interface ExportModule {

    }
}

declare module "@fxjs/orm-core" {
    var mod: FxOrmCoreNS.ExportModule
    export = mod
}