/// <reference types="@fibjs/types" />
import type { FxOrmCommon } from '../../Typo/_common';
import type { FxOrmDb } from '../../Typo/Db';
declare const Driver: typeof import("@fxjs/db-driver/typings/built-ins/base.class").MySQLDriver;
export declare class Database extends Driver implements FxOrmDb.DatabaseBase<Class_MySQL> {
    eventor: Class_EventEmitter;
    connect(cb?: FxOrmCommon.GenericCallback<Class_MySQL>): Class_MySQL;
    query<T = any>(sql: string, cb?: FxOrmCommon.GenericCallback<T>): any;
}
export {};
