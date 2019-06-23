module.exports = orm => {
    const { User, Project, Stage, Task } = require('./common')(orm)

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
            'beforeRemove': function ({associations: membersToRemove = [], useChannel}) {
                const proj_uaci = this.$getUacis().object
                /**
                 * revoke all members' permissions about object
                 */
                if (!membersToRemove.length) {
                    membersToRemove = this.getMembersSync()
                }

                const member_ids = membersToRemove.map(x => x.id)
                useChannel('revokeAllAssociatedPermissionsFromUser', () => {
                    const stages = this.getStagesSync()

                    member_ids.forEach(member_id => {
                        this.$uacl({ uid: member_id })
                            .revoke(proj_uaci)

                        stages.forEach(proj_stage => {
                            this.$uacl({ uid: member_id })
                                .revoke(
                                    proj_stage.$getUacis({ prefix: proj_uaci }).object
                                )
                        })
                    })
                })
            },
            'afterRemove': function ({ useChannel }) {
                useChannel('revokeAllAssociatedPermissionsFromUser')[0].call()
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
}