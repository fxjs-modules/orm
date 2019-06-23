import util = require('util')
import mq = require('mq')

import { Tree, Node } from './tree'
import { findACLNode, generateGrantMessage, generateLoadMessage, normalizeUaci } from './_utils';

function nOop () { return null as any }

/**
 * @description retrievable-end/grant-end of uacl
 */
export class ACLTree extends Tree<ACLNode> implements FxORMPluginUACLNS.ACLTree {
    // namespace: string = '';

    name: string
    type: 'user' | 'role'

    readonly _tree_stores: FxORMPluginUACLNS.ACLTree['_tree_stores'];
    readonly routing: FxORMPluginUACLNS.ACLTree['routing'];

    constructor ({ name, type = 'user', configRouting = nOop }: {
        name: FxORMPluginUACLNS.ACLTree['name'],
        type: FxORMPluginUACLNS.ACLTree['type'],
        configRouting?: (
            cfg?: {
                tree: FxORMPluginUACLNS.ACLTree,
            }
        ) => Class_Routing | Fibjs.AnyObject
    } = {
        name: null, type: null, configRouting: null
    }) {
        super();

        if (!type || !['user', 'role'].includes(type))
            throw `[ACLTree] valid type is required, but '${type}' provided`

        const _treeStores = {}
        Object.defineProperty(this, '_tree_stores', { get () { return _treeStores }, enumerable: false });

        Object.defineProperty(this, 'name', { get () { return name }, configurable: false });
        Object.defineProperty(this, 'type', { get () { return type }, configurable: false });

        /* after basic info :start */
        let routing = configRouting({ tree: this })
        if (!(routing instanceof mq.Routing))  {
            routing = routing || {}
            routing = new mq.Routing(routing)
        }
        Object.defineProperty(this, 'routing', { get () { return routing }, configurable: false });
        /* after basic info :end */
    }

    /**
     * @description
     *  load resource's information of specific uaci if provided,
     *  if no uaci specified, load all uacis from ALL childNodes in this tree
     */
    load (uaci?: string): void {
        if (!uaci) {
            // const uacis = this.nonRootNodes.map(x => x.id)
            // const msg = generateBatchPullMessage(uacis, { uids: this. })
            this.nonRootNodes.forEach(node => node.pull())
            return ;
        }

        uaci = normalizeUaci(uaci)

        const node = findACLNode(this, uaci)
        if (!node)
            return ;

        node.pull()
    }

    /**
     * @description
     *  save resource's information of specific uaci if provided,
     *  if no uaci specified, save all uacis from ALL childNodes in this tree
     */
    persist(uaci?: string): void {
        if (!uaci) {
            // const uacis = this.nonRootNodes.map(x => x.id)
            // const msg = generateBatchPullMessage(uacis, { uids: this. })
            this.nonRootNodes.forEach(node => node.push(this.type, this.name))
            return ;
        }

        uaci = normalizeUaci(uaci)

        const node = findACLNode(this, uaci)
        if (!node)
            return ;

        node.push(this.type, this.name)
    } 

    /**
     * check if `user` with (this.id) can DO `action` TO uaci('s askedFields if provided)
     * 
     * verb: CAN
     */
    can (action: FxORMPluginUACLNS.ACLType, uaci: string, askedFields: any[]) {
        const node = findACLNode(this, uaci)

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

    grant (
        uaci: string,
        oacl: FxORMPluginUACLNS.OACLStruct,
        opts?: {
            puaci?: string
        }
    ) {
        const { puaci = null } = opts || {}

        let pnode: FxORMPluginUACLNS.Node
        if (puaci && (pnode = findACLNode(this, puaci))) {}
        else
            pnode = this.root
            
        uaci = normalizeUaci(uaci)
        
        ;[null].forEach(() => {
            let node = findACLNode(this, uaci)
            if (!node)
                node = pnode.addChildNode(
                    new ACLNode({
                        id: uaci,
                        data: {
                            id: this.type === 'user' ? this.name : null,
                            role: this.type === 'role' ? this.name : null
                        },
                        oacl
                    })
                ) as ACLNode;

            node.oacl = oacl
        });
    }

    revoke (uaci: string) {
        uaci = normalizeUaci(uaci)
        
        ;[null].forEach(() => {
            let node = findACLNode(this, uaci)
            if (!node)
                return ;

            node.remove()
        });

        return this;
    }

    reset (): void {
        super.clear()
    }
}

export class ACLNode extends Node<FxORMPluginUACLNS.ACLNode['data']> implements FxORMPluginUACLNS.ACLNode {
    data: FxORMPluginUACLNS.ACLNode['data']
    acl: FxORMPluginUACLNS.ACLNode['acl']
    oacl: FxORMPluginUACLNS.ACLNode['oacl']

    root: FxORMPluginUACLNS.Node<any, FxORMPluginUACLNS.ACLTree>['root']
    
    constructor (cfg: FxORMPluginUACLNS.ACLNodeConstructorOptions) {
        if (!cfg.data /* || !cfg.data.hasOwnProperty('id') || !cfg.data.hasOwnProperty('roles') */)
            throw `[ACLNode] valid 'data' is missing in config!`

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
            data: cfg.data
        })

        this.acl = acl
        this.oacl = oacl
    }

    /**
     * @description update local acl information
     */
    updateAcl () {
    }

    /**
     * @description data to storage
     */
    push (
        type: FxORMPluginUACLNS.ACLTree['type'],
        target_id: string
    ) {
        const data = {
            id: type === 'user' ? target_id : null,
            roles: type === 'role' ? [target_id] : []
        }

        const msg = generateGrantMessage(this, {
            uid: data.id,
            type: this.root.tree.type
        })
        console.log('[ACLNode/push]this.oacl', this.oacl)
        console.log('[ACLNode/push]msg.value', msg.value)
        console.log('[ACLNode/push]msg.json()', msg.json())

        mq.invoke(this.root.tree.routing, msg);
    }

    /**
     * @description pull data about uaci(this.id)
     * 
     * if no data corresponding in persist-end, remove this node in tree
     */
    pull () {
        const msg = generateLoadMessage(this.id, {
            uid: this.root.tree.name,
            type: this.root.tree.type
        })
        console.log('[ACLNode/pull]msg.value', msg.value)
        console.log('[ACLNode/pull]msg.json()', msg.json())
    }
}