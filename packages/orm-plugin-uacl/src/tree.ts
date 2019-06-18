function nodeEdgeAdd (node: Node, side: 'left' | 'right', count = 2) {
    switch (side) {
        case 'left':
            node.leftEdge += count;
            break
        case 'right':
            node.rightEdge += count;
            break
    }
}

function reCountEdgeAfterSetParent (nodeToAdd: Node, tree: Tree) {
    if (!nodeToAdd.parent)
        return ;

    const parent = nodeToAdd.parent;

    nodeToAdd.leftEdge = parent.rightEdge;
    nodeToAdd.rightEdge = nodeToAdd.leftEdge + 1;

    const rgt = parent.rightEdge;

    tree.nodeSet.forEach((node) => {
        if (node.leftEdge >= rgt)
            nodeEdgeAdd(node, 'left', 2)

        if (node.rightEdge >= rgt)
            nodeEdgeAdd(node, 'right', 2)
    })
}

function reCountEdgeAfterOffParent (removedNode: Node, tree: Tree) {
    if (tree.hasNode(removedNode))
        unrecordNode.call(tree, removedNode);

    const leftEdge = removedNode.leftEdge
    const rightEdge = removedNode.rightEdge

    tree.nodeSet.forEach((node) => {
        if (node.leftEdge > leftEdge)
            nodeEdgeAdd(node, 'left', -2)

        if (node.rightEdge > rightEdge)
            nodeEdgeAdd(node, 'right', -2)
    })
}

function reAssignRoot (node: Node) {
    if (isRoot(node))
        return node.root = node;

    let _root: RootNode | Node = node;
    while (_root.parent !== null) {
        _root = _root.parent as any;
    }

    node.root = isRoot(_root) ? _root : null
}

interface JsonifiedNode {
    id: Node['id']
    leftEdge: Node['id']
    rightEdge: Node['id']
    children: JsonifiedNode[]
}

function jsonifyNodeInfo (node: FxORMPluginUACL.Node): JsonifiedNode {
    return {
        id: node.id,
        leftEdge: node.leftEdge,
        rightEdge: node.rightEdge,
        children: node.children.map(node => jsonifyNodeInfo(node))
    }
}

function isRoot (node: RootNode | Node): node is RootNode {
    return node instanceof RootNode
}

function initializeDataOfNode (this: Node) {
    this.leftEdge = -Infinity
    this.rightEdge = +Infinity
}

export class Node implements FxORMPluginUACL.Node {
    id: string | number
    parent: FxORMPluginUACL.Node | null
    root: RootNode
    children: FxORMPluginUACL.Node[]

    leftEdge: number = -Infinity;
    rightEdge: number = +Infinity;

    get descendantCount () {
        return Math.floor(
            (this.rightEdge - this.leftEdge - 1) / 2
        )
    }

    get layer () {
        if (isRoot(this))
            return 1;
            
        let layer = 0;
        const lft = this.leftEdge
        const rgt = this.rightEdge

        this.root.tree.nodeSet.forEach(node => {
            if (node.leftEdge <= lft && node.rightEdge >= rgt)
                layer++;
        })

        return layer
    }

    get isRoot () {
        return isRoot(this)
    }

    get hasRoot () {
        return !isRoot(this) && this.root && isRoot(this.root)
    }

    get breadCrumbs () {
        let nodes: Node[] = [];

        const lft = this.leftEdge
        const rgt = this.rightEdge

        this.root.tree.nodeSet.forEach(node => {
            const yes = node.leftEdge < lft && node.rightEdge > rgt
            if (!yes)
                return ;

            nodes.push(node);
            // nodes = nodes.sort((a, b) => a.leftEdge < b.leftEdge ? -1 : 1);
        });

        return nodes.sort((a, b) => a.leftEdge < b.leftEdge ? -1 : 1);
    }

    constructor ({
        id = null,
        parent = null,
        children = []
    }: FxORMPluginUACL.NodeConstructorOptions = {
        id: null
    }) {
        if (typeof id !== 'string' && typeof id !== 'number' && id < 0)
            throw `[Node] id is required!`

        this.id = id
        this.setParent(parent);
        
        const _children: Node['children'] = Array.from(children);
        Object.defineProperty(this, 'children', { get () { return _children } });
    }

    setParent (parentNode: FxORMPluginUACL.Node) {
        parentNode = parentNode || null;

        this.parent = parentNode;
        reAssignRoot(this);
    }

    removeParent () {
        this.parent = null;
        reAssignRoot(this);
    }

    addChildNode (node: Node) {
        this.children.push(node);
        const tree = this.root.tree;
        node.setParent(this);

        reCountEdgeAfterSetParent(node, tree);

        recordNode.call(tree, node);
    }

    removeChildNode (node: Node) {
        if (node.parent !== this)
            return ;

        const idx = this.children.findIndex(x => x === node);

        if (idx === -1)
            return ;

        this.children.splice(idx, 1);
        const tree = node.root.tree;
        node.removeParent();
        
        reCountEdgeAfterOffParent(node, tree);

        unrecordNode.call(tree, node);
    }

    // destroy () {
    //     this.root = null
    //     initializeDataOfNode.call(this)
    // }

    toJSON () {
        return jsonifyNodeInfo(this)
    }
}

function setTree (this: RootNode, tree: Tree) {
    Object.defineProperty(this, 'tree', { get () { return tree } })
}

class RootNode extends Node implements FxORMPluginUACL.RootNode {
    id: 0
    parent: null
    tree: Tree
    isRoot: true

    constructor (opts?: FxORMPluginUACL.NodeConstructorOptions) {
        super({...opts, parent: null, id: 0})

        this.leftEdge = 1;
        this.rightEdge = 2;
    }
}

function setRootNode (this: Tree, root: RootNode) {
    if (this.root)
        unrecordNode.call(this, this.root)
        
    if (!(root instanceof RootNode))
        throw `[Tree] root node must be RootNode!`
        
    setTree.call(root, this);
    Object.defineProperty(this, 'root', { get () { return root } })

    recordNode.call(this, root);
}

function recordNode (this: Tree, node: Node) {
    this.nodeSet.add(node)
}

function unrecordNode (this: Tree, node: Node) {
    this.nodeSet.delete(node);
}

export class Tree<NTYPE extends Node = Node> implements FxORMPluginUACL.Tree {
    root: RootNode;

    nodeSet: Set<NTYPE>;

    get nodeCount () {
        return this.root.descendantCount + 1;
    }

    get nodes () {
        return Array.from(this.nodeSet.values())
    }

    constructor ({}: any = {}) {
        const _nodes = new Set<NTYPE>();
        Object.defineProperty(this, 'nodeSet', { get () { return _nodes } });

        const _root = new RootNode()
        setRootNode.call(this, _root);
    }

    hasNode (node: NTYPE) {
        return this.nodeSet.has(node);
    }
}