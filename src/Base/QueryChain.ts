import util = require('util');
import SqlQuery = require('@fxjs/sql-query');

import * as SYMBOLS from '../Utils/symbols';

function transformToQCIfModel (target: QueryChain, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) {
    let method = descriptor.value;

    descriptor.value = function () {
        // in-model
        if (this.isModel) {
            const qc = new QueryChain()
            qc.model = this;

            return qc[propertyName].apply(qc, arguments)
        }

        // just in QueryChain
        switch (this.model.dbdriver.type) {
            case 'mysql':
            case 'mssql':
            case 'sqlite':
                this.sqlQuery = new SqlQuery.Query({
                    dialect: this.model.dbdriver.type,
                });
                break
        }

        return method.apply(this, arguments);
    }
}

class QueryChain<TUPLE_ITEM = any> {
    private _tuples: TUPLE_ITEM[] = [];

    model: any;

    conditions: any;
    sqlQuery: FxSqlQuery.Class_Query

    [k: string]: any;

    get isModel () { return this._symbol === SYMBOLS.Model };

    /**
     * @description find tuples from remote endpoints
     */
    @transformToQCIfModel
    find (
        opts: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']> = {}
    ): QueryChain {
        const results = this.model.$dml.find(
            this.model.collection,
            opts
        )

        this._tuples = results.map((x: TUPLE_ITEM) => {
            const inst = this.model.New(x)
            inst.$isPersisted = true
            return inst
        });

        return this;
    }

    /**
     * @description get first tuple from remote endpoints
     */
    @transformToQCIfModel
    get (id?: string | number): TUPLE_ITEM {
        return this.find({
            beforeQuery: (kqbuilder) => {
                if (this.model.id)
                    kqbuilder.where(this.model.id, '=', id)
            }
        }).first();
    }

    first (): TUPLE_ITEM {
        return util.first(this._tuples);
    }

    last (): TUPLE_ITEM {
        return util.last(this._tuples);
    }
}

export default QueryChain