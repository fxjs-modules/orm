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
        uacl: {}
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
            afterAddStages (stages) {
                /**
                 * 为所有的该 project 下的 stages 的 members 赋予对 project 的
                 * 字段读取权限
                 */
                const project = this
                stages.forEach((stage) => {
                    stage.getMembersSync().forEach(member => {
                        project.$uacl('stages')
                            .$uacl('members', stage)
                            .grant(member, {
                                write: false,
                                read: ['name', 'description']
                            })
                    })
                })
            }
        }
    })
    Stage.hasMany('tasks', Task, {}, {})

    Project.hasMany('members', User, {}, {
        hooks: {
            'beforeAdd': function ({associations: members}) {
                /**
                 * 在 project/1/members 为 ID 的树形结构中, 为这些 members 赋予读写权限
                 */
                this.$uacl('members')
                    .grant(members, {
                        write: true,
                        read: ['name', 'description']
                    })
            },
            'afterRemove': function ({associations: specificRemovedMembers = []}) {
                /**
                 * 如果删除了该 project 下所有的 members, 则清除这些用户对它的所有权限
                 */
                if (!specificRemovedMembers.length)
                    this.$uacl('members')
                        .clear()
            }
        }
    })
    Stage.hasMany('members', User, {}, {
        hooks: {
            'afterAdd': function ({associations: members}) {
                this.getOfProjectsSync()
                    .forEach(project => {
                        /**
                         * 在 project/xxx/stages/xx/members 为 ID 的树形结构中, 为这些 members 赋予读取 projects 权限
                         */
                        project
                            .$uacl('stages')
                            .$uacl('members')
                            .grant(members, {
                                write: true,
                                read: ['name', 'description']
                            })
                    })
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