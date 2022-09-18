import { FxOrmSqlDDLSync__Collection } from "./Typo/Collection";
import { FxOrmSqlDDLSync__DbIndex } from "./Typo/DbIndex";
import { FxOrmSqlDDLSync__Dialect } from "./Typo/Dialect";
import { FxOrmSqlDDLSync__Driver } from "./Typo/Driver";
import { FxOrmSqlDDLSync } from "./Typo/_common";
import { FxOrmCoreCallbackNS } from '@fxjs/orm-core';
import "./Dialects";
import { IProperty } from '@fxjs/orm-property';
import { IDbDriver } from "@fxjs/db-driver";
export declare function dialect(name: FxOrmSqlDDLSync__Dialect.DialectType | 'psql'): typeof import("./Dialects/mysql") | typeof import("./Dialects/sqlite");
export declare class Sync<T extends IDbDriver.ISQLConn = IDbDriver.ISQLConn> {
    strategy: FxOrmSqlDDLSync.SyncCollectionOptions['strategy'];
    /**
     * @description total changes count in this time `Sync`
     * @deprecated
     */
    total_changes: number;
    readonly collections: FxOrmSqlDDLSync__Collection.Collection[];
    readonly dbdriver: IDbDriver.ITypedDriver<T>;
    readonly Dialect: FxOrmSqlDDLSync__Dialect.Dialect<T>;
    /**
     * @description customTypes
     */
    readonly types: Record<string, FxOrmSqlDDLSync__Driver.CustomPropertyType<T>>;
    private suppressColumnDrop;
    private debug;
    constructor(options: FxOrmSqlDDLSync.SyncOptions<T>);
    [sync_method: string]: any;
    defineCollection(collection_name: string, properties: FxOrmSqlDDLSync__Collection.Collection['properties']): this;
    findCollection(collection_name: string): FxOrmSqlDDLSync__Collection.Collection;
    defineType(type: string, proto: FxOrmSqlDDLSync__Driver.CustomPropertyType<T>): this;
    /**
     * @description
     *  create collection in db if it doesn't exist, then sync all columns for it.
     *
     * @param collection collection relation to create
     */
    createCollection<T = any>(collection: FxOrmSqlDDLSync__Collection.Collection): T;
    /**
     * @description
     *  compare/diff properties between definition ones and the real ones,
     *  then sync column in definition but missing in the real
     *
     * @param collection collection properties user provided
     * @param opts
     *      - opts.columns: properties from user(default from db)
     *      - opts.strategy: (default soft) strategy when conflict between local and remote db, see details below
     *
     * @strategy
     *      - 'soft': no change
     *      - 'mixed': add missing columns, but never change existed column in db
     *      - 'hard': modify existed columns in db
     */
    syncCollection(_collection: string | FxOrmSqlDDLSync__Collection.Collection, opts?: FxOrmSqlDDLSync.SyncCollectionOptions): void;
    syncIndexes(collection_name: string, index_defs: FxOrmSqlDDLSync__DbIndex.CollectionDbIndexInfo[]): void;
    /**
     * @description
     *  sync all collections to db (if not existing), with initializing ones' properties.
     *
     * @callbackable
     */
    sync(cb: FxOrmCoreCallbackNS.ExecutionCallback<FxOrmSqlDDLSync.SyncResult>): void;
    sync(): FxOrmSqlDDLSync.SyncResult;
    /**
     * @description
     *  sync all collections to db whatever it existed,
     *  with sync ones' properties whatever the property existed.
     *
     * @callbackable
     */
    forceSync(cb: FxOrmCoreCallbackNS.ExecutionCallback<FxOrmSqlDDLSync.SyncResult>): void;
    forceSync(): FxOrmSqlDDLSync.SyncResult;
    /**
     * @description if sync one column
     *
     * @param property existed property in collection
     * @param column column expected to be synced
     */
    needDefinitionToColumn(property: IProperty, column: IProperty, options?: {
        collection?: string;
    }): boolean;
}
export type { FxOrmSqlDDLSync } from "./Typo/_common";
export type { FxOrmSqlDDLSync__Driver } from "./Typo/Driver";
export type { FxOrmSqlDDLSync__Dialect } from "./Typo/Dialect";
