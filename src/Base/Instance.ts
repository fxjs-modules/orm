import util = require('util');
import coroutine = require('coroutine');

import LinkedList from '../Utils/linked-list';
import { setTarget } from '../Utils/deep-kv';
import * as DecoratorsProperty from '../Decorators/property';
import { arraify } from '../Utils/array';

const REVERSE_KEYS = [
    'set',
    'get',
    'save',
    // 'saveo2o',
    // 'savem2m',
    // 'savem2m',
    // 'savem2o',
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
class Instance implements FxOrmInstance.Class_Instance {
    @DecoratorsProperty.buildDescriptor({ enumerable: false })
    $model: FxOrmModel.Class_Model
    
    // TOOD: only allow settting fields of Model.properties into it.
    $kvs: Fibjs.AnyObject = {}
    
    @DecoratorsProperty.buildDescriptor({ enumerable: false })
    $changes: {
        [filed_name: string]: LinkedList<{
            via_path: string
            type: 'add' | 'update' | 'delete',
            prev_state: any
        }>
    } = {};

    @DecoratorsProperty.buildDescriptor({ enumerable: false })
    get $saved (): boolean {
        return !Object.keys(this.$changes).length
    }
    @DecoratorsProperty.buildDescriptor({ enumerable: false })
    get $isPersisted (): boolean {
        return this.$model.keyPropertyNames
            .every(x => this.$isFieldFilled(x))
    }

    $isFieldFilled (x: string) {
        return this.$kvs[x] !== undefined
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
    $isModelField (prop: string) {
        return !!this.$model.fieldInfo(prop);
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
        if (instanceBase instanceof Instance)
            instanceBase = instanceBase.toJSON()

        this.$kvs = {...instanceBase}
        Object.defineProperty(this, '$model', { configurable: true, enumerable: false, writable: false, value: model })
    }

    set (prop: string | string[], value: any) {
        if (!prop) return ;

        if (typeof prop === 'string') {
            setTarget(prop, value, this);
        } if (Array.isArray(prop)) {
            prop = prop.filter(x => x && typeof x === 'string').join('.');
            this.set(prop, value);
        }
    }

    save (
        dataset: Fibjs.AnyObject = this.$kvs
    ): any {
        if (Array.isArray(dataset))
            return coroutine.parallel(dataset, (prop: Fibjs.AnyObject) => {
                return this.save(prop)
            })

        if (!dataset)
            throw new Error(`dataset must be non-empty object!`)

        this.$dml
            .toSingleton()
            .useTrans((dml: any) => {
                if (this.$isPersisted) {
                    console.log('[instance] update', dataset);

                    dml.update(
                        this.$model.collection,
                        this.$model.normalizePropertiesToData(dataset),
                        { keyPropertyList: this.$model.keyPropertyList }
                    )
                } else {
                    console.warn(
                        '[instance] insert\n',
                        this.$model.name, '\n',
                        dataset,
                        this.$model.normalizePropertiesToData(dataset),
                        this.$model.keyPropertyNames
                    );

                    const result = dml.insert(
                        this.$model.collection,
                        this.$model.normalizePropertiesToData(dataset),
                        { keyPropertyList: this.$model.keyPropertyList }
                    );
                    
                    if (result)
                        this.$model.normalizeDataToProperties(
                            Object.assign(result, dataset),
                            this.$kvs
                        )
                }

                this.$model.filterOutAssociatedData(dataset)
                    .forEach(item => {
                        const assocModel = item.association
                        assocModel.saveForSource({
                            associationDataSet: item.dataset,
                            sourceInstance: this
                        })
                    })
            })
            .releaseSingleton()

        this.$clearChange()

        return this
    }

    toJSON () {
        const kvs = <Instance['$kvs']>{};

        Object.keys(this.$kvs).forEach((k) => {
            if (this.$isEnumerable(k))
                kvs[k] = this.$kvs[k];
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
): FxOrmInstance.Class_Instance[] | FxOrmInstance.Class_Instance {
    if (Array.isArray(instanceBase))
        return instanceBase.map(x => getInstance(model, x)) as any
    
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

                if (!instanceBase.$isModelField(prop))
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
            // enumerate (target: typeof instanceBase) {
            //     return Object.keys(target.$kvs);
            // },
        }
    };

    return new Proxy(instanceBase, getPhHandler({ parent_path: '' ,track_$kv: true }))
}