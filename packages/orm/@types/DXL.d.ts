declare namespace FxOrmDXL {
    interface OptionsCommon<ConnType = any> {
        connection?: FxDbDriverNS.Driver<ConnType>['connection']
    }
    class DXLDialect<CONN_TYPE> {
        dialect: FxSqlQueryDialect.DialectType | FxDbDriverNS.DriverType
        connection: CONN_TYPE;

        /**
         * @description only valid for supported sql dbdriver
         *
         * @warning it costs so much time to re-create sqlQuery, so
         * re-use sqlQuery as possible, e.g. `toSingleton()` will
         * generate one sub-DXL instance shared sqlQuery with parent-DXL
         */
        sqlQuery: FxSqlQuery.Class_Query;

        constructor(opts: {
            // dbdriver: DXLDialect<CONN_TYPE>['dbdriver'],
            dialect: DXLDialect<CONN_TYPE>['dialect'],
            connection: DXLDialect<CONN_TYPE>['connection'],

            sqlQuery?: DXLDialect<CONN_TYPE>['sqlQuery'],
        })

        fromNewConnection(connection: CONN_TYPE): FxOrmDXL.DXLDialect<CONN_TYPE>

        execSqlQuery<T_RESULT = any>(
            connection: any,
            sqlstr: string,
            args?: any[]
        ): T_RESULT
    }
}
