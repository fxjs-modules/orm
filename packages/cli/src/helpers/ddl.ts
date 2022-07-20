import coroutine = require('coroutine');
import { IDbDriver } from "@fxjs/db-driver";
import { Sync } from '@fxjs/sql-ddl-sync';

export function getAllTableNames (driver: IDbDriver.ISQLDriver) {
    let tableNames = [] as string[];

    switch (driver.type) {
        case 'psql': {
            const result = driver.execute<{
                table_schema: string;
                table_name: string
            }[]>('SELECT * FROM information_schema.tables');
            result.forEach((x) => {
                // skip system tables
                if (x.table_name.startsWith('pg_')) return ;
                // skip non public tables
                if (x.table_schema !== 'public') return ;

                tableNames.push(x.table_name);
            });
            break;
        }
        case 'mysql': {
            const result = driver.execute<{ [k: string]: string }[]>('show tables;');
            tableNames = result.reduce((accu, x) => (
                accu.push(Object.entries(x)[0][1]),
                accu
            ), [] as string[]);  
            break;
        }
        case 'sqlite': {
            const result = driver.execute<{ name: string }[]>(`SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name
            `);
            result.forEach((x) => {
                // skip system tables
                if (x.name.startsWith('sqlite_')) return ;

                tableNames.push(x.name);
            });
            break;
        }
        default:
            throw new Error(`[getAllTableNames] unsupported driver type: ${driver.type}`);
    }

    return tableNames;
}

export type IModelProperties = ReturnType<Sync['Dialect']['getCollectionPropertiesSync']>
export type IRawColumns = ReturnType<Sync['Dialect']['getCollectionColumnsSync']>

export function getTableDDLs (sync: Sync, {
    tableNames,
    afterGetTableDDL
} : {
    tableNames?: string[],
    afterGetTableDDL?: (ddl: {
        collection: string,
        properties: IModelProperties,
        rawColumns: IRawColumns,
    }) => void,
} = {}) {
    tableNames = tableNames?.length ? tableNames : getAllTableNames(sync.dbdriver);

    const tableDDLs = coroutine.parallel(tableNames, (tableName: string) => {
        const ddl = {
            collection: tableName,
            properties: sync.Dialect.getCollectionPropertiesSync(sync.dbdriver, tableName),
            rawColumns: sync.Dialect.getCollectionColumnsSync(sync.dbdriver, tableName),
        };

        afterGetTableDDL?.(ddl);

        return ddl;
    }) as {
        collection: string,
        rawColumns: IRawColumns
        properties: IModelProperties,
    }[];

    return tableDDLs;
}