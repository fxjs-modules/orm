declare namespace FxOrmDXL {
    class DXLDialect<CONN_TYPE> {
        dbdriver: FxDbDriverNS.Driver<CONN_TYPE>;
        singleton_connection?: CONN_TYPE;

        /**
         * @description only valid for supported sql dbdriver
         *
         * @warning it costs so much time to re-create sqlQuery, so
         * re-use sqlQuery as possible, e.g. `toSingleton()` will
         * generate one sub-DXL instance shared sqlQuery with parent-DXL
         */
        sqlQuery: FxSqlQuery.Class_Query;

        constructor(opts: {
            dbdriver: DXLDialect<CONN_TYPE>['dbdriver'],
            sqlQuery?: DXLDialect<CONN_TYPE>['sqlQuery'],
            singleton?: boolean,
        })

        toSingleton (): this
        useSingletonTrans (callback: (dxl: DXLDialect<CONN_TYPE>) => any): this

        useConnection (callback: (connection: CONN_TYPE) => any): any

        execSqlQuery<T_RESULT = any>(
            connection: any,
            sqlstr: string,
            args?: any[]
        ): T_RESULT
    }
}
