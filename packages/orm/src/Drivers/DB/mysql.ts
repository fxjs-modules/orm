import { Driver as FxDbDriver } from '@fxjs/db-driver';

import getEventEmitter = require('./base');

import * as Utilities from '../../Utilities';

import type { FxOrmCommon } from '../../Typo/_common';
import type { FxOrmDb } from '../../Typo/Db';

const Driver = FxDbDriver.getDriver('mysql');

export class Database extends Driver implements FxOrmDb.Database<Class_MySQL> {
    eventor: Class_EventEmitter = getEventEmitter();

    connect(cb?: FxOrmCommon.GenericCallback<Class_MySQL>) {
        const exposedErrResults = Utilities.catchBlocking(
            () => super.open()
        )
        Utilities.takeAwayResult(exposedErrResults, { no_throw: !!cb, callback: cb});
        
        return this.connection
    }

    query<T = any>(sql: string, cb?: FxOrmCommon.GenericCallback<T>) {
        const exposedErrResults = Utilities.catchBlocking(
            () => this.execute(sql)
        )

        Utilities.takeAwayResult(exposedErrResults, { no_throw: !!cb, callback: cb});
            
        return exposedErrResults.result;
    }
}
