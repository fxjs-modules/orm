import { Driver as FxDbDriver } from '@fxjs/db-driver';

import getEventEmitter = require('./base');

import * as Utilities from '../../Utilities';

import type { FxOrmCommon } from '../../Typo/_common';
import type { FxOrmDb } from '../../Typo/Db';

function isMemoryMode (href: string) {
    return href === ':memory:'
}
const Driver = FxDbDriver.getDriver('sqlite');

export class Database extends Driver implements FxOrmDb.DatabaseBase_SQLite {
    eventor: Class_EventEmitter = getEventEmitter();
    conn: Class_SQLite;
    get use_memory () {
        return isMemoryMode(this.config.href)
    }

    constructor (opts: any) {
        super(opts)

        this.config.slashes = false
    }

    connect(cb?: FxOrmCommon.GenericCallback<Class_SQLite>) {
        const exposedErrResults = Utilities.catchBlocking(
            () => super.open()
        )
        Utilities.takeAwayResult(exposedErrResults, { no_throw: !!cb, callback: cb});
        
        return this.connection
    }

    query<T = any>(sql: string, cb?: FxOrmCommon.GenericCallback<T>) {
        const exposedErrResults = Utilities.catchBlocking(
            () => this.execute(sql)
        );
        Utilities.takeAwayResult(exposedErrResults, { no_throw: !!cb, callback: cb});
            
        return exposedErrResults.result
    }

    all<T = any>(sql: string, cb?: FxOrmCommon.GenericCallback<T>) {
        return this.query(sql, cb);
    }

    get<T = any>(sql: string, cb?: FxOrmCommon.GenericCallback<T>) {
        const results = this.all(sql)[0];

        if (typeof cb === 'function')
            return cb(null, results);

        return results;
    }
}
