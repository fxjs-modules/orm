/// <reference types="@fibjs/types" />
import type { FxOrmCommon } from '../../Typo/_common';
import type { FxOrmDb } from '../../Typo/Db';
declare const Driver: typeof import("@fxjs/db-driver/typings/built-ins/driver-postgresql").default;
export default class PostgresqlDatabase extends Driver implements FxOrmDb.Database<Class_DbConnection> {
    eventor: Class_EventEmitter;
    connect(cb?: FxOrmCommon.GenericCallback<Class_DbConnection>): Class_DbConnection;
    query<T = any>(sql: string, cb?: FxOrmCommon.GenericCallback<T>): any;
}
export {};
