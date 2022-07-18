/// <reference types="@fibjs/types" />
/// <reference types="fib-pool" />
import { FxOrmCoreCallbackNS } from "@fxjs/orm-core";
export declare namespace FxDbDriverNS {
    type DriverType = 'mysql' | 'sqlite' | 'psql' | 'redis' | 'unknown';
    interface ConnectionInputArgs {
        protocol?: string;
        /**
         *
         * prioty: hasOwnProperty('hostname') > host
         */
        hostname?: string;
        host?: string;
        port?: number | string;
        /**
         * if auth existed, user/password would be overwritten
         */
        auth?: string;
        username?: string;
        password?: string;
        database?: string;
        pool?: boolean | ConnectionPoolOptions;
        debug?: boolean;
        pathname?: string;
        query?: Fibjs.AnyObject;
        href?: string;
        [extra: string]: any;
    }
    interface ConnectionPoolOptions {
        maxsize?: FibPoolNS.FibPoolOptionArgs['maxsize'];
        timeout?: FibPoolNS.FibPoolOptionArgs['timeout'];
        retry?: FibPoolNS.FibPoolOptionArgs['retry'];
    }
    /**
     * @description plain object, not Url Object
     */
    interface DBConnectionConfig {
        protocol: ConnectionInputArgs['protocol'];
        slashes: Class_UrlObject['slashes'];
        query: ConnectionInputArgs['query'];
        database: ConnectionInputArgs['database'];
        username: ConnectionInputArgs['username'];
        password: ConnectionInputArgs['password'];
        host: ConnectionInputArgs['host'];
        href: ConnectionInputArgs['href'];
        pathname: ConnectionInputArgs['pathname'];
        [extra: string]: any;
    }
    interface DriverBuiltInExtConfig {
        pool: false | ConnectionPoolOptions;
        debug: boolean;
    }
    interface DriverExtendTransaction {
        begin: {
            <T = any>(): void;
        };
        commit: {
            <T = any>(): void;
        };
        rollback: {
            <T = any>(): void;
        };
        trans: {
            <T = any>(cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): boolean;
        };
    }
    interface DriverConfig {
        database: string;
        [ext_cfg_name: string]: any;
    }
}
export declare namespace FxDbDriverNS {
    type DriverUidType = string;
    interface QueryDataPayload {
        [key: string]: any;
    }
    interface QueriedCountDataPayload {
        c: number;
    }
}
export declare namespace FxDbDriver__Driver_SQLShared {
    interface SyncOptions {
        id: string[];
        table: string;
    }
    interface DropOptions {
        table: string;
    }
}
export declare namespace FxDbDriverNS {
    interface SQLDriver extends DriverExtendTransaction {
        currentDb: string;
        execute: {
            <T = any>(sql: string): T;
        };
    }
    interface CommandDriverCommandOptions {
        parallel?: boolean;
    }
    interface CommandDriver {
        command: {
            <T = any>(cmd: string, ...args: any[]): T;
        };
        commands: {
            <T = any>(cmds: Fibjs.AnyObject, opts?: CommandDriverCommandOptions): T;
        };
    }
    interface ServiceDriver {
        /**
         * @description is this service support rest api
         * @sample elasticsearch, tdengine
         */
        readonly isRest: boolean;
    }
}
