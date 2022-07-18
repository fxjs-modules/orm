/// <reference types="@fibjs/types" />
import { FxDbDriverNS } from '../Typo';
import { Driver } from "./base.class";
export default class RedisDriver extends Driver<Class_Redis> implements FxDbDriverNS.CommandDriver {
    constructor(conn: FxDbDriverNS.ConnectionInputArgs | string);
    open(): Class_Redis;
    close(): void;
    ping(): void;
    command<T = any>(cmd: string, ...args: any[]): T;
    commands<T = any>(cmds: Fibjs.AnyObject, opts?: FxDbDriverNS.CommandDriverCommandOptions): T;
    getConnection(): Class_Redis;
}
