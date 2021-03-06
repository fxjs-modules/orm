#!/usr/bin/env fibjs

var test = require("test");
test.setup();

const fs = require('fs');
const path = require('path');

const coroutine = require('coroutine')

const ORM = require('@fxjs/orm');
const ORMPluginUACL = require('../../');

const { check_handler, check_handler2 } = require('../spec_helpers')

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

    it('$uacl', () => {
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
            user$2
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
            .persist({ sync: true })

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

        project$1.$uacl({ uid: user$2.id })
            .grant(project$1.$getUacis().object, {
                write: true,
                read: true
            }, {sync: true })
        
        project$1.$uacl({ uid: user$1.id })
            .revoke({ uaci: project$1.$getUacis().object, sync: true })
            .load({ uaci: project$1.$getUacis().object, sync: true })

        ;[
            [ [user$1, 'write'  , project$1,                                           ], false ],
            [ [user$1, 'read'   , project$1, ['name']                                  ], false ],
            [ [user$1, 'read'   , project$1, ['name', 'description']                   ], false ],
            [ [user$2, 'write'  , project$1,                                           ], true ],
            [ [user$2, 'read'   , project$1, ['name']                                  ], true ],
            [ [user$2, 'read'   , project$1, ['name', 'description']                   ], true ],
        ].forEach(check_handler)

        project$1.$uacl({ uid: user$1.id })
            .grant(project$1.$getUacis().object, {
                write: true,
                read: true
            }, {sync: true })
        
        project$1.$uacl({ uid: user$2.id })
            .revoke({ uaci: project$1.$getUacis().object, sync: true })
            .load({ uaci: project$1.$getUacis().object, sync: true })

            ;[
                [ [user$1, 'write'  , project$1,                                           ], true ],
                [ [user$1, 'read'   , project$1, ['name']                                  ], true ],
                [ [user$1, 'read'   , project$1, ['name', 'description']                   ], true ],
                [ [user$2, 'write'  , project$1,                                           ], false ],
                [ [user$2, 'read'   , project$1, ['name']                                  ], false ],
                [ [user$2, 'read'   , project$1, ['name', 'description']                   ], false ],
            ].forEach(check_handler)
        /* revoke test :end */
    })

    it('$uaclPool', () => {
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
            user$2
        ] = coroutine.parallel([
            new orm.models.user(),
            new orm.models.user(),
        ], (instance) => instance.saveSync())

        project$1.$uaclPool({ uid: user$1.id })(user1tree => {
            user1tree
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
                .persist({ sync: true })

            ;[
                [ [user1tree, 'write'  , project$1,                                           ], true ],
                [ [user1tree, 'read'   , project$1, ['name']                                  ], true ],
                [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], false ],
                [ [user1tree, 'read'   , project$readableonly, ['name', 'description']        ], true ],
                [ [user1tree, 'read'   , project$writableonly, ['name', 'description']        ], false ],
                [ [user1tree, 'write'  , project$writableonly, ['name', 'description']        ], true ],
            ].forEach(check_handler2)

            user1tree.reset()

            ;[
                [ [user1tree, 'write'  , project$1,                                           ], false ],
                [ [user1tree, 'read'   , project$1, ['name']                                  ], false ],
                [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], false ],
                [ [user1tree, 'read'   , project$readableonly, ['name', 'description']        ], false ],
                [ [user1tree, 'read'   , project$writableonly, ['name', 'description']        ], false ],
                [ [user1tree, 'write'  , project$writableonly, ['name', 'description']        ], false ],
            ].forEach(check_handler2)

            assert.equal(
                project$1.$uacl({ uid: user$1.id }),
                project$1.$uacl({ uid: user$1.id })
            )

            user1tree
                .load({ uaci: project$1.$getUacis().objectless, sync: true })
                .load({ uaci: project$1.$getUacis().object, sync: true })
    
            ;[
                [ [user1tree, 'write'  , project$1,                                           ], true ],
                [ [user1tree, 'read'   , project$1, ['name']                                  ], true ],
                [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], false ],
                [ [user1tree, 'read'   , project$readableonly, ['name', 'description']        ], false ],
                [ [user1tree, 'read'   , project$writableonly, ['name', 'description']        ], false ],
                [ [user1tree, 'write'  , project$writableonly, ['name', 'description']        ], false ],
            ].forEach(check_handler2)
    
            user1tree
                .load({ uaci: project$readableonly.$getUacis().object, sync: true })

            ;[
                [ [user1tree, 'write'  , project$1,                                           ], true ],
                [ [user1tree, 'read'   , project$1, ['name']                                  ], true ],
                [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], false ],
                [ [user1tree, 'read'   , project$readableonly, ['name', 'description']        ], true ],
                [ [user1tree, 'read'   , project$writableonly, ['name', 'description']        ], false ],
                [ [user1tree, 'write'  , project$writableonly, ['name', 'description']        ], false ],
            ].forEach(check_handler2)
    
            user1tree
                .load({ uaci: project$writableonly.$getUacis().object, sync: true })

            ;[
                [ [user1tree, 'write'  , project$1,                                           ], true ],
                [ [user1tree, 'read'   , project$1, ['name']                                  ], true ],
                [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], false ],
                [ [user1tree, 'read'   , project$readableonly, ['name', 'description']        ], true ],
                [ [user1tree, 'read'   , project$writableonly, ['name', 'description']        ], false ],
                [ [user1tree, 'write'  , project$writableonly, ['name', 'description']        ], true ],
            ].forEach(check_handler2)
    
            /* revoke test :start */
            user1tree
                .revoke({ uaci: project$writableonly.$getUacis().object, sync: true })
                .load({ uaci: project$writableonly.$getUacis().object, sync: true })
    
            ;[
                [ [user1tree, 'read'   , project$writableonly, ['name', 'description']        ], false ],
                [ [user1tree, 'write'  , project$writableonly, ['name', 'description']        ], false ],
            ].forEach(check_handler2)
    
            user1tree
                .revoke({ uaci: project$readableonly.$getUacis().object, sync: true })
                .load({ uaci: project$readableonly.$getUacis().object, sync: true })
    
            ;[
                [ [user1tree, 'read'   , project$readableonly, ['name', 'description']        ], false ],
            ].forEach(check_handler2)
            
            project$1.$uacl({ uid: user$2.id })
                .grant(project$1.$getUacis().object, {
                    write: true,
                    read: true
                }, {sync: true })
            
            user1tree
                .revoke({ uaci: project$1.$getUacis().object, sync: true })
                .load({ uaci: project$1.$getUacis().object, sync: true })

            ;[
                [ [user1tree, 'write'  , project$1,                                           ], false ],
                [ [user1tree, 'read'   , project$1, ['name']                                  ], false ],
                [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], false ],
            ].forEach(check_handler2)

            ;[
                [ [user$2, 'write'  , project$1,                                           ], true ],
                [ [user$2, 'read'   , project$1, ['name']                                  ], true ],
                [ [user$2, 'read'   , project$1, ['name', 'description']                   ], true ],
            ].forEach(check_handler)

            user1tree
                .grant(project$1.$getUacis().object, {
                    write: true,
                    read: true
                }, {sync: true })
            
            project$1.$uacl({ uid: user$2.id })
                .revoke({ uaci: project$1.$getUacis().object, sync: true })
                .load({ uaci: project$1.$getUacis().object, sync: true })

                ;[
                    [ [user1tree, 'write'  , project$1,                                           ], true ],
                    [ [user1tree, 'read'   , project$1, ['name']                                  ], true ],
                    [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], true ],
                ].forEach(check_handler2)

                ;[
                    [ [user$2, 'write'  , project$1,                                           ], false ],
                    [ [user$2, 'read'   , project$1, ['name']                                  ], false ],
                    [ [user$2, 'read'   , project$1, ['name', 'description']                   ], false ],
                ].forEach(check_handler)
            /* revoke test :end */
        })
    })

    ;[
        true,
        false
    ].forEach(usePool => {
        it(`co-test: ${usePool ? '$uacl' : '$uaclPool'}`, () => {
            const closure = (host, uid, cb) => {
                if (usePool)
                    host.$uaclPool({ uid })(cb)
                else
                    cb(host.$uacl({ uid }))
            }

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
                user$2
            ] = coroutine.parallel([
                new orm.models.user(),
                new orm.models.user(),
            ], (instance) => instance.saveSync())

            closure(project$1, user$1.id, (user1tree) => {
                user1tree
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
                    .persist({ sync: true })

                ;[
                    [ [user1tree, 'write'  , project$1,                                           ], true ],
                    [ [user1tree, 'read'   , project$1, ['name']                                  ], true ],
                    [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], false ],
                    [ [user1tree, 'read'   , project$readableonly, ['name', 'description']        ], true ],
                    [ [user1tree, 'read'   , project$writableonly, ['name', 'description']        ], false ],
                    [ [user1tree, 'write'  , project$writableonly, ['name', 'description']        ], true ],
                ].forEach(check_handler2)

                user1tree.reset()

                ;[
                    [ [user1tree, 'write'  , project$1,                                           ], false ],
                    [ [user1tree, 'read'   , project$1, ['name']                                  ], false ],
                    [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], false ],
                    [ [user1tree, 'read'   , project$readableonly, ['name', 'description']        ], false ],
                    [ [user1tree, 'read'   , project$writableonly, ['name', 'description']        ], false ],
                    [ [user1tree, 'write'  , project$writableonly, ['name', 'description']        ], false ],
                ].forEach(check_handler2)

                assert.equal(
                    project$1.$uacl({ uid: user$1.id }),
                    project$1.$uacl({ uid: user$1.id })
                )

                user1tree
                    .load({ uaci: project$1.$getUacis().objectless, sync: true })
                    .load({ uaci: project$1.$getUacis().object, sync: true })
        
                ;[
                    [ [user1tree, 'write'  , project$1,                                           ], true ],
                    [ [user1tree, 'read'   , project$1, ['name']                                  ], true ],
                    [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], false ],
                    [ [user1tree, 'read'   , project$readableonly, ['name', 'description']        ], false ],
                    [ [user1tree, 'read'   , project$writableonly, ['name', 'description']        ], false ],
                    [ [user1tree, 'write'  , project$writableonly, ['name', 'description']        ], false ],
                ].forEach(check_handler2)
        
                user1tree
                    .load({ uaci: project$readableonly.$getUacis().object, sync: true })

                ;[
                    [ [user1tree, 'write'  , project$1,                                           ], true ],
                    [ [user1tree, 'read'   , project$1, ['name']                                  ], true ],
                    [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], false ],
                    [ [user1tree, 'read'   , project$readableonly, ['name', 'description']        ], true ],
                    [ [user1tree, 'read'   , project$writableonly, ['name', 'description']        ], false ],
                    [ [user1tree, 'write'  , project$writableonly, ['name', 'description']        ], false ],
                ].forEach(check_handler2)
        
                user1tree
                    .load({ uaci: project$writableonly.$getUacis().object, sync: true })

                ;[
                    [ [user1tree, 'write'  , project$1,                                           ], true ],
                    [ [user1tree, 'read'   , project$1, ['name']                                  ], true ],
                    [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], false ],
                    [ [user1tree, 'read'   , project$readableonly, ['name', 'description']        ], true ],
                    [ [user1tree, 'read'   , project$writableonly, ['name', 'description']        ], false ],
                    [ [user1tree, 'write'  , project$writableonly, ['name', 'description']        ], true ],
                ].forEach(check_handler2)
        
                /* revoke test :start */
                user1tree
                    .revoke({ uaci: project$writableonly.$getUacis().object, sync: true })
                    .load({ uaci: project$writableonly.$getUacis().object, sync: true })
        
                ;[
                    [ [user1tree, 'read'   , project$writableonly, ['name', 'description']        ], false ],
                    [ [user1tree, 'write'  , project$writableonly, ['name', 'description']        ], false ],
                ].forEach(check_handler2)
        
                user1tree
                    .revoke({ uaci: project$readableonly.$getUacis().object, sync: true })
                    .load({ uaci: project$readableonly.$getUacis().object, sync: true })
        
                ;[
                    [ [user1tree, 'read'   , project$readableonly, ['name', 'description']        ], false ],
                ].forEach(check_handler2)
                
                project$1.$uacl({ uid: user$2.id })
                    .grant(project$1.$getUacis().object, {
                        write: true,
                        read: true
                    }, {sync: true })
                
                user1tree
                    .revoke({ uaci: project$1.$getUacis().object, sync: true })
                    .load({ uaci: project$1.$getUacis().object, sync: true })

                ;[
                    [ [user1tree, 'write'  , project$1,                                           ], false ],
                    [ [user1tree, 'read'   , project$1, ['name']                                  ], false ],
                    [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], false ],
                ].forEach(check_handler2)

                ;[
                    [ [user$2, 'write'  , project$1,                                           ], true ],
                    [ [user$2, 'read'   , project$1, ['name']                                  ], true ],
                    [ [user$2, 'read'   , project$1, ['name', 'description']                   ], true ],
                ].forEach(check_handler)

                user1tree
                    .grant(project$1.$getUacis().object, {
                        write: true,
                        read: true
                    }, {sync: true })
                
                project$1.$uacl({ uid: user$2.id })
                    .revoke({ uaci: project$1.$getUacis().object, sync: true })
                    .load({ uaci: project$1.$getUacis().object, sync: true })

                    ;[
                        [ [user1tree, 'write'  , project$1,                                           ], true ],
                        [ [user1tree, 'read'   , project$1, ['name']                                  ], true ],
                        [ [user1tree, 'read'   , project$1, ['name', 'description']                   ], true ],
                    ].forEach(check_handler2)

                    ;[
                        [ [user$2, 'write'  , project$1,                                           ], false ],
                        [ [user$2, 'read'   , project$1, ['name']                                  ], false ],
                        [ [user$2, 'read'   , project$1, ['name', 'description']                   ], false ],
                    ].forEach(check_handler)
                /* revoke test :end */
            })
        })
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
