import util = require('util');
import SqlQuery = require('@fxjs/sql-query');

import * as SYMBOLS from '../Utils/symbols';
import { getInstance } from './Instance';

class QueryChain<TUPLE_ITEM = any> {
    private _tuples: TUPLE_ITEM[] = [];

    model: any;
    // dbdriver: FxDbDriverNS.Driver;

    collection: string;
    conditions: any;
    sqlQuery: FxSqlQuery.Class_Query

    [k: string]: any;

    private get isModel () { return this._symbol === SYMBOLS.Model };

    /**
     * @description find tuples from remote endpoints
     */
    find (): QueryChain {
        if (this.isModel) {
            const qc = new QueryChain()
            qc.model = this;

            switch (this.dbdriver.type) {
                case 'mysql':
                // case 'mssql':
                case 'sqlite':
                    qc.sqlQuery = new SqlQuery.Query({
                        dialect: this.dbdriver.type,
                    });
                    qc.collection = this.collection
                    break
            }

            return qc.find()
        }

        const sql = this.sqlQuery.select()
            .from(this.collection)
            .build()

        if (this.model.dbdriver.isSql) {
            const results = (this.model.dbdriver as FxDbDriverNS.SQLDriver).execute(sql);

            this._tuples = results.map((x: TUPLE_ITEM) => {
                const inst = this.model.New(x)
                inst.$isPersisted = true
                return inst
            });
        }

        return this;
    }

    first (): TUPLE_ITEM {
        return util.first(this._tuples);
    }

    last (): TUPLE_ITEM {
        return util.last(this._tuples);
    }
}

export default QueryChain