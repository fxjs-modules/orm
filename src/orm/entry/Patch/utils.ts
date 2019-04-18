import * as util from 'util'

import * as Utilities from '../Utilities'
import { preReplaceHook, prependHook } from '../Helpers';

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

function patchObject(m: FxOrmInstance.Instance) {
    var methods = [
        // "save",
        // "remove",
        // "validate",
        // "model"
    ];

    function enum_associations(assocs: (FxOrmAssociation.InstanceAssociationItem)[]) {
        assocs.forEach(function (item: FxOrmAssociation.InstanceAssociationItem) {
            if (item.getAccessor)
                methods.push(item.getAccessor);
            if (item.setAccessor)
                methods.push(item.setAccessor);
            if (item.hasAccessor)
                methods.push(item.hasAccessor);
            if (item.delAccessor)
                methods.push(item.delAccessor);
            if (item.addAccessor)
                methods.push(item.addAccessor);
        });
    }

    // patch associations methods
    var opts = m.__opts;
    if (opts) {
        enum_associations(opts.one_associations);
        enum_associations(opts.many_associations);
        enum_associations(opts.extend_associations);
        /**
         * leave it here just due to historical reason,
         * maybe useless here, its's all string in it
         */
        // enum_associations(opts.association_properties);

        // patch lazyload's accessor
        for (var f in opts.fieldToPropertyMap) {
            if (opts.fieldToPropertyMap[f].lazyload) {
                var name = f.charAt(0).toUpperCase() + f.slice(1);
                methods.push('get' + name);
                methods.push('set' + name);
                methods.push('remove' + name);
            }
        };
    }

    patchSync(m, methods);
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

export function patchHooksInModelOptions(
    opts: FxOrmModel.ModelOptions,
    hooks: (keyof FxOrmNS.Hooks)[] = ['afterLoad', 'afterAutoFetch']
) {
    hooks.forEach(hook => {
        prependHook(opts.hooks, hook, function () {
            patchObject(this);
        });
    });
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