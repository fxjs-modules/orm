import SqlQuery = require('@fxjs/sql-query');

export default class DXLBase<ConnType = any> implements FxOrmDXL.DXLDialect<ConnType> {
    dialect: FxOrmDXL.DXLDialect<ConnType>['dialect'];
    connection: FxOrmDXL.DXLDialect<ConnType>['connection'];

    sqlQuery: FxSqlQuery.Class_Query;

    constructor(opts: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmDXL.DXLDialect>[0]) {
        this.connection = <any>opts.connection

        this.dialect = opts.dialect
        switch (opts.dialect) {
            case 'mssql':
            case 'mysql':
            case 'sqlite':
            case 'postgresql':
                if (opts.sqlQuery instanceof SqlQuery.Query)
                    this.sqlQuery = opts.sqlQuery
                else
                    this.sqlQuery = new SqlQuery.Query({ dialect: opts.dialect });
                break
        }
    }

    fromNewConnection (connection: FxOrmTypeHelpers.FirstParameter<FxOrmDXL.DXLDialect<ConnType>['fromNewConnection']>) {
        return new (<any>this.constructor)({
            dialect: this.dialect,
            sqlQuery: this.sqlQuery,
            connection,
        })
    }

    execSqlQuery<T_RESULT = any>(
        connection: any,
        sqlstr: string,
        args?: any[]
    ): T_RESULT {
        if (arguments.length >= 3)
            sqlstr = this.sqlQuery.escape(sqlstr, args);

        if (process.env.ORM_DEBUG)
            console.log(require('@fibjs/chalk')`{bold.blue.inverse [SQL]{~inverse  ${sqlstr}}}`)

        return connection.execute(sqlstr)
    }
}
