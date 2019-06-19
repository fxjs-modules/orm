import { Tree, Node } from './tree'

class ACLTree extends Tree<ACLNode> implements FxORMPluginUACL.ACLTree {
    /**
     * @sample `GRANT parent/1/children`
     */
    type: string = '';

    constructor ({
        type = '',
    }: any = {
        type: null
    }) {
        super();

        if (!type)
            throw `[Tree] type is required!`
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
    {
        getUaci = function (
            {parent, child_instance: stage_instance}: {
                parent: ACLNode,
                child_instance: FxORMPluginUACL.ACLNode['data']
            }
        ) {
            return {
                // common one
                objectless: `${parent.id}/stages/0`,
                // object one
                object: `${parent.id}/stages/${stage_instance.id}`,
            }
        }
    }
): ACLTree {
    if (!this.$uaclGrantTree) {
        this.$uaclGrantTree = new ACLTree({ type: `${this.table}` })
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
    {
    }
): ACLTree {
    if (!this.$uaclGrantTree) {
        this.$uaclGrantTree = new ACLTree({ type: `${this.table}` })
    }

    return this.$uaclGrantTree
}

const Plugin: FxOrmPluginUACL = function (orm, opts) {
    opts = opts || {};

    orm.ACLTree = ACLTree;
    orm.ACLNode = ACLNode;

    return {
        beforeDefine (name, props, opts) {
            opts.ievents = opts.ievents || {};
        },
        define (model) {
            model.uacl = modelUacl.bind(model)

            model.afterLoad(function () {
                this.$uacl = instanceUacl.bind(model)
            }, { oldhook: 'prepend' })
        }
    }
};

export = Plugin