const test = require('test')
test.setup()

var index   = require("../../lib");

describe("index", function () {
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
          'getType',
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
});

if (require.main === module) {
  test.run(console.DEBUG)
}