import util = require('util');
import events = require('events');
import coroutine = require('coroutine');

import LinkedList from '../Utils/linked-list';
import { setTarget } from '../Utils/deep-kv';
import * as DecoratorsProperty from '../Decorators/property';
import { isEmptyPlainObject } from '../Utils/object';
import Property from './Property';
import { arraify } from '../Utils/array';

const { EventEmitter } = events

const REVERSE_KEYS = [
    'toJSON'
];

function pushChange (
    inst: FxOrmInstance.Class_Instance,
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
class Instance extends EventEmitter implements FxOrmInstance.Class_Instance {
    @DecoratorsProperty.buildDescriptor({ enumerable: false })
    $model: FxOrmModel.Class_Model
    
    /**
     * only allow settting fields of Model.properties into it.
     */
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
    
    $clearChanges (fieldName?: string | string[]) {
        if (!fieldName)
            fieldName = Object.keys(this.$changes);

        if (Array.isArray(fieldName)) {
            fieldName.forEach(x => this.$clearChanges(x))
            return
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

    constructor (...args: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmInstance.Class_Instance>) {
        super()

        let [model, instanceBase] = args

        if (Array.isArray(instanceBase))
            return instanceBase.map(x => new Instance(model, x)) as any

        if (instanceBase instanceof Instance)
            instanceBase = instanceBase.toJSON()

        this.$kvs = {...instanceBase}
        Object.defineProperty(this, '$model', { configurable: true, enumerable: false, writable: false, value: model })

        return getInstance(this) as any;
    }

    $on (...args: any[]) { return super.on.apply(this, args) }
    $off (...args: any[]) { return super.off.apply(this, args) }
    $emit (...args: any[]) { return super.emit.apply(this, args) }

    $set (prop: string | string[], value: any) {
        if (!prop) return ;

        if (typeof prop === 'string') {
            setTarget(prop, value, this);
        } if (Array.isArray(prop)) {
            prop = prop.filter(x => x && typeof x === 'string').join('.');
            this.$set(prop, value);
        }
    }

    $fetch () {
        const kvs = this.$get(this.$model.propertyNames);

        Object.keys(kvs).forEach(fieldName => {
            if (this.$isModelField(fieldName)) {
                this[fieldName] = kvs[fieldName]
            }
        });

        this.$clearChanges(this.$model.propertyNames);

        return this
    }

    /**
     * @TODO support get association by `assocNames`
     */
    $get (fieldName: string | string[]) {
        const propertyNames = arraify(fieldName).filter(x => this.$model.isPropertyName(x))
        const assocNames = arraify(fieldName).filter(x => this.$model.isAssociationName(x))

        if (!propertyNames.length && !assocNames.length)
            throw new Error(`[Instance::$get] invalid field name given`)

        const whereCond = <any>{};
        this.$model.idPropertyList.forEach((property) => {
            whereCond[property.name] = this[property.name];
        });
        if (isEmptyPlainObject(whereCond))
            throw new Error(`[Instance::$get] invalid where conditions generated, check if id properties(${this.$model.ids.join(', ')}) of your model(collection: ${this.$model.collection}) filled in this instance!`)

        /**
         * @is all key in propertyNames is valid property/association names?
         */
        const item = this.$model.find(
            {
                limit: 1,
                where: whereCond,
                fields: propertyNames
            }
        )[0];

        if (!item)
            throw new Error(`[Instance::$get] item not found, check if id properties(${this.$model.ids.join(', ')}) of your model(collection: ${this.$model.collection}) filled in this instance!`)

        const itemRaw = item.toJSON();
        const kvs = <any>{};
        propertyNames.forEach(fname => {
            if (this.$isModelField(fname)) {
                kvs[fname] = itemRaw[fname]
            }
        });

        return kvs
    }

    $save (
        dataset: Fibjs.AnyObject = this.$kvs
    ): any {
        if (dataset !== undefined && typeof dataset !== 'object')
            throw new Error(`[Instance::save] invalid save arguments ${dataset}, it should be non-empty object or undefined`)
            
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
                if (this.$isPersisted && this.$exists()) {
                    const changes = this.$model.normalizePropertiesToData(dataset);
                    const whereCond = <typeof changes>{};

                    Object.values(this.$model.idPropertyList).forEach(property => {
                        if (changes.hasOwnProperty(property.mapsTo)) {
                            whereCond[property.mapsTo] = changes[property.mapsTo]
                            delete changes[property.mapsTo];
                        }
                    });

                    dml.update(
                        this.$model.collection,
                        changes,
                        { where: whereCond }
                    );
                } else {
                    const creates = this.$model.normalizePropertiesToData(dataset);
                    const insertResult = dml.insert(
                        this.$model.collection,
                        creates,
                        { idPropertyList: this.$model.idPropertyList }
                    );

                    if (insertResult)
                        this.$model.normalizeDataToProperties(
                            Object.assign(insertResult),
                            this.$kvs
                        )
                    this.$model.normlizePropertyData(dataset, this.$kvs)
                }

                this.$model.filterOutAssociatedData(dataset)
                    .forEach(item => {
                        const assocModel = item.association
                        
                        assocModel.saveForSource({
                            targetDataSet: item.dataset,
                            sourceInstance: this
                        });

                        /**
                         * @whatif item.dataset is array of Instance
                         */
                        if (item.dataset instanceof Instance) {
                            item.dataset.$model.propertyList.forEach(property => {
                                if (this[item.association.name].$kvs.hasOwnProperty(property.name))
                                    item.dataset[property.name] = this[item.association.name].$kvs[property.name]
                            });
                        }
                    })
            })
            .releaseSingleton()

        this.$clearChanges()

        super.emit('saved')

        return this
    }

    $remove (): void {

    }

    $exists (): boolean {
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

const getInstance = function (
    instance: FxOrmInstance.Class_Instance,
) {
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
                if (REVERSE_KEYS.includes(prop) || !instance.$isModelField(prop))
                    return false;

                /**
                 * @shouldit allowed?
                 */
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
            }
        }
    };

    return new Proxy(instance, getPhHandler({ parent_path: '' ,track_$kv: true }))
}

export default Instance