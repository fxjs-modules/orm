import * as util from 'util'

import * as Utilities from '../Utilities'

interface ModelFuncToPatch extends Function {
    is_new?: boolean;
}

type FxOrmModelAndIChainFind = FxOrmModel.Model | FxOrmQuery.IChainFind

type HashOfModelFuncNameToPath = string[];

// patch async function to sync function
function patchSync(
    o: FxOrmModelAndIChainFind | FxOrmNS.ORMLike | FxOrmInstance.Instance | FxOrmDMLDriver.DMLDriver,
    funcs: HashOfModelFuncNameToPath
) {
    funcs.forEach(function (func: string) {
        const old_func = o[func];
        /**
         * we should re init the sync method in hook `afterAutoFetch`,
         * so never check if new_func existed.
         */
        if (old_func) {
            Object.defineProperty(o, func + 'Sync', {
                value: util.sync(old_func),
                writable: true
            });
        }
    })
}

export function patchFindBy(m: FxOrmModel.Model, funcs: HashOfModelFuncNameToPath) {
    funcs.forEach(function (func) {
        var old_func: ModelFuncToPatch = m[func];
        if (old_func)
            m[func] = function () {
                var r = old_func.apply(this, Array.prototype.slice.apply(arguments));

                var name = arguments[0];
                name = 'findBy' + Utilities.formatNameFor('findBy:common', name);
                patchSync(this, [name]);

                return r;
            }
    })
}

export function patchModelAfterDefine(m: FxOrmModel.Model, /* opts: FxOrmModel.ModelOptions */) {
    patchFindBy(m, [
        'hasOne',
        'hasMany',
        'extendsTo'
    ]);
}

export function execQuerySync(
    this: FxOrmDMLDriver.DMLDriver,
    query: string,
    opt: FxSqlQuerySql.SqlEscapeArgType[]
) {
    if (arguments.length == 2)
        query = this.query.escape(query, opt);

    return this.db.execute(query);
}