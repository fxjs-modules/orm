/// <reference types="@fibjs/types" />

import coroutine = require('coroutine');
import { FxOrmSqlDDLSync__Column } from "./Typo/Column";
import { FxOrmSqlDDLSync } from "./Typo/_common";

import { FxDbDriverNS } from "@fxjs/db-driver/typings/Typo";
import { FxOrmSqlDDLSync__Collection } from "./Typo/Collection";
import { IDbDriver } from "@fxjs/db-driver";

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
type ISqlQueryDialects = typeof sqlQueryDialects;

export function addSqlQueryDialect (type: string, Dialect: any) {
    (sqlQueryDialects as any)[type] = Dialect;
}

export function getAllSqlQueryDialects (type: string) {
    return sqlQueryDialects
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
    property: FxOrmSqlDDLSync__Column.Property,
    ctx: {
        collection: string,
        property: FxOrmSqlDDLSync__Column.Property,
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
    columns: Record<string, FxOrmSqlDDLSync__Column.Property> | FxOrmSqlDDLSync__Column.Property[],
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
    
    coroutine.parallel(missingEnumTypeProperties, (property: FxOrmSqlDDLSync__Column.Property) => {
        const type = psqlGetEnumTypeName(collection_name, property.mapsTo.toLowerCase());
        
        const values = property.values.map(function (val) {
            return sqlQueryDialect.escapeVal(val);
        });

        dbdriver.execute(`CREATE TYPE ${type} AS ENUM (${values})`);
    });
}