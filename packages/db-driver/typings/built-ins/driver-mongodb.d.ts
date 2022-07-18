/// <reference types="@fibjs/types" />
import { FxDbDriverNS } from '../Typo';
import { Driver } from "./base.class";
/**
 * @TODO there's no full support for mongodb on native fibjs,
 * we should implement one mongo driver with tcp/socket on JS and give all methods
 */
declare class Class_MongoDBConnection extends Class_MongoDB {
    getSiblingDB(name: string): this;
    getName(): string;
    [K: string]: any;
}
export default class MongoDriver extends Driver<Class_MongoDBConnection> implements FxDbDriverNS.CommandDriver {
    constructor(conn: FxDbDriverNS.ConnectionInputArgs);
    switchDb(targetDb: string): void;
    reopen(): Class_MongoDBConnection;
    open(): Class_MongoDBConnection;
    close(): void;
    ping(): void;
    command<T = any>(cmd: string, arg?: any): T;
    commands<T = any>(cmds: Record<string, any>, opts?: FxDbDriverNS.CommandDriverCommandOptions): T;
    getConnection(): Class_MongoDBConnection;
}
export {};
