/// <reference types="@fxjs/orm" />
/// <reference types="fib-kv" />

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
        readonly type: 'user' | 'role'
        readonly _tree_stores: {
            [k: string]: ACLTree
        };
        /**
         * @internal
         * @description routing for invoking message from ACLNode
         */
        readonly routing: Class_Routing
        // readonly readORM: FxOrmNS.ORM;
        // readonly saveORM: FxOrmNS.ORM;
        // association_name?: string
        // association_info?: FxOrmModel.Model['associations'][any]

        load (uaci?: string): void
        persist(uaci?: string): void

        can (action: FxORMPluginUACLNS.ACLType, uaci: string, askedFields?: string[]): boolean
        grant (uaci: string, oacl: FxORMPluginUACLNS.OACLStruct): void
        reset(): void
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

    class ACLNode extends Node {
        constructor (cfg: ACLNodeConstructorOptions);
        // data: {
        //     uid: string | number
        //     uroles: string[]
        // }

        acl: {
            create?: boolean | string[]
            find?: boolean | string[]
            clear?: boolean | string[]
        }

        oacl: {
            write?: boolean | string[]
            read?: boolean | string[]
            remove?: boolean | string[]
        }

        push (type: 'user' | 'role', target_id: string): void;

        pull (): void;
    }

    type ACLType = keyof ACLNode['acl'] | keyof ACLNode['oacl']
    type ACLDescriptor = boolean | string[]

    interface ACLStruct {
        create?: boolean | string[]
        clear?: boolean | string[]
    }
    
    interface OACLStruct {
        find?: boolean | string[]
        write?: boolean | string[]
        read?: boolean | string[]
        remove?: boolean | string[]
    }
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
