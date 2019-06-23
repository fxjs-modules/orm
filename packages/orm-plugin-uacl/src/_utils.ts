import mq = require('mq')

export function arraify<T = any> (item: T | T[]): T[] {
	return Array.isArray(item) ? item : [item]
}

export function normalizeUaci (uaci: string = '') {
    if (!uaci || typeof uaci !== 'string')
        throw `[normalizeUaci] uaci must be non-empty string`

    if (uaci[0] !== '/')
        uaci = '/' + uaci

    return uaci
}

export function findNodeForUser (
	aclTree: FxORMPluginUACLNS.ACLTree,
	uaci: string,
	uid: FxORMPluginUACLNS.ACLNode['data']['uid']
): FxORMPluginUACLNS.ACLNode {
    let node: FxORMPluginUACLNS.ACLNode = null

    for (let x of aclTree.nodeSet) {
        if (x.isRoot)
            continue ;

        if (x.id === uaci && x.data.uid === uid) {
            node = x as FxORMPluginUACLNS.ACLNode;            
            break ;
        }
    }

    return node;
}

export function findACLNode (
	aclTree: FxORMPluginUACLNS.ACLTree,
	uaci: string,
): FxORMPluginUACLNS.ACLNode {
    let node: FxORMPluginUACLNS.ACLNode = null

    for (let x of aclTree.nodeSet) {
        if (x.isRoot)
            continue ;

        if (x.id === uaci) {
            node = x as FxORMPluginUACLNS.ACLNode;            
            break ;
        }
    }

    return node;
}

/* for acl-tree: start */
export const GRANT_ERRCODE = {
    4030001: {
        literalCode: 'INVALID_VERB',
        message: 'verb must in `GRANT`, `CAN`, `REVOKE`'
    },
    4030002: {
        literalCode: 'INVALID_DEPTH',
        message: 'depth could be only 1, 2'
    },
}
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
export function generateGrantMessage (
    node: FxORMPluginUACLNS.ACLNode,
    {
        uid = null,
        type = 'user'
    }: {
        uid: string | string[],
        type: FxORMPluginUACLNS.ACLTree['type']
    }
) {
    const msg = new mq.Message()
    msg.type = 1

    msg.value = node.id

    msg.json({
        verb: 'GRANT',
        // grant depth
        depth: node.layer,
        date: (new Date()).toUTCString(),
        uid: uid,
        acl: node.acl,
        oacl: node.oacl,

        via: type,
    })

    return msg
}

export function generateBatchPullMessage (
    uacis: string[],
    {
        uid = null,
        type = 'user'
    }: {
        uid: string | string[],
        type: FxORMPluginUACLNS.ACLTree['type']
    }
) {
    const msg = new mq.Message()
    msg.type = 1

    msg.value = uacis[0]

    msg.json({
        verb: 'BATCH_QUERY',
        uid: uid,

        via: type,
    })

    return msg
}

export function generateLoadMessage (
    uaci: string,
    {
        uid = null,
        type = 'user'
    }: {
        uid: string | string[],
        type: FxORMPluginUACLNS.ACLTree['type']
    }
) {
    const msg = new mq.Message()
    msg.type = 1

    msg.value = uaci

    uid = arraify(uid).filter(x => x)

    msg.json({
        verb: 'QUERY',
        uids: uid,

        via: type,
    })

    return msg
}
/* for acl-tree: end */