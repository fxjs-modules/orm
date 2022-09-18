import { IPropTransformer, IProperty, PropertyType, __StringType, ICustomPropertyType } from "../Property"
import { COLUMN_NUMER_TYPE_IDX, filterPropertyDefaultValue } from "../Utils"

export type ColumnType_MySQL = PropertyType

/**
 * result from:
 * 1. SHOW COLUMN FROM ??;
 * 1. SHOW FULL COLUMN FROM ??;
 * 
 * there're extra fields in the result of sql 2: Collation, Comment, Privileges
 * 
 */
export interface ColumnInfoMySQL {
    Field: string
    Type: Class_Buffer | __StringType<
        'smallint'
        | 'integer'
        | 'bigint'
        | 'int'
        | 'float'
        | 'double'
        | 'tinyint'
        | 'datetime'
        | 'date'
        | 'longblob'
        | 'blob'
        | 'varchar'
    >
    Size: number | string
    /**
     * extra description such as `AUTO_INCREMENT`
     */
    Extra: string
    /**
     * @example `PRI`
     */
    Key: __StringType<'PRI' | 'MUL'>
    /**
     * @example `NO`
     */
    Null: __StringType<'NO' | 'YES'>
    /**
     * @deprecated
     */
    SubType?: string[]
    /**
     * @example null
     */
    Default?: any

    /**
     * @example `utf8mb4_unicode_ci`
     */
    Collation?: string

    /**
     * @example `select,insert,update,references`
     * type IPrivileges = "select" | "insert" | "update" | "references";
     */
    Privileges?: string

    Comment?: string
}


export interface ColumnInfoMySQL {
    Field: string;
    Type: Class_Buffer | __StringType<'smallint' | 'integer' | 'bigint' | 'int' | 'float' | 'double' | 'tinyint' | 'datetime' | 'date' | 'longblob' | 'blob' | 'varchar'>;
    Size: number | string;
    /**
     * extra description such as `AUTO_INCREMENT`
     */
    Extra: string;
    /**
     * @example `PRI`
     */
    Key: __StringType<'PRI' | 'MUL'>;
    /**
     * @example `NO`
     */
    Null: __StringType<'NO' | 'YES'>;
    SubType?: string[];
    /**
     * @example null
     */
    Default?: any;
}

type DB_INTEGER = number;
type DB_UNSIGNED_INT = DB_INTEGER;
type DB_BIGINT = number | bigint;
type DB_UNSIGNED_BIGINT = DB_BIGINT;
type DB_TEXT = string;
type DB_VARCHAR<T extends number = 255> = string;

// result from: SELECT * FROM information_schema.columns WHERE table_name = ? AND table_schema = ?;
// this type from: show columns from information_schema.columns;
export interface SchemaColumnInfoMySQL {
    TABLE_CATALOG: DB_VARCHAR<64>
    TABLE_SCHEMA: DB_VARCHAR<64>
    TABLE_NAME: DB_VARCHAR<64>
    COLUMN_NAME: DB_VARCHAR<64>
    ORDINAL_POSITION: DB_UNSIGNED_INT
    COLUMN_DEFAULT: DB_TEXT
    IS_NULLABLE: DB_VARCHAR<3> | 'NO' | 'YES'
    DATA_TYPE: DB_TEXT
    CHARACTER_MAXIMUM_LENGTH: DB_BIGINT
    CHARACTER_OCTET_LENGTH: DB_BIGINT
    NUMERIC_PRECISION: DB_UNSIGNED_BIGINT
    NUMERIC_SCALE: DB_UNSIGNED_BIGINT
    DATETIME_PRECISION: DB_UNSIGNED_INT
    CHARACTER_SET_NAME: DB_VARCHAR
    COLLATION_NAME: DB_TEXT
    COLUMN_TYPE: DB_TEXT
    COLUMN_KEY: '' | 'PRI' | 'UNI' | 'MUL'
    EXTRA: DB_VARCHAR<256>
    PRIVILEGES: DB_VARCHAR<154>
    COLUMN_COMMENT: DB_TEXT
    GENERATION_EXPRESSION: DB_TEXT
    SRS_ID: DB_UNSIGNED_INT
}

