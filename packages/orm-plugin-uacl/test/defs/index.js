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

    User.uacl({
        getUaci ({ instance }) {
            return {
                // common one
                objectless: `user/0`,
                // object one
                object: `user/${instance.id}`,
            }
        }
    })

    Project.uacl({
        getUaci ({ instance }) {
            return {
                // common one
                objectless: `project/0`,
                // object one
                object: `project/${instance.id}`,
            }
        }
    })

    Stage.uacl({
        getUaci ({ instance }) {
            return {
                // common one
                objectless: `stage/0`,
                // object one
                object: `stage/${instance.id}`,
            }
        }
    })

    Project
        // find associations by assoc_name, generate one UACL object
        .uacl('members', {
            /**
             * get uaci
             * 
             * parent and child is not orm instance, it's ACLTreeNode
             * parent_instance is project instance
             * child_instance is stage instance
             * 
             * parent.id is from project::getUaci['object']
             * 
             */
            getUaci ({parent, parent_instance, child, child_instance}) {
                return {
                    // common one
                    objectless: `${parent.id}-members-0`,
                    // object one
                    object: `${parent.id}-members-${child_instance.id}`,
                }
            },
        })
    
    Project
        .uacl('stages', {
            getUaci ({parent, child_instance: stage_instance}) {
                return {
                    // common one
                    objectless: `${parent.id}/stages/0`,
                    // object one
                    object: `${parent.id}/stages/${stage_instance.id}`,
                }
            }
        })
        .uacl('members', {
            getUaci ({parent, child: member_instance}) {
                return {
                    // common one
                    objectless: `${parent.id}/members/0`,
                    // object one
                    object: `${parent.id}/members/${member_instance.id}`,
                }
            }
        })
        .grant('write', false)
        .grant('read', true)

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
             * `project1$GrantTree.addChildNode({ id: projectMembers$uaci, instance: member1, acl: { write: true, ... } })`
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

        /**
         * when `.can` called, only local data would be used to judge if child could access host
         */
        this.$uacl('members')
            // check if user$1 is member of this project, and if user$1 could `write`
            .can(user$1, 'write')

        this.$uacl('members')
            // check if user$1 is member of this project, and if user$1 could `read` some fields
            .can(user$1, 'read', ['name', 'description'])
    }, {
        oldhook: 'prepend'
    })
}