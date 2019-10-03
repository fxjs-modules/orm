import coroutine = require('coroutine');

import { getDML } from '../DXL/DML';
import { configurable } from '../Decorators/accessor';

const REVERSE_KEYS = [
    'set',
    'get',
    'save',
    'remove',
    'exists',
];

class Instance {
    $model: any
    $kvs: Fibjs.AnyObject = {}
    $isInstance = true;
    
    $dml: any = null;

    constructor (
        model: any,
        instanceBase: Fibjs.AnyObject
    ) {
        this.$kvs = {...instanceBase}
        this.$model = model;
        
        const DML = getDML(model.dbdriver.type)
        this.$dml = new DML({ dbdriver: model.dbdriver })
    }

    private $m_bPersisted = false;
    @configurable(false)
    set $isPersisted (value: boolean) {
        this.$m_bPersisted = !!value;
    }
    get $isPersisted () {
        return this.$m_bPersisted;
    }

    private $m_bSaved = false;
    @configurable(false)
    set $saved (value: boolean) {
        this.$m_bSaved = !!value;
    }
    get $saved () {
        return this.$m_bSaved;
    }

    set (prop: string, value: any) {
        this.$kvs[prop] = value;
    }

    get () {

    }

    save (props: Fibjs.AnyObject) {
        if (Array.isArray(props))
            return coroutine.parallel(props, (prop: Fibjs.AnyObject) => {
                return this.save(prop)
            })

        if (!props)
            throw new Error(`props must be non-empty object!`)

        const result = this.$dml.insert(
            this.$model.collection,
            props,
            Object.values(this.$model.keyProperties)
        );

        if (result)
            Object.keys(result).forEach((k: string) => {
                this.$kvs[k] = result[k]
            });

        // console.log(Chalk`{bold.magenta.italic.inverse instance saved}`, result);

        return this
    }
}

function isInternalProp (prop: string) {
    return prop.startsWith('$') || prop.startsWith('_')
}

export function getInstance (
    model: any,
    instanceBase: Fibjs.AnyObject
): FxOrmInstance.Instance {
    instanceBase = new Instance(model, instanceBase)

    const phHandler = new Proxy(instanceBase, {
        set: function(target: typeof instanceBase, prop: string, value: any) {
            if (REVERSE_KEYS.includes(prop))
                return false;

            // status
            if (isInternalProp(prop))
                target[prop] = value;

            target.$kvs[prop] = value;

            return true;
        },
        get (target: typeof instanceBase, prop: string) {
            if (REVERSE_KEYS.includes(prop) || isInternalProp(prop))
                return target[prop];

            return target.$kvs[prop];
        },
        enumerate (target: typeof instanceBase) {
            return Object.keys(target.$kvs);
        }
    });

    return phHandler
}