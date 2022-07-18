/// <reference types="@fibjs/types" />
import type { FxOrmCommon } from '../../Typo/_common';
import type { FxOrmDb } from '../../Typo/Db';
declare const Driver: typeof import("@fxjs/db-driver/typings/built-ins/driver-sqlite").default;
export declare class Database extends Driver implements FxOrmDb.DatabaseBase_SQLite {
    eventor: Class_EventEmitter;
    conn: Class_SQLite;
    get use_memory(): boolean;
    constructor(opts: any);
    connect(cb?: FxOrmCommon.GenericCallback<Class_SQLite>): Class_SQLite;
    query<T = any>(sql: string, cb?: FxOrmCommon.GenericCallback<T>): any;
    all<T = any>(sql: string, cb?: FxOrmCommon.GenericCallback<T>): any;
    get<T = any>(sql: string, cb?: FxOrmCommon.GenericCallback<T>): any;
}
export {};
