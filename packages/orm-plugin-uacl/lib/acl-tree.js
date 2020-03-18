Object.defineProperty(exports, "__esModule", { value: true });
const coroutine = require("coroutine");
const util = require("util");
const mq = require("mq");
const tree_1 = require("./tree");
const _utils_1 = require("./_utils");
function nOop() { return null; }
/**
 * @description retrievable-end/grant-end of uacl
 */
class ACLTree extends tree_1.Tree {
    constructor({ name, type = 'user', configStorageServiceRouting = nOop } = {
        name: null, type: null, configStorageServiceRouting: null
    }) {
        super();
        if (!type || !['user', 'role'].includes(type))
            throw `[ACLTree] valid type is required, but '${type}' provided`;
        const _treeStores = {};
        Object.defineProperty(this, '_tree_stores', { get() { return _treeStores; }, enumerable: false });
        if (typeof name === 'number') {
            if (isNaN(name))
                name = '0';
            else
                name = name + '';
        }
        Object.defineProperty(this, 'name', { get() { return name; }, configurable: false });
        Object.defineProperty(this, 'type', { get() { return type; }, configurable: false });
        /* after basic info :start */
        let routing = configStorageServiceRouting({ tree: this });
        if (!(routing instanceof mq.Routing)) {
            routing = routing || {};
            routing = new mq.Routing(routing);
        }
        Object.defineProperty(this, 'routing', { get() { return routing; }, configurable: false });
        /* after basic info :end */
    }
    /**
     * @default_sync
     * @description
     *  load resource's information of specific uaci if provided,
     *  if no uaci specified, load all uacis from ALL childNodes in this tree
     */
    load(opts) {
        let { uaci = null, sync: is_sync = true } = opts || {};
        if (!uaci) {
            this.nonRootNodes.forEach(node => node.pull({ sync: is_sync }));
            return this;
        }
        uaci = _utils_1.normalizeUaci(uaci);
        let node = _utils_1.findACLNode(this, uaci);
        if (!node)
            node = ACLNode.looseNodeOf(this, { id: uaci, data: {} });
        // use synchronous mode
        node.pull({ sync: is_sync });
        return this;
    }
    /**
     * @default_async
     * @description
     *  save resource's information of specific uaci if provided,
     *  if no uaci specified, save all uacis from ALL childNodes in this tree
     */
    persist(opts) {
        let { uaci = null, sync: is_sync = false } = opts || {};
        if (!uaci) {
            this.nonRootNodes.forEach(node => node.push({
                type: this.type,
                id: this.name
            }, {
                sync: is_sync
            }));
            return this;
        }
        uaci = _utils_1.normalizeUaci(uaci);
        const node = _utils_1.findACLNode(this, uaci);
        if (!node)
            return this;
        node.push({
            type: this.type,
            id: this.name
        }, { sync: is_sync });
        return this;
    }
    revoke(opts) {
        let { uaci = null, sync: is_sync = false } = opts || {};
        if (!uaci) {
            this.nonRootNodes.forEach(node => node.revoke({
                sync: is_sync
            }));
            return this;
        }
        uaci = _utils_1.normalizeUaci(uaci);
        const node = _utils_1.findACLNode(this, uaci);
        if (!node)
            return this;
        node.revoke({ sync: is_sync });
        return this;
    }
    /**
     * check if `user` with (this.id) can DO `action` TO uaci('s askedFields if provided)
     *
     * verb: CAN
     */
    can(action, uaci, askedFields) {
        const node = _utils_1.findACLNode(this, uaci);
        if (!node)
            return false;
        return node.could(action, uaci, askedFields);
    }
    grant(uaci, oacl, opts) {
        const { puaci = null } = opts || {};
        let pnode;
        if (puaci && (pnode = _utils_1.findACLNode(this, puaci))) { }
        else
            pnode = this.root;
        uaci = _utils_1.normalizeUaci(uaci);
        [null].forEach(() => {
            let node = _utils_1.findACLNode(this, uaci);
            if (!node)
                node = pnode.addChildNode(new ACLNode({
                    id: uaci,
                    data: {
                        id: this.type === 'user' ? this.name : null,
                        role: this.type === 'role' ? this.name : null
                    },
                    oacl
                }));
            _setOACL(node, oacl);
        });
        return this;
    }
    reset() {
        super.clear();
        return this;
    }
    find({ uaci = '' }) {
        return _utils_1.findACLNode(this, uaci);
    }
}
exports.ACLTree = ACLTree;
function _setOACL(node, newOACL) {
    const { write = undefined, read = undefined, delete: _del = undefined, } = Object.assign({}, node.oacl, newOACL);
    const oacl = {
        write: write,
        read: read,
        delete: _del,
    };
    node.oacl = oacl;
}
class ACLNode extends tree_1.Node {
    static looseNodeOf(tree, cfg) {
        const node = new ACLNode(cfg);
        node.root = tree.root;
        return node;
    }
    constructor(cfg) {
        cfg.data = Object.assign({}, cfg.data);
        super({
            id: cfg.id,
            parent: cfg.parent,
            children: cfg.children,
            data: cfg.data
        });
        _setOACL(this, cfg.oacl);
    }
    /**
     * @default_async
     * @description data to storage
     */
    push({ type = null, id = null }, opts) {
        const { sync = false } = opts || {};
        const data = {
            id: type === 'user' ? id : null,
            role: type === 'role' ? id : []
        };
        const msg = _utils_1.generateGrantMessage(this, {
            uid: data.id,
            role: data.role,
        });
        const evt = new coroutine.Event();
        const handler = () => {
            const { success, error } = msg.json();
            if (success && success.code === 'pending') {
                return;
            }
            else if (error) {
                console.error('error', error);
            }
            evt.set();
        };
        coroutine.start(() => {
            mq.invoke(this.root.tree.routing, msg);
            handler();
        });
        if (sync)
            evt.wait();
    }
    /**
     * @default_sync
     * @description pull data about uaci(this.id)
     *
     * if no data corresponding in persist-end, remove this node in tree
     */
    pull(opts) {
        const { sync = true } = opts || {};
        const msg = _utils_1.generateLoadMessage(this.id, {
            uid: this.root.tree.name,
            role: [],
            uacis: []
        });
        const evt = new coroutine.Event();
        const handler = () => {
            const { success, error } = msg.json();
            if (success && success.code === 'pending') {
                return;
            }
            else if (error) {
                console.error('error', error);
                evt.set();
                return;
            }
            const { data: aclInfos = [] } = success || {};
            /**
             * @TODO: update the whole tree for `root.tree.type+root.tree.name` once
             */
            const sync_lock = new coroutine.Lock();
            sync_lock.acquire();
            aclInfos.forEach((item) => {
                if (item.target.type !== this.root.tree.type)
                    return;
                if (item.target.id !== this.root.tree.name)
                    return;
                this.root.tree.grant(item.uaci, {
                    write: item.write,
                    read: item.read,
                    delete: item.delete
                });
            });
            sync_lock.release();
            evt.set();
        };
        coroutine.start(() => {
            mq.invoke(this.root.tree.routing, msg);
            handler();
        });
        if (sync)
            evt.wait();
    }
    /**
     * @default_sync
     * @description pull data about uaci(this.id)
     *
     * if no data corresponding in persist-end, remove this node in tree
     */
    revoke(opts) {
        const tree = this.root.tree;
        // remove local data firstly
        this.remove();
        const { sync = true } = opts || {};
        const { uids: uid, roles: role } = _utils_1.getIdsFromTree(tree);
        const msg = _utils_1.generateRevokeByUACIMessage(this, { uid, role });
        const evt = new coroutine.Event();
        const handler = () => {
            const { success, error } = msg.json();
            if (success && success.code === 'pending') {
                return;
            }
            else if (error) {
                console.error('error', error);
                evt.set();
                return;
            }
            /**
             * @TODO: update the whole tree for `root.tree.type+root.tree.name` once
             */
            evt.set();
        };
        coroutine.start(() => {
            mq.invoke(tree.routing, msg);
            handler();
        });
        if (sync)
            evt.wait();
    }
    /**
     * @local_computation
     */
    could(action, uaci, askedFields) {
        const node = this;
        const oacl = node.oacl[action];
        if (!oacl)
            return false;
        if (oacl === true)
            return true;
        if (!askedFields || !askedFields.length)
            return false;
        let permissonedFields = []
            .concat(Array.isArray(oacl) ? oacl : []);
        if (!permissonedFields.length)
            return false;
        if (askedFields.length > permissonedFields.length)
            return false;
        const diff = util.difference(askedFields, permissonedFields);
        return !diff.length;
    }
}
exports.ACLNode = ACLNode;
