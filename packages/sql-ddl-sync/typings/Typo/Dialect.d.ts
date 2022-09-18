import { IDbDriver } from '@fxjs/db-driver';
import { FxOrmCoreCallbackNS, FxOrmDialect } from "@fxjs/orm-core";
import { IProperty } from "@fxjs/orm-property";
import { IPropTransformer } from '@fxjs/orm-property/lib/Property';
import { FxOrmSqlDDLSync__Collection } from "./Collection";
import { FxOrmSqlDDLSync__DbIndex } from "./DbIndex";
import { FxOrmSqlDDLSync } from "./_common";
export declare namespace FxOrmSqlDDLSync__Dialect {
    export type DialectType = 'mysql' | 'mssql' | 'sqlite' | 'postgresql';
    export type PurposeToGetRawType = 'alter_table' | 'create_table' | 'add_column' | 'alter_column';
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
            (driver: ITypedDriver<ConnType>, collection: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<Record<string, IProperty>>): void;
        };
        getCollectionPropertiesSync: {
            (driver: ITypedDriver<ConnType>, collection: string): Record<string, IProperty>;
        };
        getCollectionIndexes: {
            (driver: ITypedDriver<ConnType>, collection: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<Record<string, FxOrmSqlDDLSync__DbIndex.DbIndexInfo>>): void;
        };
        getCollectionIndexesSync: {
            (driver: ITypedDriver<ConnType>, collection: string): Record<string, FxOrmSqlDDLSync__DbIndex.DbIndexInfo>;
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
         * @description transform semantic property to raw string in db
         * @experimental
         */
        toRawType: (property: PropTransformerParams[0], ctx: PropTransformerParams[1] & {
            driver?: ITypedDriver<ConnType>;
            userOptions?: {
                useDefaultValue?: boolean;
            };
        }) => ReturnType<IPropTransformer<any>['toStorageType']>;
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
        convertIndexes?: <T extends FxOrmSqlDDLSync__DbIndex.DbIndexInfo>(collection: FxOrmSqlDDLSync__Collection.Collection['name'], db_idxes: T[]) => (typeof db_idxes);
        [extra: string]: any;
    }
    type PropTransformerParams = Parameters<IPropTransformer<any>['toStorageType']>;
    export interface TypeResult<T = any> {
        value: T;
        before?: false | (() => any);
    }
    export type DialectResult<T = any> = TypeResult<T>;
    export {};
}
