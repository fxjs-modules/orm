Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const FxOrmCore = require("@fxjs/orm-core");
const dsl_1 = require("./dsl");
const DEFAULT_MIGRATION_TABLE = 'db_migration';
function ensureMigrationsTable(runner) {
    if (!runner.migrator_dsl.hasTable(runner.migrator_table))
        runner.migrator_dsl.createTable(runner.migrator_table, { migration: { type: "text", required: true } });
    FxOrmCore.Utils.exposeErrAndResultFromSyncMethod(() => runner.migrator_dsl.addIndex('unique_orm_migrations', { table: 'orm_migrations', columns: ['migration'], unique: true }));
    /* do migration :start */
    /* do migration :end */
}
function finishOneMigration(runner, m) {
    // var query = 'DELETE FROM orm_migrations WHERE orm_migrations.migration = ? AND orm_migrations.created_at = ?';
    const query = 'UPDATE SET status = ?? FROM orm_migrations WHERE orm_migrations.migration = ? AND orm_migrations.created_at = ?';
    const params = ['finished', m.migration, m.created_at];
    runner.migrator_dsl.execQuery(query, params);
}
class Flow {
    constructor(opts) {
        assert.ok(opts.connection && typeof opts.connection === 'string', 'connection is required!');
        this.dsl = new dsl_1.default(opts.connection);
        Object.defineProperty(this, 'migrator_table', {
            value: opts.migration_table_name || DEFAULT_MIGRATION_TABLE,
            configurable: false,
            writable: false
        });
        const migrator_connection = opts.migrator_connection && typeof opts.migrator_connection === 'string' ? opts.migrator_connection : this.dsl.driver.uri;
        Object.defineProperty(this, 'migrator_dsl', {
            value: new dsl_1.default(migrator_connection),
            configurable: false,
            writable: false
        });
        ensureMigrationsTable(this);
    }
    lastTask() {
        const tasks = this.dsl.execQuery(`SELECT migration FROM ?? ORDER BY migration DESC LIMIT 1;`, [this.migrator_table]);
        return tasks.length ? tasks[0] : null;
    }
    allTasks() {
        const tasks = this.dsl.execQuery(`SELECT migration FROM ?? ORDER BY migration DESC;`, [this.migrator_table]);
        return tasks;
    }
    saveTask(t) {
        this.dsl.execQuery(`INSERT INTO ??(migration) VALUES(?);`, [this.migrator_table]);
    }
    deleteTask(t) {
        this.dsl.execQuery(`DELETE FROM ?? WHERE migration LIKE ?;`, [this.migrator_table]);
    }
}
exports.default = Flow;
