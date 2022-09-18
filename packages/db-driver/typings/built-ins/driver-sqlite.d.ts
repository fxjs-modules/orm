/// <reference types="@fibjs/types" />
import { FxDbDriverNS } from '../Typo';
import { FxOrmCoreCallbackNS } from '@fxjs/orm-core';
import { SQLDriver } from "./base.class";
export default class SQLiteDriver extends SQLDriver<Class_SQLite> implements FxDbDriverNS.SQLDriver {
    constructor(conn: FxDbDriverNS.ConnectionInputArgs | string);
    open(): Class_SQLite;
    close(): void;
    ping(): void;
    begin(): void;
    commit(): void;
    trans<T = any>(cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): boolean;
    rollback(): void;
    getConnection(): Class_SQLite;
    dbExists(dbname: string): boolean;
    execute<T = any>(sql: string): T;
}
