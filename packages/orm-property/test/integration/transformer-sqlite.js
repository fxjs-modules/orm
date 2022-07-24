require("should");
const common  = require("../common");
const Transformer = require("../../lib").transformer('sqlite');

const ctx = {
	customTypes: common.customTypes,
	escapeVal: common.QueryDialects.sqlite.escapeVal,
}

describe("transformer('sqlite').toStorageType", function () {
	it("should detect text", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "text" }, ctx).typeValue.should.equal("TEXT");
		Transformer.toStorageType({ mapsTo: 'abc', type: "text", size: 150 }, ctx).typeValue.should.equal("TEXT");
	});

	it("should detect numbers", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer" }, ctx).typeValue.should.equal("INTEGER");
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer", size: 4 }, ctx).typeValue.should.equal("INTEGER");
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer", size: 2 }, ctx).typeValue.should.equal("INTEGER");
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer", size: 8 }, ctx).typeValue.should.equal("INTEGER");
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", rational: false }, ctx).typeValue.should.equal("INTEGER");
	});

	it("should detect rational numbers", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "number"}, ctx).typeValue.should.equal("REAL");
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", size: 4 }, ctx).typeValue.should.equal("REAL");
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", size: 8 }, ctx).typeValue.should.equal("REAL");
	});

	it("should detect booleans", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "boolean" }, ctx).typeValue.should.equal("INTEGER UNSIGNED");
	});

	it("should detect dates", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "date" }, ctx).typeValue.should.equal("DATETIME");
		Transformer.toStorageType({ mapsTo: 'abc', type: "date", time: true }, ctx).typeValue.should.equal("DATETIME");
		Transformer.toStorageType({ mapsTo: 'abc', type: "datetime" }, ctx).typeValue.should.equal("DATETIME");
	});

	it("should detect binary", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "binary" }, ctx).typeValue.should.equal("BLOB");
		Transformer.toStorageType({ mapsTo: 'abc', type: "binary", big: true }, ctx).typeValue.should.equal("BLOB");
	});

	it("should detect custom types", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "json" }, ctx).typeValue.should.equal("JSON");
	});

	it("should detect required items", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "boolean", required: true }, ctx).typeValue.should.match(/NOT NULL/);
	});

	it("should detect default values", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", defaultValue: 3 }, ctx).typeValue.should.match(/DEFAULT 3/);
	});

	it("should detect serial", function () {
		var column = Transformer.toStorageType({ mapsTo: 'abc', type: "serial" }, ctx).typeValue;

		column.should.match(/INT/);
		column.should.match(/AUTOINCREMENT/);
	});
});

describe("transformer('sqlite').rawToProperty", function () {
	;[
		{
			title: 'text',
			groups: [
				[
					{ "cid": 0, "name": "name", "type": "TEXT", "notnull": 0, "dflt_value": null, "pk": 0 },
					{ mapsTo: 'name', type: 'text' }
				]
			] 
		},
		{
			title: 'int',
			groups: [
				[
					{ "cid": 1, "name": "id", "type": "INTEGER", "notnull": 1, "dflt_value": null, "pk": 1 },
					{ key: true, required: true, type: 'serial', mapsTo: 'id' }
				],
			],
		},
	].forEach(({ title, groups }) => {
		it(title, function () {
			groups.forEach(([ raw, property ]) => {
				Transformer.rawToProperty(raw).property.should.deepEqual(property);
			});
		});
	});
});

if (require.main === module) {
	test.run(console.DEBUG)
}