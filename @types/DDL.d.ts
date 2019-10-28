/// <reference path="_common.d.ts" />

/// <reference path="DXL.d.ts" />

declare namespace FxOrmDDL {
  type KnexSchemaBuilder = FKnexNS.KnexInstance['schema'];

    class DDLDialect<ConnType = any> extends FxOrmDXL.DXLDialect<ConnType> {
        // uid: string
        createCollection: <T = Fibjs.AnyObject[]>(collection: string) => T
        alertCollection: <T = any>(collection: string) => T
        truncateCollection: <T = any>(collection: string) => T
        commentCollection: <T = any>(collection: string) => T
        dropCollection: (collection: string) => void
        renameCollection: <T = number>(collection: string) => T
    }
}
