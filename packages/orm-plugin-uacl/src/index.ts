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

    grant () {

    }
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

const Plugin: FxOrmPluginUACL = function (orm, opts) {
    opts = opts || {};

    orm.ACLTree = ACLTree;
    orm.ACLNode = ACLNode;

    return {
        define (model) {
        }
    }
};

export = Plugin