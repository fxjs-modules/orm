var ORM = require("../..");
var Property = ORM.Property;

describe("Property", function () {
    it("passing String should return type: 'text'", function () {
        assert.equal(Property.normalize(String, 'abc').type, "text");
    });

    it("passing Number should return type: 'number'", function () {
        assert.equal(Property.normalize(Number, 'abc').type, "number");
    });

    it("passing Boolean should return type: 'boolean'", function () {
        assert.equal(Property.normalize(Boolean, 'abc').type, "boolean");
    });

    it("passing Date should return type: 'date'", function () {
        assert.equal(Property.normalize(Date, 'abc').type, "date");
    });

    it("passing Object should return type: 'object'", function () {
        assert.equal(Property.normalize(Object, 'abc').type, "object");
    });

    it("passing Buffer should return type: 'binary'", function () {
        assert.equal(Property.normalize(Buffer, 'abc').type, "binary");
    });

    it("passing an Array of items should return type: 'enum' with list of items", function () {
        var prop = Property.normalize([1, 2, 3], 'abc')

        assert.equal(prop.type, "enum");
        assert.propertyVal(prop.values, "length", 3);
    });

    describe("passing a string type", function () {
        it("should return type: <type>", function () {
            assert.equal(Property.normalize({
                type: "text",
                name: 'abc'
            }).type, "text");
        });

        it("should accept: 'point'", function () {
            assert.equal(Property.normalize({
                type: "point",
                name: 'abc'
            }).type, "point");
        });

        it("fallback to 'text'", function () {
            assert.equal(Property.normalize({
              name: 'abc'
            }).type, "text");
        });

        describe("customized type", function () {
          it("should allow string", function () {
            assert.equal(Property.normalize({
              type: 'string',
              name: 'abc'
            }).type, "string");
          });

          it("throw for other types", function () {
            assert.throws(() => {
              Property.normalize({ type: [], name: 'abc' });
            });

            assert.throws(() => {
              Property.normalize({ type: null, name: 'abc' });
            });

            assert.throws(() => {
              Property.normalize({ type: 1, name: 'abc' });
            });

            assert.throws(() => {
              Property.normalize({ type: Symbol, name: 'abc' });
            });
          });
        });
    });

    it("should not modify the original property object", function () {
        var original = {
            type: 'text',
            required: true
        };

        var normalized = Property.normalize({
            prop: original,
            name: 'abc'
        });

        original.test = 3;
        assert.strictEqual(normalized.test, undefined);
    });
});
