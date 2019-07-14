import fs = require('fs')
import path = require('path')
import assert = require('assert')

const mkdirp = require('@fibjs/mkdirp')

import FxORMCore = require('@fxjs/orm-core')
import Flow from './mods/flow'

function prependIfNotAbsPath (fileordirname: string = '', prefix: string = '') {
  if (path.isAbsolute(fileordirname))
    return fileordirname

  return path.join(prefix, fileordirname)
}

function ensureDirnameValid (directory: string, fallback: string) {
    try {
        const stats = fs.stat(directory)
        if (stats.isFile())
            directory = path.dirname(directory)
        else if (!stats.isDirectory())
            directory = fallback;
    } catch (error) {
        directory = fallback;
    }
    
    return directory
}

function ensureDirnameExisted (directory: string) {
    if (directory !== ensureDirnameValid(directory, process.cwd()))
        throw new Error('valid directory requried!')

    FxORMCore.Utils.exposeErrAndResultFromSyncMethod(
        () => mkdirp(directory, {mode: 0o774})
    )
}

const CWD = process.cwd()

export = class Migrator implements FxORMMigratorNS.Migrator {
    directory: FxORMMigratorNS.Migrator['directory']
    
    migrations: FxORMMigratorNS.Migrator['migrations'] = []
    tasks: FxORMMigratorNS.Migrator['tasks'] = []

    // private runner: FxORMMigratorFlow.Flow
    private runner:Flow

    constructor (opts?: FxORMMigratorNS.MigratorOptions) {
        let { dir = CWD, connection = '' } = opts || {}
        assert.ok(!!connection, '[Migrator] connection is required');

        dir = ensureDirnameValid(
            prependIfNotAbsPath(dir, CWD),
            CWD
        );
        ensureDirnameExisted(dir);
        this.setDirectory(dir)

        this.loadFromDirectory();

        this.runner = new Flow({
            connection,
            migrator_connection: `sqlite:${path.join(dir, './migration.db')}`
        });
    }

    setDirectory (dir: string) {
        Object.defineProperty(this, 'directory', { value: dir, writable: false })
    }
    
    loadFromDirectory(
        directory: string = './',
        opts?: {
            recursively?: boolean
        }
    ): FxORMMigratorNS.Migrator['migrations'] {
        directory = ensureDirnameValid(
            prependIfNotAbsPath(directory || './', this.directory),
            CWD
        );

        const files: string[] = fs.readdir(directory)
        const migrations: FxORMMigratorNS.Migrator['migrations'] = []

        files
            .filter(file => file.match(/^(.*)\.migrate\.js$/))
            .forEach((file) => {
                if (!file)
                    return ;

                const basedir = prependIfNotAbsPath(directory, CWD);
                const uri = path.join(basedir, file);
                const mod = require(uri);
                const basename = path.basename(file, '.migrate.js')

                if (typeof mod.up === 'function' || typeof mod.down === 'function') {
                    const mig: FxORMMigratorNS.Migration = {
                        name: basename,
                        type: 'file' as FxORMMigratorNS.Migration['type'],
                        uri: uri,
                        up: mod.up,
                        down: mod.down
                    }

                    migrations.push(mig)
                }
            });

        return this.migrations = migrations
    };

    migrate (
        direction: FxORMMigratorNS.MigrationDirection,
        migrationName?: string
        // migrations: FxORMMigratorFlow.Migration | FxORMMigratorFlow.Migration[]
    ): void {
        const tasks = this.runner.allTasks()

        const migrations = this.loadFromDirectory()
        const migration = migrations.find(mig => mig.name === migrationName)

        if (!migration)
            throw new Error(`invalid migrationName ${migrationName} for base directory ${this.directory}`)

        const exposedErrResult = FxORMCore.Utils.exposeErrAndResultFromSyncMethod(() => {
            migration[direction].call({ dsl: this.runner.dsl })
        });

        // TODO: record failure
        if (exposedErrResult.error) {
            throw exposedErrResult.error
        }

        switch (direction) {
            case 'up':
                this.runner.saveTask({ migration: migration.name, finished: false })
            case 'down':
                this.runner.deleteTask({ migration: migration.name, finished: false })
        }
    }
}