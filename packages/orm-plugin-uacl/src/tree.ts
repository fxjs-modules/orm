function nodeEdgeAdd (node: FxORMPluginUACL.Node, side: 'left' | 'right', count = 2) {
    switch (side) {
        case 'left':
            node.leftEdge += count;
            break
        case 'right':
            node.rightEdge += count;
            break
    }
}

function reCountEdgeAfterSetParent (nodeToAdd: FxORMPluginUACL.Node, tree: FxORMPluginUACL.Tree) {
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

function reCountEdgeAfterOffParent (removedNode: FxORMPluginUACL.Node, tree: FxORMPluginUACL.Tree) {
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

function setParent (self: Node, parentNode: FxORMPluginUACL.Node) {
    parentNode = parentNode || null;

    self.parent = parentNode;
    reAssignRoot(self);
}

function removeFromParent (self: Node) {
    self.parent = null;
    reAssignRoot(self);
}

function jsonifyNodeInfo (node: FxORMPluginUACL.Node): FxORMPluginUACL.JsonifiedNode {
    return {
        id: node.id,
        ...node.isRoot && { isRoot: node.isRoot },
        ...node.data !== undefined && { data: node.data },
        leftEdge: node.leftEdge,
        rightEdge: node.rightEdge,
        children: node.children.map(node => jsonifyNodeInfo(node))
    }
}

function isRoot (node: Node['root'] | Node): node is RootNode {
    return node instanceof RootNode
}

function initializeDataOfNode (this: Node) {
    this.leftEdge = -Infinity
    this.rightEdge = +Infinity
}

export class Node<DTYPE = any> implements FxORMPluginUACL.Node<DTYPE> {
    id: FxORMPluginUACL.Node['id']
    parent: FxORMPluginUACL.Node['parent']
    root: FxORMPluginUACL.Node['root']
    children: FxORMPluginUACL.Node['children']

    leftEdge: FxORMPluginUACL.Node['leftEdge'] = -Infinity;
    rightEdge: FxORMPluginUACL.Node['rightEdge'] = +Infinity;

    data?: FxORMPluginUACL.Node['data']

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

    get isRoot (): boolean {
        return isRoot(this)
    }

    get hasRoot (): boolean {
        return !isRoot(this) && this.root && isRoot(this.root)
    }

    get breadCrumbs () {
        let nodes: FxORMPluginUACL.Node[] = [];

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
        children = [],
        data = undefined
    }: FxORMPluginUACL.NodeConstructorOptions = {
        id: null
    }) {
        if (typeof id !== 'string' && typeof id !== 'number' && id < 0)
            throw `[Node] id is required!`

        this.id = id
        setParent(this, parent);

        Object.defineProperties(this, {
            leftEdge: { enumerable: false, value: -Infinity, configurable: false },
            rightEdge: { enumerable: false, value: +Infinity, configurable: false },
        })
        
        const _children: Node['children'] = Array.from(children);
        Object.defineProperty(this, 'children', { get () { return _children } });

        if (data !== undefined)
            this.data = data
    }

    addChildNode (node: Node) {
        this.children.push(node);

        const tree = this.root.tree;
        
        setParent(node, this);
        reCountEdgeAfterSetParent(node, tree);
        recordNode.call(tree, node);

        return node;
    }

    removeChildNode (node: Node) {
        if (node.parent !== this)
            return ;

        const idx = this.children.findIndex(x => x === node);

        if (idx === -1)
            return ;
            
        if (node.children.length) {
            Array.from(node.children).forEach((childNode) => {
                node.removeChildNode(childNode as Node)
            });
        }

        this.children.splice(idx, 1);
        
        const tree = this.root.tree;
        
        unrecordNode.call(tree, node);
        reCountEdgeAfterOffParent(node, tree);
        removeFromParent(node);
    }

    toJSON (): FxORMPluginUACL.JsonifiedNode {
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

    clear (): number {
        const count = this.descendantCount;

        this.children.splice(0);

        this.leftEdge = 1;
        this.rightEdge = 2;

        return count;
    };

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

    clear (): number {
        const count = this.nodeCount - 1;

        this.nodeSet.clear();
        this.root.clear();

        recordNode.call(this, this.root);

        return count;
    }

    toJSON () {
        if (!this.root)
            return null
            
        return this.root.toJSON()
    }
}