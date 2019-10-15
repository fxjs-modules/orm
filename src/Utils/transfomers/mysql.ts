import knex = require('@fxjs/knex')
import util = require('util')
import { use_propertyToValue, use_valueToProperty } from './_utils';
import { coerceNumber } from '../number';

export const storeType = 'sqlite'

export function valueToProperty (
    value: any,
    property: FxOrmModel.Class_Model['properties'][any],
    customTypes: FxOrmDTransformer.CustomTypes
) {
	switch (property.type) {
		case "date":
			if (util.isNumber(value) || util.isString(value))
            	value = new Date(value);
			break;
		case "boolean":
			value = !!value;
			break;
		case "object":
			if (typeof value == "object" && !Buffer.isBuffer(value)) {
				break;
			}
			try {
				value = JSON.parse(value);
			} catch (e) {
				value = null;
			}
			break;
		default:
			value = use_valueToProperty(value, customTypes[property.type])
			break;

	}
	return value;
};

export function propertyToValue (
    value: any,
    property: FxOrmModel.Class_Model['properties'][any],
    customTypes: FxOrmDTransformer.CustomTypes
) {
	switch (property.type) {
		case "date":
			if (util.isNumber(value) || util.isString(value))
            	value = new Date(value);
			break;
		case "boolean":
			value = (value) ? 1 : 0;
			break;
		case "object":
			if (value !== null) {
				value = JSON.stringify(value);
			}
			break;
		case "point":
			try {
				value = `POINT(${coerceNumber(value.x)} ${coerceNumber(value.y)})`
			} catch (error) {
				value = `POINT(0 0)`
			}
			
			value = property.$ctx.knex.raw(`GeomFromText('${value}')`)
            break
		default:
			value = use_propertyToValue(value, customTypes[property.type])
            break
	}
	return value;
};