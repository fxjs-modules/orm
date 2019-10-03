import SqlQuery = require('@fxjs/sql-query');

export interface ConstructorOpts<ConnType> { dbdriver: Base<ConnType>['dbdriver'] }

export default class Base<ConnType = any> {
    dbdriver: FxDbDriverNS.Driver<ConnType>;

    sqlQuery: FxSqlQuery.Class_Query;

    static create (opts: { dbdriver: Base['dbdriver'] }) {
        return new Base({ dbdriver: opts.dbdriver })
    }

    constructor(opts: ConstructorOpts<ConnType>) {
        this.dbdriver = opts.dbdriver;

        if (this.dbdriver.isSql)
            this.sqlQuery = new SqlQuery.Query();
    }

    execSqlQuery<T_RESULT = any>(
        sqlstr: string,
        args?: FxSqlQuerySql.SqlEscapeArgType[]
    ): T_RESULT {
        if (arguments.length == 2)
            sqlstr = this.sqlQuery.escape(sqlstr, args);

        if (process.env.ORM_DEBUG)
            console.log(require('@fibjs/chalk')`{bold.blue.inverse [SQL]{~inverse  ${sqlstr}}}`)

        return this.dbdriver.execute(sqlstr) as T_RESULT;
    }

    /**
     * @description find items from remote endpoints
     */
    find: FxOrmDML.DMLDriver['find'] = () => void 0
    insert: FxOrmDML.DMLDriver['insert'] = () => void 0
    update: FxOrmDML.DMLDriver['update'] = () => void 0
    remove: FxOrmDML.DMLDriver['remove'] = () => void 0
}