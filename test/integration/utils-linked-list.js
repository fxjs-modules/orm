var helper = require('../support/spec_helper');

var LinkedList = require('../../lib/Utils/linked-list').default;

describe("Utils LinkedList", function () {
    var linkedList = null

    beforeEach(function () {
        linkedList = new LinkedList()
    });

    it("node properties", function () {
        var node = linkedList.addHead(0)

        assert.property(node, '_uuid', null)
        assert.propertyVal(node, 'data', 0)
    });

    it("#addHead", function () {
        var node = linkedList.addHead(0)

        assert.propertyVal(node, 'prev', null)
        assert.propertyVal(node, 'next', null)
        
        var node2 = linkedList.addHead(0)
        assert.propertyVal(node2, 'prev', null)
        assert.propertyVal(node2, 'next', node)
        
        var node3 = linkedList.addHead(0)
        assert.propertyVal(node3, 'prev', null)
        assert.propertyVal(node3, 'next', node2)
    });

    it("#addTail", function () {
        var node = linkedList.addTail(0)

        assert.propertyVal(node, 'prev', null)
        assert.propertyVal(node, 'next', null)
        
        var node2 = linkedList.addTail(0)
        assert.propertyVal(node2, 'prev', node)
        assert.propertyVal(node2, 'next', null)
        
        var node3 = linkedList.addTail(0)
        assert.propertyVal(node3, 'prev', node2)
        assert.propertyVal(node3, 'next', null)
    });

    it('#remove, #clear', function () {
        var [
            node1,
            node2,
            node3
        ] = [
            linkedList.addHead(0),
            linkedList.addHead(0),
            linkedList.addTail(0),
        ]

        assert.propertyVal(node1, 'prev', node2)
        assert.propertyVal(node1, 'next', node3)

        assert.propertyVal(node2, 'prev', null)
        assert.propertyVal(node2, 'next', node1)

        assert.propertyVal(node3, 'prev', node1)
        assert.propertyVal(node3, 'next', null)

        assert.propertyVal(linkedList, 'count', 3)
        linkedList.clear()
        assert.propertyVal(linkedList, 'count', 0)
    });
});