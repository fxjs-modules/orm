#!/usr/bin/env fibjs

var test = require("test");
test.setup();

const ORM = require('@fxjs/orm');
const ORMPluginUACL = require('../');

const TreeAbout = require('../lib/tree');
const ACLTreeAbout = require('../lib/acl-tree');

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
                "id": null,
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
                "id": null,
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
                "id": null,
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
                "id": null,
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
                "id": null,
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
                "id": null,
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
                "id": null,
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

            $tree.clear();
            assert.equal($tree.root.descendantCount, 0);
            assert.equal($tree.nodeCount, 1);
        });
    })

    describe('orm.ACL*', () => {
        let orm = null

        const coroutine = require('coroutine')

        const prepare = () => {
            orm = ORM.connectSync('sqlite:uacl-test.db')
            orm.use(ORMPluginUACL, {})
            ormDefs(orm)
        }

        before(() => {
            prepare()
            orm.syncSync()
        });

        after(() => {
            orm.dropSync()
        });

        beforeEach(() => {
        });

        afterEach(() => {
        })

        it('UACL basic: ACLTree/ACLNode', () => {
            let triggered = {
                configRouting: false,
                level1_routing: false,
                level2_routing: false,
            }
            const tree = new ACLTreeAbout.ACLTree({
                name: '1',
                type: 'user',
                configRouting ({ tree }) {
                    assert.exist(tree)
                    triggered.configRouting = true

                    return {
                        '/:model_name/:id': (_msg, model_name, id) => {
                            assert.exist(model_name)
                            assert.exist(id)

                            triggered.level1_routing = true
                        },
                        '/:model_name/:id/:association_name/:aid': (_msg, model_name, id, association_name, aid) => {
                            triggered.level2_routing = true

                            assert.exist(model_name)
                            assert.exist(id)
                            assert.exist(association_name)
                            assert.exist(aid)
                        },
                    }
                }
            })

            assert.isTrue(triggered.configRouting)

            tree.grant('project/1', { write: false, read: ['name', 'description'] })

            assert.isTrue(tree.can('read', '/project/1', ['name']))
            assert.isFalse(tree.can('read', '/project/1', ['lalala']))

            // tree.load('project/1')
            assert.isFalse(triggered.level1_routing)
            assert.isFalse(triggered.level2_routing)
            tree.persist()
            assert.isTrue(triggered.level1_routing)
            assert.isFalse(triggered.level2_routing)

            tree.reset()

            assert.isFalse(tree.can('read', '/project/1', ['name']))
            assert.isFalse(tree.can('read', '/project/1', ['lalala']))
        })

        it('oacl: read/write/remove self-level', () => {
            const [
                project$1,
            ] = coroutine.parallel([
                new orm.models.project(),
                new orm.models.project(),
            ], (instance) => instance.saveSync())

            const [
                stage$1,
                stage$2,
            ] = coroutine.parallel([
                new orm.models.stage(),
                new orm.models.stage(),
            ], (instance) => instance.saveSync())

            const [
                user$1,
                user$2,
                user$3,
                user$memberof$stage1,
                user$memberof$stage2,
            ] = coroutine.parallel([
                new orm.models.user(),
                new orm.models.user(),
                new orm.models.user(),
                new orm.models.user(),
                new orm.models.user(),
            ], (instance) => instance.saveSync())

            const check_handler = ([ [user, action, entity, fields, prefix = ''], result ]) => {
                /**
                 * when `.can` called, only local data would be used to judge if child could access entity
                 */
                assert.equal(
                    entity.$uacl({ uid: user.id })
                        .can(action, entity.$getUacis({ prefix }).object, fields),
                    result
                )
            }

            /**
             * this would grant some permissions to user$1, user$2;
             */
            project$1.addMembersSync([user$1, user$2])
            
            ;[
                // check if user$1 is member of this project, and if user$1 could `write`
                [ [user$1, 'write'  , project$1,                                           ], true ],
                // check if user$1 is member of this project, and if user$1 could `write`
                [ [user$2, 'write'  , project$1,                                           ], true ],
                // check if user$1 is member of this project, and if user$1 could `read` some fields
                [ [user$1, 'read'   , project$1, ['name', 'description']                   ], true ],
                // mixed unknown field name
                [ [user$1, 'read'   , project$1, ['name', 'description', 'unknown']        ], false ],
                [ [user$1, 'read'   , project$1, ['lalala']                                ], false ],
            ].forEach(check_handler)

            /**
             * this would revoke all permissions of user$1, user$2, and grant some permissions to user$3;
             */
            project$1.setMembersSync([user$3])

            ;[
                [ [user$1, 'write'  , project$1 ], false ],
                [ [user$2, 'read'   , project$1 ], false ],
                [ [user$3, 'write'  , project$1 ], true ],
                [ [user$3, 'read'   , project$1 ], true ],
            ].forEach(check_handler)

            project$1.addStages([stage$1])

            ;[
                [ [user$1, 'write'  , stage$1   ], false ],
                [ [user$1, 'read'   , stage$1   ], false ],
                [ [user$2, 'write'  , stage$1   ], false ],
                [ [user$2, 'read'   , stage$1   ], false ],
                
                [ [user$3, 'write'  , stage$1   ], false ],
                [ [user$3, 'read'   , stage$1   ], true ],
            ].forEach(check_handler)

            project$1.setMembersSync([user$1, user$2, user$3])
            
            ;[
                [ [user$1, 'write', stage$1, [], `/project/${project$1.id}` ], false ],
                [ [user$1, 'read' , stage$1, [], `/project/${project$1.id}` ], true ],
                [ [user$2, 'write', stage$1, [], `/project/${project$1.id}` ], false ],
                [ [user$2, 'read' , stage$1, [], `/project/${project$1.id}` ], true ],
                
                [ [user$3, 'write', stage$1, [], `/project/${project$1.id}` ], false ],
                [ [user$3, 'read' , stage$1, [], `/project/${project$1.id}` ], true ],
            ].forEach(check_handler)

            // users all has one acl-tree which records /project/PROJECT1_ID/stage/STAGE1_ID
            ;[
                user$1,
                user$2,
                user$3
            ].forEach((user) => {
                assert.deepEqual(
                    project$1.$uacl({ uid: user.id }).toJSON(),
                    JSON.parse(`{
                        "id": null,
                        "isRoot": true,
                        "leftEdge": 1,
                        "rightEdge": 6,
                        "children": [
                            {
                            "id": "/project/${project$1.id}",
                            "data": {
                                "id": ${user.id},
                                "role": null
                            },
                            "leftEdge": 2,
                            "rightEdge": 5,
                            "children": [
                                {
                                "id": "/project/${project$1.id}/stage/${stage$1.id}",
                                "data": {
                                    "id": ${user.id},
                                    "role": null
                                },
                                "leftEdge": 3,
                                "rightEdge": 4,
                                "children": []
                                }
                            ]
                            }
                        ]
                    }`)
                )
            })
        });

        xit('oacl: persist to db', () => {

        })
    })
})

test.run(console.DEBUG);
