import { IPropTransformer, IProperty, __StringType } from "../Property";
import { filterPropertyDefaultValue } from "../Utils";

type AllNinable<T extends object> = {
    [P in keyof T]: null | T[P]
}
type PostgreSQLTypeValueBool = 'NO' | 'YES';
// item in list from `SELECT * FROM information_schema.columns WHERE table_name = ?;`
export type ColumnInfo__PostgreSQL = AllNinable<{
    table_catalog: string
    table_schema: string
    table_name: string
    column_name: string
    ordinal_position: string
    column_default: string
    is_nullable: PostgreSQLTypeValueBool
    data_type: __StringType<
        | 'smallint'
        | 'integer'
        | 'bigint'
        | 'real'
        | 'double precision'
        | 'boolean'
        | 'timestamp with time zone'
        | 'timestamp without time zone'
        | 'date'
        | 'bytea'
        | 'text'
        | 'character varying'
        | 'user-defined'
    >
    character_maximum_length: number
    character_octet_length: number
    numeric_precision: string
    numeric_precision_radix: string
    numeric_scale: string
    datetime_precision: string
    interval_type: string
    interval_precision: string
    character_set_catalog: string
    character_set_schema: string
    character_set_name: string
    collation_catalog: string
    collation_schema: string
    collation_name: string
    domain_catalog: string
    domain_schema: string
    domain_name: string
    udt_catalog: string
    udt_schema: string
    udt_name: string
    scope_catalog: string
    scope_schema: string
    scope_name: string
    maximum_cardinality: string
    dtd_identifier: string
    is_self_referencing: PostgreSQLTypeValueBool
    is_identity: PostgreSQLTypeValueBool
    identity_generation: string
    identity_start: string
    identity_increment: string
    identity_maximum: string
    identity_minimum: string
    identity_cycle: string
    is_generated: PostgreSQLTypeValueBool
    generation_expression: string
    is_updatable: PostgreSQLTypeValueBool
}>

function psqlGetEnumTypeName (
    collection_name: string,
    column_name: string
) {
    return `${collection_name}_enum_${column_name.toLowerCase()}`
}

const columnSizes = {
    integer: { 2: 'SMALLINT', 4: 'INTEGER', 8: 'BIGINT' },
    floating: { 4: 'REAL', 8: 'DOUBLE PRECISION' },
};

export const rawToProperty: IPropTransformer<ColumnInfo__PostgreSQL>['rawToProperty'] = function (
	dCol, ctx
) {
    let property = <IProperty>{};

    if (dCol.is_nullable.toUpperCase() == "NO") {
        property.required = true;
    }
    if (dCol.column_default !== null) {
        let m = dCol.column_default.match(/^'(.+)'::/);
        if (m) {
            property.defaultValue = m[1];
        } else {
            property.defaultValue = dCol.column_default;
        }
    }

    switch (dCol.data_type.toUpperCase()) {
        case "SMALLINT":
        case "INTEGER":
        case "BIGINT":
            if (typeof dCol.column_default == 'string' && dCol.column_default.indexOf('nextval(') == 0) {
                property.type = "serial";
            } else {
                property.type = "integer";
            }
            for (let k in columnSizes.integer) {
                if ((columnSizes.integer as any)[k] == dCol.data_type.toUpperCase()) {
                    property.size = k;
                    break;
                }
            }
            break;
        case "REAL":
        case "DOUBLE PRECISION":
            property.type = "number";
            property.rational = true;
            for (let k in columnSizes.floating) {
                if ((columnSizes.floating as any)[k] == dCol.data_type.toUpperCase()) {
                    property.size = k;
                    break;
                }
            }
            break;
        case "BOOLEAN":
            property.type = "boolean";
            break;
        case "TIMESTAMP WITH TIME ZONE":
            property.time = true;
            property.type = "date";
            break;
        case "TIMESTAMP WITHOUT TIME ZONE":
            property.time = false;
            property.type = "date";
            break;
        case "DATE":
            property.type = "date";
            break;
        case "BYTEA":
            property.type = "binary";
            break;
        case "TEXT":
            property.type = "text";
            break;
        case "CHARACTER VARYING":
            property.type = "text";
            if (dCol.character_maximum_length) {
                property.size = dCol.character_maximum_length;
            }
            break;
        case "USER-DEFINED":
            if (dCol.udt_name.match(/_enum_/)) {
                property.type = "enum";
                property.values = ctx?.userOptions?.enumValues || [];
                break;
            }
        default:
            throw new Error("Unknown column type '" + dCol.data_type + "'");
    }

    property.mapsTo = dCol.column_name;

    return {
        raw: dCol,
        property
    }
}

export const toStorageType: IPropTransformer<ColumnInfo__PostgreSQL>['toStorageType'] = function (
    inputProperty, ctx
) {
    const property = { ...inputProperty }

    const result: ReturnType<IPropTransformer<ColumnInfo__PostgreSQL>['toStorageType']> = {
        isCustom: false,
        property,
        typeValue: '',
    }

    if (property.serial) {
        result.typeValue = 'SERIAL';
        return result;
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
            result.typeValue = (columnSizes.integer as any)[property.size] || columnSizes.integer[4];
            break;
        case "number":
            result.typeValue = (columnSizes.floating as any)[property.size] || columnSizes.floating[4];
            break;
        case "serial":
            property.serial = true;
            property.key = true;
            result.typeValue = "SERIAL";
            break;
        case "boolean":
            result.typeValue = "BOOLEAN";
            break;
        case "datetime":
            property.type = "date";
            property.time = true;
        case "date":
            if (!property.time) {
                result.typeValue = "DATE";
            } else {
                result.typeValue = "TIMESTAMP WITHOUT TIME ZONE";
            }
            break;
        case "binary":
        case "object":
            result.typeValue = "BYTEA";
            break;
        case "enum":
            const collection = (ctx?.collection || '');
            result.typeValue = psqlGetEnumTypeName(collection, property.mapsTo?.toLowerCase() || '');
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

    if (result.isCustom) {
        if (ctx.customTypes?.[property.type]) {
            result.typeValue = ctx.customTypes?.[property.type].datastoreType(property, ctx)
        }
    } else if (property.hasOwnProperty("defaultValue") && property.defaultValue !== undefined) {
        if (property.type == 'date' && property.defaultValue === Date.now){
            result.typeValue += " DEFAULT now()";
        } else {
            const defaultValue = filterPropertyDefaultValue(property, ctx)
            result.typeValue += " DEFAULT " + ctx.escapeVal?.(defaultValue);
        }
    }

    return result;
}