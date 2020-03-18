Object.defineProperty(exports, "__esModule", { value: true });
const mq = require("mq");
const coroutine = require("coroutine");
function arraify(item) {
    return Array.isArray(item) ? item : [item];
}
exports.arraify = arraify;
function normalizeUaci(uaci = '') {
    if (!uaci || typeof uaci !== 'string')
        throw new Error(`[normalizeUaci] uaci must be non-empty string`);
    if (uaci[0] !== '/')
        uaci = '/' + uaci;
    return uaci;
}
exports.normalizeUaci = normalizeUaci;
function findACLNode(aclTree, uaci) {
    let node = null;
    if (!uaci || typeof uaci !== 'string')
        throw Error('[findACLNode]invalid uaci');
    const depth = compuateUaciDepth(uaci);
    for (let x of aclTree.nodeSet) {
        if (x.isRoot)
            continue;
        if (x.layer - 1 !== depth)
            continue;
        if (x.id === uaci) {
            node = x;
            break;
        }
    }
    return node;
}
exports.findACLNode = findACLNode;
/* for acl-tree: start */
/**
 * generate message for retrievable-end
 *
 * ---- head begin ----
 * verb: GRANT
 * date: GMT FORMAT STRING
 * uaci: /project/1; /project/1/stages/2
 * level: 1, 2
 * ---- head end ------
 *
 * ---- body begin ----
 * x-key1: ...
 * x-key2: ...
 * ---- body end ------
 */
function generateGrantMessage(node, { uid = null, role = [] }) {
    const msg = new mq.Message();
    msg.type = 1;
    msg.value = node.id;
    const uids = arraify(uid);
    const roles = arraify(role);
    msg.json({
        verb: 'GRANT',
        date: (new Date()).toUTCString(),
        uids: uids,
        roles: roles,
        oacl: node.oacl,
    });
    return msg;
}
exports.generateGrantMessage = generateGrantMessage;
function generateRevokeByUACIMessage(node, { uid = null, role = [] }) {
    const msg = new mq.Message();
    msg.type = 1;
    msg.value = node.id;
    const uids = arraify(uid);
    const roles = arraify(role);
    msg.json({
        verb: 'REVOKE_BY_UACI',
        date: (new Date()).toUTCString(),
        uids: uids,
        roles: roles,
        oacl: null,
    });
    return msg;
}
exports.generateRevokeByUACIMessage = generateRevokeByUACIMessage;
function getIdsFromTree(tree) {
    let uids = [];
    let roles = [];
    switch (tree.type) {
        case 'user':
            uids = arraify(tree.name);
            break;
        case 'role':
            roles = arraify(tree.name);
            break;
    }
    return {
        uids,
        roles
    };
}
exports.getIdsFromTree = getIdsFromTree;
/**
 *
 * @param uaci batch query when uaci is empty
 */
function generateLoadMessage(uaci, { uid = null, role = [], uacis = [], }) {
    const msg = new mq.Message();
    msg.type = 1;
    msg.value = uaci;
    const uids = arraify(uid);
    const roles = arraify(role);
    if (uaci)
        uacis = [];
    else
        uacis = arraify(uaci);
    msg.json({
        verb: 'QUERY',
        date: (new Date()).toUTCString(),
        uids: uids,
        roles: roles,
        uacis: uacis
    });
    return msg;
}
exports.generateLoadMessage = generateLoadMessage;
/* for acl-tree: end */
/* for acl-item: start */
function encodeGrantTareget(type, id = '0') {
    return `${type}:${id}`;
}
exports.encodeGrantTareget = encodeGrantTareget;
function decodeGrantTareget(value) {
    const tuple = (value || '').split(':');
    return {
        type: tuple[0],
        id: tuple[1]
    };
}
exports.decodeGrantTareget = decodeGrantTareget;
function compuateUaciDepth(uaci = '') {
    if (!uaci)
        return 0;
    const list = uaci.split('/').filter(x => x !== undefined);
    return Math.floor(list.length / 2);
}
exports.compuateUaciDepth = compuateUaciDepth;
function isUaciWild(uaci = '') {
    if (!uaci)
        return false;
    const list = uaci.split('/').filter(x => !!x);
    const result = list.every((item, idx) => {
        // even position
        if (idx % 2 === 0)
            return true;
        return item + '' === '0';
    });
    return result;
}
exports.isUaciWild = isUaciWild;
/* for acl-item: end */
/* for acl-message: start */
function waitUntil(timeout, ifTrue) {
    if (ifTrue())
        return;
    const tstart = process.hrtime();
    const evt = new coroutine.Event();
    coroutine.start(() => {
        const [t_offset_s] = process.hrtime(tstart);
        while (t_offset_s && t_offset_s * 1000 <= timeout) {
            if (ifTrue())
                break;
        }
        evt.set();
    });
    evt.wait();
}
exports.waitUntil = waitUntil;
/* for acl-message: end */
