import type { IProperty } from "@fxjs/orm-property";
import { FxOrmSqlDDLSync__DbIndex } from "./DbIndex";

export namespace FxOrmSqlDDLSync__Collection {
    export interface Collection {
        // table name
        name: string
        properties: Record<string, IProperty>

        index_defs: FxOrmSqlDDLSync__DbIndex.CollectionDbIndexInfo[]
        
        // [ext_k: string]: any
    }
}