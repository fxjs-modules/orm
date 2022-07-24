/// <reference types="@fibjs/types" />
import { FxOrmSqlDDLSync__Dialect } from "../Typo/Dialect";
declare type IDialect = FxOrmSqlDDLSync__Dialect.Dialect<Class_SQLite>;
export declare const hasCollectionSync: IDialect['hasCollectionSync'];
export declare const hasCollection: IDialect['hasCollection'];
/**
 * @no_test
 */
export declare const addPrimaryKeySync: IDialect['addPrimaryKeySync'];
export declare const addPrimaryKey: IDialect['addPrimaryKey'];
export declare const dropPrimaryKeySync: IDialect['dropPrimaryKeySync'];
export declare const dropPrimaryKey: IDialect['dropPrimaryKey'];
export declare const addForeignKeySync: IDialect['addForeignKeySync'];
export declare const addForeignKey: IDialect['addForeignKey'];
export declare const dropForeignKeySync: IDialect['dropForeignKeySync'];
export declare const dropForeignKey: IDialect['dropForeignKey'];
export declare const getCollectionColumnsSync: IDialect['getCollectionColumnsSync'];
export declare const getCollectionColumns: IDialect['getCollectionColumns'];
export declare const getCollectionPropertiesSync: IDialect['getCollectionPropertiesSync'];
export declare const getCollectionProperties: IDialect['getCollectionProperties'];
export declare const createCollectionSync: IDialect['createCollectionSync'];
export declare const createCollection: IDialect['createCollection'];
export declare const dropCollectionSync: IDialect['dropCollectionSync'];
export declare const dropCollection: IDialect['dropCollection'];
export declare const hasCollectionColumnsSync: IDialect['hasCollectionColumnsSync'];
export declare const hasCollectionColumns: IDialect['hasCollectionColumns'];
export declare const addCollectionColumnSync: IDialect['addCollectionColumnSync'];
export declare const addCollectionColumn: IDialect['addCollectionColumn'];
export declare const renameCollectionColumnSync: IDialect['renameCollectionColumnSync'];
export declare const renameCollectionColumn: IDialect['renameCollectionColumn'];
export declare const modifyCollectionColumnSync: IDialect['modifyCollectionColumnSync'];
export declare const modifyCollectionColumn: IDialect['modifyCollectionColumn'];
export declare const dropCollectionColumnSync: IDialect['dropCollectionColumnSync'];
export declare const dropCollectionColumn: IDialect['dropCollectionColumn'];
export declare const getCollectionIndexesSync: IDialect['getCollectionIndexesSync'];
export declare const getCollectionIndexes: IDialect['getCollectionIndexes'];
export declare const addIndexSync: IDialect['addIndexSync'];
export declare const addIndex: IDialect['addIndex'];
export declare const removeIndexSync: IDialect['removeIndexSync'];
export declare const removeIndex: IDialect['removeIndex'];
export declare const processKeys: IDialect['processKeys'];
export declare const supportsType: IDialect['supportsType'];
export declare const toRawType: IDialect['toRawType'];
export {};
