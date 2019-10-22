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
    // @DecoratorsProperty.buildDescriptor({ enumerable: false })
    $model: FxOrmModel.Class_Model

    /**
     * only allow settting fields of Model.properties into it.
     */
    $kvs: FxOrmInstance.Class_Instance['$kvs'] = {};
    $refs: FxOrmInstance.Class_Instance['$refs'] = {};

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
        return this.$model.keyPropertyNames.every(x => this.$isFieldFilled(x))
    }

    $isFieldFilled (x: string) {
        return (
            this.$model.isPropertyName(x) && this.$kvs[x] !== undefined
        ) || (
            this.$model.isAssociationName(x) && this.$refs[x] !== undefined
        )
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
        return (
            this.$model.properties.hasOwnProperty(prop) && this.$model.properties[prop].enumerable
            || this.$model.isAssociationName(prop)
        )
    }

    get $isInstance () { return true };

    get $dml () { return this.$model.$dml }

    constructor (...args: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmInstance.Class_Instance>) {
        super()

        let [model, instanceBase] = args

        if (Array.isArray(instanceBase))
            return instanceBase.map(x => new Instance(model, x)) as any

        this.$model = model

        if (instanceBase instanceof Instance)
            instanceBase = instanceBase.toJSON()

        instanceBase = {...instanceBase}
        this.$kvs = this.$model.normlizePropertyData(instanceBase, this.$kvs)
        this.$refs = this.$model.normlizeAssociationData(instanceBase, this.$refs)

        return getInstance(this) as any;
    }

    $on (...args: any[]) { return super.on.apply(this, args) }
    $off (...args: any[]) { return super.off.apply(this, args) }
    $emit (...args: any[]) { return super.emit.apply(this, args) }

    $set (prop: string | string[], value: any) {
        if (!prop) return ;

        if (typeof prop === 'string') {
            if (this.$model.isPropertyName(prop))
                setTarget(prop, value, this);
            else if (this.$model.isAssociationName(prop)) {
                this.$refs[prop] = value
            }

        } if (Array.isArray(prop)) {
            prop = prop.filter(x => x && typeof x === 'string').join('.');
            this.$set(prop, value);
        }

        return this
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

    $get (fieldName: string | string[]) {
        const propertyNames = arraify(fieldName).filter(x => this.$model.isPropertyName(x))

        if (!propertyNames.length)
            throw new Error(`[Instance::$get] invalid field names given`)

        const kvs = <any>{};

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
        propertyNames.forEach(fname => {
            if (this.$isModelField(fname)) {
                kvs[fname] = itemRaw[fname]
            }
        });

        return isEmptyPlainObject(kvs) ? undefined : kvs;
    }

    $fetchReference () {
        const refs = this.$getReference(this.$model.associationNames);

        this.$model.normlizeAssociationData(refs, this.$refs);

        return this
    }

    $getReference (refName: string | string[]) {
        const associationInfos = <FxOrmTypeHelpers.ReturnType<FxOrmModel.Class_Model['fieldInfo']>[]>[]
        arraify(refName).filter(x => {
            if (this.$model.isAssociationName(x))
                associationInfos.push(this.$model.fieldInfo(x))
        })
        if (!associationInfos.length)
            throw new Error(`[Instance::$getReference] invalid reference names given`)

        const refs = <any>[];

        coroutine.parallel(
            associationInfos,
            (associationInfo: typeof associationInfos[any]) => {
                if (associationInfo.type !== 'association') return ;

                associationInfo.association.findForSource({
                    sourceInstance: this
                });

                refs.push(this[associationInfo.association.name] || null);
            }
        )

        return Array.isArray(refName) ? refs : refs[0];
    }

    $hasReference (refName: string | string[]): any {
        if (Array.isArray(refName))
            return refName.map(_ref => this.$hasReference(_ref)) as any

        if (!this.$model.isAssociationName(refName))
            throw new Error(`[Instance::$hasReference] "${refName}" is not reference of this instance, with model(collection: ${this.$model.collection})`)

        return !!this.$getReference(refName) as any
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

        const kvs = {...this.$kvs, ...this.$model.normlizePropertyData(dataset)}
        const refs = {...this.$refs, ...this.$model.normlizeAssociationData(dataset)}

        /* fill default value :start */
        this.$model.propertyList.forEach(property => {
            if (
                (kvs[property.name] === undefined)
                && (kvs[property.mapsTo] === undefined)
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
                    kvs[property.name] = dfltValue

            }
        })
        /* fill default value :end */

        if (isEmptyPlainObject(kvs) && isEmptyPlainObject(refs) && !this.$model.noKey)
            throw new Error(`[Instance::save] for instance of model(collection: ${this.$model.collection}), at least one non-empty object in "kvs" and "refs" should be provided!`)

        this.$dml
            .toSingleton()
            .useTrans((dml: any) => {
                if (this.$isPersisted && (!this.$model.noKey && this.$exists())) {
                    const changes = this.$model.normalizePropertiesToData(kvs);
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
                    const creates = this.$model.normalizePropertiesToData(kvs);
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
                    this.$model.normlizePropertyData(kvs, this.$kvs)
                }

                this.$model.filterOutAssociatedData(refs)
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
        const whereCond = <any>{};

        this.$model.ids.forEach((pname) => {
            if (this.$isFieldFilled(pname))
                whereCond[pname] = this[pname]
        })

        if (isEmptyPlainObject(whereCond))
            throw new Error(`[Instance::$remove] empty where conditions for removation generated, check if all id fields filled in your instance!`)

        this.$model.remove({
            where: whereCond
        })
    }

    $removeReference (refName: string | string[]) {
        const refNames = arraify(refName).filter(x => this.$refs.hasOwnProperty(x))

        if (!refNames.length)
            throw new Error(`[Instance::$removeReference] no any valid reference names provided!`)

        this.$model.filterOutAssociatedData(this.$refs)
            .filter(item => refNames.includes(item.association.name))
            .forEach(item => {
                const assocModel = item.association

                assocModel.removeForSource({ sourceInstance: this });
            })
        return this
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
        const json = <Instance['$kvs']>{};

        Object.keys(this.$kvs).forEach((k) => {
            if (this.$isEnumerable(k))
                json[k] = this.$kvs[k];
        })

        this.$model.normlizeAssociationData(this.$refs, json);

        return json;
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
                    if (Array.isArray(target[prop]))
                        return target[prop];

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

                if (target.$model.isAssociationName(prop))
                    return target.$refs[prop];

                if (target.$kvs[prop] && typeof target.$kvs[prop] === 'object') {
                    return new Proxy(target.$kvs[prop], getPhHandler({ parent_path: prop }))
                }

                return target.$kvs[prop];
            },
            ownKeys (target: typeof instance) {
                return Reflect.ownKeys(target.$kvs).concat(
                    Reflect.ownKeys(target.$refs)
                )
                // return instance.$model.propertyNames.concat(
                //     Object.keys(instance.$model.associations)
                // )
            },
            deleteProperty (target: typeof instance, prop:string) {
                if (REVERSE_KEYS.includes(prop) || isInternalProp(prop)) {
                    delete target[prop];
                    return true;
                }

                if (target.$model.isAssociationName(prop)) {
                    delete target.$refs[prop];
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

                if (target.$model.isAssociationName(prop)) {
                    target.$refs[prop] = value;
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

                return target.$kvs.hasOwnProperty(prop) || target.$refs.hasOwnProperty(prop);
            }
        }
    };

    return new Proxy(instance, getPhHandler({ parent_path: '' ,track_$kv: true }))
}

export default Instance
