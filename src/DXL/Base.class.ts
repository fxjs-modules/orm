import SqlQuery = require('@fxjs/sql-query');

export default class DXLBase<ConnType = any> implements FxOrmDXL.DXLDialect<ConnType> {
    dbdriver: FxDbDriverNS.Driver<ConnType>;
    singleton_connection?: ConnType;

    sqlQuery: FxSqlQuery.Class_Query;

    constructor(opts: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmDXL.DXLDialect>[0]) {
        this.dbdriver = <FxOrmDXL.DXLDialect<ConnType>['dbdriver']>opts.dbdriver;

        if (opts.singleton)
            this.singleton_connection = this.dbdriver.getConnection()

        if (this.dbdriver.isSql)
            if (opts.sqlQuery instanceof SqlQuery.Query)
                this.sqlQuery = opts.sqlQuery
            else
                this.sqlQuery = new SqlQuery.Query({ dialect: <any>this.dbdriver.type });
    }

    /**
     * @warning you should always call releaseSingleton when task of singleton finished
     */
    toSingleton () {
        return new (<any>this.constructor)({
            dbdriver: this.dbdriver,
            sqlQuery: this.sqlQuery,
            singleton: true
        })
    }

    useSingletonTrans (callback: (dxl: DXLBase<ConnType>) => any) {
        const dml = this.toSingleton()

        dml.useConnection((connection: any) => {
            if (this.dbdriver.isSql)
                connection.trans(() => {
                    callback(dml)

                    return true
                })
            else
                callback(dml)

            connection.close()
        })

        return dml
    }

    useConnection (callback: (connection: ConnType) => any) {
        if (this.singleton_connection)
            return callback(this.singleton_connection)
        else
            return this.dbdriver.connectionPool(conn => callback(conn))
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
