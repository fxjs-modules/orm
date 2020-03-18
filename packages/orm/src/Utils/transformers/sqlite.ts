import util = require('util')
import { coerceNumber } from '../number';

module SQLite {
    export const storeType = 'sqlite'

    export function valueToProperty(
        value: any,
        property: FxOrmProperty.NormalizedProperty,
        customTypes: FxOrmDTransformer.CustomTypes
    ) {
        let v;

        switch (property.type) {
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
            case "number":
                if (typeof value === 'string') {
                    switch (value.trim()) {
                        case 'Infinity':
                        case '-Infinity':
                        case 'NaN':
                            value = Number(value);
                            break;
                        default:
                            v = parseFloat(value);
                            if (Number.isFinite(v)) {
                                value = v;
                            }
                    }
                }
                break;
            case "integer":
                if (typeof value === 'string') {
                    v = parseInt(value);

                    if (Number.isFinite(v)) {
                        value = v;
                    }
                }
                break;
            case "date":
                if (util.isNumber(value) || util.isString(value))
                    value = new Date(value);

                break;
            case "point":
                try {
                    if (typeof value === 'string') {
                        const [_, x = 0, y = 0] = (value || '').match(/POINT\(([0-9\.]+),\s?([0-9\.]+)\)/g)
                        value = {
                            x: coerceNumber(x),
                            y: coerceNumber(y),
                        }
                    }
                } catch (error) {
                    value = {x: 0, y: 0}
                }
                break;
            default:
                break;
        }
        return value;
    }

    export function propertyToStoreValue (
        value: any,
        property: FxOrmProperty.NormalizedProperty,
        customTypes: FxOrmDTransformer.CustomTypes
    ) {
        switch (property.type) {
            case "boolean":
                value = (value) ? 1 : 0;
                break;
            case "object":
                if (value !== null) {
                    value = JSON.stringify(value);
                }
                break;
            case "date":
                if (util.isNumber(value) || util.isString(value))
                    value = new Date(value);
                break;
            case "point":
                try {
                    value = `POINT(${coerceNumber(value.x)}, ${coerceNumber(value.y)})`
                } catch (error) {
                    value = `POINT(0, 0)`
                }
                break
            default:
                break
        }
        return value;
    }
}

export = SQLite as FxOrmDTransformer.Transformer
