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

exports.getTableNames = (args) => {
    const {
        connection = 'mysql://root:@localhost:3306/mysql',
    } = args

    const orm = ORM.connectSync(connection)
    let rows = [];

    // PostgreSQL: SELECT tablename FROM pg_tables WHERE schemaname='public'
    // MySQL: SELECT * FROM information_schema.tables
    // SQLite3: SELECT name FROM sqlite_master WHERE type='table';
    switch (orm.driver.config.protocol) {
        case 'mysql:':
            // rows = orm.driver.execQuerySync(
            //     'SELECT TABLE_NAME as name FROM information_schema.tables',
            //     []
            // ).map(x => x.name);

            const database = orm.driver.config.database
            rows = orm.driver.execQuerySync(
                'SHOW TABLES from ??;',
                [database]
            ).map(x => Object.values(x)[0]);
                
            break
        case 'sqlite:':
            rows = orm.driver.execQuerySync(
                `SELECT name FROM sqlite_master WHERE type='table';`,
                []
            ).map(x => x.name);

            break
    }
    
    return rows;
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