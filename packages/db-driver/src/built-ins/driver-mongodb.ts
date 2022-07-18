/// <reference types="fib-pool" />

import db = require('db')

import { FxDbDriverNS } from '../Typo';
import { Driver } from "./base.class";

/**
 * @TODO there's no full support for mongodb on native fibjs,
 * we should implement one mongo driver with tcp/socket on JS and give all methods
 */
declare class Class_MongoDBConnection extends Class_MongoDB {
    getSiblingDB(name: string): this
    getName(): string

    [K: string]: any
}

export default class MongoDriver extends Driver<Class_MongoDBConnection> implements FxDbDriverNS.CommandDriver {
    constructor (conn: FxDbDriverNS.ConnectionInputArgs) {
        super(conn);

        this.connection = null
    }

    switchDb (targetDb: string) {
        if (!this.connection) this.open();

        const currentDb = this.connection.getName();
        if (currentDb === targetDb) return;

        this.connection.getSiblingDB(targetDb);
    }

    reopen () {
        try { this.close() } catch (error) {}
        return this.open()
    }

    open () {
        return super.open()
    }

    close (): void {
        if (this.connection) this.connection.close()
        this.connection = null;
    }
    
    ping (): void {}

    command<T = any> (cmd: string, arg?: any): T {
        return this.commands({ [cmd]: arg })
    }

    commands<T = any> (
        cmds: Record<string, any>,
        opts?: FxDbDriverNS.CommandDriverCommandOptions
    ): T {
        if (this.isPool)
            return this.pool(conn => conn.runCommand(cmds)) as any;

        if (!this.connection) this.open()
        return this.connection.runCommand(cmds) as any;
    }

    getConnection () {
        // @notice it's invalid cast, you should replace one JS implementation of mongodb
        return db.openMongoDB(this.uri) as Class_MongoDBConnection;
    }
}