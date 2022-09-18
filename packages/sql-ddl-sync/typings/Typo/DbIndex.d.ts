export declare namespace FxOrmSqlDDLSync__DbIndex {
    interface DbIndexInfo {
        name?: string;
        columns: (string | {
            string: number;
            column: string;
        })[];
        unique?: boolean;
    }
    interface CollectionDbIndexInfo extends Required<DbIndexInfo> {
        collection: string;
    }
}
