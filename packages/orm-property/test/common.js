const { defineCustomType } = require("../");

exports.table   = "orm_property_test_table";

exports.QueryDialects = require("@fxjs/sql-query/lib/Dialects");

exports.customTypes = {
	json: defineCustomType({
		datastoreType: function (prop, ctx) {
			switch (ctx.type) {
				case 'mysql':
				case 'postgresql':
				case 'sqlite':
				default:
					return prop.type.toUpperCase();
			}
		}
	})
}