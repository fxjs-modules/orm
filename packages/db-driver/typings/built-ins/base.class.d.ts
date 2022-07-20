/// <reference types="@fibjs/types" />
/// <reference types="fib-pool" />
import { FxDbDriverNS } from '../Typo';
import { FxOrmCoreCallbackNS } from '@fxjs/orm-core';
declare function getDriver(name: 'mysql'): typeof import('./driver-mysql').default;
declare function getDriver(name: 'psql' | 'postgresql' | 'pg'): typeof import('./driver-postgresql').default;
declare function getDriver(name: 'sqlite'): typeof import('./driver-sqlite').default;
declare function getDriver(name: 'redis'): typeof import('./driver-redis').default;
export declare namespace Driver {
    export type IConnTypeEnum = Class_DbConnection | Class_MongoDB | Class_Redis;
    type IClass_PostgreSQL = Class_DbConnection;
    type IClass_MSSQL = Class_DbConnection;
    export type ISQLConn = IClass_PostgreSQL | IClass_MSSQL | Class_SQLite | Class_MySQL;
    export type ITypedDriver<T extends IConnTypeEnum = IConnTypeEnum> = T extends ISQLConn ? SQLDriver<T> : T extends Class_MongoDB ? import('./driver-mongodb').default : T extends Class_Redis ? import('./driver-redis').default : Driver<T>;
    export type ISQLDriver = ITypedDriver<ISQLConn>;
    export {};
}
export declare class Driver<CONN_TYPE extends Driver.IConnTypeEnum = Driver.IConnTypeEnum> {
    static getDriver: typeof getDriver;
    static create(input: FxDbDriverNS.ConnectionInputArgs | string): import("./driver-mysql").default;
    /**
     * @descritpin there's a bug in fibjs <= 0.35.x, only string type `field` would be
     * used by `url.format`
     */
    static formatUrl(input: FxDbDriverNS.ConnectionInputArgs): string;
    readonly uid: string;
    get uri(): string;
    readonly config: FxDbDriverNS.DBConnectionConfig;
    readonly extend_config: Fibjs.AnyObject & FxDbDriverNS.DriverBuiltInExtConfig;
    type: FxDbDriverNS.DriverType;
    connection: CONN_TYPE;
    pool: FibPoolNS.FibPool<CONN_TYPE, any>;
    get isPool(): boolean;
    get isSql(): boolean;
    get isNoSql(): boolean;
    get isCommand(): boolean;
    constructor(options: FxDbDriverNS.ConnectionInputArgs | string);
    /**
     * @description switch to another database, pointless for some databases such as sqlite
     * @param targetDb
     */
    switchDb(targetDb: string): void;
    /**
     * @description re open db connection
     */
    reopen(): CONN_TYPE;
    /**
     * @description open db connection
     */
    open(): CONN_TYPE;
    /**
     * @description close db connection
     */
    close(): void;
    /**
     * @description some db connection has `ping` method
     */
    ping(): void;
    /**
     * @description get connection instance but don't change internal status
     */
    getConnection(): CONN_TYPE;
    connectionPool(callback: (connection: CONN_TYPE) => any): any;
    useTrans(callback: (conn_for_trans: CONN_TYPE) => any): any;
    [sync_method: string]: any;
}
export declare class SQLDriver<CONN_TYPE extends Driver.IConnTypeEnum> extends Driver<CONN_TYPE> implements FxDbDriverNS.SQLDriver {
    currentDb: FxDbDriverNS.SQLDriver['currentDb'];
    /**
     * @override
     */
    begin(): void;
    /**
     * @override
     */
    commit(): void;
    /**
     * @override
     */
    trans<T>(cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): boolean;
    /**
     * @override
     */
    rollback(): void;
    execute<T>(sql: string): T;
}
export {};
