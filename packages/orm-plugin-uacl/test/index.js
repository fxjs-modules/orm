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

            const check_handler = ([ [guest, action, fields], result ]) => {
                /**
                 * when `.can` called, only local data would be used to judge if child could access host
                 */
                assert.equal(
                    project$1.$uacl()
                        .can(guest, action, fields),
                    result
                )
            }

            /**
             * this would grant some permissions to user$1, user$2;
             */
            project$1.addMembersSync([user$1, user$2])
            
            ;[
                // check if user$1 is member of this project, and if user$1 could `write`
                [ [user$1, 'write' ], true ],
                // check if user$1 is member of this project, and if user$1 could `write`
                [ [user$2, 'write' ], true ],
                // check if user$1 is member of this project, and if user$1 could `read` some fields
                [ [user$1, 'read', ['name', 'description'] ], true ],
                // mixed unknown field name
                [ [user$1, 'read', ['name', 'description', 'unknown'] ] , false ],
                [ [user$1, 'read', ['lalala'] ] , false ],
            ].forEach(check_handler)

            /**
             * this would revoke all permissions of user$1, user$2, and grant some permissions to user$3;
             */
            project$1.setMembersSync([user$3])

            ;[
                [ [user$1, 'write' ], false ],
                [ [user$2, 'read' ], false ],
                [ [user$3, 'write' ], true ],
                [ [user$3, 'read' ], true ],
            ].forEach(check_handler)

            project$1.addStages([stage$1])

            project$1.setMembersSync([user$1, user$2, user$3])

            project$1.$uacl()
                .push()
        });

        oit('oacl: read/write/remove crossing 2-level', () => {
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
                user1$memberof$stage1,
                user2$memberof$stage1,
                user1$memberof$stage2,
                user2$memberof$stage2,
            ] = coroutine.parallel([
                new orm.models.user(),
                new orm.models.user(),
                new orm.models.user(),
                new orm.models.user(),
                new orm.models.user(),
            ], (instance) => instance.saveSync())

            const check_handler = ([ [guest, action, fields], result ]) => {
                /**
                 * when `.can` called, only local data would be used to judge if child could access host
                 */
                assert.equal(
                    project$1.$uacl()
                        .can(guest, action, fields),
                    result
                )
            }

            project$1.addStagesSync([stage$1, stage$2])
            /**
             * this would grant some permissions to user$1, user$2;
             */
            stage$1.addMembersSync([user1$memberof$stage1, user2$memberof$stage1])
            
            ;[
                [ [user1$memberof$stage1, 'write' ], true ],
                [ [user2$memberof$stage1, 'write' ], true ],
                [ [user1$memberof$stage1, 'read', ['name', 'description'] ], true ],
                [ [user1$memberof$stage1, 'read', ['name', 'description', 'unknown'] ] , false ],
                [ [user1$memberof$stage1, 'read', ['lalala'] ] , false ],
            ].forEach(check_handler)

            /**
             * this would revoke all permissions of user$1, user$2, and grant some permissions to user$3;
             */
            // stage$1.setMembersSync([user$3])

            // ;[
            //     [ [user$1, 'write' ], false ],
            //     [ [user$2, 'read' ], false ],
            //     [ [user$3, 'write' ], true ],
            //     [ [user$3, 'read' ], true ],
            // ].forEach(check_handler)

            // stage$1.setMembersSync([user$1, user$2, user$3])

            // stage$1.$uacl('members')
            //     .push()
        });

        it('oacl: persist to db', () => {

        })
    })
})

test.run(console.DEBUG);
