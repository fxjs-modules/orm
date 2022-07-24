import type { IProperty } from "@fxjs/orm-property";

export namespace FxOrmSqlDDLSync__Collection {
    export interface Collection {
        // table name
        name: string
        properties: Record<string, IProperty>
        
        [ext_k: string]: any
    }
}