/// <reference types="@fibjs/types" />
/// <reference types="@fibjs/enforce" />
/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />
/// <reference types="fib-pool" />

/// <reference path="_common.d.ts" />
/// <reference path="settings.d.ts" />

/// <reference path="model.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="instance.d.ts" />

/// <reference path="Error.d.ts" />
/// <reference path="Validators.d.ts" />

/// <reference path="DXL.d.ts" />
/// <reference path="DML.d.ts" />
/// <reference path="DDL.d.ts" />

// fix fibjs types' missing
// declare var console: any

declare namespace FxOrmNS {
    /* next generation :start */
    class Class_ORM<ConnType = any> {
        static Op: {
            [k: string]: Symbol
        }
        /**
         * @description create one orm, but never do any real connection
         */
        static create (connection: string | FxDbDriverNS.ConnectionInputArgs): Class_ORM

        /**
         * @description create orm and connect it
         */
        static connect (connection: string | FxDbDriverNS.DBConnectionConfig): Class_ORM

        driver: FxDbDriverNS.Driver<ConnType>

        settings: any

        readonly models: {[k: string]: FxOrmModel.Class_Model}
        $dml: any; // FxOrmDML.DMLDriver;
        $ddl: any; // FxOrmDDL.DDLDriver;
    }
    /* next generation :end */
}
