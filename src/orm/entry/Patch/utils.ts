import * as util from 'util'

interface ModelFuncToPatch extends Function {
    is_new?: boolean;
}

type HashOfModelFuncNameToPath = string[];

// patch async function to sync function
export function patchSync(
    o: FxOrmModel.Model | FxOrmNS.FibOrmFixedModelInstance | FxOrmNS.FibOrmDB,
    funcs: HashOfModelFuncNameToPath
) {
    funcs.forEach(function (func) {
        const old_func = o[func];
        if (old_func) {
            Object.defineProperty(o, func + 'Sync', {
                value: util.sync(old_func),
                writable: true
            });
        }
    })
}

const model_conjunctions_keys: (keyof FxSqlQuerySubQuery.ConjunctionInput__Sample)[] = [
    'or',
    'and',
    'not_or',
    'not_and',
    'not'
];

function is_model_conjunctions_key (k: string) {
    return model_conjunctions_keys.includes(k as any)
}

// hook find, patch result
export function patchResult(o: FxOrmNS.FibOrmFixedModelInstance | FxOrmModel.Model): void {
    var old_func: ModelFuncToPatch = o.find;
    var m: FxOrmModel.Model = o.model || o;
    // keyof FxSqlQuerySql.DetailedQueryWhereCondition
    var comps = ['val', 'from', 'to'];

    if (old_func.is_new)
        return;

    /**
     * filter the Date-Type SelectQuery Property corresponding item when call find-like executor ('find', 'get', 'where')
     * @param opt 
     */
    function filter_date(opt) {
        for (var k in opt) {
            if (is_model_conjunctions_key(k))
                Array.isArray(opt[k]) && opt[k].forEach(filter_date);
            else {
                var p = m.allProperties[k];
                if (p && p.type === 'date') {
                    var v: any = opt[k];

                    if (!util.isDate(v)) {
                        if (util.isNumber(v) || util.isString(v))
                            opt[k] = new Date(v);
                        else if (util.isObject(v)) {
                            comps.forEach(c => {
                                var v1 = v[c];

                                if (util.isArray(v1)) {
                                    v1.forEach((v2, i) => {
                                        if (!util.isDate(v2))
                                            v1[i] = new Date(v2);
                                    });
                                } else if (v1 !== undefined && !util.isDate(v1)) {
                                    v[c] = new Date(v1);
                                }
                            });
                        }
                    }
                }
            }
        }
    }

    var new_func: ModelFuncToPatch = function () {
        var opt = arguments[0];

        if (util.isObject(opt) && !util.isFunction(opt)) {
            /** filter opt to make Date-Type SelectQuery Property corresponding item */
            filter_date(opt);
        }

        var rs: FxOrmNS.FibOrmFixedModelInstance = old_func.apply(this, Array.prototype.slice.apply(arguments));
        if (rs) {
            patchResult(rs);
            patchSync(rs, [
                "count",
                "first",
                "last",
                'all',
                'where',
                'find',
                'remove',
                'run'
            ]);
        }
        return rs;
    }

    new_func.is_new = true;
    o.where = o.all = o.find = new_func;
}

export function patchObject(m: FxOrmNS.FibOrmFixedModelInstance) {
    var methods = [
        "save",
        "remove",
        "validate",
        "model"
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

export function patchHas(m: FxOrmModel.Model, funcs: HashOfModelFuncNameToPath) {
    funcs.forEach(function (func) {
        var old_func: ModelFuncToPatch = m[func];
        if (old_func)
            m[func] = function () {
                var r = old_func.apply(this, Array.prototype.slice.apply(arguments));

                var name = arguments[0];
                name = 'findBy' + name.charAt(0).toUpperCase() + name.slice(1);
                patchSync(this, [name]);

                return r;
            }
    })
}

export function patchAggregate(m: FxOrmModel.Model) {
    var aggregate: FxOrmNS.OrigAggreteGenerator = m.aggregate;
    m.aggregate = function () {
        var r = aggregate.apply(this, Array.prototype.slice.apply(arguments));
        patchSync(r, ['get']);
        return r;
    };
}

export function patchModel(m: FxOrmModel.Model, opts: FxOrmModel.ModelOptions) {
    var _afterAutoFetch;
    if (opts !== undefined && opts.hooks)
        _afterAutoFetch = opts.hooks.afterAutoFetch;

    /**
     * use `afterAutoFetch` rather than `afterLoad`,
     * because patch in `afterLoad` only process instance's basic(exclude lazyload) fields' accessors，
     * as patch in `afterAutoFetch` would process instance's basic/lazyload/associated fields' accessors
     */
    m.afterAutoFetch(function (next) {
        patchObject(this as FxOrmNS.FibOrmFixedModelInstance);

        if (_afterAutoFetch) {
            if (_afterAutoFetch.length > 0)
                return _afterAutoFetch(next);
            _afterAutoFetch();
        }

        next();
    });

    patchResult(m);

    patchSync(m, [
        "clear",
        "count",
        "exists",
        "one",
        "where",
        'all',
        'create',
        'drop',
        'find',
        'get',
        'sync'
    ]);

    patchHas(m, [
        'hasOne',
        'extendsTo'
    ]);

    patchAggregate(m);
}

interface keyPropertiesTypeItem {
    type: string;
    name: string;
}
export function patchInsert(table: string, data: any, keyProperties: keyPropertiesTypeItem[], cb: Function) {
    var q = this.query.insert()
        .into(table)
        .set(data)
        .build();

    this.db.all(q, function (err, info) {
        if (err) return cb(err);
        if (!keyProperties) return cb(null);

        var ids = {},
            prop;

        if (keyProperties.length == 1 && keyProperties[0].type == 'serial') {
            ids[keyProperties[0].name] = info.insertId;
            return cb(null, ids);
        } else {
            for (let i = 0; i < keyProperties.length; i++) {
                prop = keyProperties[i];
                // Zero is a valid value for an ID column
                ids[prop.name] = data[prop.mapsTo] !== undefined ? data[prop.mapsTo] : null;
            }
            return cb(null, ids);
        }
    }.bind(this));
};

/**
 * @description patch `date` type property's transform
 */
export function patchDriver(driver: FxOrmDMLDriver.DMLDriver) {
    if (driver.dialect === 'sqlite')
        driver.insert = patchInsert;

    var propertyToValue = driver.propertyToValue;
    driver.propertyToValue = function (value, property) {
        if (property.type === 'date' &&
            (util.isNumber(value) || util.isString(value)))
            value = new Date(value);
        return propertyToValue.call(this, value, property);
    }

    var valueToProperty = driver.valueToProperty;
    driver.valueToProperty = function (value, property) {
        if (property.type === 'date' &&
            (util.isNumber(value) || util.isString(value)))
            value = new Date(value);
        return valueToProperty.call(this, value, property);
    }
}

export function execQuerySync(query: string, opt) {
    if (arguments.length == 2)
        query = this.query.escape(query, opt);

    return this.db.execute(query);
}