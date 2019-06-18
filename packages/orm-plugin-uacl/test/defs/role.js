module.exports = (orm) => {
    orm.define('role', {
        name: String,
        description: String
    }, {
        uacl: {
            hooks: {
                beforeGrant (next) {
                    
                },
                afterGrant () {
    
                }
            }
        }
    })

    // internal code
    ;[
        orm.models.user,
        orm.models.role,
        orm.models.project,
    ].forEach(model => {
        model.extendsTo('uacl', {
            // uacl id, unlimited length
            id: {
                type: 'text',
                required: true
            },
            // parsed query string
            kvs: {
                type: 'text',
                required: false
            },
            host_type: {
                // original table's name
                type: 'text',
                unique: false,
                index: false,
                serial: false,
                defaultValue: model.table
            }
        }, {
            // @default orm.settings.get('uacl.common_table_name')
            table: 'uacl',
            field: {
                host_id: {
                    type: 'text',
                    unique: false,
                    index: false,
                    serial: false,
                }
            }
        })
    })

    orm
        .define('level1', {
            name: String,
            description: String
        }, {
        })
        .uacl({
            hooks: {
                session (input, next) {
                    const instance = this

                    Object.defineProperties(instance, {
                        '$uid': input.uid,
                        '$roles': input.roles,
                    })
                },
                /**
                 * 
                    @entry_url /level1/:__id/l1l2/:__id?action=find&uid=xxx&roles=admin&roles=role1
                */
                beforeFind () {
                    
                },
                afterFind () {

                },
                /**
                 * 
                    @entry_url /level1/:__id1/l1l2/:__id?action=read&uid=xxx&roles=admin&roles=role1
                */
                beforeGet () {

                },
                afterGet () {

                },
                /**
                 * 
                    @entry_url /level1/:__id1/l1l2/:__id?action=create&uid=xxx&roles=admin&roles=role1
                */
                beforeCreate () {

                },
                afterCreate () {

                },
                /**
                 * 
                    @entry_url /level1/:__id1/l1l2/:__id?action=write/create&uid=xxx&roles=admin&roles=role1
                */
                // prepend hooks.beforeSave
                beforeSave (next) {
                    const { $uid, $roles } = this

                    this.$preGrant()
                },
                // after hooks.afterSave
                afterSave (success) {
                    if (!success)
                        return 

                    // asyncConfirmGrantAndPushToCache
                    this.$confirmGrant()
                }
            }
        })

    orm.define('level2', {
        name: String,
        description: String
    }, {
    })

    orm.define('level3', {
        name: String,
        description: String
    }, {
    })

    orm.models.level1.hasMany('l1l2', orm.models.level2, {}, { reverse: 'parent_levels' })
    orm.models.level2.hasMany('l2l3', orm.models.level3, {}, { reverse: 'parent_levels' })
}