import { IPropTransformer, IProperty, __StringType } from "../Property"
import { filterPropertyDefaultValue } from "../Utils"

// item in list from `PRAGMA table_info(??)`
export interface ColumnInfoSQLite {
    cid: number
    dflt_value: string
    name: string
    notnull: 1 | 0
    pk: 1 | 0
    type: ColumnType_SQLite
}
type ColumnType_SQLite =
    __StringType<
        'TEXT'
        | 'INTEGER'
        | 'REAL'
        | 'SERIAL'
        | 'INTEGER UNSIGNED'
        | 'DATE'
        | 'DATETIME'
        | 'BLOB'
        | 'ENUM'
        | 'POINT'
    >

export interface PropertySQLite extends IProperty {
    key?: boolean

    before?: string
    after?: string
}

type ITransformers = IPropTransformer<ColumnInfoSQLite>;

export const rawToProperty: ITransformers['rawToProperty'] = function (
    dCol, ctx
) {
    const prop = <PropertySQLite>{};

    if (dCol.pk) {
        prop.key = true;
    }

    if (dCol.notnull) {
        prop.required = true;
    }
    if (dCol.dflt_value) {
        const m = dCol.dflt_value.match(/^'(.*)'$/);
        if (m) {
            prop.defaultValue = m[1];
        } else {
            prop.defaultValue = null;
        }
    }

    switch (dCol.type.toUpperCase()) {
        case "INTEGER":
            // In sqlite land, integer primary keys are autoincrement by default
            // weather you asked for this behaviour or not.
            // http://www.sqlite.org/faq.html#q1
            if (dCol.pk == 1) {
                prop.type = "serial";
            } else {
                prop.type = "integer";
            }
            break;
        case "INTEGER UNSIGNED":
            prop.type = "boolean";
            break;
        case "REAL":
            prop.type = "number";
            prop.rational = true;
            break;
        case "DATETIME":
            prop.type = "date";
            prop.time = true;
            break;
        case "BLOB":
            prop.type = "binary";
            prop.big = true;
            break;
        case "TEXT":
            prop.type = "text";
            break;
        case "POINT":
            prop.type = "point";
            break;
        default:
            let [_, type, _before, field] = dCol.type.toUpperCase().match(/(.*)\s(AFTER|BEFORE)\s`(.*)`$/) || [] as any[]

            if (_) {
                switch (_before && field) {
                    case 'BEFORE':
                        prop.before = field
                    case 'AFTER':
                        prop.after = field
                        break
                }
                prop.type = type;
                break;
            }

            throw new Error(`Unknown prop type '${dCol.type}'`);
    }

    prop.mapsTo = dCol.name;

    return {
        raw: dCol,
        property: prop
    }
}

export const toStorageType: ITransformers['toStorageType'] = function (
    inputProperty, ctx
) {
    const property = { ...inputProperty }

    const result: ReturnType<ITransformers['toStorageType']> = {
        isCustom: false,
        property,
        typeValue: '' as ColumnType_SQLite,
    }

	if (property.type == 'number' && property.rational === false) {
		property.type = 'integer';
		delete property.rational;
	}

	switch (property.type) {
		case "text":
			result.typeValue = "TEXT";
			break;
		case "integer":
			result.typeValue = "INTEGER";
			break;
		case "number":
			result.typeValue = "REAL";
			break;
		case "serial":
			property.serial = true;
			property.key = true;
			result.typeValue = "INTEGER";
			break;
		case "boolean":
			result.typeValue = "INTEGER UNSIGNED";
			break;
		case "datetime":
			property.type = "date";
			property.time = true;
		case "date":
			result.typeValue = "DATETIME";
			break;
		case "binary":
		case "object":
			result.typeValue = "BLOB";
			break;
		case "enum":
			result.typeValue = "INTEGER";
			break;
		case "point":
			result.typeValue = "POINT";
			break;
		default:
			result.isCustom = true;
            break;
	}

	if (!result.typeValue && !result.isCustom) return result;

	if (property.required) {
		result.typeValue += " NOT NULL";
	}
	if (property.key) {
		if (!property.required) {
			// append if not set
			result.typeValue += " NOT NULL";
		}
		if (property.serial) {
			result.typeValue += " PRIMARY KEY";
		}
	}
	if (property.serial) {
		if (!property.key) {
			result.typeValue += " PRIMARY KEY";
		}
		result.typeValue += " AUTOINCREMENT";
	}

	if (result.isCustom) {
		if (ctx.customTypes?.[property.type]) {
			result.typeValue = ctx.customTypes?.[property.type].datastoreType(property, ctx)
		}
	} else if (property.hasOwnProperty("defaultValue") && property.defaultValue !== undefined) {
		let defaultValue = property.type === 'date' && property.defaultValue === Date.now
            ? ctx.escapeVal('CURRENT_TIMESTAMP')
            : ctx.escapeVal(filterPropertyDefaultValue(property, ctx));

        const { useDefaultValue = true } = ctx.userOptions || {};
        
        /**
         * @description
         * 	sqlite doens't support alter column's datetime default value,
         * 	you should alter table's schema to change `datetime` type column's default value
         * 
         * @see https://stackoverflow.com/questions/2614483/how-to-create-a-datetime-column-with-default-value-in-sqlite3
         * @see https://stackoverflow.com/questions/25911191/altering-a-sqlite-table-to-add-a-timestamp-column-with-default-value
         */
        if (defaultValue && useDefaultValue)
            result.typeValue += ` DEFAULT ${defaultValue} `;
	}

    return result;
}