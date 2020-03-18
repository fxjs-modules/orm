import uuid = require('uuid')

function get_id () {
    return uuid.snowflake().hex()
}

interface LinkedNode<TP = any> {
    _uuid: string
    prev: LinkedNode<TP>
    next: LinkedNode<TP>
    data?: TP
}

export default class LinkedList<TP = any> {
    private _head: LinkedNode<TP>
    private _tail: LinkedNode<TP>
    private _count: number = 0;

    get head (): LinkedNode<TP> { return this._head }
    addHead (data: TP) {
        const node: LinkedNode<TP> = {
            _uuid: get_id(),
            prev: null,
            next: this._head,
            data: data
        };

        if (this._head)
            this._head.prev = node;
        else
            this._tail = node;

        this._head = node;

        this._count++;

        return node;
    }

    get tail (): LinkedNode<TP> { return this._tail }
    addTail (data: TP) {
        const node: LinkedNode<TP> = {
            _uuid: get_id(),
            prev: this._tail,
            next: null,
            data: data
        };

        if (this._tail)
            this._tail.next = node;
        else
            this._head = node;

        this._tail = node;

        this._count++;

        return node;
    };
    get count () { return this._count }

    remove (node: LinkedNode<TP>): number {
        if (this._head === node)
            this._head = node.next;
        else
            node.prev.next = node.next;

        if (this._tail === node)
            this._tail = node.prev;
        else
            node.next.prev = node.prev;

        this._count--;

        return this._count;
    }

    clear () {
        let node = this._head
        while (node) {
            this.remove(node)
            node = node.next
        }
    }

    toJSON = (): TP[] => {
        const list = [];

        let node = this._head;
        while (node !== undefined) {
            list.push(node.data);
            node = node.next;
        }
        return list;
    }
}