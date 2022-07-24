import type { IProperty } from "@fxjs/orm-property";
export declare namespace FxOrmSqlDDLSync__Collection {
    interface Collection {
        name: string;
        properties: Record<string, IProperty>;
        [ext_k: string]: any;
    }
}
