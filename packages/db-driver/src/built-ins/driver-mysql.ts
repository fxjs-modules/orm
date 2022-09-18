/// <reference types="fib-pool" />

import db = require('db')

import { FxDbDriverNS } from '../Typo';
import { FxOrmCoreCallbackNS } from '@fxjs/orm-core';
import { SQLDriver } from "./base.class";
import { logDebugSQL } from '../utils';

export default class MySQLDriver extends SQLDriver<Class_MySQL> implements FxDbDriverNS.SQLDriver {
    constructor (conn: FxDbDriverNS.ConnectionInputArgs | string) {
        super(conn);

        this.connection = null
    }

    switchDb (targetDb: string) {
        this.execute(`use \`${targetDb}\``);
        this.currentDb = targetDb;
    }
    
    open (): Class_MySQL { return super.open() }
    close (): void {
        if (this.connection) this.connection.close()
    }
    ping (): void { return }
    begin (): void { return this.connection.begin() }
    commit (): void { return this.connection.commit() }
    trans<T = any> (cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): boolean { return this.connection.trans(cb); }
    rollback (): void { return this.connection.rollback() }

    getConnection (): Class_MySQL { return db.openMySQL(this.uri) }

    execute<T = any> (sql: string): T {
        if (this.extend_config.debug_sql) {
            logDebugSQL('mysql', sql);
        }
        if (this.isPool)
            return this.pool(conn => conn.execute(sql)) as any;

        if (!this.connection) this.open()
        return this.connection.execute(sql) as any;
    }
}