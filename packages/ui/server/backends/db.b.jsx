const ORM = require('@fxjs/orm')

exports.isDbExisted = (args) => {
    const {
        connection = 'mysql://root:@localhost:3306/mysql',
        db = 'test-ui'
    } = args

    const orm = ORM.connectSync(connection)

    if (orm.driver.config.protocol !== 'mysql:')
        return false;
    
    const rows = orm.driver.execQuerySync(
        `SHOW DATABASES LIKE ?`,
        [db]
    );

    return rows.length > 0;
}

exports.isTableExisted = (args) => {
    const {
        connection = 'mysql://root:@localhost:3306/mysql',
        table = ''
    } = args

    const orm = ORM.connectSync(connection)

    if (!table)
        return false
    
    return orm.driver.ddlDialect.hasCollectionSync(
        orm.driver.db,
        table
    )
}

exports.getTableColumns = (args) => {
    const {
        connection = 'mysql://root:@localhost:3306/mysql',
        table = ''
    } = args

    if (!table)
        throw new Error(`table required`) 

    const orm = ORM.connectSync(connection)
    
    return orm.driver.ddlDialect.getCollectionColumnsSync(
        orm.driver.db, table
    ).map(col => {
        if (col)
            col.Type = col.Type + ''

        return col
    })
}

exports.getTableSemanticColumns = (args) => {
    const {
        connection = 'mysql://root:@localhost:3306/mysql',
        table = ''
    } = args

    if (!table)
        throw new Error(`table required`) 

    const orm = ORM.connectSync(connection)
    
    return orm.driver.ddlDialect.getCollectionPropertiesSync(
        orm.driver.db, table
    )
}