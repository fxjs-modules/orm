require("should");
const common = require("../common");
const Transformer = require("../../lib").transformer('mysql');

const ctx = {
	customTypes: common.customTypes,
	escapeVal: common.QueryDialects.mysql.escapeVal,
}

describe("transformer('mysql').toStorageType", function () {
	it("should detect text", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "text" }, ctx).typeValue.should.equal("VARCHAR(255)");
		Transformer.toStorageType({ mapsTo: 'abc', type: "text", size: 150 }, ctx).typeValue.should.equal("VARCHAR(150)");
		Transformer.toStorageType({ mapsTo: 'abc', type: "text", size: 1000 }, ctx).typeValue.should.equal("VARCHAR(1000)");
	});

	it("should detect numbers", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer" }, ctx).typeValue.should.equal("INTEGER");
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer", size: 4 }, ctx).typeValue.should.equal("INTEGER");
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer", size: 2 }, ctx).typeValue.should.equal("SMALLINT");
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer", size: 8 }, ctx).typeValue.should.equal("BIGINT");
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", rational: false }, ctx).typeValue.should.equal("INTEGER");
	});

	it("should detect rational numbers", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "number" }, ctx).typeValue.should.equal("FLOAT");
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", size: 4 }, ctx).typeValue.should.equal("FLOAT");
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", size: 8 }, ctx).typeValue.should.equal("DOUBLE");
	});

	it("should detect booleans", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "boolean" }, ctx).typeValue.should.equal("TINYINT(1)");
	});

	it("should detect dates", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "date" }, ctx).typeValue.should.equal("DATE");
	});

	it("should detect dates with times", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "date", time: true }, ctx).typeValue.should.equal("DATETIME");
		Transformer.toStorageType({ mapsTo: 'abc', type: "datetime" }, ctx).typeValue.should.equal("DATETIME");
	});

	it("should detect binary", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "binary" }, ctx).typeValue.should.equal("BLOB");
	});

	it("should detect big binary", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "binary", big: true }, ctx).typeValue.should.equal("LONGBLOB");
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
		;[
			undefined,
			null,
			0,
			11,
			20
		].forEach(size => {
			var column
			if (size = undefined)
				column = Transformer.toStorageType({ mapsTo: 'abc', type: "serial" }, ctx).typeValue;
			else
				column = Transformer.toStorageType({ mapsTo: 'abc', type: "serial", size }, ctx).typeValue;

			column.should.match(new RegExp(`INT\\\(${size || 11}\\\)`));
			column.should.match(/INT/);
			column.should.match(/NOT NULL/);
			column.should.match(/AUTO_INCREMENT/);
		})
	});

	it("should detect comment", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", comment: 'test comment' }, ctx).typeValue.should.match(/COMMENT 'test comment'/);
	});
});

describe("transformer('mysql').rawToProperty", function () {
	;[
		{
			title: 'varchar(255)',
			groups: [
				[
					{ "Field": "street", "Type": "varchar(255)", "Null": "YES", "Key": "", "Default": "", "Extra": "", "Size": "" },
					{ mapsTo: 'street', defaultValue: '', type: 'text', size: 255, }
				]
			] 
		},
		{
			title: 'int',
			groups: [
				[
					{ "Field": "id", "Type": "int", "Null": "NO", "Key": "PRI", "Default": "", "Extra": "auto_increment", "Size": "" },
					{ serial: true, unsigned: true, primary: true, required: true, mapsTo: 'id', defaultValue: '', type: 'serial', size: 4 }
				],
				[
					{ "Field": "age", "Type": "int", "Null": "YES", "Key": "", "Default": "18", "Extra": "", "Size": "" },
					{ defaultValue: '18', type: 'integer', size: 4, mapsTo: 'age' }
				]
			],
		},
		{
			title: 'tinyint',
			groups: [
				[
					{ "Field": "bounced", "Type": "tinyint(1)", "Null": "YES", "Key": "", "Default": "", "Extra": "", "Size": "" },
					{ defaultValue: '', type: 'boolean', mapsTo: 'bounced' }
				]
			]
		},
		{
			title: 'enum',
			groups: [
				[
					{ "Field": "sex", "Type": "enum('male','female')", "Null": "YES", "Key": "", "Default": "", "Extra": "", "Size": "" },
					{ defaultValue: '', type: 'enum', values: [ 'male', 'female' ], mapsTo: 'sex' }
				]
			]
		},
		{
			title: 'comment',
			groups: [
				[
					{ "Field": "name", "Type": "varchar(255)", "Null": "YES", "Key": "", "Default": "", "Extra": "", "Comment": "test comment name", "Size": "" },
					{ defaultValue: "", type: "text", size: 255, mapsTo: "name", comment: "test comment name" }
				]
			]
		}
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