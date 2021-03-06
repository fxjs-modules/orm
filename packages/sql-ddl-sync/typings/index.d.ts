import { FxOrmSqlDDLSync__Collection } from "./Typo/Collection";
import { FxOrmSqlDDLSync__Column } from "./Typo/Column";
import { FxOrmSqlDDLSync__DbIndex } from "./Typo/DbIndex";
import { FxOrmSqlDDLSync__Dialect } from "./Typo/Dialect";
import { FxOrmSqlDDLSync__Driver } from "./Typo/Driver";
import { FxOrmSqlDDLSync } from "./Typo/_common";
import { FxOrmCoreCallbackNS } from '@fxjs/orm-core';
import "./Dialects";
import { IDbDriver } from "@fxjs/db-driver";
export declare function dialect(name: FxOrmSqlDDLSync__Dialect.DialectType): FxOrmSqlDDLSync__Dialect.Dialect;
export declare class Sync<ConnType = any> {
    strategy: FxOrmSqlDDLSync.SyncCollectionOptions['strategy'];
    /**
     * @description total changes count in this time `Sync`
     * @deprecated
     */
    total_changes: number;
    readonly collections: FxOrmSqlDDLSync__Collection.Collection[];
    readonly dbdriver: IDbDriver<ConnType>;
    readonly Dialect: FxOrmSqlDDLSync__Dialect.Dialect;
    /**
     * @description customTypes
     */
    readonly types: FxOrmSqlDDLSync__Driver.CustomPropertyTypeHash;
    private suppressColumnDrop;
    private debug;
    constructor(options: FxOrmSqlDDLSync.SyncOptions<ConnType>);
    [sync_method: string]: any;
    defineCollection(collection_name: string, properties: FxOrmSqlDDLSync__Collection.Collection['properties']): this;
    findCollection(collection_name: string): FxOrmSqlDDLSync__Collection.Collection;
    defineType(type: string, proto: FxOrmSqlDDLSync__Driver.CustomPropertyType): this;
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
    /**
     *
     * @param collection collection relation to find its indexes
     */
    getCollectionIndexes(collection: FxOrmSqlDDLSync__Collection.Collection): FxOrmSqlDDLSync__DbIndex.DbIndexInfo[];
    syncIndexes(collection_name: string, indexes: FxOrmSqlDDLSync__DbIndex.DbIndexInfo[]): void;
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
    needDefinitionToColumn(property: FxOrmSqlDDLSync__Column.Property, column: FxOrmSqlDDLSync__Column.Property, options?: {
        collection?: string;
    }): boolean;
}
export type { FxOrmSqlDDLSync } from "./Typo/_common";
export type { FxOrmSqlDDLSync__Driver } from "./Typo/Driver";
export type { FxOrmSqlDDLSync__Dialect } from "./Typo/Dialect";
export type { FxOrmSqlDDLSync__Column } from "./Typo/Column";
