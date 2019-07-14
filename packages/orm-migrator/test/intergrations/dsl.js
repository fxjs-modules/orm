#!/usr/bin/env fibjs

var test = require("test");
test.setup();

const DSL = require('../../lib/mods/dsl').default;

describe('DSL', () => {
    let orm = null
    var dsl = null

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
        dsl = new DSL('sqlite:tmp/test-app.db')
    });

    after(() => {
    });
    
    describe('createTable/dropTable', () => {
        before(() => {
            assert.equal(dsl.hasTable('user'), false)
        })

        it('user table', () => {
            dsl.createTable('user', {name: getColumnDefinition('user:name')})

            assert.equal(dsl.hasTable('user'), true)
            assert.equal(dsl.hasColumn('user', 'name'), true)

            assert.deepEqual(
                dsl.getColumns('user').name,
                {
                    "required": true,
                    "defaultValue": null,
                    "type": "text"
                }
            )

            dsl.dropTable('user')

            assert.equal(dsl.hasTable('user'), false)
        })
    })

    describe('addColumn/hasColumn/dropColumn/renameColumn', () => {
        before(() => {
            if (dsl.hasTable('user')) dsl.dropTable('user')
            assert.equal(dsl.hasTable('user'), false)

            dsl.createTable('user', {name: getColumnDefinition('user:name')})

            assert.equal(dsl.hasTable('user'), true)
        })

        after(() => {
            if (dsl.hasTable('user')) dsl.dropTable('user')
            assert.equal(dsl.hasTable('user'), false)
        })

        it('addColumn', () => {
            dsl.addColumn('user', 'gender', getColumnDefinition('user:gender'))
            assert.equal(dsl.hasColumn('user', 'gender'), true)

            assert.deepEqual(
                dsl.getColumns('user').gender,
                {
                    // "required": false,
                    "defaultValue": 'female',
                    "type": "integer"
                }
            )
        })

        it('dropColumn', () => {
            if (!dsl.hasColumn('user', 'gender'))
                dsl.addColumn('user', 'gender', getColumnDefinition('user:gender'))

            assert.equal(dsl.hasColumn('user', 'gender'), true)
            dsl.dropColumn('user', 'gender')
            assert.equal(dsl.hasColumn('user', 'gender'), false)
        })

        it('renameColumn', () => {
            if (!dsl.hasColumn('user', 'gender'))
                dsl.addColumn('user', 'gender', getColumnDefinition('user:gender'))

            assert.equal(dsl.hasColumn('user', 'gender'), true)
            dsl.renameColumn('user', 'gender', 'gender2')
            assert.equal(dsl.hasColumn('user', 'gender'), false)
            assert.equal(dsl.hasColumn('user', 'gender2'), true)
            dsl.renameColumn('user', 'gender2', 'gender')
        })
    })
})

if (require.main === module)
    test.run(console.DEBUG);
