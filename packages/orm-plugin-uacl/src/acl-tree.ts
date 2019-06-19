import util = require('util')
import { Tree, Node } from './tree'

function findNodeByInstance (aclTree: ACLTree, instance: FxOrmInstance.Instance) {
    let node = null

    for (let x of aclTree.nodeSet) {
        if (x.isRoot)
            continue ;

        if (x.data.instance === instance) {
            node = x
            break
        }
            
        if (x.data.instance.id === instance.id)
            node = x
    }

    return node;
}

export class ACLTree extends Tree<ACLNode> implements FxORMPluginUACL.ACLTree {
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
        target: FxOrmInstance.Instance | FxOrmInstance.Instance[],
        oacl: FxORMPluginUACL.OACLStruct
    ) {
        if (oacl === undefined) {
            oacl = target as any
            target = null
        }

        if (Array.isArray(target))
            target = target.filter(x => x);
        else if (target)
            target = [target];
        else
            target = [];

        target.forEach((data: FxOrmInstance.Instance) => {
            const node = this.root.addChildNode(
                new ACLNode({
                    id: data.id,
                    data: data,
                    oacl
                })
            )
        });

        return this;
    }

    pull () {}

    push () {}

    revoke () {}

    can (target: FxOrmInstance.Instance, action: FxORMPluginUACL.ACLType, askedFields: any[]) {
        const node = findNodeByInstance(this, target);

        if (!node)
            return false;

        if (!node.oacl && !node.acl)
            return false;

        const acl = node.acl[action as keyof ACLNode['acl']]
        const oacl = node.oacl[action as keyof ACLNode['oacl']]

        if (acl || oacl) {
            if (!askedFields || !askedFields.length) {
                return true;
            }

            let permissonedFields = []
            if (acl === true || oacl === true) {
                return true;
            } else {
                permissonedFields = []
                    .concat(
                        Array.isArray(acl) ? acl : []
                    )
                    .concat(
                        Array.isArray(oacl) ? oacl : []
                    )
            }

            const diff = util.difference(askedFields, permissonedFields)
            return !diff.length;
        }
        
        return false;
    }
}

export class ACLNode extends Node<FxORMPluginUACL.ACLNode['data']> implements FxORMPluginUACL.ACLNode {
    data: FxORMPluginUACL.ACLNode['data']
    acl: FxORMPluginUACL.ACLNode['acl']
    oacl: FxORMPluginUACL.ACLNode['oacl']
    
    constructor (cfg: FxORMPluginUACL.ACLNodeConstructorOptions) {
        if (!cfg.data || !cfg.data.isInstance)
            throw `[ACLNode] instance type 'data' is missing in config!`

        const acl: ACLNode['acl'] = {
            create: undefined,
            clear: undefined,
            find: undefined,
            ...cfg.acl
        }
        const oacl: ACLNode['oacl'] = {
            write: undefined,
            read: undefined,
            remove: undefined,
            ...cfg.oacl
        }

        super({
            id: cfg.id,
            parent: cfg.parent,
            children: cfg.children,
            data: { instance: cfg.data, acl, oacl }
        })

        this.acl = acl
        this.oacl = oacl
    }
}