/// <reference types="@fibjs/types" />
import type { IDbDriver } from "@fxjs/db-driver";
import type { FxDbDriverNS } from "@fxjs/db-driver/typings/Typo";
import type { IProperty } from "@fxjs/orm-property";
import type { FxOrmSqlDDLSync } from "./Typo/_common";
import type { FxOrmSqlDDLSync__Collection } from "./Typo/Collection";
export declare function logJson(group: string, detail: any): string;
import sqlQueryDialects = require('@fxjs/sql-query/lib/Dialects');
import { FxOrmSqlDDLSync__DbIndex } from './Typo/DbIndex';
declare type ISqlQueryDialects = typeof sqlQueryDialects;
export declare function addSqlQueryDialect(type: string, Dialect: any): void;
export declare function getAllSqlQueryDialects(type: string): {
    psql: import("@fxjs/sql-query/lib/Typo/Dialect").FxSqlQueryDialect.Dialect<import("@fxjs/sql-query/lib/Typo/Dialect").FxSqlQueryDialect.DialectType>;
    mysql: import("@fxjs/sql-query/lib/Typo/Dialect").FxSqlQueryDialect.Dialect<import("@fxjs/sql-query/lib/Typo/Dialect").FxSqlQueryDialect.DialectType>;
    postgresql: import("@fxjs/sql-query/lib/Typo/Dialect").FxSqlQueryDialect.Dialect<import("@fxjs/sql-query/lib/Typo/Dialect").FxSqlQueryDialect.DialectType>;
    sqlite: import("@fxjs/sql-query/lib/Typo/Dialect").FxSqlQueryDialect.Dialect<import("@fxjs/sql-query/lib/Typo/Dialect").FxSqlQueryDialect.DialectType>;
    mssql: import("@fxjs/sql-query/lib/Typo/Dialect").FxSqlQueryDialect.Dialect<import("@fxjs/sql-query/lib/Typo/Dialect").FxSqlQueryDialect.DialectType>;
};
export declare function getSqlQueryDialect(type: FxDbDriverNS.DriverType | 'postgresql'): ISqlQueryDialects[keyof ISqlQueryDialects];
export declare function arraify<T = any>(item: T | T[]): T[];
export declare function getCollectionMapsTo_PropertyNameDict(collection: FxOrmSqlDDLSync__Collection.Collection): {
    [k: string]: string;
};
export declare function filterPropertyDefaultValue(property: IProperty, ctx: {
    collection: string;
    property: IProperty;
    driver: IDbDriver;
}): any;
export declare function filterSyncStrategy(strategy: FxOrmSqlDDLSync.SyncCollectionOptions['strategy']): "soft" | "hard" | "mixed";
export declare function filterSuppressColumnDrop(suppressColumnDrop: boolean, db_type: FxDbDriverNS.DriverType): boolean;
export declare function psqlGetEnumTypeName(collection_name: string, column_name: string): string;
export declare function psqlRepairEnumTypes(columns: Record<string, IProperty> | IProperty[], collection_name: string, dbdriver: IDbDriver.ITypedDriver<Class_DbConnection>): void;
/**
 *
 * @param collection collection relation to find its indexes
 */
export declare function parseCollectionIndexes(collection: FxOrmSqlDDLSync__Collection.Collection['name'], properties: FxOrmSqlDDLSync__Collection.Collection['properties'], driver_type: string): FxOrmSqlDDLSync__DbIndex.CollectionDbIndexInfo[];
export {};
