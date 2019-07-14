#!/usr/bin/env fibjs

var test = require("test");
test.setup();

const Migrator = require('../..');

const path = require("path");

const CWD = process.cwd()
const root = path.resolve(__dirname, '../../')

describe('Migrator', () => {
    var migrator = null

    function getColumnDefinition (col_name) {
        switch (col_name) {
            case 'user:name':
                return {
                    type: 'text',

                    mapsTo: 'name',

                    unique: false,
                    index: undefined,

                    /* extra option :start */
                    serial: false,
                    unsigned: false,
                    primary: false,
                    required: true,
                    defaultValue: undefined,
                    size: 24,
                    rational: false,
                    time: false,
                    big: false,
                    values: undefined,
                }
            case 'user:gender':
                return {
                    type: 'enum',

                    mapsTo: 'gender',

                    unique: false,
                    index: undefined,

                    /* extra option :start */
                    serial: false,
                    unsigned: false,
                    primary: false,
                    required: false,
                    defaultValue: 'female',
                    size: undefined,
                    rational: false,
                    time: false,
                    big: false,
                    values: ['female', 'male'],
                }
        }
    }

    before(() => {
        migrator = new Migrator({
            connection: 'sqlite:tmp/test-migrator.db'
        })

        assert.equal(migrator.directory, CWD)
        migrator.setDirectory(root)
    });

    it("member properties/methods", () => {
        assert.isString(migrator.directory)
        assert.isArray(migrator.migrations)

        assert.isFunction(migrator.loadFromDirectory)
        assert.isFunction(migrator.migrate)
    });

    it("#directory", () => {
        assert.equal(migrator.directory, root)
    });

    describe("#loadFromDirectory", () => {
        it("basic", () => {
            const migrations = migrator.loadFromDirectory('./test/__tasks__/simple')
            const migration = migrations.find(mig => mig.name === 'basic')

            assert.exist(migration)
            assert.ok(migration.name === 'basic')
            assert.ok(migration.type === 'file')

            assert.isFunction(migration.up)
            assert.isFunction(migration.down)
        });

        it("no up", () => {
            const migrations = migrator.loadFromDirectory('./test/__tasks__/simple')
            const migration = migrations.find(mig => mig.name === 'no_up')

            assert.exist(migration)
            assert.ok(migration.name === 'no_up')
            assert.ok(migration.type === 'file')

            assert.notExist(migration.up)
            assert.isFunction(migration.down)
        });

        it("no down", () => {
            const migrations = migrator.loadFromDirectory('./test/__tasks__/simple')
            const migration = migrations.find(mig => mig.name === 'no_down')

            assert.exist(migration)
            assert.ok(migration.name === 'no_down')
            assert.ok(migration.type === 'file')

            assert.isFunction(migration.up)
            assert.notExist(migration.down)
        });

        it("pointless", () => {
            const migrations = migrator.loadFromDirectory('./test/__tasks__/simple')
            const migration = migrations.find(mig => mig.name === 'pointless')

            assert.notExist(migration)
        });
    });

    it("#migrate", () => {
        // assert.equal(migrator.migrate, CWD)
    });
})

if (require.main === module)
    test.run(console.DEBUG);
