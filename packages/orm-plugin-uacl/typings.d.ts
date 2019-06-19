/// <reference types="@fxjs/orm" />
/// <reference types="fib-kv" />

declare namespace FxORMPluginUACL {
    interface JsonifiedNode {
        id: Node['id']
        leftEdge: Node['id']
        rightEdge: Node['id']
        children: JsonifiedNode[]

        isRoot?: boolean
    }

    interface NodeConstructorOptions<NTYPE = Node> {
        id: string | number
        parent?: NTYPE,
        children?: NTYPE[]
    }

    class Node {
        constructor (cfg: NodeConstructorOptions);

        id: string | number
        parent: Node | null
        root: Node
        children: Node[]

        leftEdge: number;
        rightEdge: number;

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

        toJSON (): JsonifiedNode;
    }

    interface RootNode extends Node {
        id: 0
        parent: null
        tree: Tree
        isRoot: true
    }

    interface Tree<NTYPE = Node> {
        root: NTYPE
        // TODO: try to forbid add/remove node by this field
        nodeSet: Set<NTYPE>
        hasNode (node: NTYPE): boolean

        readonly nodeCount: number
        readonly nodes: NTYPE[]

        toJSON: RootNode['toJSON'];
    }

    type ACLTree = Tree<ACLNode | RootNode>
    // interface ACLTree extends Tree {
    // }

    interface ACLNodeConstructorOptions extends NodeConstructorOptions<ACLNode> {
        data: ACLNode['data']
    }

    class ACLNode extends Node {
        constructor (cfg: ACLNodeConstructorOptions);
        data: FxOrmNS.Instance | FxOrmNS.InstanceDataPayload

        acl: {
            create?: boolean | string[]
            clear?: boolean | string[]
        }

        oacl: {
            find?: boolean | string[]
            write?: boolean | string[]
            read?: boolean | string[]
            remove?: boolean | string[]
        }
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
}
interface FxOrmPluginUACL extends FxOrmNS.PluginConstructCallback<
    FxOrmNS.ORM, FxOrmNS.PluginOptions & FxOrmPluginUACLOptions
> {
}

declare module "@fxjs/orm-plugin-uacl" {
    var plugin: FxOrmPluginUACL
    export = plugin;
}
