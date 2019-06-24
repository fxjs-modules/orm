#!/usr/bin/env fibjs

var test = require("test");
test.setup();

const coroutine = require('coroutine')

const ORM = require('@fxjs/orm');
const ORMPluginUACL = require('../../');

const ACLTreeAbout = require('../../lib/acl-tree');

const { check_handler } = require('../spec_helpers')

describe('Basic local only', () => {
    let orm = null

    before(() => {
        orm = ORM.connectSync('sqlite:tmp/test-app.db')
        orm.use(ORMPluginUACL, {})
        require('../defs/basic-allsync-mode')(orm)

        orm.syncSync()
    });

    after(() => {
        orm.dropSync()
    });

    it('UACL basic: ACLTree/ACLNode', () => {
        let triggered = {
            configStorageServiceRouting: false,
            level1_routing: false,
            level2_routing: false,
        }
        const tree = new ACLTreeAbout.ACLTree({
            name: '1',
            type: 'user',
            configStorageServiceRouting ({ tree }) {
                assert.exist(tree)
                triggered.configStorageServiceRouting = true

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

        assert.isTrue(triggered.configStorageServiceRouting)

        tree.grant('project/1', { write: false, read: ['name', 'description'] })

        assert.isTrue(tree.can('read', '/project/1', ['name']))
        assert.isFalse(tree.can('read', '/project/1', ['lalala']))

        assert.isFalse(triggered.level1_routing)
        assert.isFalse(triggered.level2_routing)
        tree.persist({ sync: true })
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
                                "id": "${user.id}",
                                "role": null
                            },
                            "leftEdge": 2,
                            "rightEdge": 5,
                            "children": [
                                {
                                    "id": "/project/${project$1.id}/stage/${stage$1.id}",
                                    "data": {
                                        "id": "${user.id}",
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
})

if (require.main === module)
    test.run(console.DEBUG);
