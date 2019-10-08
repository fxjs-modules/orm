import util = require('util');
import coroutine = require('coroutine');

import LinkedList from '../Utils/linked-list';
import { setTarget } from '../Utils/deep-kv';
import * as DecoratorsProperty from '../Decorators/property';
import { isEmptyPlainObject } from '../Utils/object';
import Property from './Property';

const REVERSE_KEYS = [
    'set',
    'get',
    'save',
    'exists',
    // 'saveo2o',
    // 'savem2m',
    // 'savem2m',
    // 'savem2o',
    'remove',
    '$clearChanges',
    'toJSON',
    'toArray'
];

function pushChange (
    inst: Instance,
    fieldName: string,
    payload: {
        via_path: string,
        type: 'add' | 'update' | 'delete',
        snapshot?: any
    }
) {
    if (!inst.$changes[fieldName]) inst.$changes[fieldName] = new LinkedList();

    inst.$changes[fieldName].addTail({
        via_path: payload.via_path,
        type: payload.type,
        prev_state: payload.snapshot,
        date: new Date()
    });
}

function clearChanges(
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
            prev_state: any,
            date: Date
        }>
    } = {};

    get $changedFieldsCount () {
        return Object.keys(this.$changes).length
    }

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
    
    $clearChanges (fieldName?: string) {
        if (!fieldName) {
            Object.keys(this.$changes).forEach((f: string) => {
                this.$clearChanges(f)
            })

            return ;
        }

        clearChanges(this, fieldName)
        delete this.$changes[fieldName]
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

        dataset = {...this.$kvs, ...dataset};

        /* fill default value :start */
        this.$model.propertyList.forEach(property => {
            if (
                (dataset[property.name] === undefined)
                && (dataset[property.mapsTo] === undefined)
            ) {
                let dfltValue = Property.filterDefaultValue(
                    property,
                    {
                        collection: this.$model.name,
                        property,
                        driver: this.$model.orm.driver
                    }
                )

                if (dfltValue !== undefined)
                    dataset[property.name] = dfltValue

            }
        })
        /* fill default value :end */

        if (isEmptyPlainObject(dataset))
            throw new Error(`[Instance::save] dataset must be non-empty object!`)

        this.$dml
            .toSingleton()
            .useTrans((dml: any) => {
                if (this.$isPersisted && this.exists()) {
                    dml.update(
                        this.$model.collection,
                        this.$model.normalizePropertiesToData(dataset),
                        { idPropertyList: this.$model.idPropertyList }
                    )
                } else {
                    const insertResult = dml.insert(
                        this.$model.collection,
                        this.$model.normalizePropertiesToData(dataset),
                        { idPropertyList: this.$model.idPropertyList }
                    );

                    if (insertResult)
                        this.$model.normalizeDataToProperties(
                            Object.assign(insertResult, dataset),
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

        this.$clearChanges()

        return this
    }

    exists (): boolean {
        const where: Fibjs.AnyObject = {};

        if (!this.$model.idPropertyList.length) {
            if (this.$model.isMergeModel)
                throw new Error(
                    `[Instance::exists] merge-model(name: ${this.$model.name}, ` + 
                    `type: ${(<FxOrmModel.Class_MergeModel>this.$model).type})` +
                    `has no any property as id, check your definitions`
                )
            else
                throw new Error(`[Instance::exists] model(${this.$model.name}) has no any property as id, check your definitions`)
        }

        let withIdFilled = false
        this.$model.idPropertyList.forEach(prop => {
            if (this.$isFieldFilled(prop.name)) {
                where[prop.mapsTo] = this[prop.name]
                withIdFilled = true
            }
        })
        
        // if no any id filled, return false directly
        if (!withIdFilled) return false
        
        return this.$dml.exists(
            this.$model.collection,
            { where }
        )
        
        return false
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

export const getInstance: FxOrmTypeHelpers.ReturnItemOrArrayAccordingTo_2ndParam<
    Fibjs.AnyObject,
    FxOrmInstance.Class_Instance
> = function (
    model: any,
    instanceBase = {}
) {
    if (Array.isArray(instanceBase))
        return instanceBase.map(x => getInstance(model, x)) as any
    
    const instance = new Instance(model, instanceBase)

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
                        pushChange(instance, util.first(loose_p_tuple(prop)), {
                            type: 'delete',
                            snapshot: target[prop],
                            via_path: cur_path_str(prop)
                        });
                        delete target[prop];
                    }
                        
                    return true;
                },
                set: function(target: any, prop: string, value: any) {
                    if (!target.hasOwnProperty(prop))
                        // @todo: only allow set deep key which existed in intialization
                        // pushChange(instance, util.first(loose_p_tuple(prop)), {
                        //     type: 'add',
                        //     snapshot: target[prop],
                        //     via_path: cur_path_str(prop)
                        // });
                        return true;
                    else if (target[prop] !== value)
                        pushChange(instance, util.first(loose_p_tuple(prop)), {
                            type: 'update',
                            snapshot: target[prop],
                            via_path: cur_path_str(prop)
                        });

                    target[prop] = value;

                    return true;
                }
            }
        }
        
        return {
            get (target: typeof instance, prop: string): any {
                if (REVERSE_KEYS.includes(prop) || isInternalProp(prop))
                    return target[prop];

                if (target.$kvs[prop] && typeof target.$kvs[prop] === 'object') {
                    return new Proxy(target.$kvs[prop], getPhHandler({ parent_path: prop }))
                }

                return target.$kvs[prop];
            },
            ownKeys (target: typeof instance) {
                return Reflect.ownKeys(target.$kvs)
                // return Object.keys(target.$kvs)
            },
            deleteProperty (target: typeof instance, prop:string) {
                if (REVERSE_KEYS.includes(prop) || isInternalProp(prop)) {
                    delete target[prop];
                    return true;
                }

                if (target.$kvs.hasOwnProperty(prop)) {
                    pushChange(target, prop, {
                        type: 'delete',
                        snapshot: target.$kvs[prop],
                        via_path: prop
                    });
                    delete target.$kvs[prop];
                }
                    
                return true;
            },
            set: function(target: typeof instance, prop: string, value: any) {
                if (REVERSE_KEYS.includes(prop))
                    return false;

                if (!instance.$isModelField(prop))
                    return true;

                if (isInternalProp(prop)) {
                    target[prop] = value;
                    return true;
                }

                if (!target.$kvs.hasOwnProperty(prop))
                    pushChange(target, prop, {
                        type: 'add',
                        snapshot: target.$kvs[prop],
                        via_path: prop
                    });
                else if (target.$kvs[prop] !== value)
                    pushChange(target, prop, {
                        type: 'update',
                        snapshot: target.$kvs[prop],
                        via_path: prop
                    });

                target.$kvs[prop] = value;

                return true;
            },
            has (target: typeof instance, prop: string) {
                if (REVERSE_KEYS.includes(prop) || isInternalProp(prop))
                    return prop in target;

                return prop in target.$kvs;
            },
            // enumerate (target: typeof instanceBase) {
            //     return Object.keys(target.$kvs);
            // },
        }
    };

    return new Proxy(instance, getPhHandler({ parent_path: '' ,track_$kv: true }))
}