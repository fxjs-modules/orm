import util = require('util')
import { Tree, Node } from './tree'
import { arraify } from './_utils';

function getModelObjectLess (model: FxOrmModel.Model) {
    return (new model()).$getUacis().objectless;
}

function findNodeForUser (aclTree: ACLTree, uaci: string, uid: ACLNode['data']['uid']) {
    let node = null

    for (let x of aclTree.nodeSet) {
        if (x.isRoot)
            continue ;

        if (x.id === uaci && x.data.uid === uid) {
            node = x;            
            break ;
        }
    }

    return node;
}

function computeUaciId (aclTree: ACLTree, uacl_info?: FxORMPluginUACL.InstanceUACLInfo) {
    if (!uacl_info)
        return `${aclTree.namespace}`

    return `${aclTree.namespace}/${aclTree.association_name ? `${aclTree.association_name}/${uacl_info.id}` : uacl_info.object}`
}

export class ACLTree extends Tree<ACLNode> implements FxORMPluginUACL.ACLTree {
    /**
     * @sample `GRANT parent/1/children`
     */
    namespace: string = '';
    readonly model: FxOrmModel.Model;
    readonly instance: FxOrmInstance.Instance;

    readonly _tree_stores: FxORMPluginUACL.ACLTree['_tree_stores'];
    readonly association_name?: string
    readonly association_info?: FxOrmModel.Model['associations'][any]
    get _ref_association () {
        return !!this.association_name
    }

    constructor ({ namespace, instance, association_name }: {
        namespace: string,
        instance: FxOrmInstance.Instance,
        association_name?: string
    } = {
        namespace: null,
        instance: null,
        association_name: null,
    }) {
        super();

        if (!namespace)
            throw `[Tree] namespace is required!`

        if (!instance)
        throw `[Tree] instance is required!`

        const model = instance.model()

        const _treeStores = {}
        Object.defineProperty(this, '_tree_stores', { get () { return _treeStores }, enumerable: false });

        Object.defineProperty(this, 'namespace', { get () { return namespace } });
        Object.defineProperty(this, 'instance', { get () { return instance }, enumerable: false });
        Object.defineProperty(this, 'model', { get () { return model }, enumerable: false });
        if (association_name)
            Object.defineProperty(this, 'association_name', { get () { return association_name }, enumerable: false });
            Object.defineProperty(this, 'association_info', { get () { return model.associations[association_name] }, enumerable: false });
    }

    $uacl (
        next_assoc_name: string,
        next_instance?: FxOrmInstance.Instance
    ): FxORMPluginUACL.ACLTree {
        const next_assoc_info = this.instance.model().associations[next_assoc_name]
        const next_model = next_assoc_info.association.model;

        if (next_instance && next_model !== next_instance.model())
            throw `[ACLTree::$uacl] invalid instance for association '${next_assoc_info.association.name}'`

        const namespace = `${this.namespace}/${next_assoc_name}/${next_instance ? next_instance.$getUacis().id : 0}`
        const key = `$uaclGrantTrees$${namespace}`

        if (!this._tree_stores[key])
            Object.defineProperty(this._tree_stores, key, {
                value: new ACLTree({
                    namespace,
                    instance: this.instance,
                    association_name: next_assoc_name
                }),
                configurable: false,
                writable: false,
                enumerable: false
            })

        return this._tree_stores[key];
    }

    grant (
        users: FxOrmInstance.Instance | FxOrmInstance.Instance[],
        oacl: FxORMPluginUACL.OACLStruct
    ) {
        if (oacl === undefined) {
            oacl = users as any
            users = null
        }

        users = arraify(users).filter(x => x)

        users.forEach((data: FxOrmInstance.Instance) => {
            const uaci_id = `${computeUaciId(this, !this._ref_association ? null : getModelObjectLess(this.association_info.association.model) )}`
            // const uaci_id = `${computeUaciId(this)}`

            this.root.addChildNode(
                new ACLNode({
                    id: uaci_id,
                    data: {
                        instance: data,
                        id: data.id,
                        roles: data.roles || []
                    },
                    oacl
                })
            )
        });

        console.log(
            'granted',
            this.toJSON()
        )

        return this;
    }

    pull () {
        console.log('[pull]I would pull')
        return this;
    }

    push () {
        console.log('[push]I would push')

        console.log(
            '[push] data structure',
            // this.toJSON(),
            // this.nonRootNodes.map(node => node)
        )
        return this;
    }

    revoke () {
        console.log('I would revoke')
        return this;
    }

    can (user: FxOrmInstance.Instance, action: FxORMPluginUACL.ACLType, askedFields: any[]) {
        // const node = findNode(this);
        const uaci = computeUaciId(this, !this._ref_association ? null : getModelObjectLess(this.association_info.association.model))
        console.log('uaci', uaci);
        
        const node = findNodeForUser(
            this,
            uaci,
            user.id
        )

        console.log('node', node);
        console.log('this.toJSON()', this.toJSON());

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
                user: cfg.data.instance,
                uid: cfg.data.id,
                uroles: cfg.data.roles
            }
        })

        this.acl = acl
        this.oacl = oacl
    }
}