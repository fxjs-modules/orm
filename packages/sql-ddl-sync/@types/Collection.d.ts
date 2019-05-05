declare namespace FxOrmSqlDDLSync__Collection {
    interface Collection {
        // table name
        name: string
        properties: {
            [k: string]: FxOrmSqlDDLSync__Column.Property
        }
        
        [ext_k: string]: any
    }

    interface CollectionIndexInfo {

    }
}