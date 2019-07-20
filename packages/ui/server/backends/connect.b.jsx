const ORM = require('@fxjs/orm')

const { defs } = require('./_orm')

exports.connect = (args) => {
    const {
        connection = 'mysql://root:@localhost:3306/test-ui'
    } = args

    const orm = ORM.connectSync(connection)

    defs(orm)
    orm.syncSync();
    
    return orm.models.person.findSync();
}

exports.addPerson = (args) => {
    let {
        connection = 'mysql://root:@localhost:3306/test-ui',
        newPerson = null
    } = args

    newPerson = {
        firstName: 'Steve',
        lastName: 'Rogers',
        ...newPerson
    }

    const orm = ORM.connectSync(connection)

    defs(orm);
    orm.syncSync();

    return orm.models.person.createSync(newPerson);
}

exports.removePerson = (args) => {
    let {
        connection = 'mysql://root:@localhost:3306/test-ui',
        personId = null
    } = args

    const orm = ORM.connectSync(connection)

    defs(orm);
    orm.syncSync();

    return orm.models.person.removeSync(personId);
}