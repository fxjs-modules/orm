module.exports = orm => {
    const User = orm.define('user', {
        name: String
    }, {
    })

    const Role = orm.define('role', {
        name: String
    }, {
    })

    const Project = orm.define('project', {
        name: String
    }, {
        uacl: {},
        hooks: {
            // afterLoad () {
            //     console.log('project afterLoad')
            // }
        }
    })

    const Stage = orm.define('stage', {
        name: String
    }, {
        uacl: {}
    })

    const Task = orm.define('task', {
        name: String
    }, {
        uacl: {}
    })

    Project.hasMany('stages', Stage, {}, {
        reverse: 'ofProjects',
        hooks: {
            afterAdd ({ associations: stages }) {
                /**
                 * 为所有的该 project 下的 stages 的 members 赋予对 project 的
                 * 字段读取权限
                 */
                const project = this
                const proj_uaci = project.$getUacis().object
                stages.forEach(stage => stage.$uaclPrefix(proj_uaci))

                project.getMembersSync().forEach(proj_member => {
                    const aclTree = project.$uacl({ uid: proj_member.id })

                    stages.forEach(proj_stage => {
                        proj_stage_uaci = proj_stage.$getUacis({ prefix: proj_uaci }).object
                        aclTree.grant(
                            proj_stage_uaci,
                            {
                                write: false,
                                read: ['name', 'description']
                            },
                            {
                                puaci: proj_uaci
                            }
                        )
                    })
                })
            }
        }
    })
    Stage.hasMany('tasks', Task, {}, {})

    Project.hasMany('members', User, {}, {
        hooks: {
            'beforeAdd': function ({associations: members, useChannel}) {
                members.forEach(member => {
                    this.$uacl({ uid: member.id })
                        .grant(this.$getUacis().object, {
                            write: true,
                            read: ['name', 'description']
                        })
                })

                const member_ids = members.map(x => x.id)

                const project = this
                const proj_uaci = project.$getUacis().object
                useChannel('grantMemberAccessToStages', () => {
                    const stages = project.getStagesSync()
                        
                    member_ids.forEach((member_id) => {
                        const aclTree = project.$uacl({ uid: member_id })

                        stages.forEach(proj_stage => {
                            aclTree
                                .grant(
                                    proj_stage.$getUacis({ prefix: proj_uaci }).object,
                                    {
                                        write: false,
                                        read: ['name', 'description']
                                    },
                                    {
                                        puaci: proj_uaci
                                    }
                                )
                        })
                    })
                })
            },
            'afterAdd': function ({ useChannel }) {
                useChannel('grantMemberAccessToStages')[0].call()
            },
            'beforeRemove': function ({associations: specificRemovedMembers = []}) {
                /**
                 * 如果删除了该 project 下所有的 members, 则清除这些用户对它的所有权限
                 */
                if (!specificRemovedMembers.length) {
                    specificRemovedMembers = this.getMembersSync()
                    specificRemovedMembers.forEach(member => {
                        this.$uacl({ uid: member.id })
                            .revoke(this.$getUacis().object)
                    })
                }
            }
        }
    })
    
    Stage.hasMany('members', User, {}, {
        hooks: {
            'afterAdd': function ({associations: members}) {
            }
        }
    })
    Task.hasOne('owner', User, {}, {})
    Task.hasMany('members', User, {}, {})

    false && Project.afterLoad(function () {
        /**
         * once called, `this.$uacl('members')`
         * 1. start one interval to pull all members of this `project` asynchronously,
         * 2. initialize one ACLTree or access the generated one,
         * 
         * like this:
         * ```javascript
         *     const project1$GrantTree = new ACLTree({ type: 'project-1-members-grant' })
         *     // or
         *     const project1$GrantTree = this.generated$project1$GrantTree
         * ```
         * 
         * project1$GrantTree is just result of `this.$uacl('members')`
         * 
         * after 1st time usage, project1$GrantTree would
         * - addChildNode when add members to project
         * - removeChildNode when member removed from project
         * - update childNode' acl value if commanded
         * 
         * project1$GrantTree would be destroyed when instance is destroyed.
         */
        this.$uacl('members')

        this.$uacl('members')
            // pull members and build ACLNodes with thems
            .pull()

        this.$uacl('members')
            /**
             * grant(aclKv)
             * 
             * equals to
             * `project1$GrantTree.addChildNode({ id: 0, acl: { write: true, ... } })`
             * 
             */
            .grant({
                write: true,
                read: ['name', 'description']
            })

        this.$uacl('members')
            /**
             * `revoke(action)`
             * equals to
             * `project1$GrantTree.getChildNodeById(member.$getUacis()).removeACLByKey('write')`
             */
            .revoke('write')
            /**
             * `revoke(action)`
             * 
             * equals to
             * `project1$GrantTree.removeChildNodeById(member.$getUacis())`
             */

        this.$uacl('members')
            .revoke()

        this.$uacl('members')
            // save grant for members from built ACLNodes
            .push()
    }, {
        oldhook: 'prepend'
    })
}