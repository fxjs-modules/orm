const ORM = require('@fxjs/orm')

const { defs } = require('./_orm')

exports.connect = (args) => {
    const {
        connection = 'mysql://root:@localhost:3306/test-ui'
    } = args

    const orm = ORM.connectSync(connection)

    defs(orm)
    orm.syncSync();
    
    return orm.driver.config;
}