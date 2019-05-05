declare namespace FxOrmSqlDDLSync__SQL {
    interface TableOptions {
        name: string

        keys?: string[]
        columns?: string[]
    }

    interface IndexOptions extends TableOptions {
        unique?: boolean
        // table/collection name
        collection?: string
    }

    interface TableColumnOptionsBase {
        // table/collection name
        name: string
    }

    interface AddColumnOptions extends TableColumnOptionsBase {
        // column name
        column: string
        first?: boolean
        after?: string|false
    }

    interface AlterColumnOptions extends TableColumnOptionsBase {
        // column name
        column: string
    }

    interface AlertColumnRenameOptions extends TableColumnOptionsBase {
        oldColName: string
        newColName: string
    }
}