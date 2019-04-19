export function execQuerySync(
    this: FxOrmDMLDriver.DMLDriver,
    query: string,
    opt: FxSqlQuerySql.SqlEscapeArgType[]
) {
    if (arguments.length == 2)
        query = this.query.escape(query, opt);

    return this.db.execute(query);
}