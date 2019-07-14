import assert = require('assert');
import FxOrmCore = require('@fxjs/orm-core')
import DSL from './dsl'

const DEFAULT_MIGRATION_TABLE = 'db_migration'

function ensureMigrationsTable (runner: Flow) {
    if (!runner.migrator_dsl.hasTable(runner.migrator_table))
        runner.migrator_dsl.createTable(runner.migrator_table, { migration : { type : "text", required: true } });
    
    FxOrmCore.Utils.exposeErrAndResultFromSyncMethod(
        () => runner.migrator_dsl.addIndex('unique_orm_migrations', { table: 'orm_migrations', columns: ['migration'] , unique: true })
    )

    /* do migration :start */
    /* do migration :end */
}

function finishOneMigration (runner: Flow, m: any) {
    // var query = 'DELETE FROM orm_migrations WHERE orm_migrations.migration = ? AND orm_migrations.created_at = ?';
    const query = 'UPDATE SET status = ?? FROM orm_migrations WHERE orm_migrations.migration = ? AND orm_migrations.created_at = ?';
    const params = ['finished', m.migration, m.created_at];
    runner.migrator_dsl.execQuery(query, params);
}

export default class Flow implements FxORMMigratorFlow.Flow {    
    dsl: FxORMMigratorFlow.Flow['dsl'];

    readonly migrator_table: string;
    readonly migrator_dsl: FxORMMigratorFlow.Flow['dsl'];

    [ext_k: string]: any

    constructor (opts: FxORMMigratorFlow.RunnerOpts) {
        assert.ok(opts.connection && typeof opts.connection === 'string', 'connection is required!')

        this.dsl = new DSL(opts.connection)

        Object.defineProperty(this, 'migrator_table', {
            value: opts.migration_table_name || DEFAULT_MIGRATION_TABLE,
            configurable: false,
            writable: false
        })

        const migrator_connection = opts.migrator_connection && typeof opts.migrator_connection === 'string' ? opts.migrator_connection : this.dsl.driver.uri

        Object.defineProperty(this, 'migrator_dsl', {
            value: new DSL(migrator_connection),
            configurable: false,
            writable: false
        })

        ensureMigrationsTable(this)
    }

    lastTask (): FxORMMigratorFlow.Task | null {
        const tasks = this.dsl.execQuery<FxORMMigratorFlow.Task[]>(
            `SELECT migration FROM ?? ORDER BY migration DESC LIMIT 1;`, [this.migrator_table]
        )

        return tasks.length ? tasks[0] : null
    }

    allTasks (): FxORMMigratorFlow.Task[] {
        const tasks = this.dsl.execQuery<FxORMMigratorFlow.Task[]>(
            `SELECT migration FROM ?? ORDER BY migration DESC;`, [this.migrator_table]
        )

        return tasks
    }

    saveTask (t: FxORMMigratorFlow.Task): void {
        this.dsl.execQuery<void>(
            `INSERT INTO ??(migration) VALUES(?);`, [this.migrator_table]
        )
    }

    deleteTask (t: FxORMMigratorFlow.Task): void {
        this.dsl.execQuery<void>(
            `DELETE FROM ?? WHERE migration LIKE ?;`, [this.migrator_table]
        )
    }
}