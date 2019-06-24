/// <reference types="@fxjs/orm" />
/// <reference types="fib-kv" />

declare namespace FxORMPluginUACLInternal {
    type GRANT_TYPE = 'role' | 'user'
    
    type ACLMessagePayload = {
        verb: 'GRANT' | 'QUERY' | 'REVOKE_BY_UACI' | 'REVOKE_BY_UID' | 'REVOKE_BY_ROLE' | 'REVOKE'

        uids: string[]
        roles: string[]
        /**
         * @date must be GMT string
         */
        date: string | Date

        oacl: FxORMPluginUACLNS.ACLNode['oacl']

        // via?: GRANT_TYPE
    } & Fibjs.AnyObject

    type ACLMessagePayloadGrant = ACLMessagePayload & {
    }
    type ACLMessagePayloadQuery = ACLMessagePayload & {
        // uaci?: string
    }
    
    type ACLMessage = Class_Message & {
        /**
         * @once
         * @description parsed message payload
         */
        payload: ACLMessagePayload & Fibjs.AnyObject
        // response: ACLMessageResponse
    } & Fibjs.AnyObject

    // interface ACLMessageResponse extends Class_Message {}

    interface ACLMessageResult<TSUCCESS = any, TERROR = any> {
        success: {
            code: string,
            data: TSUCCESS,
            msg: string
        },
        error: {
            code: string
            data: TERROR
            msg: string
        }
    }

    interface ACLStorageItem {
        uacl_id: string,
        uaci: string,
        target: {
          type: GRANT_TYPE,
          id: string
        },
        depth: 1 | 2
        is_wild: boolean
        read: FxORMPluginUACLNS.ACLNode['oacl']['read']
        write: FxORMPluginUACLNS.ACLNode['oacl']['write']
        delete: FxORMPluginUACLNS.ACLNode['oacl']['delete']
        allowed_actions: string[]
    }
}

declare namespace FxORMPluginUACLNS {
    interface JsonifiedNode {
        id: Node['id']
        leftEdge: number
        rightEdge: number
        children: JsonifiedNode[]

        isRoot?: boolean
    }

    interface NodeConstructorOptions<NTYPE = Node, DTYPE = any> {
        id: string
        parent?: NTYPE,
        children?: NTYPE[]
        data?: DTYPE
    }

    class Node<DTYPE = any, TTREE = any> {
        constructor (cfg: NodeConstructorOptions);

        id: string
        parent: Node | null
        root: RootNode<TTREE> | null
        children: Node[]

        leftEdge: number;
        rightEdge: number;

        data?: DTYPE

        /**
         * @description count of descendant from this Node
         */
        readonly descendantCount: number;
        /**
         * @description layer of this Node in its tree, only valid when `hasRoot` is true or `isRoot` is true
         */
        readonly layer: number;
        /**
         * @description if is root node
         */
        readonly isRoot: boolean;
        /**
         * @description if is not root node and has self own root
         */
        readonly hasRoot: boolean;
        /**
         * @description pedigree of a clan from rootNode
         */
        readonly breadCrumbs: Node[];

        addChildNode (node: Node): Node;
        removeChildNode (node: Node): void;
        remove (): void;

        toJSON (): JsonifiedNode;
    }

    interface RootNode<TTREE = Tree> extends Node {
        id: null
        parent: null
        tree: TTREE
        isRoot: true

        clear (): number;
    }

    interface Tree<NTYPE = Node> {
        root: NTYPE
        // TODO: try to forbid add/remove node by this field
        nodeSet: Set<NTYPE>

        hasNode (node: NTYPE): boolean
        clear (): number

        readonly nodeCount: number
        readonly nodes: NTYPE[]
        readonly nonRootNodes: NTYPE[]

        toJSON: RootNode['toJSON'];
    }

    interface ACLTree extends Tree<ACLNode | RootNode> {
        // user id or role name
        readonly name: string
        readonly type: FxORMPluginUACLInternal.GRANT_TYPE
        readonly _tree_stores: {
            [k: string]: ACLTree
        };
        /**
         * @internal
         * @description routing for invoking message from ACLNode
         */
        readonly routing: Class_Routing

        can (action: FxORMPluginUACLNS.ACLType, uaci: string, askedFields?: string[]): boolean

        load (opts?: ACLTreeLoadOptions): this
        persist(opts?: ACLTreePersistOptions): this
        revoke (opts?: FxORMPluginUACLNS.ACLTreeRevokeOptions): this
        grant (uaci: string, oacl: FxORMPluginUACLNS.ACLNode['oacl']): this
        reset(): this
    }

    type ACLTreeLoadOptions = {
        uaci?: ACLNode['id']   
        sync?: ACLNodePushOpts['sync']
    }
    type ACLTreePersistOptions = {
        sync?: ACLNodePushOpts['sync']
        uaci?: ACLNode['id']   
    }
    type ACLTreeRevokeOptions = {
        sync?: ACLNodePushOpts['sync']
        uaci?: ACLNode['id']   
    }

    interface InstanceUACLInfo {
        objectless: string
        object: string
        id: string
    }

    interface ACLNodeConstructorOptions extends NodeConstructorOptions<ACLNode> {
        data: FxOrmNS.InstanceDataPayload
        acl?: ACLNode['acl']
        oacl?: ACLNode['oacl']
    }

    interface ACLNodePullOpts {
        sync?: boolean
    }
    interface ACLNodePushOpts {
        sync?: boolean
    }
    interface ACLNodeRevokeOpts {
        sync?: boolean
    }
    class ACLNode extends Node {
        constructor (cfg: ACLNodeConstructorOptions);

        static looseNodeOf (tree: ACLTree, cfg: ACLNodeConstructorOptions): ACLNode;

        acl: {
            create?: boolean | string[]
            find?: boolean | string[]
            clear?: boolean | string[]
        }

        oacl: {
            write?: boolean | string[]
            read?: boolean | string[]
            delete?: boolean | string[]
        }

        push (
            target: {
                type: FxORMPluginUACLInternal.ACLStorageItem['target']['type'],
                id: FxORMPluginUACLInternal.ACLStorageItem['target']['id']
            },
            opts?: ACLNodePushOpts
        ): void;
        revoke (opts?: ACLNodeRevokeOpts): void;

        pull (opts?: ACLNodePullOpts): void;
    }

    type ACLType = keyof ACLNode['acl'] | keyof ACLNode['oacl']
    type ACLDescriptor = boolean | string[]

    type ACLTreeStorageRoutingConfigurationGenerator = (
        cfg?: {
            tree: FxORMPluginUACLNS.ACLTree,
        }
    ) => Class_Routing | Fibjs.AnyObject
}

declare namespace FxOrmNS {
    interface ORM {
    }

    interface ExportModule {
    }
}

interface FxOrmPluginUACLOptions {
    orm?: FxOrmNS.ORM
}
interface FxOrmPluginUACL extends FxOrmNS.PluginConstructCallback<
    FxOrmNS.ORM, FxOrmNS.PluginOptions & FxOrmPluginUACLOptions
> {
}

declare module "@fxjs/orm-plugin-uacl" {
    var plugin: FxOrmPluginUACL
    export = plugin;
}
