/// <reference types="@fibjs/types" />
import { FxDbDriverNS } from '../Typo';
import { FxOrmCoreCallbackNS } from '@fxjs/orm-core';
import { SQLDriver } from "./base.class";
export default class PostgreSQLDriver extends SQLDriver<Class_DbConnection> implements FxDbDriverNS.SQLDriver {
    constructor(conn: FxDbDriverNS.ConnectionInputArgs | string);
    switchDb(targetDb: string): void;
    open(): Class_DbConnection;
    close(): void;
    ping(): void;
    begin(): void;
    commit(): void;
    trans<T = any>(cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): boolean;
    rollback(): void;
    getConnection(): Class_DbConnection;
    execute<T = any>(sql: string): T;
}
