module.exports = orm => {
    const { User, Project, Stage, Task } = require('./common')(orm)

    Project.hasMany('stages', Stage, {}, {
        reverse: 'ofProjects',
        hooks: {
            afterAdd ({ associations: stages }) {
            }
        }
    })
    Stage.hasMany('tasks', Task, {}, {})

    Project.hasMany('members', User, {}, {
        hooks: {
            'beforeAdd': function ({associations: members, useChannel}) {
            },
            'afterAdd': function ({ useChannel }) {
            },
            'beforeRemove': function ({associations: membersToRemove = [], useChannel}) {
            },
            'afterRemove': function ({ useChannel }) {
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