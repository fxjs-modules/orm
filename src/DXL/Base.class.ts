import SqlQuery = require('@fxjs/sql-query');

export default class DXLBase<ConnType = any> implements FxOrmDXL.DXLDriver<ConnType> {
    dbdriver: FxDbDriverNS.Driver<ConnType>;
    singleton_connection?: ConnType;

    sqlQuery: FxSqlQuery.Class_Query;

    constructor(opts: {
        dbdriver: DXLBase['dbdriver'],
        singleton?: boolean,
    }) {
        this.dbdriver = opts.dbdriver;

        if (opts.singleton)
            this.singleton_connection = this.dbdriver.getConnection();

        if (this.dbdriver.isSql)
            this.sqlQuery = new SqlQuery.Query({ dialect: <any>this.dbdriver.type });
    }

    /**
     * @warning you should always call releaseSingleton when task of singleton finished
     */
    toSingleton () {
        return new (<any>this.constructor)({ dbdriver: this.dbdriver, singleton: true })
    }
    releaseSingleton () {
        if (this.singleton_connection)
            (<any>this.singleton_connection).close()

        return this
    }

    useTrans (callback: (dxl: DXLBase<ConnType>) => any) {
        this.useConnection((connection: any) => {
            if (this.dbdriver.isSql)
                connection.trans(() => {
                    callback(this)
                })
            else
                callback(this)
        })

        return this
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
