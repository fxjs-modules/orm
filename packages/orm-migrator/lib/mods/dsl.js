/// <reference path="../../@types/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const DBDriver = require("@fxjs/db-driver");
const SqlQuery = require("@fxjs/sql-query");
const SqlDDLSync = require("@fxjs/sql-ddl-sync");
function getColumnMetadata(property) {
    return property.hasOwnProperty('addSQL') ? property.addSQL : "";
}
;
function transformColumnToAdd(dsl, collection, name, property) {
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
    };
}
;
class DSL {
    constructor(conn_string) {
        this.driver = DBDriver.create(conn_string);
        const type = this.driver.type;
        this.Dialect = SqlDDLSync.dialect(type);
        const SqDialect = SqlQuery.Dialects[type];
        this.escapeId = SqDialect.escapeId;
        this.escapeVal = SqDialect.escapeVal;
        this.escapeQuery = SqDialect.escape;
    }
    createTable(collectionName, properties) {
        const columns = [];
        let keys = [];
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
        return this.Dialect.createCollectionSync(this.driver, collectionName, columns, keys);
    }
    ;
    hasTable(collectionName) {
        return this.Dialect.hasCollectionSync(this.driver, collectionName);
    }
    dropTable(collectionName) {
        return this.Dialect.dropCollectionSync(this.driver, collectionName);
    }
    getColumns(collectionName) {
        return this.Dialect.getCollectionPropertiesSync(this.driver, collectionName);
    }
    addColumn(collectionName, columnName, property) {
        const column = transformColumnToAdd(this, collectionName, columnName, property);
        if (column)
            this.Dialect.addCollectionColumnSync(this.driver, collectionName, column.value, null);
    }
    hasColumn(collectionName, columnName) {
        const columns = this.getColumns(collectionName);
        return columns.hasOwnProperty(columnName);
    }
    dropColumn(collectionName, columnName) {
        if (this.driver.type === 'sqlite') {
            /**
             * sqlite doesn't support drop column by SQL directly; you should
             * always create new table
             * @see https://www.techonthenet.com/sqlite/tables/alter_table.php
             */
            const columns = this.getColumns(collectionName);
            const flag = Date.now();
            const columnTypeLines = [];
            Object.keys(columns).map(col_name => {
                const col = columns[col_name];
                const type = this.Dialect.getType(collectionName, col, this.driver);
                if (!type || col_name === columnName)
                    return;
                columnTypeLines.push({
                    name: col_name,
                    value: type.value
                });
            });
            ;
            [
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
                this.execQuery(sqlLine, []);
            });
        }
        else {
            this.Dialect.dropCollectionColumnSync(this.driver, collectionName, columnName);
        }
    }
    renameColumn(collectionName, oldName, newName) {
        this.Dialect.renameCollectionColumnSync(this.driver, collectionName, oldName, newName);
    }
    addIndex(indexName, options) {
        this.Dialect.addIndexSync(this.driver, indexName, options.unique, options.table, options.columns);
    }
    dropIndex(collectionName, indexName) {
        this.Dialect.removeIndexSync(this.driver, indexName, collectionName);
    }
    addPrimaryKey(collectionName, columnName) {
        this.Dialect.addPrimaryKeySync(this.driver, collectionName, columnName);
    }
    dropPrimaryKey(collectionName, columnName) {
        this.Dialect.dropPrimaryKeySync(this.driver, collectionName, columnName);
    }
    addForeignKey(collectionName, options) {
        this.Dialect.addForeignKeySync(this.driver, collectionName, options);
    }
    dropForeignKey(collectionName, columnName) {
        this.Dialect.dropForeignKeySync(this.driver, collectionName, columnName);
    }
    execQuery(query, args) {
        return this.driver.execute(this.escapeQuery(query, args));
    }
}
exports.default = DSL;
