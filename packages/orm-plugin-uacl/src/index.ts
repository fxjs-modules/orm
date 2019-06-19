import { Tree, Node } from './tree'

class ACLTree extends Tree<ACLNode> implements FxORMPluginUACL.ACLTree {
    /**
     * @sample `GRANT parent/1/children`
     */
    prefix: string = '';
    readonly model: FxOrmModel.Model;

    constructor ({ prefix, model, association_name }: {
        prefix: string,
        model: FxOrmModel.Model,
        association_name: string
    } = {
        prefix: null,
        model: null,
        association_name: null,
    }) {
        super();

        if (!prefix)
            throw `[Tree] prefix is required!`
        if (!model || typeof model !== 'function')
            throw `[Tree] model is required!`

        Object.defineProperty(this, 'prefix', { get () { return prefix } });
        Object.defineProperty(this, 'model', { get () { return model }, enumerable: false });
        if (association_name)
            Object.defineProperty(this, 'association_name', { get () { return association_name }, enumerable: false });
            Object.defineProperty(this, 'association', { get () { return model.associations[association_name] }, enumerable: false });
    }

    uacl () {
        return this;
    }

    grant (
        target: FxOrmInstance.InstanceDataPayload,
        acl: FxORMPluginUACL.OACLStruct
    ) {
        if (acl === undefined) {
            acl = target
            target = null
        }

        if (Array.isArray(target))
            target = target.filter(x => x);
        else if (target)
            target = [target];
        else
            target = [];

        target.forEach((data: FxOrmInstance.InstanceDataPayload) => {
            // console.log('this.prefix', this.prefix)
            this.root.addChildNode(
                new ACLNode({
                    id: data.id,
                    data: data,
                })
            )
        });
        // console.log('this.toJSON()', this.toJSON())

        return this;
    }

    pull () {}

    push () {}

    revoke () {}

    can () {}
}

class ACLNode extends Node implements FxORMPluginUACL.ACLNode {
    data: FxORMPluginUACL.ACLNode['data']
    acl: FxORMPluginUACL.ACLNode['acl']
    oacl: FxORMPluginUACL.ACLNode['oacl']
    
    constructor (cfg: FxORMPluginUACL.ACLNodeConstructorOptions) {
        super({
            id: cfg.id,
            parent: cfg.parent,
            children: cfg.children
        })

        if (!cfg.data)
            throw `[ACLNode] 'data' field is required!`

        this.acl = {
            create: undefined,
            clear: undefined
        }

        this.oacl = {
            write: undefined,
            read: undefined,
            remove: undefined,
            find: undefined,
        }
    }
}

/**
 * @chainapi
 * @purpose record the relations, and provide the `uaci` computation by getUaci
 * 
 */
function modelUacl (
    this: FxOrmModel.Model,
    association_name: string
): ACLTree {
    if (!this.$uaclGrantTree) {
        const model = this;
        this.$uaclGrantTree = new ACLTree({
            model: model,
            prefix: `${model.table}`,
            association_name,
        })
    }

    return this.$uaclGrantTree
}


/**
 * @chainapi
 * @purpose record the relations, and provide the `uaci` computation by getUaci
 * 
 */
function instanceUacl (
    this: FxOrmInstance.Instance,
    association_name: string
): ACLTree {
    const model = this.model()
    if (!model.associations.hasOwnProperty(association_name))
        throw `association name must be valid for model ${model.name}`

    const treeKey = `$uaclGrantTrees$${association_name}`
    if (!this[treeKey]) {
        this[treeKey] = new ACLTree({
            model: model,
            prefix: `${model.table}`,
            association_name: association_name
        })
    }

    return this[treeKey]
}

const Plugin: FxOrmPluginUACL = function (orm, opts) {
    opts = opts || {};

    orm.ACLTree = ACLTree;
    orm.ACLNode = ACLNode;

    return {
        beforeDefine (name, props, opts) {
            opts.ievents = opts.ievents || {};

            opts.methods = opts.methods || {};
            if (typeof opts.methods.$getUaci !== 'function')
                opts.methods.$getUaci = function () {
                    return {
                        objectless: `${this.model().table}/0`,
                        object: `${this.model().table}/${this.id}`
                    }
                }
        },
        define (model) {
            model.uacl = modelUacl.bind(model)

            model.afterLoad(function () {
                Object.defineProperty(this, '$uacl', {
                    value: instanceUacl.bind(this),
                    writable: false,
                    configurable: false,
                    enumerable: false
                })
            }, { oldhook: 'prepend' })
        }
    }
};

export = Plugin