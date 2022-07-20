import { IDbDriver } from "@fxjs/db-driver";
import { Sync } from '@fxjs/sql-ddl-sync';
export declare function getAllTableNames(driver: IDbDriver.ISQLDriver): string[];
export declare type IModelProperties = ReturnType<Sync['Dialect']['getCollectionPropertiesSync']>;
export declare type IRawColumns = ReturnType<Sync['Dialect']['getCollectionColumnsSync']>;
export declare function getTableDDLs(sync: Sync, { tableNames, afterGetTableDDL }?: {
    tableNames?: string[];
    afterGetTableDDL?: (ddl: {
        collection: string;
        properties: IModelProperties;
        rawColumns: IRawColumns;
    }) => void;
}): {
    collection: string;
    rawColumns: unknown[];
    properties: IModelProperties;
}[];
