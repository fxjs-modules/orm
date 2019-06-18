#!/usr/bin/env fibjs

var test = require("test");
test.setup();

const ORM = require('@fxjs/orm');
const ORMPluginUACL = require('../');

const TreeAbout = require('../lib/tree');

describe('orm-plugin-uacl', () => {
    describe('TreeAbout', () => {
        let project$1 = null
        let project$2 = null
        let task$1 = null
        let task$2 = null
        let task$2$owner = null
        let task$2$member = null

        beforeEach(() => {
            project$1 = new TreeAbout.Node({ id: 1, type: 'project'})
            project$2 = new TreeAbout.Node({ id: 2, type: 'project'})

            task$1 = new TreeAbout.Node({ id: 1, type: 'task'})
            task$2 = new TreeAbout.Node({ id: 2, type: 'task'})

            task$2owner = new TreeAbout.Node({ id: 1, type: 'user'})
            task$2member1 = task$2owner
            task$2member2 = new TreeAbout.Node({ id: 2, type: 'user'})
        })

        it('TreeAbout.Tree CRUD in memory (not about ORM)', () => {
            const $tree = new TreeAbout.Tree({ type: 'project-tasks-members' });

            assert.ok($tree)
            assert.ok($tree.root)
            assert.equal($tree.root.isRoot, true)
            assert.equal($tree.root.layer, 1)
            assert.equal($tree.root.descendantCount, 0)
            
            $tree.root.addChildNode(project$1)
            assert.equal($tree.root, project$1.root);
            assert.equal($tree, project$1.root.tree);
            assert.ok($tree.hasNode(project$1));
            assert.equal(project$1.layer, 2)
            assert.equal($tree.root.descendantCount, 1)

            assert.deepEqual($tree.root.toJSON(), {
                "id": 0,
                "leftEdge": 1,
                "rightEdge": 4,
                "children": [
                    {
                        "id": 1,
                        "leftEdge": 2,
                        "rightEdge": 3,
                        "children": []
                    }
                ]
            });

            $tree.root.addChildNode(project$2)
            assert.equal($tree.root, project$2.root);
            assert.equal($tree, project$2.root.tree);
            assert.ok($tree.hasNode(project$2));
            assert.equal(project$2.layer, 2)
            assert.equal($tree.root.descendantCount, 2)

            assert.deepEqual($tree.root.toJSON(), {
                "id": 0,
                "leftEdge": 1,
                "rightEdge": 6,
                "children": [
                    {
                        "id": 1,
                        "leftEdge": 2,
                        "rightEdge": 3,
                        "children": []
                    },
                    {
                        "id": 2,
                        "leftEdge": 4,
                        "rightEdge": 5,
                        "children": []
                    }
                ]
            });

            $tree.root.removeChildNode(project$1)
            assert.equal($tree.root.descendantCount, 1)
            assert.throws(() => {
                // no root for project$1
                assert.equal(project$1.layer, 1)
            })

            assert.deepEqual($tree.root.toJSON(), {
                "id": 0,
                "leftEdge": 1,
                "rightEdge": 4,
                "children": [
                    {
                        "id": 2,
                        "leftEdge": 2,
                        "rightEdge": 3,
                        "children": []
                    }
                ]
            });

            project$2.addChildNode(task$1)
            assert.deepEqual([$tree.root, project$2], task$1.breadCrumbs)
            assert.deepEqual($tree.root.toJSON(), {
                "id": 0,
                "leftEdge": 1,
                "rightEdge": 6,
                "children": [
                    {
                        "id": 2,
                        "leftEdge": 2,
                        "rightEdge": 5,
                        "children": [
                            {
                                "id": 1,
                                "leftEdge": 3,
                                "rightEdge": 4,
                                "children": [] 
                            }
                        ]
                    }
                ]
            });
            assert.equal($tree.root.descendantCount, 2)

            project$2.addChildNode(task$2)
            assert.deepEqual([$tree.root, project$2], task$2.breadCrumbs)
            assert.deepEqual($tree.root.toJSON(), {
                "id": 0,
                "leftEdge": 1,
                "rightEdge": 8,
                "children": [
                    {
                        "id": 2,
                        "leftEdge": 2,
                        "rightEdge": 7,
                        "children": [
                            {
                                "id": 1,
                                "leftEdge": 3,
                                "rightEdge": 4,
                                "children": [] 
                            },
                            {
                                "id": 2,
                                "leftEdge": 5,
                                "rightEdge": 6,
                                "children": [] 
                            }
                        ]
                    }
                ]
            });
            assert.equal($tree.root.descendantCount, 3)
            assert.equal($tree.nodeCount, 4)
            assert.equal($tree.nodeCount, $tree.nodeSet.size)

            console.dir($tree.root.toJSON())
        });
    })

    describe('orm.ACL*', () => {
        let orm = null
        let project$1 = null
        let project$2 = null
        let task$1 = null
        let task$2 = null
        let task$2$owner = null
        let task$2$member = null

        before(() => {
            orm = ORM.connectSync('sqlite:uacl-test.db')
            orm.use(ORMPluginUACL)
        });

        after(() => {
            Object.values(orm.models).forEach(model => model.dropSync())
        });

        beforeEach(() => {
            project$1 = new orm.ACLNode({ id: 1, data: { type: 'project' } })
            project$2 = new orm.ACLNode({ id: 2, data: { type: 'project' } })

            task$1 = new orm.ACLNode({ id: 1, data: { type: 'task' } })
            task$2 = new orm.ACLNode({ id: 2, data: { type: 'task' } })

            task$2owner = new orm.ACLNode({ id: 1, data: { type: 'user' } })
            task$2member1 = task$2owner
            task$2member2 = new orm.ACLNode({ id: 2, data: { type: 'user' } })
        });
    })
})

test.run(console.DEBUG);
