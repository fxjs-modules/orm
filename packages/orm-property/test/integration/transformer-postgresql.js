require("should");
const common  = require("../common");
const Transformer = require("../../lib").transformer('postgresql');

const ctx = {
	customTypes: common.customTypes,
	escapeVal: common.QueryDialects.postgresql.escapeVal,
}

describe("transformer('postgresql').toStorageType", function () {
	it("should detect text", function () {
		Transformer.toStorageType({ mapsTo: 'abc',  type: "text" }, ctx).typeValue.should.equal("TEXT");
		Transformer.toStorageType({ mapsTo: 'abc',  type: "text", size: 150 }, ctx).typeValue.should.equal("TEXT");
		Transformer.toStorageType({ mapsTo: 'abc',  type: "text", size: 1000 }, ctx).typeValue.should.equal("TEXT");
	});

	it("should detect numbers", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer" }, ctx).typeValue.should.equal("INTEGER");
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer", size: 4 }, ctx).typeValue.should.equal("INTEGER");
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer", size: 2 }, ctx).typeValue.should.equal("SMALLINT");
		Transformer.toStorageType({ mapsTo: 'abc', type: "integer", size: 8 }, ctx).typeValue.should.equal("BIGINT");
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", rational: false }, ctx).typeValue.should.equal("INTEGER");
	});

	it("should detect rational numbers", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "number"}, ctx).typeValue.should.equal("REAL");
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", size: 4 }, ctx).typeValue.should.equal("REAL");
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", size: 8 }, ctx).typeValue.should.equal("DOUBLE PRECISION");
	});

	it("should detect booleans", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "boolean" }, ctx).typeValue.should.equal("BOOLEAN");
	});

	it("should detect dates", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "date" }, ctx).typeValue.should.equal("DATE");
	});

	it("should detect dates with times", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "date", time: true }, ctx).typeValue.should.equal("TIMESTAMP WITHOUT TIME ZONE");
	});

	it("should detect binary", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "binary" }, ctx).typeValue.should.equal("BYTEA");
	});

	it("should detect custom types", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "json" }, ctx).typeValue.should.equal("JSON");
	});

	it("should detect required items", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "boolean", required: true }, ctx).typeValue.should.match(/NOT NULL/);
	});

	it("should detect default values", function () {
		Transformer.toStorageType({ mapsTo: 'abc', type: "number", defaultValue: 3 }, ctx).typeValue.should.match(/REAL DEFAULT 3/);
		Transformer.toStorageType({ mapsTo: 'abc', type: 'date',   defaultValue: Date.now }, ctx).typeValue.should.equal('DATE DEFAULT now()');
	});
});

