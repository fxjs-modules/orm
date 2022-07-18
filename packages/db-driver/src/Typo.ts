import { FxOrmCoreCallbackNS } from "@fxjs/orm-core"

export namespace FxDbDriverNS {
    export type DriverType =
        'mysql'
        | 'sqlite'
        | 'psql'
        // | 'mssql'
        | 'redis'
        // | 'mongodb'
        | 'unknown'

    export interface ConnectionInputArgs {
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

    export interface ConnectionPoolOptions {
        maxsize?: FibPoolNS.FibPoolOptionArgs['maxsize']
        timeout?: FibPoolNS.FibPoolOptionArgs['timeout']
        retry?: FibPoolNS.FibPoolOptionArgs['retry']
    }

    /**
     * @description plain object, not Url Object
     */
    export interface DBConnectionConfig {
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

    export interface DriverBuiltInExtConfig {
        pool: false | ConnectionPoolOptions
        debug: boolean
    }

    export interface DriverExtendTransaction {
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

    export interface DriverConfig {
        database: string

        [ext_cfg_name: string]: any
    }
}

export namespace FxDbDriverNS {
    export type DriverUidType = string

    export interface QueryDataPayload {
        [key: string]: any
    }

    export interface QueriedCountDataPayload {
        c: number
    }
}

export namespace FxDbDriver__Driver_SQLShared {
    export interface SyncOptions {
        id: string[]
        table: string
    }

    export interface DropOptions {
        table: string
    }
}

export namespace FxDbDriverNS {
    export interface SQLDriver extends DriverExtendTransaction {
        currentDb: string

        execute: {
            <T=any>(sql: string): T;
        }
    }

    export interface CommandDriverCommandOptions {
        parallel?: boolean
    }
    export interface CommandDriver {
        command: {
            <T=any>(cmd: string, ...args: any[]): T;
        }
        commands: {
            <T=any>(cmds: Fibjs.AnyObject, opts?: CommandDriverCommandOptions): T;
        }
    }

    export interface ServiceDriver {
        /**
         * @description is this service support rest api
         * @sample elasticsearch, tdengine
         */
        readonly isRest: boolean
    }
}