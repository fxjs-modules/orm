import util = require('util');
import coroutine = require('coroutine');

import LinkedList from '../Utils/linked-list';
import { setTarget } from '../Utils/deep-kv';
import * as DecoratorsProperty from '../Decorators/property';
import { filterPropertyToStoreData, fillStoreDataToProperty } from '../DXL/DML/_utils';

const REVERSE_KEYS = [
    'set',
    'get',
    'save',
    'remove',
    '$clearChange',
    'toJSON',
    'toArray'
];

function pushChange (
    inst: Instance,
    fieldName: string,
    payload: {
        via_path: string,
        type: 'add' | 'update' | 'delete',
        prev_snapshot?: any
    }
) {
    if (!inst.$changes[fieldName])
        inst.$changes[fieldName] = new LinkedList();

    // console.trace(`[pushChange] fieldName ${fieldName}`);
    inst.$changes[fieldName].addTail({
        via_path: payload.via_path,
        type: payload.type,
        prev_state: payload.prev_snapshot
    });
}

function clearChange(
    inst: Instance,
    fieldName?: string
) {
    if (!inst.$changes[fieldName]) return ;

    inst.$changes[fieldName].clear();
}
class Instance {
    @DecoratorsProperty.buildDescriptor({ configurable: false, enumerable: false })
    $model: any
    
    // TOOD: only allow settting fields of Model.properties into it.
    $kvs: Fibjs.AnyObject = {}
    
    @DecoratorsProperty.buildDescriptor({ configurable: false, enumerable: false })
    $changes: {
        [filed_name: string]: LinkedList<{
            via_path: string
            type: 'add' | 'update' | 'delete',
            prev_state: any
        }>
    } = {};
    get $saved (): boolean {
        return !Object.keys(this.$changes).length
    }
    
    $clearChange (fieldName?: string) {
        if (!fieldName) {
            return Object.keys(this.$changes).forEach((f: string) => {
                this.$clearChange(f)
            })
        }

        clearChange(this, fieldName)
    }
    get $changedKeys () {
        return Object.keys(this.$changes);
    }
    $isModelProperty (prop: string) {
        return this.$model.properties.hasOwnProperty(prop);
    }
    $isEnumerable (prop: string) {
        return this.$model.properties.hasOwnProperty(prop) && this.$model.properties[prop].enumerable
    }

    get $isInstance () { return true };
    
    get $dml () { return this.$model.$dml }

    constructor (
        model: any,
        instanceBase: Fibjs.AnyObject
    ) {
        this.$kvs = {...instanceBase}
        this.$model = model;
    }

    @DecoratorsProperty.buildDescriptor({ configurable: false, enumerable: false })
    $isPersisted: boolean = true;

    set (prop: string | string[], value: any) {
        if (!prop) return ;

        if (typeof prop === 'string') {
            setTarget(prop, value, this);
        } if (Array.isArray(prop)) {
            prop = prop.filter(x => x && typeof x === 'string').join('.');
            this.set(prop, value);
        }
    }

    save (dataset: Fibjs.AnyObject = this.$kvs) {
        if (Array.isArray(dataset))
            return coroutine.parallel(dataset, (prop: Fibjs.AnyObject) => {
                return this.save(prop)
            })

        if (!dataset)
            throw new Error(`dataset must be non-empty object!`)

        const result = this.$dml.insert(
            this.$model.collection,
            filterPropertyToStoreData(dataset, this.$model),
            {
                keyProperties: this.$model.keyPropertyList
            }
        );

        if (result) {
            fillStoreDataToProperty(
                Object.assign(result, dataset),
                this.$model,
                this.$kvs
            )
        }

        this.$clearChange()

        return this
    }

    toJSON () {
        const kvs = <Instance['$kvs']>{};

        Object.entries(this.$kvs).forEach(([k, v]) => {
            if (this.$isEnumerable(k))
                kvs[k] = v;
        })

        return kvs;
    }

    toString () {
        return JSON.stringify(this.toJSON())
    }

    [k: string]: any
}

