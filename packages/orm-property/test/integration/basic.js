const test = require('test')
test.setup()

const Property   = require("../../lib");

describe("orm-property", function () {
  describe("exports", function () {
    it("should expose Transformers", function () {
      assert.isObject(Property.Transformers)
      assert.property(Property.Transformers, 'mysql');
      assert.property(Property.Transformers, 'sqlite');
      assert.property(Property.Transformers, 'postgresql');
    });
  });

  describe("#transformer", function () {
    [
      'mysql',
      'postgresql',
      'sqlite'
    ].forEach(function (name) {
      describe(`should expose ${name} transformer`, function () {
        const transformer = Property.Transformers[name];

        it(`transformer ${name} exists`, () => {
          assert.exist(transformer);
        });
        
        ;[
          'rawToProperty',
          'toStorageType',
        ]
        .forEach(func => {
          it(`should be function: ${func}`, () => {
            assert.isFunction(transformer[func])
          })
        })
      });
    });
  });
});

if (require.main === module) {
  test.run(console.DEBUG)
}