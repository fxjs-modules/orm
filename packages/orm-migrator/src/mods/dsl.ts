/// <reference path="../../@types/index.d.ts" />

import DBDriver = require('@fxjs/db-driver');
import SqlQuery = require('@fxjs/sql-query');
import SqlDDLSync = require('@fxjs/sql-ddl-sync');

function getColumnMetadata(property: FxOrmSqlDDLSync__Column.Property): "" | string {
    return property.hasOwnProperty('addSQL') ? property.addSQL : "";
};

function transformColumnToAdd(
    dsl: FxORMMigratorDSL.DSL,
    collection: FxOrmSqlDDLSync.TableName,
    name: string,
    property: FxOrmSqlDDLSync__Column.Property,
): false | FxOrmSqlDDLSync__Column.OpResult__CreateColumn {
    let type = dsl.Dialect.getType(collection, property, dsl.driver);

    if (type === false) {
        return false;
    }
    if (typeof type == "string") {
        type = { value: type };
    }

    const meta = getColumnMetadata(property);

    return {
        value: `${dsl.escapeId(name)} ${type.value} ${meta}`,
        // before: type.before
    };
};

export default class DSL<ConnType = any> implements FxORMMigratorDSL.DSL {
    driver: FxDbDriverNS.Driver<ConnType>
    Dialect: FxOrmSqlDDLSync__Dialect.Dialect

    escapeId: FxSqlQueryDialect.Dialect['escapeId']
    escapeVal: FxSqlQueryDialect.Dialect['escapeVal']
    escapeQuery: FxSqlQueryDialect.Dialect['escape']

    constructor(conn_string: FxDbDriverNS.ConnectionInputArgs | string) {
        this.driver = DBDriver.create<ConnType>(conn_string);
        const type = this.driver.type as FxOrmSqlDDLSync__Dialect.DialectType;
        this.Dialect = SqlDDLSync.dialect(type);

        const SqDialect = (SqlQuery.Dialects as any)[type] as FxSqlQueryDialect.Dialect;
        this.escapeId = SqDialect.escapeId;
        this.escapeVal = SqDialect.escapeVal;
        this.escapeQuery = SqDialect.escape;
    }

    createTable<T = any>(
        collectionName: string,
        properties: FxORMMigratorDSL.Properties__createTable,
    ): T {
        const columns = [];
        let keys = <string[]>[];

        for (let k in properties) {
            const col = transformColumnToAdd(this, collectionName, k, properties[k]);

            if (col === false)
                throw new Error("Unknown type for property '" + k + "'");

            // `primary` is deprecated in favour of `key`
            if (properties[k].key || properties[k].primary) {
                keys.push(k);
            }

            if (typeof this.Dialect.processKeys == "function") {
                keys = this.Dialect.processKeys(keys);
            }

            columns.push(col.value);
        }

        return this.Dialect.createCollectionSync(this.driver, collectionName, columns, keys) as T
    };

    hasTable(
        collectionName: FxOrmSqlDDLSync.TableName
    ): boolean {
        return this.Dialect.hasCollectionSync(this.driver, collectionName);
    }

    dropTable(
        collectionName: string
    ): void {
        return this.Dialect.dropCollectionSync(this.driver, collectionName);
    }

    getColumns(
        collectionName: FxOrmSqlDDLSync.TableName
    ): FxOrmSqlDDLSync__Column.ColumnInfoHash {
        return this.Dialect.getCollectionPropertiesSync(this.driver, collectionName)
    }

    addColumn(
        collectionName: FxOrmSqlDDLSync.TableName,
        columnName: string,
        property: FxOrmSqlDDLSync__Column.Property
    ): void {
        const column = transformColumnToAdd(this, collectionName, columnName, property);

        if (column)
            this.Dialect.addCollectionColumnSync(this.driver, collectionName, column.value, null);
    }

    hasColumn (
        collectionName: FxOrmSqlDDLSync.TableName,
        columnName: string
    ): boolean {
        const columns = this.getColumns(collectionName);

        return columns.hasOwnProperty(columnName)
    }

    dropColumn(
        collectionName: FxOrmSqlDDLSync.TableName,
        columnName: string,
    ): void {
        if (this.driver.type === 'sqlite') {
            /**
             * sqlite doesn't support drop column by SQL directly; you should 
             * always create new table
             * @see https://www.techonthenet.com/sqlite/tables/alter_table.php
             */
            const columns = this.getColumns(collectionName);
            const flag = Date.now();
            const columnTypeLines = <{name: string, value: string}[]>[]
            Object.keys(columns).map(col_name => {
                const col = columns[col_name];
                const type = this.Dialect.getType(collectionName, col, this.driver);
                
                if (!type || col_name === columnName)
                    return 

                columnTypeLines.push({
                    name: col_name,
                    value: type.value
                })
            });

            ;[
                `PRAGMA foreign_keys=off;`,
                `BEGIN TRANSACTION;`,

                `ALTER TABLE ${collectionName} RENAME TO _${collectionName}_old_${flag};`,

                `CREATE TABLE ${collectionName} (
                    ${columnTypeLines.map(x => `${x.name} ${x.value}`).join('\n')}
                );`,

                `
                INSERT INTO ${collectionName} (${columnTypeLines.map(x => x.name).join(', ')})
                SELECT ${columnTypeLines.map(x => x.name).join(', ')}
                FROM _${collectionName}_old_${flag};
                `,

                `COMMIT;`,

                `PRAGMA foreign_keys=on;`
            ]
            .filter(sqlLine => {
                this.execQuery(sqlLine, [])
            })
        } else {
            this.Dialect.dropCollectionColumnSync(this.driver, collectionName, columnName);
        }
    }

    renameColumn(
        collectionName: FxOrmSqlDDLSync.TableName,
        oldName: string,
        newName: string,
    ): void {
        this.Dialect.renameCollectionColumnSync(this.driver, collectionName, oldName, newName);
    }

    addIndex(
        indexName: string,
        options: FxORMMigratorDSL.Options__addIndex,
    ): void {
        this.Dialect.addIndexSync(this.driver, indexName, options.unique, options.table, options.columns);
    }

    dropIndex(
        collectionName: FxOrmSqlDDLSync.TableName,
        indexName: string
    ): void {
        this.Dialect.removeIndexSync(this.driver, indexName, collectionName)
    }

    addPrimaryKey(
        collectionName: FxOrmSqlDDLSync.TableName,
        columnName: string,
    ): void {
        this.Dialect.addPrimaryKeySync(this.driver, collectionName, columnName)
    }

    dropPrimaryKey<T = any>(
        collectionName: FxOrmSqlDDLSync.TableName,
        columnName: string,
    ) {
        this.Dialect.dropPrimaryKeySync(this.driver, collectionName, columnName);
    }

    addForeignKey(
        collectionName: FxOrmSqlDDLSync.TableName,
        options: FxORMMigratorDSL.Options__addForeignKey,
    ): void {
        this.Dialect.addForeignKeySync(this.driver, collectionName, options)
    }

    dropForeignKey(
        collectionName: FxOrmSqlDDLSync.TableName,
        columnName: string,
    ): void {
        this.Dialect.dropForeignKeySync(this.driver, collectionName, columnName)
    }

    execQuery<T = any>(
        query: string,
        args?: (string | number | Date | Class_Buffer | any)[]
    ): T {
        return this.driver.execute(
            this.escapeQuery(
                query, args    
            )
        )
    }
}