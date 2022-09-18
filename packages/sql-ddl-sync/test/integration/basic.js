const test = require('test')
test.setup()

var index   = require("../../lib");
var DBDriver  = require("@fxjs/db-driver").Driver;

describe("sql-ddl-sync", function () {
  describe("exports", function () {
    it("should expose Sync function", function () {
      assert.exist(index.Sync)
      assert.equal(typeof index.Sync, 'function');
    });

    it("should expose dialect function", function () {
      assert.exist(index.dialect)
      assert.equal(typeof index.dialect, 'function');
    });
  });

  describe("#dialect", function () {
    ['mysql', 'postgresql', 'sqlite'].forEach(function (dialectName) {
      describe("should expose " + dialectName + " dialect", function () {
        var dialect = index.dialect(dialectName);

        it(`dialect ${dialectName} exists`, () => {
          assert.exist(dialect);
        });
        
        ;[
          'hasCollection',
          'addPrimaryKey',
          'dropPrimaryKey',
          'addForeignKey',
          'dropForeignKey',
          'getCollectionColumns',
          'hasCollectionColumns',
          'getCollectionProperties',
          'createCollection',
          'dropCollection',
          'addCollectionColumn',
          'renameCollectionColumn',
          'modifyCollectionColumn',
          'dropCollectionColumn',
          'getCollectionIndexes',
          'addIndex',
          'removeIndex',
          'toRawType',
        ]
        .concat(
          dialectName === 'sqlite' ? [
            'processKeys',
            'supportsType'
          ] : []
        )
        .forEach(dialect_func => {
          it(`should be function: ${dialect_func}`, () => {
            assert.isFunction(dialect[dialect_func])
          })
        })
      });
    });
  });

  describe("Sync instance", function () {
    var syncInstance = null

    before(() => {
      syncInstance = new index.Sync({
        dbdriver: DBDriver.create('sqlite:never_open.db'),
      })
    });

    describe('member properties', () => {
      ;[
        'dbdriver',
        'Dialect',
        'types',
      ].forEach(member => {
        it(`@${member} existed`, () => {
          assert.exist(syncInstance[member])
        });
      });
    });

    describe('member methods', () => {
      ;[
        'defineCollection',
        'findCollection',
        'defineType',
        'createCollection',
        'syncCollection',
        'syncIndexes',
        'needDefinitionToColumn',
        'sync',
        'forceSync',
      ].forEach(method => {
        it(`#${method} existed`, () => {
          assert.isFunction(syncInstance[method])
        });
      });
    });

    var commonCheckors = [
        [
          { type: 'text' },
          { type: 'serial' },
          ,
          true
        ],
        [
          { type: 'serial' },
          { type: 'text' },
          ,
          true
        ],
        [
          { type: 'serial' },
          { type: 'serial' },
          ,
          false
        ],
        [
          { type: 'text', required: true },
          { type: 'text', required: false },
          ,
          true
        ],
        [
          { type: 'text', required: true },
          { type: 'text', required: false },
          ,
          true
        ],
        [
          { type: 'enum', values: [1, 2, 3] },
          { type: 'enum', values: [1, 2, 3] },
          ,
          false
        ],
        [
          { type: 'enum', values: [1] },
          { type: 'enum', values: [1, 2, 3] },
          ,
          true
        ],
        [
          { type: 'enum', values: [1, 2, 3] },
          { type: 'enum', values: [1] },
          ,
          true
        ],
        [
          { type: 'enum', values: ["1", "2", "3"] },
          { type: 'enum', values: [1, 2, 3] },
          ,
          true
        ]
      ]

    it('#needDefinitionToColumn - SQLite', () => {
      syncInstance = new index.Sync({
        dbdriver: DBDriver.create('sqlite:never_open.db'),
      });

      commonCheckors
      .concat([])
      .forEach(([def, col, opts, result]) => {
        assert.strictEqual(
          syncInstance.needDefinitionToColumn(
            def,
            col,
            {...opts}
          ),
          result
        )
      });
    });

    it('#needDefinitionToColumn - MySQL', () => {
      syncInstance = new index.Sync({
        dbdriver: DBDriver.create('mysql://localhost:3306/never_open'),
      });

      commonCheckors
      .concat([])
      .forEach(([def, col, opts, result]) => {
        assert.strictEqual(
          syncInstance.needDefinitionToColumn(
            def,
            col,
            {...opts}
          ),
          result
        )
      });
    });

    it('#needDefinitionToColumn - PostgreSQL', () => {
      syncInstance = new index.Sync({
        dbdriver: DBDriver.create('postgresql://localhost:5432/never_open'),
      });

      commonCheckors
      .concat([])
      .forEach(([def, col, opts, result]) => {
        assert.strictEqual(
          syncInstance.needDefinitionToColumn(
            def,
            col,
            {...opts}
          ),
          result
        )
      });
    });
  });
});

if (require.main === module) {
  test.run(console.DEBUG)
}