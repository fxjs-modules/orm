/// <reference types="fib-pool" />

import db = require('db')

import { FxDbDriverNS } from '../Typo';
import { FxOrmCoreCallbackNS } from '@fxjs/orm-core';
import { SQLDriver } from "./base.class";
import { logDebugSQL } from '../utils';

export default class PostgreSQLDriver extends SQLDriver<Class_DbConnection> implements FxDbDriverNS.SQLDriver {
    constructor (conn: FxDbDriverNS.ConnectionInputArgs | string) {
        super(conn);

        this.connection = null
    }

    /**
     * @description unsafe for parallel execution, make sure call it in serial
     * @param targetDb 
     */
    switchDb (targetDb: string) {
        // // will throw out error now, postgresql does not support run commmand as sql
        // this.execute(`\\c ${targetDb};`);

        this.config.database = targetDb;
        this.reopen();
        this.currentDb = targetDb;
    }
    
    open (): Class_DbConnection { return super.open() }
    close (): void {
        if (this.connection) this.connection.close()
    }
    ping (): void { return }
    begin (): void { return this.connection.begin() }
    commit (): void { return this.connection.commit() }
    trans<T = any> (cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): boolean { return this.connection.trans(cb); }
    rollback (): void { return this.connection.rollback() }

    getConnection (): Class_DbConnection { return db.openPSQL(this.uri) }

    dbExists (dbname: string): boolean {
        return this.execute(`SELECT datname FROM pg_database WHERE datname = '${dbname}'`).length > 0;
    }

    execute<T = any> (sql: string): T {
        if (this.extend_config.debug_sql) {
            logDebugSQL('postgresql', sql);
        }
        if (this.isPool)
            return this.pool(conn => conn.execute(sql)) as any;

        if (!this.connection) this.open()
        return this.connection.execute(sql) as any;
    }
}