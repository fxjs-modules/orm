/// <reference types="@fibjs/types" />
/// <reference types="@fxjs/sql-ddl-sync" />
/// <reference types="@fxjs/sql-query" />

declare namespace FxORMMigratorDSL {
    interface Properties__createTable {
        [k: string]: FxOrmSqlDDLSync__Column.Property
    }

    interface Properties__addColumn {
        [k: string]: FxOrmSqlDDLSync__Column.Property
    }

    interface Options__addIndex {
        unique: boolean
        table: FxOrmSqlDDLSync.TableName
        columns: string[]
    }

    interface Options__addForeignKey {
        [k: string]: any
    }
    
    class DSL {
        driver: FxDbDriverNS.Driver
        Dialect: FxOrmSqlDDLSync__Dialect.Dialect
        escapeId: FxSqlQueryDialect.Dialect['escapeId']
        escapeVal: FxSqlQueryDialect.Dialect['escapeVal']
        escapeQuery: FxSqlQueryDialect.Dialect['escape']
        
        constructor (driver: FxDbDriverNS.Driver);

        createTable (
            collectionName: string,
            properties: Properties__createTable,
        ): void;
        hasTable (
            collectionName: FxOrmSqlDDLSync.TableName
        ): boolean
        dropTable (
            collectionName: string
        ): void;

        getColumns (
            collectionName: FxOrmSqlDDLSync.TableName
        ): FxOrmSqlDDLSync__Column.ColumnInfoHash
        addColumn (
            collectionName: FxOrmSqlDDLSync.TableName,
            columnName: string,
            property: FxOrmSqlDDLSync__Column.Property
        ): void;
        /**
         * @warn `sqlite` not support this method.
         */
        dropColumn (
            collectionName: FxOrmSqlDDLSync.TableName,
            columnName: string,
        ): void;
        /**
         * @warn `sqlite` not support this method.
         */
        renameColumn (
            collectionName: FxOrmSqlDDLSync.TableName,
            oldName: string,
            newName: string,
        ): void;
        // addColumns (
        //     collectionName: FxOrmSqlDDLSync.TableName,
        //     properties: Properties__addColumn
        // ): void;

        addIndex (
            indexName: string,
            options: Options__addIndex,
        ): void;
        dropIndex (
            collectionName: FxOrmSqlDDLSync.TableName,
            indexName: string
        ): void;

        addPrimaryKey (
            collectionName: FxOrmSqlDDLSync.TableName,
            columnName: string,
        ): void;
        dropPrimaryKey<T = any>(
            collectionName: FxOrmSqlDDLSync.TableName,
            columnName: string,
        ): void;
        
        addForeignKey (
            collectionName: FxOrmSqlDDLSync.TableName,
            options: Options__addForeignKey,
        ): void;
        dropForeignKey (
            collectionName: FxOrmSqlDDLSync.TableName,
            columnName: string,
        ): void;

        execQuery <T = any>(
            query: string,
            args?: (string|number|Date|Class_Buffer|any)[]
        ): T;
    }
}