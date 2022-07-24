require("should");
const common  = require("../common");
const Dialect = require("../../").dialect('postgresql');

const ctx = {
	customTypes: common.customTypes,
	driver: common.fakeDriver,
}

describe("PostgreSQL.toRawType", function () {
	it("should detect text", function (done) {
		Dialect.toRawType({ mapsTo: 'abc',  type: "text" }, ctx).typeValue.should.equal("TEXT");
		Dialect.toRawType({ mapsTo: 'abc',  type: "text", size: 150 }, ctx).typeValue.should.equal("TEXT");
		Dialect.toRawType({ mapsTo: 'abc',  type: "text", size: 1000 }, ctx).typeValue.should.equal("TEXT");

		return done();
	});

	it("should detect numbers", function (done) {
		Dialect.toRawType({ mapsTo: 'abc', type: "integer" }, ctx).typeValue.should.equal("INTEGER");
		Dialect.toRawType({ mapsTo: 'abc', type: "integer", size: 4 }, ctx).typeValue.should.equal("INTEGER");
		Dialect.toRawType({ mapsTo: 'abc', type: "integer", size: 2 }, ctx).typeValue.should.equal("SMALLINT");
		Dialect.toRawType({ mapsTo: 'abc', type: "integer", size: 8 }, ctx).typeValue.should.equal("BIGINT");
		Dialect.toRawType({ mapsTo: 'abc', type: "number", rational: false }, ctx).typeValue.should.equal("INTEGER");

		return done();
	});

	it("should detect rational numbers", function (done) {
		Dialect.toRawType({ mapsTo: 'abc', type: "number"}, ctx).typeValue.should.equal("REAL");
		Dialect.toRawType({ mapsTo: 'abc', type: "number", size: 4 }, ctx).typeValue.should.equal("REAL");
		Dialect.toRawType({ mapsTo: 'abc', type: "number", size: 8 }, ctx).typeValue.should.equal("DOUBLE PRECISION");

		return done();
	});

	it("should detect booleans", function (done) {
		Dialect.toRawType({ mapsTo: 'abc', type: "boolean" }, ctx).typeValue.should.equal("BOOLEAN");

		return done();
	});

	it("should detect dates", function (done) {
		Dialect.toRawType({ mapsTo: 'abc', type: "date" }, ctx).typeValue.should.equal("DATE");

		return done();
	});

	it("should detect dates with times", function (done) {
		Dialect.toRawType({ mapsTo: 'abc', type: "date", time: true }, ctx).typeValue.should.equal("TIMESTAMP WITHOUT TIME ZONE");
		// Dialect.toRawType({ mapsTo: 'abc', type: "datetime" }, ctx).typeValue.should.equal("DATETIME");
		
		return done();
	});

	it("should detect binary", function (done) {
		Dialect.toRawType({ mapsTo: 'abc', type: "binary" }, ctx).typeValue.should.equal("BYTEA");

		return done();
	});

	it("should detect custom types", function (done) {
		Dialect.toRawType({ mapsTo: 'abc', type: "json" }, ctx).typeValue.should.equal("JSON");

		return done();
	});

	it("should detect required items", function (done) {
		Dialect.toRawType({ mapsTo: 'abc', type: "boolean", required: true }, ctx).typeValue.should.match(/NOT NULL/);

		return done();
	});

	it("should detect default values", function (done) {
		Dialect.toRawType({ mapsTo: 'abc', type: "number", defaultValue: 3 }, ctx).typeValue.should.match(/DEFAULT \^\^3\^\^/);
		Dialect.toRawType({ mapsTo: 'abc', type: 'date',   defaultValue: Date.now }, ctx).typeValue.should.equal('DATE DEFAULT now()');

		return done();
	});
});

if (require.main === module) {
  test.run(console.DEBUG)
}