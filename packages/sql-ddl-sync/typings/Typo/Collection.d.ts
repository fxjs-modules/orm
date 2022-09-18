import type { IProperty } from "@fxjs/orm-property";
import { FxOrmSqlDDLSync__DbIndex } from "./DbIndex";
export declare namespace FxOrmSqlDDLSync__Collection {
    interface Collection {
        name: string;
        properties: Record<string, IProperty>;
        index_defs: FxOrmSqlDDLSync__DbIndex.CollectionDbIndexInfo[];
    }
}
