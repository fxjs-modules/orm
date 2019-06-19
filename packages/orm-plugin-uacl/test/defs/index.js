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
        ievents: {
            'after:add:members': function (members) {
                this.$uacl('members')
                    /**
                     * grant(aclKv)
                     * 
                     * equals to
                     * `project1$GrantTree.addChildNode({ id: projectMembers$uaci, instance: member$1, acl: { write: true, ... } })`
                     * 
                     */
                    .grant(members, {
                        write: true,
                        read: ['name', 'description']
                    })
            },
            'after:del:members': function (members = []) {
                console.log('members', members)
                if (!members.length)
                    this.$uacl('members')
                        .clear()
            }
        }
    })

    const Stage = orm.define('stage', {
        name: String
    }, {
    })

    const Task = orm.define('task', {
        name: String
    }, {
    })

    Project.hasMany('stages', Stage, {}, {})
    Stage.hasMany('tasks', Task, {}, {})

    Project.hasMany('members', User, {}, {})
    Stage.hasMany('members', User, {}, {})
    Task.hasOne('owner', User, {}, {})
    Task.hasMany('members', User, {}, {})

    Project.afterLoad(function () {
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
             * `project1$GrantTree.getChildNodeById(member.$getUaci()).removeACLByKey('write')`
             */
            .revoke('write')
            /**
             * `revoke(action)`
             * 
             * equals to
             * `project1$GrantTree.removeChildNodeById(member.$getUaci())`
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