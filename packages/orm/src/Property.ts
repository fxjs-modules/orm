import _cloneDeep = require('lodash.clonedeep');
import ORMError from "./Error";
import { FxOrmModel } from './Typo/model';
import { FxOrmNS } from './Typo/ORM';
import { FxOrmProperty } from './Typo/property';

const KNOWN_TYPES = [
	"text", "number", "integer", "bigint", "long", "boolean", "date", "enum", "object",
	"binary", "point",  "serial"
] as const;

export function normalize 
(opts: {
	prop: FxOrmModel.ComplexModelPropertyDefinition
	name: string
	customTypes: FxOrmNS.ORM['customTypes']
	settings: FxOrmNS.ORM['settings']
}): FxOrmProperty.NormalizedProperty {
	const orig_prop = opts.prop as FxOrmProperty.NormalizedProperty
	let result_prop: FxOrmProperty.NormalizedProperty = orig_prop

	if (typeof opts.prop === "function") {
		const primitiveProp: FxOrmModel.ComplexModelPropertyDefinition = opts.prop 
		switch (primitiveProp.name) {
			case "String":
				result_prop = <FxOrmProperty.NormalizedProperty>{ type: "text" };
				break;
			case "Number":
				result_prop = <FxOrmProperty.NormalizedProperty>{ type: "number" };
				break;
			case "BigInt":
				result_prop = <FxOrmProperty.NormalizedProperty>{ type: "bigint" };
				break;
			case "Boolean":
				result_prop = <FxOrmProperty.NormalizedProperty>{ type: "boolean" };
				break;
			case "Date":
				result_prop = <FxOrmProperty.NormalizedProperty>{ type: "date" };
				break;
			case "Object":
				result_prop = <FxOrmProperty.NormalizedProperty>{ type: "object" };
				break;
			case "Buffer":
				result_prop = <FxOrmProperty.NormalizedProperty>{ type: "binary" };
				break;
		}
	} else if (typeof opts.prop === "string") {
		result_prop = <FxOrmProperty.NormalizedProperty>{
			type: opts.prop
		};
	} else if (Array.isArray(opts.prop)) {
		result_prop = <FxOrmProperty.NormalizedProperty>{ type: "enum", values: opts.prop };
	} else {
		result_prop = _cloneDeep<FxOrmProperty.NormalizedProperty>(orig_prop);
	}

	if (!KNOWN_TYPES.includes(result_prop.type as any) && !(result_prop.type in opts.customTypes)) {
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
};
