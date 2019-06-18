import { Tree, Node } from './tree'

class ACLTree extends Tree<ACLNode> implements FxORMPluginUACL.ACLTree {
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
}

class ACLNode extends Node implements FxORMPluginUACL.ACLNode {
    data: FxORMPluginUACL.ACLNode['data']
    
    constructor (cfg: FxORMPluginUACL.ACLNodeConstructorOptions) {
        super({
            id: cfg.id,
            parent: cfg.parent,
            children: cfg.children
        })

        if (!cfg.data)
            throw `[ACLNode] 'data' field is required!`
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