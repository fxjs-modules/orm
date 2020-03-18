const fs = require("fs");
const path = require("path");
const assert = require("assert");
const mkdirp = require('@fibjs/mkdirp');
const FxORMCore = require("@fxjs/orm-core");
const flow_1 = require("./mods/flow");
function prependIfNotAbsPath(fileordirname = '', prefix = '') {
    if (path.isAbsolute(fileordirname))
        return fileordirname;
    return path.join(prefix, fileordirname);
}
function ensureDirnameValid(directory, fallback) {
    try {
        const stats = fs.stat(directory);
        if (stats.isFile())
            directory = path.dirname(directory);
        else if (!stats.isDirectory())
            directory = fallback;
    }
    catch (error) {
        directory = fallback;
    }
    return directory;
}
function ensureDirnameExisted(directory) {
    if (directory !== ensureDirnameValid(directory, process.cwd()))
        throw new Error('valid directory requried!');
    FxORMCore.Utils.exposeErrAndResultFromSyncMethod(() => mkdirp(directory, { mode: 0o774 }));
}
const CWD = process.cwd();
module.exports = class Migrator {
    constructor(opts) {
        this.migrations = [];
        this.tasks = [];
        let { dir = CWD, connection = '' } = opts || {};
        assert.ok(!!connection, '[Migrator] connection is required');
        dir = ensureDirnameValid(prependIfNotAbsPath(dir, CWD), CWD);
        ensureDirnameExisted(dir);
        this.setDirectory(dir);
        this.loadFromDirectory();
        this.runner = new flow_1.default({
            connection,
            migrator_connection: `sqlite:${path.join(dir, './migration.db')}`
        });
    }
    setDirectory(dir) {
        Object.defineProperty(this, 'directory', { value: dir, writable: false });
    }
    loadFromDirectory(directory = './', opts) {
        directory = ensureDirnameValid(prependIfNotAbsPath(directory || './', this.directory), CWD);
        const files = fs.readdir(directory);
        const migrations = [];
        files
            .filter(file => file.match(/^(.*)\.migrate\.js$/))
            .forEach((file) => {
            if (!file)
                return;
            const basedir = prependIfNotAbsPath(directory, CWD);
            const uri = path.join(basedir, file);
            const mod = require(uri);
            const basename = path.basename(file, '.migrate.js');
            if (typeof mod.up === 'function' || typeof mod.down === 'function') {
                const mig = {
                    name: basename,
                    type: 'file',
                    uri: uri,
                    up: mod.up,
                    down: mod.down
                };
                migrations.push(mig);
            }
        });
        return this.migrations = migrations;
    }
    ;
    migrate(direction, migrationName
    // migrations: FxORMMigratorFlow.Migration | FxORMMigratorFlow.Migration[]
    ) {
        const tasks = this.runner.allTasks();
        const migrations = this.loadFromDirectory();
        const migration = migrations.find(mig => mig.name === migrationName);
        if (!migration)
            throw new Error(`invalid migrationName ${migrationName} for base directory ${this.directory}`);
        const exposedErrResult = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(() => {
            migration[direction].call({ dsl: this.runner.dsl });
        });
        // TODO: record failure
        if (exposedErrResult.error) {
            throw exposedErrResult.error;
        }
        switch (direction) {
            case 'up':
                this.runner.saveTask({ migration: migration.name, finished: false });
            case 'down':
                this.runner.deleteTask({ migration: migration.name, finished: false });
        }
    }
};
