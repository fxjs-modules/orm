import mq = require('mq')
import coroutine = require('coroutine')

export function arraify<T = any> (item: T | T[]): T[] {
	return Array.isArray(item) ? item : [item]
}

export function normalizeUaci (uaci: string = '') {
    if (!uaci || typeof uaci !== 'string')
        throw new Error(`[normalizeUaci] uaci must be non-empty string`)

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
        type = 'user',
        role = []
    }: {
        uid: FxOrmNS.Arraible<string>,
        role: FxOrmNS.Arraible<string>,
        type: FxORMPluginUACLInternal.GRANT_TYPE
    }
) {
    const msg = new mq.Message()
    msg.type = 1

    msg.value = node.id

    const uids = arraify(uid)
    const roles = arraify(role)

    msg.json({
        verb: 'GRANT',
        date: (new Date()).toUTCString(),
        uids: uids,
        roles: roles,
        oacl: node.oacl,

        // via: type,
    } as FxORMPluginUACLInternal.ACLMessagePayloadGrant)

    return msg
}

export function generateRevokeByUACIMessage (
    node: FxORMPluginUACLNS.ACLNode,
    {
        // uid = null,
        // role = []
    }: {
        // uid: FxOrmNS.Arraible<string>,
        // role: FxOrmNS.Arraible<string>,
    } = {}
) {
    const msg = new mq.Message()
    msg.type = 1

    msg.value = node.id

    msg.json({
        verb: 'REVOKE_BY_UACI',
        date: (new Date()).toUTCString(),
        uids: [],
        roles: [],
        oacl: null,
    } as FxORMPluginUACLInternal.ACLMessagePayloadGrant)

    return msg
}

/**
 * 
 * @param uaci batch query when uaci is empty
 */
export function generateLoadMessage (
    uaci: string,
    {
        uid = null,
        role = [],
        uacis = [],
    }: {
        uid: FxOrmNS.Arraible<string>,
        role: FxOrmNS.Arraible<string>,
        uacis: FxOrmNS.Arraible<string>,
    }
) {
    const msg = new mq.Message()
    msg.type = 1

    msg.value = uaci

    const uids = arraify(uid)
    const roles = arraify(role)
    
    if (uaci)
        uacis = []
    else
        uacis = arraify(uaci)

    msg.json({
        verb: 'QUERY',
        date: (new Date()).toUTCString(),
        uids: uids,
        roles: roles,
        uacis: uacis
    })

    return msg
}
/* for acl-tree: end */

/* for acl-item: start */
export function encodeGrantTareget (type: FxORMPluginUACLInternal.GRANT_TYPE, id = '0') {
    return `${type}:${id}`
}
export function decodeGrantTareget (value: string): [string, string] {
    const tuple = (value || '').split(':')
    return [tuple[0], tuple[1]]
}

export function compuateUaciDepth (uaci: string = '') {
    if (!uaci)
        return 0

    const list = uaci.split('/').filter(x => x !== undefined)
    return Math.floor(list.length / 2)
}

export function isUaciWild (uaci: string = '') {
    if (!uaci)
        return false
        
    const list = uaci.split('/').filter(x => !!x)
    const result = list.every((item, idx) => {
        // even position
        if (idx % 2 === 0) return true
            
        return item + '' === '0'
    })

    return result
}
/* for acl-item: end */

/* for acl-message: start */
export function waitUntil (timeout: number, ifTrue: () => boolean) {
    if (ifTrue())
        return 
    
    const tstart = process.hrtime()
    const evt = new coroutine.Event()
    
    coroutine.start(() => {
        const [t_offset_s] = process.hrtime(tstart)
        while (t_offset_s && t_offset_s * 1000 <= timeout) {
            if (ifTrue())
                break
        }
        evt.set()
    })

    evt.wait()
}
/* for acl-message: end */