describe("transformer('postgresql').rawToProperty", function () {
	;[
		{
			title: 'text',
			groups: [
				[
					{
						"table_catalog": "fxjs-orm-test",
						"table_schema": "public",
						"table_name": "tree",
						"column_name": "type",
						"ordinal_position": 1,
						"column_default": null,
						"is_nullable": "YES",
						"data_type": "text",
						"character_maximum_length": null,
						"character_octet_length": 1073741824,
						"numeric_precision": null,
						"numeric_precision_radix": null,
						"numeric_scale": null,
						"datetime_precision": null,
						"interval_type": null,
						"interval_precision": null,
						"character_set_catalog": null,
						"character_set_schema": null,
						"character_set_name": null,
						"collation_catalog": null,
						"collation_schema": null,
						"collation_name": null,
						"domain_catalog": null,
						"domain_schema": null,
						"domain_name": null,
						"udt_catalog": "fxjs-orm-test",
						"udt_schema": "pg_catalog",
						"udt_name": "text",
						"scope_catalog": null,
						"scope_schema": null,
						"scope_name": null,
						"maximum_cardinality": null,
						"dtd_identifier": "1",
						"is_self_referencing": "NO",
						"is_identity": "NO",
						"identity_generation": null,
						"identity_start": null,
						"identity_increment": null,
						"identity_maximum": null,
						"identity_minimum": null,
						"identity_cycle": "NO",
						"is_generated": "NEVER",
						"generation_expression": null,
						"is_updatable": "YES"
					},
					{ mapsTo: 'type', type: 'text' }
				]
			] 
		},
		{
			title: 'int',
			groups: [
				[
					{
						"table_catalog": "fxjs-orm-test",
						"table_schema": "public",
						"table_name": "door_access_history",
						"column_name": "year",
						"ordinal_position": 1,
						"column_default": null,
						"is_nullable": "NO",
						"data_type": "integer",
						"character_maximum_length": null,
						"character_octet_length": null,
						"numeric_precision": 32,
						"numeric_precision_radix": 2,
						"numeric_scale": 0,
						"datetime_precision": null,
						"interval_type": null,
						"interval_precision": null,
						"character_set_catalog": null,
						"character_set_schema": null,
						"character_set_name": null,
						"collation_catalog": null,
						"collation_schema": null,
						"collation_name": null,
						"domain_catalog": null,
						"domain_schema": null,
						"domain_name": null,
						"udt_catalog": "fxjs-orm-test",
						"udt_schema": "pg_catalog",
						"udt_name": "int4",
						"scope_catalog": null,
						"scope_schema": null,
						"scope_name": null,
						"maximum_cardinality": null,
						"dtd_identifier": "1",
						"is_self_referencing": "NO",
						"is_identity": "NO",
						"identity_generation": null,
						"identity_start": null,
						"identity_increment": null,
						"identity_maximum": null,
						"identity_minimum": null,
						"identity_cycle": "NO",
						"is_generated": "NEVER",
						"generation_expression": null,
						"is_updatable": "YES"
					},
					{ required: true, type: 'integer', size: '4', mapsTo: 'year' }
				],
			],
		},
		{
			title: 'enum',
			groups: [
				[
					{
						"table_catalog": "fxjs-orm-test",
						"table_schema": "public",
						"table_name": "door_access_history",
						"column_name": "action",
						"ordinal_position": 5,
						"column_default": null,
						"is_nullable": "YES",
						"data_type": "USER-DEFINED",
						"character_maximum_length": null,
						"character_octet_length": null,
						"numeric_precision": null,
						"numeric_precision_radix": null,
						"numeric_scale": null,
						"datetime_precision": null,
						"interval_type": null,
						"interval_precision": null,
						"character_set_catalog": null,
						"character_set_schema": null,
						"character_set_name": null,
						"collation_catalog": null,
						"collation_schema": null,
						"collation_name": null,
						"domain_catalog": null,
						"domain_schema": null,
						"domain_name": null,
						"udt_catalog": "fxjs-orm-test",
						"udt_schema": "public",
						"udt_name": "door_access_history_enum_action",
						"scope_catalog": null,
						"scope_schema": null,
						"scope_name": null,
						"maximum_cardinality": null,
						"dtd_identifier": "5",
						"is_self_referencing": "NO",
						"is_identity": "NO",
						"identity_generation": null,
						"identity_start": null,
						"identity_increment": null,
						"identity_maximum": null,
						"identity_minimum": null,
						"identity_cycle": "NO",
						"is_generated": "NEVER",
						"generation_expression": null,
						"is_updatable": "YES"
					},
					{ type: 'enum', values: [ 'in', 'out' ], mapsTo: 'action' },
					{ userOptions: { enumValues: [ 'in', 'out' ] } }
				]
			]
		}
	].forEach(({ title, groups }) => {
		it(title, function () {
			groups.forEach(([ raw, property, sampleCtx ]) => {
				Transformer.rawToProperty(raw, sampleCtx).property.should.deepEqual(property);
			});
		});
	});
});

if (require.main === module) {
  test.run(console.DEBUG)
}