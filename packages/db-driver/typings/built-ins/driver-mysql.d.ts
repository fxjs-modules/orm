/// <reference types="@fibjs/types" />
import { FxDbDriverNS } from '../Typo';
import { FxOrmCoreCallbackNS } from '@fxjs/orm-core';
import { SQLDriver } from "./base.class";
export default class MySQLDriver extends SQLDriver<Class_MySQL> implements FxDbDriverNS.SQLDriver {
    constructor(conn: FxDbDriverNS.ConnectionInputArgs | string);
    switchDb(targetDb: string): void;
    open(): Class_MySQL;
    close(): void;
    ping(): void;
    begin(): void;
    commit(): void;
    trans<T = any>(cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): boolean;
    rollback(): void;
    getConnection(): Class_MySQL;
    dbExists(dbname: string): boolean;
    execute<T = any>(sql: string): T;
}