const columnSizes = {
	integer: {
		[COLUMN_NUMER_TYPE_IDX.SHORT]: 'SMALLINT',
        [COLUMN_NUMER_TYPE_IDX.INTEGER]: 'INTEGER',
        [COLUMN_NUMER_TYPE_IDX.LONG]: 'BIGINT'
	},
	floating: {
		[COLUMN_NUMER_TYPE_IDX.FLOAT]: 'FLOAT',
		[COLUMN_NUMER_TYPE_IDX.DOUBLE]: 'DOUBLE'
	}
};

function colInfoToProperty(colInfo: ColumnInfoMySQL) {
    const property = <IProperty>{};
    colInfo = { ...colInfo };
    filterRawColumns(colInfo);

    let Type = colInfo.Type + ''
    if (Type.indexOf(" ") > 0) {
        colInfo.SubType = Type.substr(Type.indexOf(" ") + 1).split(/\s+/);
        Type = Type.substr(0, Type.indexOf(" "));
    }

    // match_result
    let [_, _type, _size] = Type.match(/^(.+)\((\d+)\)$/) || [] as any[];
    if (_) {
        colInfo.Size = parseInt(_size, 10);
        Type = _type;
    }

    if (colInfo.Extra.toUpperCase() == "AUTO_INCREMENT") {
        property.serial = true;
        property.unsigned = true;
    }

    if (colInfo.Key == "PRI") {
        property.primary = true;
    }

    if (colInfo.Null.toUpperCase() == "NO") {
        property.required = true;
    }
    if (colInfo.Default !== "null") {
        property.defaultValue = colInfo.Default;
    }

    switch (Type.toUpperCase()) {
        case "SMALLINT":
        case "INTEGER":
        case "BIGINT":
        case "INT":
            property.type = "integer";
            property.size = 4; // INT
            for (let k in columnSizes.integer) {
                if ((columnSizes.integer as any)[k] == Type.toUpperCase()) {
                    property.size = k;
                    break;
                }
            }
            break;
        case "FLOAT":
        case "DOUBLE":
            property.type = "number";
            property.rational = true;
            for (let k in columnSizes.floating) {
                if ((columnSizes.floating as any)[k] == Type.toUpperCase()) {
                    property.size = k;
                    break;
                }
            }
            break;
        case "TINYINT":
            if (colInfo.Size == 1) {
                property.type = "boolean";
            } else {
                property.type = "integer";
            }
            break;
        case "DATETIME":
            property.time = true;
        case "DATE":
            property.type = "date";
            break;
        case "LONGBLOB":
            property.big = true;
        case "BLOB":
            property.type = "binary";
            break;
        case "VARCHAR":
            property.type = "text";
            if (colInfo.Size) {
                property.size = colInfo.Size;
            }
            break;
        case "TEXT":
            property.type = "text";
            break;
        case "POINT":
            property.type = "point";
            break;
        default:
            let [_2, _enum_value_str] = Type.match(/^enum\('(.+)'\)$/) || [] as any;
            if (_2) {
                property.type = "enum";
                property.values = _enum_value_str.split(/'\s*,\s*'/);
                break;
            }
            throw new Error(`Unknown property type '${Type}'`);
    }

    if (property.serial) {
        property.type = "serial";
    }

    property.mapsTo = colInfo.Field;

    if (colInfo.Comment)
        property.comment = colInfo.Comment;

    return property
}

function schemaColInfoToProperty(colInfo: SchemaColumnInfoMySQL) {
    throw new Error('Not implemented');
}

export const rawToProperty: IPropTransformer<ColumnInfoMySQL>['rawToProperty'] = function (
	colInfo, ctx
) {
    return {
        raw: colInfo,
        property: colInfoToProperty(colInfo)
    }
};

