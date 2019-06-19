import util = require('util')
import { Tree, Node } from './tree'

function findNodeByInstance (aclTree: ACLTree, instance: FxOrmInstance.Instance) {
    let node = null

    const uaci = instance.$getUacis().object
    for (let x of aclTree.nodeSet) {
        if (x.isRoot)
            continue ;
            
        if (x.data.id === uaci)
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

    readonly _tree_stores: FxORMPluginUACL.ACLTree['_tree_stores'];
    readonly association_info: FxOrmModel.Model['associations'][any]

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

        const _treeStores = {}
        Object.defineProperty(this, '_tree_stores', { get () { return _treeStores }, enumerable: false });

        Object.defineProperty(this, 'prefix', { get () { return prefix } });
        Object.defineProperty(this, 'model', { get () { return model }, enumerable: false });
        if (association_name)
            Object.defineProperty(this, 'association_name', { get () { return association_name }, enumerable: false });
            Object.defineProperty(this, 'association_info', { get () { return model.associations[association_name] }, enumerable: false });
    }

    $uacl (next_assoc_name: string, instance?: FxOrmInstance.Instance) {
        const association_info = this.association_info
        const next_model = association_info.association.model;

        const prefix = `${this.prefix}/${next_assoc_name}/${instance ? instance.$getUacis().id : 0}`
        const key = `$uaclGrantTrees$${prefix}`

        if (this._tree_stores[key])
            return new ACLTree({
                prefix,
                model: next_model,
                association_name: next_assoc_name
            });

        return this._tree_stores[key];
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
            const uaci = data.$getUacis()

            this.root.addChildNode(
                new ACLNode({
                    id: uaci.object,
                    data: {
                        id: uaci.object,
                        roles: data.roles || []
                    },
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
        if (!cfg.data || !cfg.data.hasOwnProperty('id') || !cfg.data.hasOwnProperty('roles'))
            throw `[ACLNode] valid 'data' is missing in config!`

        if (!Array.isArray(cfg.data.roles))
            throw `[ACLNode] array-type 'roles' is missing in config.data!`

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
            data: {
                id: cfg.data.id,
                roles: cfg.data.roles
            }
        })

        this.acl = acl
        this.oacl = oacl
    }
}