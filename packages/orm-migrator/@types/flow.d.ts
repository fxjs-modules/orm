/// <reference types="@fibjs/types" />
/// <reference types="@fxjs/sql-ddl-sync" />
/// <reference types="@fxjs/sql-query" />

/// <reference path="dsl.d.ts" />

declare namespace FxORMMigratorFlow {    
    interface Task {
        migration: string
        finished: boolean
    }

    interface RunnerOpts {
        connection: string
        migrator_connection?: string
        /**
         * @default (string) "db_migration"
         */
        migration_table_name?: string
    }
    
    class Flow {
        dsl: FxORMMigratorDSL.DSL

        readonly migrator_table: string
        readonly migrator_dsl: FxORMMigratorDSL.DSL

        constructor (opts: RunnerOpts)

        lastTask (): Task | null

        allTasks (): Task[]

        saveTask (t: Task): void

        deleteTask (t: Task): void
    }
}