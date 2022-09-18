/// <reference types="@fibjs/types" />

import coroutine = require('coroutine');
import type { IDbDriver } from "@fxjs/db-driver";
import type { FxDbDriverNS } from "@fxjs/db-driver/typings/Typo";
import type { IProperty } from "@fxjs/orm-property";

import type { FxOrmSqlDDLSync } from "./Typo/_common";

import type { FxOrmSqlDDLSync__Collection } from "./Typo/Collection";

export function logJson (group: string, detail: any) {
    let json = null;
    try {
        json = JSON.stringify(detail, null, '\t');
    } catch (e) {
        throw 'Error occured when trying to log detail';
    }
    
    if (process.env.DEBUG)
        console.notice(json)

    return json
}

import sqlQueryDialects = require('@fxjs/sql-query/lib/Dialects');
import { FxOrmSqlDDLSync__DbIndex } from './Typo/DbIndex';
type ISqlQueryDialects = typeof sqlQueryDialects;

export function addSqlQueryDialect (type: string, Dialect: any) {
    (sqlQueryDialects as any)[type] = Dialect;
}

export function getAllSqlQueryDialects (type: string) {
    return {
        ...sqlQueryDialects,
        psql: sqlQueryDialects['postgresql']
    }
}

export function getSqlQueryDialect (type: FxDbDriverNS.DriverType | 'postgresql'): ISqlQueryDialects[keyof ISqlQueryDialects] {
    switch (type) {
        default:
            // some times others libs could mount faked dialect to sqlQueryDialects, allow return it
            return (sqlQueryDialects as any)[type] || null;
        // case 'mongodb':
        case 'redis':
            throw new Error('[getSqlQueryDialect] unsupported driver type: ' + type)
        case 'postgresql':
        case 'psql':
            return sqlQueryDialects['postgresql'];
        case 'sqlite':
        case 'mysql':
        // case 'mssql':
	        return sqlQueryDialects[type];
    }
}

export function arraify<T = any> (item: T | T[]): T[] {
	return Array.isArray(item) ? item : [item]
}

export function getCollectionMapsTo_PropertyNameDict (collection: FxOrmSqlDDLSync__Collection.Collection) {
    const hash = <{[k: string]: string}>{}

    Object.keys(collection.properties).forEach(pname => {
        const prop = collection.properties[pname]
        if (prop.mapsTo)
            hash[prop.mapsTo] = pname
    })

    return hash;
}

export function filterPropertyDefaultValue (
    property: IProperty,
    ctx: {
        collection: string,
        property: IProperty,
        driver: IDbDriver
    }
) {
    let _dftValue
    if (property.hasOwnProperty('defaultValue'))
        if (typeof property.defaultValue === 'function') {
            _dftValue = property.defaultValue(ctx)
        } else
            _dftValue = property.defaultValue

    return _dftValue
}

export function filterSyncStrategy (
    strategy: FxOrmSqlDDLSync.SyncCollectionOptions['strategy']
) {
    switch (strategy) {
        case 'hard':
        case 'soft':
        case 'mixed':
            break
        default:
            strategy = 'soft'
            break
    }
    return strategy
}

export function filterSuppressColumnDrop (
    suppressColumnDrop: boolean, db_type: FxDbDriverNS.DriverType
) {
    if (db_type === 'sqlite')
        return true

    return !!suppressColumnDrop
}

export function psqlGetEnumTypeName (
    collection_name: string,
    column_name: string
) {
    return `${collection_name}_enum_${column_name.toLowerCase()}`
}

