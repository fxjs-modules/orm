import { FxOrmCoreCallbackNS } from "@fxjs/orm-core";
import { FxOrmSqlDDLSync__Column } from "./Column";
import { FxOrmSqlDDLSync__Dialect } from "./Dialect";
import { FxOrmSqlDDLSync__DbIndex } from "./DbIndex";
import { IDbDriver } from "@fxjs/db-driver";

export namespace FxOrmSqlDDLSync__Driver {
    export interface CustomPropertyType<ConnType = any> {
        datastoreType(
            prop?: FxOrmSqlDDLSync__Column.Property,
            opts?: {
                collection: string
                driver: IDbDriver<ConnType>
            }
        ): string
        valueToProperty?(value?: any, prop?: any): any
        propertyToValue?(value?: any, prop?: any): any

        [ext_cfg_name: string]: any
    }

    export interface CustomPropertyTypeHash {
        [key: string]: CustomPropertyType
    }
    /**
     * @description one protocol driver should implement
     */    
    export interface Driver<ConnType = any> extends IDbDriver<ConnType> {
        dialect: FxOrmSqlDDLSync__Dialect.DialectType

        /**
         * @description sync table/collection
         */
        sync: {
            <T = any>(): T
            <T = any>(cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): void
        }
        
        /**
         * @description drop table/collection
         */
        drop: {
            <T = any>(): T
            <T = any>(cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): void
        }

        customTypes?: {
            [type_name: string]: CustomPropertyType
        }
    }

    export interface DbIndexInfo_MySQL extends FxOrmSqlDDLSync__DbIndex.DbIndexInfo {
        index_name: string
        column_name: string

        non_unique: number|boolean
    }

    export interface DbIndexInfo_SQLite extends FxOrmSqlDDLSync__DbIndex.DbIndexInfo {
        unique: boolean
    }
}