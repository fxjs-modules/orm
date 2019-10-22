/// <reference path="_common.d.ts" />

/// <reference path="DXL.d.ts" />

declare namespace FxOrmDDL {
  type KnexSchemaBuilder = FKnexNS.KnexInstance['schema'];

    class DDLDriver<ConnType = any> extends FxOrmDXL.DXLDriver<ConnType> {
        // uid: string
        createCollection: <T = Fibjs.AnyObject[]>(collection: string) => T
        alertCollection: <T = any>(collection: string) => T
        truncateCollection: <T = any>(collection: string) => T
        commentCollection: <T = any>(collection: string) => T
        dropCollection: <T = number>(collection: string) => T
        renameCollection: <T = number>(collection: string) => T
    }
}
