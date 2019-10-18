/// <reference types="@fibjs/types" />
/// <reference types="@fibjs/enforce" />
/// <reference types="@fxjs/db-driver" />
/// <reference types="@fxjs/sql-query" />
/// <reference types="@fxjs/sql-ddl-sync" />
/// <reference types="fib-pool" />

/// <reference path="_common.d.ts" />
/// <reference path="settings.d.ts" />

/// <reference path="model.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="instance.d.ts" />
/// <reference path="dtransformer.d.ts" />

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
        static Op: FxOrmQueries.Class_QueryBuilder['Op']
        static Ql: FxOrmQueries.Class_QueryBuilder['Ql']
        static Qlfn: FxOrmQueries.Class_QueryBuilder['Qlfn']

        /**
         * @description create one orm, but never do any real connection
         */
        static create (connection: string | FxDbDriverNS.ConnectionInputArgs): Class_ORM

        /**
         * @description create orm and connect it
         */
        static connect (connection: string | FxDbDriverNS.DBConnectionConfig): Class_ORM

        /**
         * @description return one query normalizer
         */
        static parseHQL (...args: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmQueries.Class_QueryNormalizer>): FxOrmQueries.Class_QueryNormalizer

        driver: FxDbDriverNS.Driver<ConnType>

        settings: any

        readonly models: {[k: string]: FxOrmModel.Class_Model}
        $dml: any; // FxOrmDML.DMLDriver;
        $ddl: any; // FxOrmDDL.DDLDriver;
        /**
         * @description define one model with modelName(name) and properties(props)
         *
         * @param name
         * @param properties
         * @param config
         */
        define (
          name: string,
          properties: Fibjs.AnyObject,
          config: FxOrmModel.Class_ModelDefinitionOptions
        ): FxOrmModel.Class_Model

        defineFromHQLQuery (hql: string): FxOrmModel.Class_Model
        /**
         * @description sync all model in this.models to remote endpoints
         */
        sync (): void
        /**
         * @description sync all model in this.models from remote endpoints
         */
        drop (): void

        close (): void
    }
    /* next generation :end */
}
