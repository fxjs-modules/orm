import SqlQuery = require('@fxjs/sql-query');

export interface ConstructorOpts<ConnType> { dbdriver: DXLBase<ConnType>['dbdriver'] }

export default class DXLBase<ConnType = any> {
    dbdriver: FxDbDriverNS.Driver<ConnType>;

    sqlQuery: FxSqlQuery.Class_Query;

    static create (opts: { dbdriver: DXLBase['dbdriver'] }) {
        return new DXLBase({ dbdriver: opts.dbdriver })
    }

    constructor(opts: ConstructorOpts<ConnType>) {
        this.dbdriver = opts.dbdriver;

        if (this.dbdriver.isSql)
            this.sqlQuery = new SqlQuery.Query();
    }

    execSqlQuery<T_RESULT = any>(
        sqlstr: string,
        args: FxSqlQuerySql.SqlEscapeArgType[] = [],
        opts?: {
            transaction?: boolean
            pool?: boolean
            connection?: ConnType
        }
    ): T_RESULT {
        if (arguments.length >= 2)
            sqlstr = this.sqlQuery.escape(sqlstr, args);

        if (process.env.ORM_DEBUG)
            console.log(require('@fibjs/chalk')`{bold.blue.inverse [SQL]{~inverse  ${sqlstr}}}`)

        const { transaction, connection, pool = false } = opts || {};
        const doIt = (connection: any) => {
            let result
            if (transaction)
                connection.trans(() => {
                    result = connection.execute(sqlstr)
                })
            else
                result = connection.execute(sqlstr)
            
            return result
        }

        if (pool)
            return this.dbdriver.connectionPool((conn: any) => doIt(conn)) as T_RESULT;
        else {
            const conn = connection || this.dbdriver.getConnection()
            return doIt(conn)
        }
    }
}