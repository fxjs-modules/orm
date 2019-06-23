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

    return {
        User,
        Role,
        Project,
        Stage,
        Task,
    }
}