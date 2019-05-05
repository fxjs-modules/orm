/// <reference types="fibjs" />

/// <reference path="_common.d.ts" />
/// <reference path="SQL.d.ts" />
/// <reference path="Collection.d.ts" />
/// <reference path="DbIndex.d.ts" />
/// <reference path="Driver.d.ts" />
/// <reference path="Column.d.ts" />
/// <reference path="Query.d.ts" />
/// <reference path="Dialect.d.ts" />

declare namespace FxOrmSqlDDLSync {
    interface SyncOptions<DRIVER_QUERY_TYPE extends FxOrmSqlDDLSync__Query.BasicDriverQueryObject = any> {
        driver: FxOrmSqlDDLSync__Driver.Driver<DRIVER_QUERY_TYPE>
        debug?: Function | false
        suppressColumnDrop?: boolean
    }
    interface SyncConstructor {
        (options: SyncOptions): void
        prototype: Sync
    }
    interface SyncResult {
        changes: number
    }
    interface Sync {
        defineCollection: {
            (collection_name: string, properties: FxOrmSqlDDLSync__Collection.Collection['properties']): Sync
        }
        defineType: {
            (type: string, proto: FxOrmSqlDDLSync__Driver.CustomPropertyType): Sync
        }
        sync: {
            (cb?: FxOrmSqlDDLSync.ExecutionCallback<SyncResult>): void
        }
        forceSync: Sync['sync']

        [ext: string]: any
    }
    // compatible
    type SyncInstance = Sync

    interface ExportModule {
        dialect(name: FxOrmSqlDDLSync__Dialect.DialectType): FxOrmSqlDDLSync__Dialect.Dialect
        Sync: {
            new (options: SyncOptions): Sync
            (options: SyncOptions): Sync
        }
    }
}

declare module "@fxjs/sql-ddl-sync" {
    const mod: FxOrmSqlDDLSync.ExportModule
    export = mod
}