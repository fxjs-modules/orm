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
        static Opf: FxOrmQueries.Class_QueryBuilder['Opf']
        static Ql: FxOrmQueries.Class_QueryBuilder['Ql']
        static Qlfn: FxOrmQueries.Class_QueryBuilder['Qlfn']

        static Property: typeof FxOrmProperty.Class_Property

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
        static parseHQL (
            sql: string,
            opts?: {
                models?: {
                    [k: string]: FxOrmModel.Class_Model
                }
            }
        ): FxOrmQueries.HqLNormalizer

        constructor (
            driver: FxDbDriverNS.Driver<ConnType> | string | FxDbDriverNS.ConnectionInputArgs,
            opts?: {
                connection?: FxDbDriverNS.Driver<ConnType>['connection']
                ddl?: FxOrmDDL.DDLDialect<ConnType>
                dml?: FxOrmDML.DMLDialect<ConnType>
            }
        )

        driver: FxDbDriverNS.Driver<ConnType>
        connection: FxDbDriverNS.Driver<ConnType>['connection']

        settings: any

        readonly models: {[k: string]: FxOrmModel.Class_Model}
        readonly customProperties: {[k: string]: FxOrmProperty.CustomProperty}
        readonly modelDefinitions: {
            [k: string]: ((orm: FxOrmNS.Class_ORM, ...args: any) => FxOrmModel.Class_Model)
        }
        $dml: FxOrmDML.DMLDialect<ConnType>;
        $ddl: FxOrmDDL.DDLDialect<ConnType>;

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
          config?: FxOrmModel.Class_ModelDefinitionOptions
        ): FxOrmModel.Class_Model

        defineProperty (
            name: string,
            opts: {
                datastoreType: FxOrmProperty.CustomProperty['datastoreType'],
                valueToProperty: FxOrmProperty.CustomProperty['valueToProperty'],
                propertyToStoreValue: FxOrmProperty.CustomProperty['propertyToStoreValue']
            }
        ): FxOrmProperty.CustomProperty

        useTrans (callback: (orm: FxOrmNS.Class_ORM) => any): void
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
