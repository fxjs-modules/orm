/// <reference path="_common.d.ts" />

/// <reference path="DXL.d.ts" />

declare namespace FxOrmDDL {
    class DDLDriver<ConnType = any> extends FxOrmDXL.DXLDriver<ConnType> {
        // uid: string
        createTable: {
            <T=Fibjs.AnyObject[]>(
                table: string
            ): T
        }
        dropTable: {
            <T=number>(
                table: string
            ): number
        }
    }
}