export const toStorageType: IPropTransformer<ColumnInfoMySQL>['toStorageType'] = function (
    inputProperty, ctx
) {
    const property = { ...inputProperty }

    const result: ReturnType<IPropTransformer<ColumnInfoMySQL>['toStorageType']> = {
        isCustom: false,
        property,
        typeValue: '',
    }

	if (property.type == 'number' && property.rational === false) {
		property.type = 'integer';
		delete property.rational;
	}

	switch (property.type) {
		case "text":
			if (property.big) {
				result.typeValue = "LONGTEXT";
			} else {
				result.typeValue = "VARCHAR(" + Math.min(Math.max(parseInt(property.size as any, 10) || 255, 1), 65535) + ")";
			}
			break;
		case "integer":
			result.typeValue = (columnSizes.integer as any)[property.size] || columnSizes.integer[COLUMN_NUMER_TYPE_IDX.INTEGER];
			break;
		case "number":
			result.typeValue = (columnSizes.floating as any)[property.size] || columnSizes.floating[COLUMN_NUMER_TYPE_IDX.INTEGER];
			break;
		case "serial":
			property.type = "number";
			property.serial = true;
			property.key = true;
			result.typeValue = `INT(${property.size || 11})`;
			break;
		case "boolean":
			result.typeValue = "TINYINT(1)";
			break;
		case "datetime":
			property.type = "date";
			property.time = true;
		case "date":
			if (!property.time) {
				result.typeValue = "DATE";
			} else {
				result.typeValue = "DATETIME";
			}
			break;
		case "binary":
		case "object":
			if (property.big === true) {
				result.typeValue = "LONGBLOB";
			} else {
				result.typeValue = "BLOB";
			}
			break;
		case "enum":
			result.typeValue = "ENUM (" + property.values.map((val: any) => ctx.escapeVal(val)) + ")";
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
	if (property.serial) {
		if (!property.required) {
			// append if not set
			result.typeValue += " NOT NULL";
		}
		result.typeValue += " AUTO_INCREMENT";
	}

	if (result.isCustom) {
		if (ctx.customTypes?.[property.type]) {
			result.typeValue = ctx.customTypes[property.type].datastoreType(property, ctx)
		}
	} else if (property.hasOwnProperty("defaultValue") && property.defaultValue !== undefined) {
        const defaultValue = property.type === 'date' && property.defaultValue === Date.now
            ? 'CURRENT_TIMESTAMP'
            : filterPropertyDefaultValue(property, ctx);

        result.typeValue += ` DEFAULT ${
            property.type === 'date' && (['CURRENT_TIMESTAMP'].includes(defaultValue))
            ? defaultValue
            : ctx.escapeVal(defaultValue)}`;
	}

    if (property.comment) {
        result.typeValue += ` COMMENT ${ctx.escapeVal(property.comment)}`;
    }

    return result;
}

function isSimpleColumnInfo(input: ColumnInfoMySQL | SchemaColumnInfoMySQL): input is ColumnInfoMySQL {
    return input.hasOwnProperty('Type');
}

export const filterRawColumns: IPropTransformer<ColumnInfoMySQL>['filterRawColumns'] = function (col) {
    if (isSimpleColumnInfo(col)) {
        col.Type = col.Type ? col.Type.toString() : '';
        col.Size = col.Size ? col.Size.toString() : '';
        col.Extra = col.Extra ? col.Extra.toString() : '';
        col.Key = col.Key ? col.Key.toString() : '';
        col.Null = col.Null ? col.Null.toString() : '';
        col.Default = col.Default ? col.Default.toString() : '';
        col.Collation = col.Collation ? col.Collation.toString() : '';
        col.Privileges = col.Privileges ? col.Privileges.toString() : '';
        col.Comment = col.Comment ? col.Comment.toString() : '';
    
        return col as ColumnInfoMySQL;
    }

    return col;
}