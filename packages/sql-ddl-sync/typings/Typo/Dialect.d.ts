import { FxOrmCoreCallbackNS, FxOrmDialect } from "@fxjs/orm-core";
import { FxOrmSqlDDLSync__Collection } from "./Collection";
import { FxOrmSqlDDLSync__DbIndex } from "./DbIndex";
import { FxOrmSqlDDLSync } from "./_common";
import { IDbDriver } from '@fxjs/db-driver';
import { FxOrmSqlDDLSync__Column } from "./Column";
export declare namespace FxOrmSqlDDLSync__Dialect {
    export type DialectType = 'mysql' | 'mssql' | 'sqlite' | 'postgresql';
    export interface DielectGetTypeOpts {
        for?: 'alter_table' | 'create_table' | 'add_column' | 'alter_column';
    }
    type ITypedDriver<T extends IDbDriver.ISQLConn> = IDbDriver.ITypedDriver<T>;
    export interface Dialect<ConnType extends IDbDriver.ISQLConn> extends FxOrmDialect.DDLDialect<ITypedDriver<ConnType>> {
        addForeignKey: {
            (driver: ITypedDriver<ConnType>, tableName: string, options: any, cb: FxOrmCoreCallbackNS.ExecutionCallback<any>): void;
        };
        addForeignKeySync: {
            (driver: ITypedDriver<ConnType>, tableName: string, options: any): any;
        };
        dropForeignKey: {
            (driver: ITypedDriver<ConnType>, tableName: string, columnName: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<any>): void;
        };
        dropForeignKeySync: {
            (driver: ITypedDriver<ConnType>, tableName: string, columnName: string): any;
        };
        getCollectionProperties: {
            (driver: ITypedDriver<ConnType>, name: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<Record<string, FxOrmSqlDDLSync__Column.Property>>): void;
        };
        getCollectionPropertiesSync: {
            (driver: ITypedDriver<ConnType>, name: string): Record<string, FxOrmSqlDDLSync__Column.Property>;
        };
        getCollectionIndexes: {
            (driver: ITypedDriver<ConnType>, name: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<FxOrmSqlDDLSync__DbIndex.DbIndexInfoHash>): void;
        };
        getCollectionIndexesSync: {
            (driver: ITypedDriver<ConnType>, name: string): FxOrmSqlDDLSync__DbIndex.DbIndexInfoHash;
        };
        addIndex: {
            (driver: ITypedDriver<ConnType>, name: string, unique: boolean, collection: FxOrmSqlDDLSync.TableName, columns: string[], cb: FxOrmCoreCallbackNS.ExecutionCallback<any>): void;
        };
        addIndexSync: {
            (driver: ITypedDriver<ConnType>, name: string, unique: boolean, collection: FxOrmSqlDDLSync.TableName, columns: string[]): any;
        };
        removeIndex: {
            (driver: ITypedDriver<ConnType>, name: string, collection: FxOrmSqlDDLSync.TableName, cb: FxOrmCoreCallbackNS.ExecutionCallback<any>): void;
        };
        removeIndexSync: {
            (driver: ITypedDriver<ConnType>, name: string, collection: FxOrmSqlDDLSync.TableName): any;
        };
        /**
         * transform semantic property to raw string in db
         *
         * @deprecated
         */
        getType: (collection: FxOrmSqlDDLSync.TableName, property: FxOrmSqlDDLSync__Column.Property, driver: ITypedDriver<ConnType>, opts?: DielectGetTypeOpts) => false | TypeResult;
        /**
         * process composite keys
         */
        processKeys?: {
            (keys: string[]): string[];
        };
        /**
         * transform type between property and column
         */
        supportsType?: {
            (type: string): string;
        };
        convertIndexes?: {
            (rows: FxOrmSqlDDLSync__Collection.Collection, db_idxes: FxOrmSqlDDLSync__DbIndex.DbIndexInfo[]): FxOrmSqlDDLSync__DbIndex.DbIndexInfo[];
        };
        [extra: string]: any;
    }
    export interface TypeResult<T = any> {
        value: T;
        before?: false | (() => any);
    }
    export type DialectResult<T = any> = TypeResult<T>;
    export {};
}
