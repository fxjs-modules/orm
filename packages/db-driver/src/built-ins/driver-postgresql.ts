/// <reference types="fib-pool" />

import db = require('db')

import { FxDbDriverNS } from '../Typo';
import { FxOrmCoreCallbackNS } from '@fxjs/orm-core';
import { SQLDriver } from "./base.class";
import { logDebugSQL, detectWindowsCodePoints } from '../utils';

type CodePointItem = {
    codepoint: string
    dotNetName: string
    comment: string
}
const CodepointsList: CodePointItem[] = require('../../codepoints-map.json')
const CodepointsMap = CodepointsList.reduce((accu, item) => {
    accu[item.codepoint] = item;
    return accu;
}, {} as Record<CodePointItem['codepoint'], CodePointItem>);

const win32CpInfo = detectWindowsCodePoints();

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
    
    open (): Class_DbConnection {
        if (!win32CpInfo.codepoints) return super.open();

        const conn = super.open() as Class_DbConnection & { codec?: string };

        const matchedCodepoint = CodepointsMap[win32CpInfo.codepoints]
        
        // TODO: support common codepoints -> postgresql-encoding
        if (conn.codec && win32CpInfo.codepoints === '936') {
            conn.codec = 'GBK';
        } else if (conn.codec && matchedCodepoint) {
            conn.codec = matchedCodepoint.dotNetName;
        } else if (conn.codec === 'utf8' && win32CpInfo.codepoints !== '65001') {
            console.error(`system default code points is '${win32CpInfo.codepoints}', but odbc try to use codec UTF8 with codepoints 65001, refer to https://learn.microsoft.com/en-us/windows/win32/intl/code-page-identifiers to set connection.codec as UTF8`);
        }

        return conn;
    }
    close (): void {
        if (this.connection) this.connection.close()
    }
    ping (): void { return }
    begin (): void { return this.connection.begin() }
    commit (): void { return this.connection.commit() }
    trans<T = any> (cb: FxOrmCoreCallbackNS.ExecutionCallback<T>): boolean { return this.connection.trans(cb); }
    rollback (): void { return this.connection.rollback() }

    getConnection (): Class_DbConnection { 
        const conn = db.openPSQL(this.uri);
        if(this.config.query.searchPath) conn.execute(`SET search_path TO ${this.config.query.searchPath}`);
        return conn
    }

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