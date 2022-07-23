require("should");
const common  = require("../common");
const Transformer = require("../../lib").transformer('sqlite');

const ctx = {
	customTypes: common.customTypes,
	escapeVal: common.QueryDialects.sqlite.escapeVal,
}

describe("transformer('sqlite').toStorageType", function () {
	it("should detect text", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "text" }).typeValue.should.equal("TEXT");
		Transformer.toStorageType({ mapsTo: 'abc', type: "text", size: 150 }).typeValue.should.equal("TEXT");
	});

	it("should detect numbers", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer" }).typeValue.should.equal("INTEGER");
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer", size: 4 }).typeValue.should.equal("INTEGER");
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer", size: 2 }).typeValue.should.equal("INTEGER");
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer", size: 8 }).typeValue.should.equal("INTEGER");
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", rational: false }).typeValue.should.equal("INTEGER");
	});

	it("should detect rational numbers", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "number"}).typeValue.should.equal("REAL");
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", size: 4 }).typeValue.should.equal("REAL");
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", size: 8 }).typeValue.should.equal("REAL");
	});

	it("should detect booleans", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "boolean" }).typeValue.should.equal("INTEGER UNSIGNED");
	});

	it("should detect dates", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "date" }).typeValue.should.equal("DATETIME");
		Transformer.toStorageType({ mapsTo: 'abc', type: "date", time: true }).typeValue.should.equal("DATETIME");
		Transformer.toStorageType({ mapsTo: 'abc', type: "datetime" }).typeValue.should.equal("DATETIME");
	});

	it("should detect binary", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "binary" }).typeValue.should.equal("BLOB");
		Transformer.toStorageType({ mapsTo: 'abc', type: "binary", big: true }).typeValue.should.equal("BLOB");
	});

	it("should detect custom types", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "json" }, ctx).typeValue.should.equal("JSON");
	});

	it("should detect required items", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "boolean", required: true }).typeValue.should.match(/NOT NULL/);
	});

	it("should detect default values", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", defaultValue: 3 }, ctx).typeValue.should.match(/DEFAULT 3/);
	});

	it("should detect serial", function () {
		var column = Transformer.toStorageType({ mapsTo: 'abc', type: "serial" }).typeValue;

		column.should.match(/INT/);
		column.should.match(/AUTOINCREMENT/);
	});
});
