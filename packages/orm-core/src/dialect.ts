import { FxOrmCoreCallbackNS } from "./callback"

export namespace FxOrmDialect {
    export type EscapeArgType = string | number | boolean | Date | String | Number | RegExp | Symbol

    // /**
    //  * @description QueryDiact is dialct helpers
    //  * before/after sending query to database backend
    //  */
	// export interface QueryDialect {
	// 	type: string

	// 	escape (query: string, args: any[]): string
    //     /**
    //      * @description escape string as identifiers in els or `str` in els
    //      * @param els 
    //      */
	// 	escapeId (...els: (string | number | { str: string, escapes: string[] })[]): string
    //     /**
    //      * @description escape string-like as value in vals, value format is different for
    //      * database backends
    //      * @param val 
    //      */
	// 	escapeVal (val: EscapeArgType): string
	// }

    /**
     * @description DDLDialect is dialct helpers to interact with database backend,
     * to check if database has some features, get/remove data from it, or update date in it
     */
    export interface DDLDialect <TDriver extends any> {
        hasCollection: {
            (driver: TDriver, name: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<boolean>): void
        }
        hasCollectionSync: {
            (driver: TDriver, name: string): boolean
        }
        addPrimaryKey: {
            <T extends any = any>(driver: TDriver, tableName: string, columnName: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): void
        }
        addPrimaryKeySync: {
            <T extends any = any>(driver: TDriver, tableName: string, columnName: string): T
        }
        dropPrimaryKey: {
            <T extends any = any>(driver: TDriver, tableName: string, columnName: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): void
        }
        dropPrimaryKeySync: {
            <T extends any = any>(driver: TDriver, tableName: string, columnName: string): T
        }
        getCollectionColumns: {
            <T extends any = any>(driver: TDriver, name: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<T[]>): void
        }
        getCollectionColumnsSync: {
            <T extends any = any>(driver: TDriver, name: string): T[]
        }
        createCollection: {
            <T extends any = any>(driver: TDriver, name: string, columns: string[], keys: string[], cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): void
        }
        createCollectionSync: {
            <T extends any = any>(driver: TDriver, name: string, columns: string[], keys: string[]): T
        }
        dropCollection: {
            <T extends any = any>(driver: TDriver, name: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): void
        }
        dropCollectionSync: {
            <T extends any = any>(driver: TDriver, name: string): T
        }
        hasCollectionColumnsSync: {
            (driver: TDriver, name: string, column: string | string[]): boolean
        }
        hasCollectionColumns: {
            (driver: TDriver, name: string, column: string | string[], cb: FxOrmCoreCallbackNS.ExecutionCallback<boolean>): void
        }
        addCollectionColumn: {
            <T extends any = any>(driver: TDriver, name: string, column: string, after_column: string|false, cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): void
        }
        addCollectionColumnSync: {
            <T extends any = any>(driver: TDriver, name: string, column: string, after_column: string|false): T
        }
        renameCollectionColumn: {
            <T extends any = any>(driver: TDriver, name: string, oldColName: string, newColName: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): void
        }
        renameCollectionColumnSync: {
            <T extends any = any>(driver: TDriver, name: string, oldColName: string, newColName: string): T
        }
        modifyCollectionColumn: {
            <T extends any = any>(driver: TDriver, name: string, column: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): void
        }
        modifyCollectionColumnSync: {
            <T extends any = any>(driver: TDriver, name: string, column: string): T
        }
        dropCollectionColumn: {
            <T extends any = any>(driver: TDriver, name: string, column: string, cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): void
        }
        dropCollectionColumnSync: {
            <T extends any = any>(driver: TDriver, name: string, column: string): T
        }
    }
}