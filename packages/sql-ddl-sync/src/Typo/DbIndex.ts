export namespace FxOrmSqlDDLSync__DbIndex {
    export interface DbIndexInfo {
        name?: string
        columns: (string | { string: number, column: string })[]
        unique?: boolean
    }

    export interface CollectionDbIndexInfo extends Required<DbIndexInfo> {
        collection: string
    }
}