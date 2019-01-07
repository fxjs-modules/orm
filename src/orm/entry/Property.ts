const _cloneDeep = require('lodash.clonedeep');
import ORMError = require("./Error");

var KNOWN_TYPES = [
	"text", "number", "integer", "boolean", "date", "enum", "object",
	"binary", "point",  "serial"
];

export function normalize (opts: {
	prop: FxOrmModel.ComplexModelPropertyDefinition
	name: string
	customTypes: FxOrmNS.ORM['customTypes']
	settings: FxOrmNS.ORM['settings']
}): FxOrmProperty.NormalizedProperty {
	let result_prop: FxOrmProperty.NormalizedProperty = opts.prop as FxOrmModel.ModelPropertyDefinition

	if (typeof opts.prop === "function") {
		const primitiveProp: FxOrmModel.PrimitiveConstructorModelPropertyDefinition = opts.prop 
		switch (primitiveProp.name) {
			case "String":
				result_prop = { type: "text" };
				break;
			case "Number":
				result_prop = { type: "number" };
				break;
			case "Boolean":
				result_prop = { type: "boolean" };
				break;
			case "Date":
				result_prop = { type: "date" };
				break;
			case "Object":
				result_prop = { type: "object" };
				break;
			case "Buffer":
				result_prop = { type: "binary" };
				break;
		}
	} else if (typeof opts.prop === "string") {
		result_prop = {
			type: opts.prop as FxOrmModel.PropTypeStrPropertyDefinition
		};
	} else if (Array.isArray(opts.prop)) {
		result_prop = { type: "enum", values: opts.prop };
	} else {
		result_prop = _cloneDeep(opts.prop);
	}

	if (KNOWN_TYPES.indexOf(result_prop.type) === -1 && !(result_prop.type in opts.customTypes)) {
		throw new ORMError("Unknown property type: " + result_prop.type, 'NO_SUPPORT');
	}

	if (!result_prop.hasOwnProperty("required") && opts.settings.get("properties.required")) {
		result_prop.required = true;
	}

	// Defaults to true. Setting to false hides properties from JSON.stringify(modelInstance).
	if (!result_prop.hasOwnProperty("enumerable") || result_prop.enumerable === true) {
		result_prop.enumerable = true;
	}

	// Defaults to true. Rational means floating point here.
	if (result_prop.type == "number" && result_prop.rational === undefined) {
		result_prop.rational = true;
	}

	if (!('mapsTo' in result_prop)) {
		result_prop.mapsTo = opts.name
	}

	if (result_prop.type == "number" && result_prop.rational === false) {
		result_prop.type = "integer";
		delete result_prop.rational;
	}

	result_prop.name = opts.name;

	return result_prop;
	// return opts.prop;
};
