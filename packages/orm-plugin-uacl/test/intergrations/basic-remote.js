#!/usr/bin/env fibjs

var test = require("test");
test.setup();

const fs = require('fs');
const path = require('path');

const coroutine = require('coroutine')

const ORM = require('@fxjs/orm');
const ORMPluginUACL = require('../../');

const { check_handler } = require('../spec_helpers')

const root = path.resolve(__dirname, '../..')

describe('Basic Persistence', () => {
    let orm = null
    let uaclORM = null

    const uaclDBName = `tmp/test-uacl.db`
    var query = `?debug=1`
    var query = ``

    const prepareUACLORM = () => {
        try {
            fs.unlinkSync(path.join(root, `${uaclDBName}`))
        } catch (error) {}
        try {
            fs.unlinkSync(path.join(root, `${uaclDBName}-shm`))
        } catch (error) {}
        try {
            fs.unlinkSync(path.join(root, `${uaclDBName}-wal`))
        } catch (error) {}

        uaclORM = ORM.connectSync(`sqlite:${uaclDBName}${query}`)
    }

    before(() => {
        orm = ORM.connectSync('sqlite:tmp/test-app.db')
        prepareUACLORM()

        orm.use(ORMPluginUACL, { orm: uaclORM })
        require('../defs/basic-elegant-mode')(orm)

        orm.syncSync()
    });

    after(() => {
        orm.dropSync()
    });

    afterEach(() => {
        // Object.values(uaclORM.models).forEach(model => model.dropSync())
    })

    oit('UACLModel', () => {
        const [
            project$1,
            project$readableonly,
            project$writableonly,
        ] = coroutine.parallel([
            new orm.models.project(),
            new orm.models.project(),
            new orm.models.project(),
            new orm.models.project(),
            new orm.models.project(),
        ], (instance) => instance.saveSync())

        const [
            user$1,
        ] = coroutine.parallel([
            new orm.models.user(),
            new orm.models.user(),
        ], (instance) => instance.saveSync())

        project$1.$uacl({ uid: user$1.id })
            .grant(project$1.$getUacis().objectless, {
                write: true,
                read: ['name']
            })
            .grant(project$1.$getUacis().object, {
                write: true,
                read: ['name']
            })
            .grant(project$readableonly.$getUacis().object, {
                write: false,
                read: true
            })
            .grant(project$writableonly.$getUacis().object, {
                write: true,
                read: false
            })
            .persist()

        ;[
            [ [user$1, 'write'  , project$1,                                           ], true ],
            [ [user$1, 'read'   , project$1, ['name']                                  ], true ],
            [ [user$1, 'read'   , project$1, ['name', 'description']                   ], false ],
            [ [user$1, 'read'   , project$readableonly, ['name', 'description']        ], true ],
            [ [user$1, 'read'   , project$writableonly, ['name', 'description']        ], false ],
            [ [user$1, 'write'  , project$writableonly, ['name', 'description']        ], true ],
        ].forEach(check_handler)

        project$1.$uacl({ uid: user$1.id }).reset()

        ;[
            [ [user$1, 'write'  , project$1,                                           ], false ],
            [ [user$1, 'read'   , project$1, ['name']                                  ], false ],
            [ [user$1, 'read'   , project$1, ['name', 'description']                   ], false ],
            [ [user$1, 'read'   , project$readableonly, ['name', 'description']        ], false ],
            [ [user$1, 'read'   , project$writableonly, ['name', 'description']        ], false ],
            [ [user$1, 'write'  , project$writableonly, ['name', 'description']        ], false ],
        ].forEach(check_handler)

        assert.equal(
            project$1.$uacl({ uid: user$1.id }),
            project$1.$uacl({ uid: user$1.id })
        )

        project$1.$uacl({ uid: user$1.id })
            .load({ uaci: project$1.$getUacis().objectless, sync: true })
            .load({ uaci: project$1.$getUacis().object, sync: true })

        ;[
            [ [user$1, 'write'  , project$1,                                           ], true ],
            [ [user$1, 'read'   , project$1, ['name']                                  ], true ],
            [ [user$1, 'read'   , project$1, ['name', 'description']                   ], false ],
            [ [user$1, 'read'   , project$readableonly, ['name', 'description']        ], false ],
            [ [user$1, 'read'   , project$writableonly, ['name', 'description']        ], false ],
            [ [user$1, 'write'  , project$writableonly, ['name', 'description']        ], false ],
        ].forEach(check_handler)

        project$1.$uacl({ uid: user$1.id })
            .load({ uaci: project$readableonly.$getUacis().object, sync: true })

        ;[
            [ [user$1, 'write'  , project$1,                                           ], true ],
            [ [user$1, 'read'   , project$1, ['name']                                  ], true ],
            [ [user$1, 'read'   , project$1, ['name', 'description']                   ], false ],
            [ [user$1, 'read'   , project$readableonly, ['name', 'description']        ], true ],
            [ [user$1, 'read'   , project$writableonly, ['name', 'description']        ], false ],
            [ [user$1, 'write'  , project$writableonly, ['name', 'description']        ], false ],
        ].forEach(check_handler)

        project$1.$uacl({ uid: user$1.id })
            .load({ uaci: project$writableonly.$getUacis().object, sync: true })

        ;[
            [ [user$1, 'write'  , project$1,                                           ], true ],
            [ [user$1, 'read'   , project$1, ['name']                                  ], true ],
            [ [user$1, 'read'   , project$1, ['name', 'description']                   ], false ],
            [ [user$1, 'read'   , project$readableonly, ['name', 'description']        ], true ],
            [ [user$1, 'read'   , project$writableonly, ['name', 'description']        ], false ],
            [ [user$1, 'write'  , project$writableonly, ['name', 'description']        ], true ],
        ].forEach(check_handler)

        /* revoke test :start */
        project$1.$uacl({ uid: user$1.id })
            .revoke({ uaci: project$writableonly.$getUacis().object, sync: true })
            .load({ uaci: project$writableonly.$getUacis().object, sync: true })

        ;[
            [ [user$1, 'read'   , project$writableonly, ['name', 'description']        ], false ],
            [ [user$1, 'write'  , project$writableonly, ['name', 'description']        ], false ],
        ].forEach(check_handler)

        project$1.$uacl({ uid: user$1.id })
            .revoke({ uaci: project$readableonly.$getUacis().object, sync: true })
            .load({ uaci: project$readableonly.$getUacis().object, sync: true })

        ;[
            [ [user$1, 'read'   , project$readableonly, ['name', 'description']        ], false ],
        ].forEach(check_handler)

        project$1.$uacl({ uid: user$1.id })
            .revoke({ uaci: project$1.$getUacis().object, sync: true })
            .load({ uaci: project$1.$getUacis().object, sync: true })

        ;[
            [ [user$1, 'write'  , project$1,                                           ], false ],
            [ [user$1, 'read'   , project$1, ['name']                                  ], false ],
            [ [user$1, 'read'   , project$1, ['name', 'description']                   ], false ],
        ].forEach(check_handler)
        /* revoke test :end */
    })

    xit('persist with instances (push of node)', () => {
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

        ;[user$1, user$2, user$3].forEach(user => {
            project$1.$uacl({ uid: user.id })
                .grant(project$1.$getUacis().object, {
                    write: true,
                    read: ['name']
                })
                .persist()
        })

        ;[
            [ [user$1, 'write'  , project$1,                                           ], true ],
            [ [user$2, 'write'  , project$1,                                           ], true ],
            [ [user$3, 'write'  , project$1,                                           ], true ],
            [ [user$1, 'read'   , project$1, ['name', 'description']                   ], false ],
            // mixed unknown field name
            [ [user$2, 'read'   , project$1, ['name', 'description', 'unknown']        ], false ],
            [ [user$3, 'read'   , project$1, ['lalala']                                ], false ],
        ].forEach(check_handler)
    })
})

if (require.main === module)
    test.run(console.DEBUG);
