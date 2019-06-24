import coroutine = require('coroutine')
import util = require('util')
import mq = require('mq')

import { Tree, Node } from './tree'
import { findACLNode, generateGrantMessage, generateLoadMessage, normalizeUaci, generateRevokeByUACIMessage } from './_utils';

function nOop () { return null as any }

/**
 * @description retrievable-end/grant-end of uacl
 */
export class ACLTree extends Tree<ACLNode> implements FxORMPluginUACLNS.ACLTree {
    name: string
    type: FxORMPluginUACLInternal.GRANT_TYPE

    readonly _tree_stores: FxORMPluginUACLNS.ACLTree['_tree_stores'];
    readonly routing: FxORMPluginUACLNS.ACLTree['routing'];

    constructor ({ name, type = 'user', configStorageServiceRouting = nOop }: {
        name: FxORMPluginUACLNS.ACLTree['name'],
        type: FxORMPluginUACLNS.ACLTree['type'],
        configStorageServiceRouting?: FxORMPluginUACLNS.ACLTreeStorageRoutingConfigurationGenerator
    } = {
        name: null, type: null, configStorageServiceRouting: null
    }) {
        super();

        if (!type || !['user', 'role'].includes(type))
            throw `[ACLTree] valid type is required, but '${type}' provided`

        const _treeStores = {}
        Object.defineProperty(this, '_tree_stores', { get () { return _treeStores }, enumerable: false });

        if (typeof name === 'number') {
            if (isNaN(name)) name = '0'
            else name = name + ''
        }
        Object.defineProperty(this, 'name', { get () { return name }, configurable: false });
        Object.defineProperty(this, 'type', { get () { return type }, configurable: false });

        /* after basic info :start */
        let routing = configStorageServiceRouting({ tree: this })
        if (!(routing instanceof mq.Routing))  {
            routing = routing || {}
            routing = new mq.Routing(routing)
        }
        Object.defineProperty(this, 'routing', { get () { return routing }, configurable: false });
        /* after basic info :end */
    }

    /**
     * @default_sync
     * @description
     *  load resource's information of specific uaci if provided,
     *  if no uaci specified, load all uacis from ALL childNodes in this tree
     */
    load (opts?: FxORMPluginUACLNS.ACLTreePersistOptions) {
        let { uaci = null, sync: is_sync = true } = opts || {}

        if (!uaci) {
            // const uacis = this.nonRootNodes.map(x => x.id)
            // const msg = generateBatchPullMessage(uacis, { uids: this. })
            this.nonRootNodes.forEach(node => node.pull({ sync: is_sync }))
            return this;
        }

        uaci = normalizeUaci(uaci)

        let node = findACLNode(this, uaci)
        if (!node)
            node = ACLNode.looseNodeOf(this, {id: uaci, data: {}})

        // use synchronous mode
        node.pull({ sync: is_sync })

        return this
    }

    /**
     * @default_async
     * @description
     *  save resource's information of specific uaci if provided,
     *  if no uaci specified, save all uacis from ALL childNodes in this tree
     */
    persist(opts?: FxORMPluginUACLNS.ACLTreePersistOptions) {
        let { uaci = null, sync: is_sync = false } = opts || {}

        if (!uaci) {
            this.nonRootNodes.forEach(
                node => node.push({
                    type: this.type,
                    id: this.name
                }, {
                    sync: is_sync
                })
            )
            return this;
        }

        uaci = normalizeUaci(uaci)

        const node = findACLNode(this, uaci)
        if (!node)
            return this;

        node.push(
            {
                type: this.type,
                id: this.name
            },
            { sync: is_sync }
        )

        return this
    }

    revoke (
        opts?: FxORMPluginUACLNS.ACLTreeRevokeOptions
    ) {
        let { uaci = null, sync: is_sync = false } = opts || {}

        if (!uaci) {
            this.nonRootNodes.forEach(
                node => node.revoke({
                    sync: is_sync
                })
            )
            return this;
        }

        uaci = normalizeUaci(uaci)

        const node = findACLNode(this, uaci)
        if (!node)
            return this;

        node.revoke({ sync: is_sync })

        return this
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
        oacl: FxORMPluginUACLNS.ACLNode['oacl'],
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

        return this;
    }

    reset () {
        super.clear()

        return this;
    }
}

