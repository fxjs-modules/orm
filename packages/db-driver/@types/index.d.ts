/// <reference types="@fibjs/types" />
/// <reference types="@fxjs/orm-core" />
/// <reference types="fib-pool" />

declare namespace FxDbDriverNS {
    type DriverType = 'mysql' | 'sqlite' | 'redis' | 'mongodb' | 'unknown'

    interface ConnectionInputArgs {
        protocol?: string;
        /**
         *
         * prioty: hasOwnProperty('hostname') > host
         */
        hostname?: string;
        host?: string;
        port?: number|string;
        /**
         * if auth existed, user/password would be overwritten
         */
        auth?: string;
        username?: string;
        password?: string;

        database?: string;
        pool?: boolean | ConnectionPoolOptions;
        debug?: boolean;
        pathname?: string
        query?: Fibjs.AnyObject
        href?: string

        [extra: string]: any
    }

    interface ConnectionPoolOptions {
        maxsize?: FibPoolNS.FibPoolOptionArgs['maxsize']
        timeout?: FibPoolNS.FibPoolOptionArgs['timeout']
        retry?: FibPoolNS.FibPoolOptionArgs['retry']
    }

    /**
     * @description plain object, not Url Object
     */
    interface DBConnectionConfig {
        protocol: ConnectionInputArgs['protocol']
        slashes: Class_UrlObject['slashes']
        query: ConnectionInputArgs['query']
        database: ConnectionInputArgs['database']
        username: ConnectionInputArgs['username']
        password: ConnectionInputArgs['password']
        host: ConnectionInputArgs['host']

        href: ConnectionInputArgs['href']
        pathname: ConnectionInputArgs['pathname']

        [extra: string]: any
    }

    interface DriverBuiltInExtConfig {
        pool: false | ConnectionPoolOptions
        debug: boolean
    }

    interface DriverExtendTransaction {
        /* transaction about :start */
        begin: {
            <T=any>(): void
        };
        commit: {
            <T=any>(): void
        };
        rollback: {
            <T=any>(): void
        };
        trans: {
            <T=any>(cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): boolean
        }
        /* transaction about :end */
    }

    class Driver<CONN_TYPE = any> {
        static getDriver(
            name: FxDbDriverNS.DriverType | string
        ): typeof Driver
        static create<CreateCONN_TYPE = any> (options: ConnectionInputArgs | string): Driver<CreateCONN_TYPE>

        constructor (options: ConnectionInputArgs | string)

        readonly uid: string
        readonly uri: string
        readonly isPool: boolean;
        /**
         * @description whether driver is based on sql query
         */
        readonly isSql: boolean
        /**
         * @description whether driver is nosql
         */
        readonly isNoSql: boolean
        /**
         * @description whether driver is based on command
         */
        readonly isCommand: boolean

        type: DriverType
        config: DBConnectionConfig
        extend_config: Fibjs.AnyObject & DriverBuiltInExtConfig

        connection: CONN_TYPE
        pool?: FibPoolNS.FibPoolFunction<CONN_TYPE>

        // knex: FXJSKnex.FXJSKnexModule.KnexInstance

        /**
         * @description re open db connection
         */
        reopen: {
            (): CONN_TYPE
        }
        /**
         * @description open db connection
         */
        open: {
            (): CONN_TYPE
        }
        /**
         * @description close db connection
         */
        close: {
            (): void
        }
        /**
         * @description some db connection has `ping` method
         */
        ping: {
            (): void
        }
        /**
         * @description get connection instance but don't change internal status
         */
        getConnection (): CONN_TYPE

        connectionPool (callback: (connection: CONN_TYPE) => any): any

        useTrans<T = any> (callback: (conn_for_trans: CONN_TYPE) => T): T

        [ext_key: string]: any
    }

    interface DriverConfig {
        database: string

        [ext_cfg_name: string]: any
    }
}

declare namespace FxDbDriverNS {
    type DriverUidType = string

    interface QueryDataPayload {
        [key: string]: any
    }

    interface QueriedCountDataPayload {
        c: number
    }
}

declare namespace FxDbDriver__Driver_SQLShared {
    interface SyncOptions {
        id: string[]
        table: string
    }

    interface DropOptions {
        table: string
    }
}

declare namespace FxDbDriverNS {
    interface SQLDriver extends Driver, DriverExtendTransaction {
        currentDb: string
        switchDb (targetDb: string): void

        execute: {
            <T=any>(sql: string): T;
        }
    }

    interface CommandDriverCommandOptions {
        parallel?: boolean
    }
    interface CommandDriver extends Driver {
        command: {
            <T=any>(cmd: string, ...args: any[]): T;
        }
        commands: {
            <T=any>(cmds: Fibjs.AnyObject, opts?: CommandDriverCommandOptions): T;
        }
    }

    interface ServiceDriver extends Driver {
        /**
         * @description is this service support rest api
         * @sample elasticsearch, tdengine
         */
        readonly isRest: boolean
    }
}

declare namespace FxDbDriverNS {
    type ExportModule = typeof FxDbDriverNS.Driver
}

declare module "@fxjs/db-driver" {
    const mod: FxDbDriverNS.ExportModule
    export = mod
}
