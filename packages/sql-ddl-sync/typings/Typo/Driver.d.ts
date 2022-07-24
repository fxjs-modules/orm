import { IDbDriver } from "@fxjs/db-driver";
import { FxOrmCoreCallbackNS } from "@fxjs/orm-core";
import { IProperty } from "@fxjs/orm-property";
import { FxOrmSqlDDLSync__Dialect } from "./Dialect";
import { FxOrmSqlDDLSync__DbIndex } from "./DbIndex";
export declare namespace FxOrmSqlDDLSync__Driver {
    interface CustomPropertyType<T extends IDbDriver.IConnTypeEnum = IDbDriver.IConnTypeEnum> {
        datastoreType(prop?: IProperty, opts?: {
            collection: string;
            driver: IDbDriver<T>;
        }): string;
        valueToProperty?(value?: any, prop?: any): any;
        propertyToValue?(value?: any, prop?: any): any;
        [ext_cfg_name: string]: any;
    }
    /**
     * @description one protocol driver should implement
     */
    interface Driver<T extends IDbDriver.IConnTypeEnum> extends IDbDriver<T> {
        dialect: FxOrmSqlDDLSync__Dialect.DialectType;
        /**
         * @description sync table/collection
         */
        sync: {
            <T = any>(): T;
            <T = any>(cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): void;
        };
        /**
         * @description drop table/collection
         */
        drop: {
            <T = any>(): T;
            <T = any>(cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): void;
        };
        customTypes?: {
            [type_name: string]: CustomPropertyType<T>;
        };
    }
    interface DbIndexInfo_MySQL extends FxOrmSqlDDLSync__DbIndex.DbIndexInfo {
        index_name: string;
        column_name: string;
        non_unique: number | boolean;
    }
    interface DbIndexInfo_PostgreSQL extends FxOrmSqlDDLSync__DbIndex.DbIndexInfo {
        indisprimary: boolean;
        indisunique: boolean;
        relname: string;
        attname: string;
    }
    interface DbIndexInfo_SQLite extends FxOrmSqlDDLSync__DbIndex.DbIndexInfo {
        unique: boolean;
    }
}
