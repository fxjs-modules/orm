Object.defineProperty(exports, "__esModule", { value: true });
function nodeEdgeAdd(node, side, count = 2) {
    switch (side) {
        case 'left':
            node.leftEdge += count;
            break;
        case 'right':
            node.rightEdge += count;
            break;
    }
}
function reCountEdgeAfterSetParent(nodeToAdd, tree) {
    if (!nodeToAdd.parent)
        return;
    const parent = nodeToAdd.parent;
    nodeToAdd.leftEdge = parent.rightEdge;
    nodeToAdd.rightEdge = nodeToAdd.leftEdge + 1;
    const rgt = parent.rightEdge;
    tree.nodeSet.forEach((node) => {
        if (node.leftEdge >= rgt)
            nodeEdgeAdd(node, 'left', 2);
        if (node.rightEdge >= rgt)
            nodeEdgeAdd(node, 'right', 2);
    });
}
function reCountEdgeAfterOffParent(removedNode, tree) {
    const leftEdge = removedNode.leftEdge;
    const rightEdge = removedNode.rightEdge;
    tree.nodeSet.forEach((node) => {
        if (node.leftEdge > leftEdge)
            nodeEdgeAdd(node, 'left', -2);
        if (node.rightEdge > rightEdge)
            nodeEdgeAdd(node, 'right', -2);
    });
}
function reAssignRoot(node) {
    if (isRoot(node))
        return node.root = node;
    let _root = node;
    while (_root.parent !== null) {
        _root = _root.parent;
    }
    node.root = isRoot(_root) ? _root : null;
}
function setParent(self, parentNode) {
    parentNode = parentNode || null;
    self.parent = parentNode;
    reAssignRoot(self);
}
function removeFromParent(self) {
    self.parent = null;
    reAssignRoot(self);
}
function jsonifyNodeInfo(node) {
    return Object.assign({ id: node.id }, node.isRoot && { isRoot: node.isRoot }, node.data !== undefined && { data: node.data }, { leftEdge: node.leftEdge, rightEdge: node.rightEdge, children: node.children.map(node => jsonifyNodeInfo(node)) });
}
function isRoot(node) {
    return node instanceof RootNode;
}
class Node {
    constructor({ id = null, parent = null, children = [], data = undefined } = {
        id: null
    }) {
        this.leftEdge = -Infinity;
        this.rightEdge = +Infinity;
        this._depth = null;
        if (typeof id !== 'string' && typeof id !== 'number' && id < 0)
            throw `[Node] id is required!`;
        this.id = id;
        setParent(this, parent);
        Object.defineProperties(this, {
            leftEdge: { enumerable: false, value: -Infinity, configurable: false },
            rightEdge: { enumerable: false, value: +Infinity, configurable: false },
        });
        const _children = Array.from(children);
        Object.defineProperty(this, 'children', { get() { return _children; } });
        if (data !== undefined)
            this.data = data;
    }
    get descendantCount() {
        return Math.floor((this.rightEdge - this.leftEdge - 1) / 2);
    }
    get layer() {
        if (this._depth !== null)
            return this._depth + 1;
        if (isRoot(this)) {
            Object.defineProperty(this, '_depth', { value: 0, writable: false, configurable: false });
        }
        else {
            let layer = 0;
            const lft = this.leftEdge;
            const rgt = this.rightEdge;
            this.root.tree.nodeSet.forEach(node => {
                if (node.leftEdge <= lft && node.rightEdge >= rgt)
                    layer++;
            });
            Object.defineProperty(this, '_depth', { value: layer - 1, writable: false, configurable: false });
        }
        return this._depth + 1;
    }
    get isRoot() {
        return isRoot(this);
    }
    get hasRoot() {
        return !isRoot(this) && this.root && isRoot(this.root);
    }
    get breadCrumbs() {
        let nodes = [];
        const lft = this.leftEdge;
        const rgt = this.rightEdge;
        this.root.tree.nodeSet.forEach(node => {
            const yes = node.leftEdge < lft && node.rightEdge > rgt;
            if (!yes)
                return;
            nodes.push(node);
            // nodes = nodes.sort((a, b) => a.leftEdge < b.leftEdge ? -1 : 1);
        });
        return nodes.sort((a, b) => a.leftEdge < b.leftEdge ? -1 : 1);
    }
    addChildNode(node) {
        this.children.push(node);
        const tree = this.root.tree;
        setParent(node, this);
        reCountEdgeAfterSetParent(node, tree);
        recordNode.call(tree, node);
        return node;
    }
    removeChildNode(node) {
        if (node.parent !== this)
            return false;
        const idx = this.children.findIndex(x => x === node);
        if (idx === -1)
            return false;
        if (node.children.length) {
            Array.from(node.children).forEach((childNode) => {
                node.removeChildNode(childNode);
            });
        }
        this.children.splice(idx, 1);
        const tree = this.root.tree;
        unrecordNode.call(tree, node);
        reCountEdgeAfterOffParent(node, tree);
        removeFromParent(node);
        return true;
    }
    remove() {
        if (!this.parent)
            return false;
        this.parent.removeChildNode(this);
        return true;
    }
    toJSON() {
        return jsonifyNodeInfo(this);
    }
}
exports.Node = Node;
function setTree(tree) {
    Object.defineProperty(this, 'tree', { get() { return tree; } });
}
class RootNode extends Node {
    clear() {
        const count = this.descendantCount;
        this.children.splice(0);
        this.leftEdge = 1;
        this.rightEdge = 2;
        return count;
    }
    ;
    constructor(opts) {
        super(Object.assign({}, opts, { parent: null, id: null }));
        this.leftEdge = 1;
        this.rightEdge = 2;
    }
}
function setRootNode(root) {
    if (this.root)
        unrecordNode.call(this, this.root);
    if (!(root instanceof RootNode))
        throw `[Tree] root node must be RootNode!`;
    setTree.call(root, this);
    Object.defineProperty(this, 'root', { get() { return root; } });
    recordNode.call(this, root);
}
function recordNode(node) {
    this.nodeSet.add(node);
}
function unrecordNode(node) {
    this.nodeSet.delete(node);
}
class Tree {
    constructor({} = {}) {
        const _nodes = new Set();
        Object.defineProperty(this, 'nodeSet', { get() { return _nodes; } });
        const _root = new RootNode();
        setRootNode.call(this, _root);
    }
    get nodeCount() {
        return this.root.descendantCount + 1;
    }
    get nodes() {
        return Array.from(this.nodeSet.values());
    }
    get nonRootNodes() {
        return Array.from(this.nodeSet.values()).filter((x) => x !== this.root);
    }
    hasNode(node) {
        return this.nodeSet.has(node);
    }
    clear() {
        const count = this.nodeCount - 1;
        this.nodeSet.clear();
        this.root.clear();
        recordNode.call(this, this.root);
        return count;
    }
    toJSON() {
        if (!this.root)
            return null;
        return this.root.toJSON();
    }
}
exports.Tree = Tree;
