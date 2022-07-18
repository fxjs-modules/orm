/// <reference types="fib-pool" />

import db = require('db')

import { FxDbDriverNS } from '../Typo';
import { FxOrmCoreCallbackNS } from '@fxjs/orm-core';
import { SQLDriver } from "./base.class";

export default class SQLiteDriver extends SQLDriver<Class_SQLite> implements FxDbDriverNS.SQLDriver {
    constructor (conn: FxDbDriverNS.ConnectionInputArgs | string) {
        super(conn);

        this.connection = null
    }
    
    open (): Class_SQLite { return super.open() }

    close (): void {
        if (this.connection) this.connection.close()
    }
    ping (): void { return }
    begin (): void { return this.connection.begin() }
    commit (): void { return this.connection.commit() }
    trans<T = any> (cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): boolean { return this.connection.trans(cb); }
    rollback (): void { return this.connection.rollback() }

    getConnection (): Class_SQLite { return db.openSQLite(this.uri) }

    execute<T = any> (sql: string): T {
        if (this.isPool)
            return this.pool(conn => conn.execute(sql)) as any;

        if (!this.connection) this.open()
        return this.connection.execute(sql) as any;
    }
}