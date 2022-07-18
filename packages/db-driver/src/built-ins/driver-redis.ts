/// <reference types="fib-pool" />

import db = require('db')
import coroutine = require('coroutine')

import { FxDbDriverNS } from '../Typo';
import { Driver } from "./base.class";
import Utils = require('../utils')

export default class RedisDriver extends Driver<Class_Redis> implements FxDbDriverNS.CommandDriver {
    constructor (conn: FxDbDriverNS.ConnectionInputArgs | string) {
        super(conn);

        this.connection = null
    }

    open (): Class_Redis { return super.open() }

    close (): void {
        if (this.connection) this.connection.close()
    }
    
    ping (): void {}

    command<T = any> (cmd: string, ...args: any[]): T {
        if (this.isPool)
            return this.pool(conn => conn.command(cmd, ...args));

        if (!this.connection) this.open()
        return this.connection.command(cmd, ...args) as any;
    }

    commands<T = any> (
        cmds: Fibjs.AnyObject,
        opts?: FxDbDriverNS.CommandDriverCommandOptions
    ): T {
        const { parallel = false } = opts || {};

        if (parallel)
            return coroutine.parallel(Object.keys(cmds), (cmd: string) => {
                return { cmd, result: this.command(cmd, ...Utils.arraify(cmds[cmd])) }
            }) as any
        else
            return Object.keys(cmds).map((cmd: string) => {
                return { cmd, result: this.command(cmd, ...Utils.arraify(cmds[cmd])) }
            }) as any
    }

    getConnection (): Class_Redis { return db.openRedis(this.uri) }
}