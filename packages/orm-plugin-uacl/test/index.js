#!/usr/bin/env fibjs

var test = require("test");
test.setup();

const ORM = require('@fxjs/orm');
const ORMPluginUACL = require('../');

const TreeAbout = require('../lib/tree');

const ormDefs = require('./defs')

describe('orm-plugin-uacl', () => {
    describe('TreeAbout', () => {
        let project$1 = null
        let project$2 = null
        let task$1 = null
        let task$2 = null
        let task$2$owner = null
        let task$2member1 = null
        let task$2member2 = null

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
                "isRoot": true,
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
                "isRoot": true,
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
                "isRoot": true,
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
                "isRoot": true,
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
                "isRoot": true,
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

            task$2.addChildNode(task$2member1)
            assert.deepEqual([$tree.root, project$2, task$2], task$2member1.breadCrumbs)
            task$2.addChildNode(task$2member2)
            assert.deepEqual([$tree.root, project$2, task$2], task$2member2.breadCrumbs)
            assert.equal($tree.root.descendantCount, 5)
            assert.equal($tree.nodeCount, 6)
            assert.deepEqual($tree.root.toJSON(), {
                "id": 0,
                "isRoot": true,
                "leftEdge": 1,
                "rightEdge": 12,
                "children": [
                    {
                        "id": 2,
                        "leftEdge": 2,
                        "rightEdge": 11,
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
                                "rightEdge": 10,
                                "children": [
                                    {
                                        "id": 1,
                                        "leftEdge": 6,
                                        "rightEdge": 7,
                                        "children": []
                                    },
                                    {
                                        "id": 2,
                                        "leftEdge": 8,
                                        "rightEdge": 9,
                                        "children": []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            project$2.removeChildNode(task$2)
            assert.deepEqual($tree.root.toJSON(), {
                "id": 0,
                "isRoot": true,
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
            assert.equal($tree.nodeCount, 3)

            console.dir($tree.root.toJSON())
        });
    })

    xdescribe('orm.ACL*', () => {
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
            ormDefs(orm)

            orm.syncSync()
        });

        after(() => {
            Object.values(orm.models).forEach(model => model.dropSync())
        });

        beforeEach(() => {
            project$1 = new orm.ACLNode({
                id: `project-1`,
                data: {
                    type: 'project',
                    instance: {}
                }
            })
            project$2 = new orm.ACLNode({
                id: `project-2`,
                data: {
                    type: 'project',
                    instance: {}
                }
            })

            task$1 = new orm.ACLNode({
                id: `task-1`,
                data: {
                    type: 'task',
                    instance: {}
                }
            })
            task$2 = new orm.ACLNode({
                id: `task-2`,
                data: {
                    type: 'task',
                    instance: {}
                }
            })

            task$2owner = new orm.ACLNode({
                id: `user-1`,
                data: {
                    type: 'user',
                    instance: {}
                }
            })
            task$2member1 = task$2owner
            task$2member2 = new orm.ACLNode({
                id: `user-2`,
                data: {
                    type: 'user',
                    instance: {}
                }
            })
        });

        it('$?', () => {
            const [
                project$1,
                project$2,
            ] = [
                (new orm.models.project()).saveSync(),
                (new orm.models.project()).saveSync()
            ]

            const [
                stage$1,
                stage$2,
            ] = [
                (new orm.models.stage()).saveSync(),
                (new orm.models.stage()).saveSync()
            ]

            const [
                user$1,
                user$2,
            ] = [
                (new orm.models.user()).saveSync(),
                (new orm.models.user()).saveSync()
            ]

            /**
             * this would grant some accesses to user$1, user$2;
             */
            project$1.addMembersSync([user$1, user$2])

            /**
             * when `.can` called, only local data would be used to judge if child could access host
             */
            assert.equal(
                project$1.$uacl('members')
                    // check if user$1 is member of this project, and if user$1 could `write`
                    .can(user$1, 'write')
            )

            project$1.$uacl('members')
                // check if user$1 is member of this project, and if user$1 could `read` some fields
                .can(user$1, 'read', ['name', 'description'])
        })
    })
})

test.run(console.DEBUG);
