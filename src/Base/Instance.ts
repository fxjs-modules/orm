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
class Instance implements FxOrmInstance.Class_Instance {
    static isInstance (input: any): input is FxOrmInstance.Class_Instance {
        return input instanceof Instance
    }
    $event_emitter: FxOrmInstance.Class_Instance['$event_emitter'] = new EventEmitter()
    // @DecoratorsProperty.buildDescriptor({ enumerable: false })
    $model: FxOrmModel.Class_Model

    /**
     * only allow settting fields of Model.properties into it.
     */
    $kvs: FxOrmInstance.Class_Instance['$kvs'] = {};
    $refs: FxOrmInstance.Class_Instance['$refs'] = {};

    @DecoratorsProperty.buildDescriptor({ enumerable: false, writable: false })
    $bornsnapshot: FxOrmInstance.Class_Instance['$bornsnapshot'] = null;

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

    $getWhereFromProperty () {

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

    constructor (...args: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmInstance.Class_Instance>) {
        let [model, instanceBase] = args

        if (Array.isArray(instanceBase))
            return instanceBase.map(x => new Instance(model, x)) as any

        this.$model = model

        if (instanceBase instanceof Instance) instanceBase = instanceBase.toJSON()

        this.$bornsnapshot = JSON.stringify(instanceBase)

        this.$model.normalizeDataIntoInstance({...instanceBase}, {
            onPropertyField: ({ fieldname, transformedValue }) => {
                // dont use $set, never leave change history now.
                this.$kvs[fieldname] = transformedValue
            },
            onAssociationField: ({ fieldname, transformedValue }) => {
                this.$refs[fieldname] = transformedValue
            }
        })

        return getInstanceProxy(this) as any;
    }

    $on (...args: any[]) { return this.$event_emitter.on.apply(this, args) }
    $off (...args: any[]) { return this.$event_emitter.off.apply(this, args) }
    $emit (...args: any[]) { return this.$event_emitter.emit.apply(this, args) }

    $set (fieldname: string | string[], value: any) {
        if (!fieldname) return ;

        if (typeof fieldname === 'string') {
            if (this.$model.isPropertyName(fieldname))
                setTarget(fieldname, value, this);
            else if (this.$model.isAssociationName(fieldname)) {
                this.$refs[fieldname] = value
            }
        } if (Array.isArray(fieldname)) {
            fieldname = fieldname.filter(x => x && typeof x === 'string').join('.');
            this.$set(fieldname, value);
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

    $save (
        dataset: Fibjs.AnyObject = this.$kvs,
        {
            dml = this.$model.$dml
        } = {}
    ): this {
        if (dataset !== undefined && typeof dataset !== 'object')
            throw new Error(`[Instance::save] invalid save arguments ${dataset}, it should be non-empty object or undefined`)

        const kvs = {...this.$kvs, ...this.$model.normlizePropertyData(dataset)}
        const refs = {...this.$refs, ...this.$model.normalizeAssociationData(dataset)}

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

            if (this.$isPersisted && this.$exists()) {
                if (this.$changedFieldsCount) {
                    const changes = this.$model.normalizePropertiesToData(kvs);
                    const whereCond = <typeof changes>{};

                    let hasWhere = false
                    this.$model.idPropertyList.forEach(property => {
                        if (changes.hasOwnProperty(property.mapsTo)) {
                            whereCond[property.mapsTo] = changes[property.mapsTo]
                            delete changes[property.mapsTo];
                            hasWhere = true
                        }
                    });

                    if (!hasWhere)
                        throw new Error(`[Instance::save] update in $save must have specific where conditions, check your instance`)

                    dml.update(
                        this.$model.collection,
                        changes,
                        { where: whereCond }
                    );
                }
            } else {
                const creates = this.$model.normalizePropertiesToData(kvs);
                const insertResult = dml.insert(
                    this.$model.collection,
                    creates,
                    { idPropertyList: this.$model.idPropertyList }
                );

                if (insertResult)
                    this.$model.normalizeDataIntoInstance(
                        insertResult,
                        {
                            onPropertyField: ({ fieldname, transformedValue }) => {
                                this.$kvs[fieldname] = transformedValue
                            }
                        }
                    )
                this.$model.normlizePropertyData(kvs, this.$kvs)
            }

            this.$model.filterOutAssociatedData(refs)
                .forEach(item => {
                    this.$saveRef(item.association.name, item.dataset)
                })

        this.$clearChanges()

        this.$emit('saved')

        return this
    }

    $fetchRef () {
        const refs = this.$getRef(this.$model.associationNames);

        this.$model.normalizeAssociationData(refs, this.$refs);

        return this
    }

    $getRef (refName: string | string[], opts?: FxOrmTypeHelpers.SecondParameter<FxOrmInstance.Class_Instance['$getRef']>) {
        const associationInfos = <FxOrmTypeHelpers.ReturnType<FxOrmModel.Class_Model['fieldInfo']>[]>[]
        arraify(refName).filter(x => {
            if (this.$model.isAssociationName(x))
                associationInfos.push(this.$model.fieldInfo(x))
        })
        if (!associationInfos.length)
            throw new Error(`[Instance::$getRef] invalid reference names given`)

        const refs = <any>[];

        coroutine.parallel(
            associationInfos,
            (associationInfo: typeof associationInfos[any]) => {
                if (associationInfo.type !== 'association') return ;

                associationInfo.association.findForSource({
                    sourceInstance: this,
                    findOptions: opts
                });

                refs.push(this[associationInfo.association.name] || null);
            }
        )

        return Array.isArray(refName) ? refs : refs[0];
    }

    $hasRef (
        ...opts: FxOrmTypeHelpers.Parameters<FxOrmInstance.Class_Instance['$hasRef']>
    ): ReturnType<FxOrmInstance.Class_Instance['$hasRef']> {
        let [refName, dataset] = opts;

        if (!this.$model.isAssociationName(refName))
            throw new Error(`[Instance::$hasRef] "${refName}" is not reference of this instance, with model(collection: ${this.$model.collection})`)

        const assocModel = this.$model.assoc(refName)

        if (!dataset) {
            return assocModel.checkHasForSource({ sourceInstance: this, targetInstances: undefined })
        }

        let invalid: any
        const fdataset = arraify(dataset).filter(x => {
            if (!x) invalid = x
            else if (typeof x !== 'object') invalid = x

            return !!x
         })

        if (invalid || !fdataset.length)
            throw new Error(`[Instance::$hasRef] input must be non-empty object or array of it!`)

        return assocModel.checkHasForSource({
            sourceInstance: this,
            targetInstances: fdataset.map((x: Fibjs.AnyObject) => assocModel.targetModel.New(x))
        })
    }

    $saveRef (
        refName: string,
        dataset: FxOrmTypeHelpers.ItOrListOfIt<Fibjs.AnyObject | FxOrmInstance.Class_Instance> = []
    ) {
        const assocModel = this.$model.assoc(refName);
        assocModel.saveForSource({targetDataSet: dataset, sourceInstance: this})

        if (
            Instance.isInstance(dataset) && Instance.isInstance(this[refName])
            && this[refName].$model === dataset.$model
        ) {
            (<FxOrmInstance.Class_Instance>this[refName]).$model.normalizeDataIntoInstance(
                this[refName].$kvs,
                {
                    onPropertyField: ({ fieldname, transformedValue }) => {
                        dataset[fieldname] = transformedValue
                    }
                }
            )
        }

        return this[refName]
    }

    $addRef (
        refName: string,
        dataset: FxOrmTypeHelpers.ItOrListOfIt<Fibjs.AnyObject | FxOrmInstance.Class_Instance> = []
    ) {
        const assocModel = this.$model.assoc(refName);
        assocModel.saveForSource({targetDataSet: dataset, sourceInstance: this, isAddOnly: true})

        return arraify(this[refName])
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

    $unlinkRef (
        ...args: FxOrmTypeHelpers.Parameters<FxOrmInstance.Class_Instance['$unlinkRef']>
    ): this {
        const [refName, dataset] = args
        const assocModel = this.$model.assoc(refName)

        const fdataset = arraify(dataset || []).filter(x => !!x)

        assocModel.unlinkForSource({
            targetInstances: fdataset.map((x: Fibjs.AnyObject) => 
                assocModel.targetModel.isInstance(x) ? x : assocModel.targetModel.New(x)
            ),
            sourceInstance: this
        });
        return this
    }

    $exists (): boolean {
        if (this.$model.noKey) {
            // const fn = this.$model.settings.get('instance.checkExists')
            // if (typeof fn === 'function') return fn(this)
            if (this.$model.isMergeModel) return (<FxOrmModel.Class_MergeModel>this.$model).checkExistenceForSource({
                mergeInstance: this
            })

            return false
        }

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

        return this.$model.$dml.exists(this.$model.collection, { where })
    }

    toJSON () {
        const json = <Instance['$kvs']>{};

        Object.keys(this.$kvs).forEach((k) => {
            if (this.$isEnumerable(k))
                json[k] = this.$kvs[k];
        })

        this.$model.normalizeAssociationData(this.$refs, json);

        return json;
    }

    toString () {
        return JSON.stringify(this.toJSON())
    }

    [k: string]: any
}

function isInternalProp (prop: string | symbol) {
    return typeof prop === 'string' && (prop[0] === '$' || prop[0] === '_')
}

function isInternalPropOrSymbol (prop: string | symbol) {
    if (typeof prop === 'symbol') return true

    return isInternalProp(prop)
}

function getPhHandler ({
    instance = null,
    parent_path = '',
    track_$instance_self = false,
}: {
    instance: FxOrmInstance.Class_Instance,
    parent_path?: string,
    track_$instance_self?: boolean
}) {
    if (!instance || !Instance.isInstance(instance))
        throw new Error(`[getPhHandler] instance is required!`)

    if (!track_$instance_self) {
        const loose_p_tuple = (prop: string) => [parent_path, prop].join('.').split('.')
        const cur_path_str = (prop: string) => [parent_path, prop].filter(x => x).join('.')

        return {
            get (target: any, prop: string): any {
                if (Array.isArray(target[prop]))
                    return target[prop];

                if (target[prop] && typeof target[prop] === 'object') {
                    return new Proxy(target[prop], getPhHandler({ instance, parent_path: cur_path_str(prop) }))
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
            if (REVERSE_KEYS.includes(prop) || isInternalPropOrSymbol(prop))
                return target[prop];

            if (target.$model.isAssociationName(prop))
                return target.$refs[prop];

            if (target.$kvs[prop] && typeof target.$kvs[prop] === 'object') {
                return new Proxy(target.$kvs[prop], getPhHandler({ instance, parent_path: prop }))
            }

            return target.$kvs[prop];
        },
        ownKeys (target: typeof instance) {
            return Reflect.ownKeys(target.$kvs).concat(
                Object.keys(target.$refs)
            )
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

const getInstanceProxy = function (
    instance: FxOrmInstance.Class_Instance,
) {
    return new Proxy(instance, getPhHandler({ instance, parent_path: '' , track_$instance_self: true }))
}

export default Instance
