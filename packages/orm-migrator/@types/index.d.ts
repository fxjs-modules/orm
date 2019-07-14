/// <reference types="@fxjs/db-driver" />
/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />

/// <reference path="flow.d.ts" />
/// <reference path="dsl.d.ts" />

declare namespace FxORMMigratorNS {
    interface UpPayload {
        dsl: FxORMMigratorDSL.DSL
        driver: FxDbDriverNS.Driver
    }

    interface DownPayload {
        dsl: FxORMMigratorDSL.DSL
        driver: FxDbDriverNS.Driver
        error: FxOrmCoreError.ExtendedError
    }

    type MigrationDirection = 'up' | 'down'
    
    interface Migration {
        name: string
        type: 'file' | 'stdin' | 'net'
        uri: string
        
        up: {
            (data: UpPayload): void
        }
        down: {
            (data: DownPayload): void
        }
    }
    
    class Migrator {
        directory: string
        migrations: Migration[]
        tasks: FxORMMigratorFlow.Task[]
        
        constructor (opts?: MigratorOptions)

        migrate: {
            (
                direction: MigrationDirection,
                migrationName: string
            ): void,
        }

        loadFromDirectory (directory: string, opts?: { recursively?: boolean}): Migrator['migrations']
    }

    interface MigratorOptions {
        /**
         * @default CWD
         */
        dir?: string

        connection: FxORMMigratorFlow.RunnerOpts['connection']
    }
    
    type ExportModule = typeof Migrator
}

// interface FxOrmPluginMigratorOptions {
// }
// interface FxOrmPluginMigrator extends FxOrmNS.PluginConstructCallback<
//     FxOrmNS.ORM, FxOrmNS.PluginOptions & FxOrmPluginMigratorOptions
// > {
// }

declare module "@fxjs/orm-migrator" {
    var mod: FxORMMigratorNS.ExportModule
    export = mod;
}