function isInternalProp (prop: string) {
    return prop.startsWith('$') || prop.startsWith('_')
}

export function getInstance (
    model: any,
    instanceBase: any = {}
): FxOrmInstance.Instance {
    instanceBase = new Instance(model, instanceBase)

    function getPhHandler ({
        parent_path = '',
        track_$kv = false,
    } = {}) {
        if (!track_$kv) {
            const loose_p_tuple = (prop: string) => [parent_path, prop].join('.').split('.')
            const cur_path_str = (prop: string) => [parent_path, prop].filter(x => x).join('.')

            return {
                get (target: any, prop: string): any {
                    if (target[prop] && typeof target[prop] === 'object') {
                        return new Proxy(target[prop], getPhHandler({ parent_path: cur_path_str(prop) }))
                    }

                    return target[prop];
                },
                deleteProperty (target: any, prop:string) {
                    if (target.hasOwnProperty(prop)) {
                        pushChange(instanceBase, util.first(loose_p_tuple(prop)), {
                            type: 'delete',
                            prev_snapshot: target[prop],
                            via_path: cur_path_str(prop)
                        });
                        delete target[prop];
                    }
                        
                    return true;
                },
                set: function(target: any, prop: string, value: any) {
                    if (!target.hasOwnProperty(prop))
                        // @todo: only allow set deep key which existed in intialization
                        // pushChange(instanceBase, util.first(loose_p_tuple(prop)), {
                        //     type: 'add',
                        //     prev_snapshot: target[prop],
                        //     via_path: cur_path_str(prop)
                        // });
                        return true;
                    else if (target[prop] !== value)
                        pushChange(instanceBase, util.first(loose_p_tuple(prop)), {
                            type: 'update',
                            prev_snapshot: target[prop],
                            via_path: cur_path_str(prop)
                        });

                    target[prop] = value;

                    return true;
                }
            }
        }
        
        return {
            get (target: typeof instanceBase, prop: string): any {
                if (REVERSE_KEYS.includes(prop) || isInternalProp(prop))
                    return target[prop];

                if (target.$kvs[prop] && typeof target.$kvs[prop] === 'object') {
                    return new Proxy(target.$kvs[prop], getPhHandler({ parent_path: prop }))
                }

                return target.$kvs[prop];
            },
            ownKeys (target: typeof instanceBase) {
                return Reflect.ownKeys(target.$kvs)
                // return Object.keys(target.$kvs)
            },
            deleteProperty (target: typeof instanceBase, prop:string) {
                if (REVERSE_KEYS.includes(prop) || isInternalProp(prop)) {
                    delete target[prop];
                    return true;
                }

                if (target.$kvs.hasOwnProperty(prop)) {
                    pushChange(target, prop, {
                        type: 'delete',
                        prev_snapshot: target.$kvs[prop],
                        via_path: prop
                    });
                    delete target.$kvs[prop];
                }
                    
                return true;
            },
            set: function(target: typeof instanceBase, prop: string, value: any) {
                if (REVERSE_KEYS.includes(prop))
                    return false;

                if (!instanceBase.$isModelProperty(prop))
                    return true;

                if (isInternalProp(prop)) {
                    target[prop] = value;
                    return true;
                }

                if (!target.$kvs.hasOwnProperty(prop))
                    pushChange(target, prop, {
                        type: 'add',
                        prev_snapshot: target.$kvs[prop],
                        via_path: prop
                    });
                else if (target.$kvs[prop] !== value)
                    pushChange(target, prop, {
                        type: 'update',
                        prev_snapshot: target.$kvs[prop],
                        via_path: prop
                    });

                target.$kvs[prop] = value;

                return true;
            },
            has (target: typeof instanceBase, prop: string) {
                if (REVERSE_KEYS.includes(prop) || isInternalProp(prop))
                    return prop in target;

                return prop in target.$kvs;
            },
            enumerate (target: typeof instanceBase) {
                return Object.keys(target.$kvs);
            },
        }
    };

    return new Proxy(instanceBase, getPhHandler({ parent_path: '' ,track_$kv: true }))
}