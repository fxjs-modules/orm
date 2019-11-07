/// <reference types="@fxjs/orm-core" />
/// <reference path="_common.d.ts" />

declare namespace FxOrmSqlDDLSync__Driver {
    interface CustomPropertyType<ConnType = any> {
        datastoreType(
            prop?: FxOrmSqlDDLSync__Column.Property,
            opts?: {
                collection: string
                driver: FxDbDriverNS.Driver<ConnType>
            }
        ): string
        valueToProperty?(value?: any, prop?: any): any
        propertyToValue?(value?: any, prop?: any): any

        [ext_cfg_name: string]: any
    }

    interface CustomPropertyTypeHash {
        [key: string]: CustomPropertyType
    }
    /**
     * @description one protocol driver should implement
     */    
    interface Driver<ConnType = any> extends FxDbDriverNS.Driver<ConnType> {
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

    interface DbIndexInfo_MySQL extends FxOrmSqlDDLSync__DbIndex.DbIndexInfo {
        index_name: string
        column_name: string

        non_unique: number|boolean
        [propName: string]: any
    }

    interface DbIndexInfo_SQLite extends FxOrmSqlDDLSync__DbIndex.DbIndexInfo {
        unique: boolean
    }
}