export function psqlRepairEnumTypes (
    columns: Record<string, IProperty> | IProperty[],
    collection_name: string,
    dbdriver: IDbDriver.ITypedDriver<Class_DbConnection>
) {
    const enumProperties = Object.values(columns).filter(col => col.type === 'enum');
    if (!enumProperties.length) return ;

    const sqlQueryDialect = getSqlQueryDialect('psql');

    const rows = dbdriver.execute<{ typname: string }[]>(
            `SELECT * FROM pg_catalog.pg_type WHERE typname IN ${[ `(${enumProperties.map(p =>
                sqlQueryDialect.escapeVal(
                    psqlGetEnumTypeName(collection_name, p.name)
                )
            ).join(', ')})`]}`
    );
    const allExistedTypes = new Set(rows.map(row => row.typname));
    const missingEnumTypeProperties = enumProperties.filter(p => !allExistedTypes.has(
        psqlGetEnumTypeName(collection_name, p.name)
    ))
    
    coroutine.parallel(missingEnumTypeProperties, (property: IProperty) => {
        const type = psqlGetEnumTypeName(collection_name, property.mapsTo.toLowerCase());
        
        const values = property.values.map(function (val) {
            return sqlQueryDialect.escapeVal(val);
        });

        dbdriver.execute(`CREATE TYPE ${type} AS ENUM (${values})`);
    });
}

/**
 * @description compute system's index name by dialect type
 * 
 * @param collection collection to indexed
 * @param prop column's property
 */
 function getIndexName (
	collection: string,
	prop: IProperty,
	dialect_type: string
) {
	const post = prop.unique ? 'unique' : 'index';

	if (dialect_type == 'sqlite') {
		return collection + '_' + prop.name + '_' + post;
	} else {
		return prop.name + '_' + post;
	}
}
/**
 * 
 * @param collection collection relation to find its indexes
 */
export function parseCollectionIndexes (
    collection: FxOrmSqlDDLSync__Collection.Collection['name'],
    properties: FxOrmSqlDDLSync__Collection.Collection['properties']
): FxOrmSqlDDLSync__DbIndex.CollectionDbIndexInfo[] {
    const indexes: FxOrmSqlDDLSync__DbIndex.CollectionDbIndexInfo[] = [];
    let found: boolean,
        prop: IProperty;

    for (let k in properties) {
        prop = properties[k];

        if (prop.unique) {
            let mixed_arr_unique: (string | true)[] = prop.unique as string[]
            if (!Array.isArray(prop.unique)) {
                mixed_arr_unique = [ prop.unique ];
            }

            for (let i = 0; i < mixed_arr_unique.length; i++) {
                if (mixed_arr_unique[i] === true) {
                    indexes.push({
                        collection,
                        name    : getIndexName(collection, prop, this.dbdriver.type),
                        unique  : true,
                        columns : [ k ]
                    });
                } else {
                    found = false;

                    for (let j = 0; j < indexes.length; j++) {
                        if (indexes[j].name == mixed_arr_unique[i]) {
                            found = true;
                            indexes[j].columns.push(k);
                            break;
                        }
                    }

                    if (!found) {
                        indexes.push({
                            collection,
                            name    : mixed_arr_unique[i] as string,
                            unique  : true,
                            columns : [ k ]
                        });
                    }
                }
            }
        }
        
        if (prop.index) {
            let mixed_arr_index: (string | true)[] = prop.index as string[]
            if (!Array.isArray(prop.index)) {
                mixed_arr_index = [ prop.index ];
            }

            for (let i = 0; i < mixed_arr_index.length; i++) {
                if (mixed_arr_index[i] === true) {
                    indexes.push({
                        collection,
                        name: getIndexName(collection, prop, this.dbdriver.type),
                        unique: false,
                        columns: [ k ]
                    });
                } else {
                    found = false;

                    for (let j = 0; j < indexes.length; j++) {
                        if (indexes[j].name == mixed_arr_index[i]) {
                            found = true;
                            indexes[j].columns.push(k);
                            break;
                        }
                    }
                    if (!found) {
                        indexes.push({
                            collection,
                            name: mixed_arr_index[i] as string,
                            columns: [ k ],
                            unique: false,
                        });
                    }
                }
            }
        }
    }

    return indexes;
}