export class ACLNode extends Node<FxORMPluginUACLNS.ACLNode['data']> implements FxORMPluginUACLNS.ACLNode {
    data: FxORMPluginUACLNS.ACLNode['data']
    acl: FxORMPluginUACLNS.ACLNode['acl']
    oacl: FxORMPluginUACLNS.ACLNode['oacl']

    root: FxORMPluginUACLNS.Node<any, FxORMPluginUACLNS.ACLTree>['root']

    static looseNodeOf (tree: FxORMPluginUACLNS.ACLTree, cfg: FxORMPluginUACLNS.ACLNodeConstructorOptions) {
        const node = new ACLNode(cfg)
        node.root = tree.root as ACLNode['root']

        return node;
    }
    
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
            delete: undefined,
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
     * @default_async
     * @description data to storage
     */
    push (
        {
            type = null,
            id = null
        }: {
            type: FxORMPluginUACLInternal.ACLStorageItem['target']['type'],
            id: FxOrmNS.Arraible<FxORMPluginUACLInternal.ACLStorageItem['target']['id']>
        },
        opts?: FxORMPluginUACLNS.ACLNodePushOpts
    ) {
        const { sync = false } = opts || {};

        const data = {
            id: type === 'user' ? id : null,
            role: type === 'role' ? id : []
        }

        const msg = generateGrantMessage(this, {
            uid: data.id,
            role: data.role,
            type: this.root.tree.type,
        })

        const evt = new coroutine.Event()

        const handler = () => {
            const { success, error } = msg.json() as FxORMPluginUACLInternal.ACLMessageResult<FxORMPluginUACLInternal.ACLStorageItem[]>

            if (success && success.code === 'pending') {
                return 
            } else if (error) {
                console.error('error', error);
            }

            evt.set()
        }

        coroutine.start(() => {
            mq.invoke(this.root.tree.routing, msg);

            handler()
        })

        if (sync) evt.wait()
    }

    /**
     * @default_sync
     * @description pull data about uaci(this.id)
     * 
     * if no data corresponding in persist-end, remove this node in tree
     */
    pull (
        opts?: FxORMPluginUACLNS.ACLNodePullOpts
    ) {
        const { sync = true } = opts || {};

        const msg = generateLoadMessage(this.id, {
            uid: this.root.tree.name,
            role: [],
            uacis: []
        })

        const evt = new coroutine.Event()

        const handler = () => {
            const { success, error } = msg.json() as FxORMPluginUACLInternal.ACLMessageResult<FxORMPluginUACLInternal.ACLStorageItem[]>

            if (success && success.code === 'pending') {
                return 
            } else if (error) {
                console.error('error', error);
                evt.set()
                return 
            }

            const { data: aclInfos = [] } = success || {}
            /**
             * @TODO: update the whole tree for `root.tree.type+root.tree.name` once
             */
            const sync_lock = new coroutine.Lock()
            sync_lock.acquire()
            aclInfos.forEach((item) => {
                if (item.target.type !== this.root.tree.type)
                    return ;

                if (item.target.id !== this.root.tree.name)
                    return ;

                this.root.tree.grant(item.uaci, {
                    write: item.write,
                    read: item.read,
                    delete: item.delete
                })
            })
            sync_lock.release()

            evt.set()
        }

        coroutine.start(() => {
            mq.invoke(this.root.tree.routing, msg, 
            );

            handler()
        })

        if (sync) evt.wait()
    }

    /**
     * @default_sync
     * @description pull data about uaci(this.id)
     * 
     * if no data corresponding in persist-end, remove this node in tree
     */
    revoke (
        opts?: FxORMPluginUACLNS.ACLNodeRevokeOpts
    ) {
        const tree = this.root.tree;

        // remove local data firstly
        this.remove();
        
        const { sync = true } = opts || {};

        const msg = generateRevokeByUACIMessage(this)

        const evt = new coroutine.Event()

        const handler = () => {
            const { success, error } = msg.json() as FxORMPluginUACLInternal.ACLMessageResult<FxORMPluginUACLInternal.ACLStorageItem[]>

            if (success && success.code === 'pending') {
                return 
            } else if (error) {
                console.error('error', error);
                evt.set()
                return 
            }

            /**
             * @TODO: update the whole tree for `root.tree.type+root.tree.name` once
             */
            evt.set()
        }

        coroutine.start(() => {
            mq.invoke(tree.routing, msg);

            handler()
        })

        if (sync) evt.wait()
    }
}