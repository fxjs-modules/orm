declare namespace FxOrmDXL {
    class DXLDriver<CONN_TYPE> {
        // uid: string
        dbdriver: FxDbDriverNS.Driver<CONN_TYPE>;
        singleton_connection?: CONN_TYPE;

        // readonly isSql: boolean
        /**
         * @description only valid for supported sql dbdriver
         * 
         * @warning it costs so much time to re-create sqlQuery, so
         * re-use sqlQuery as possible, e.g. `toSingleton()` will
         * generate one sub-DXL instance shared sqlQuery with parent-DXL
         */
        sqlQuery: FxSqlQuery.Class_Query;

        constructor(opts: {
            dbdriver: DXLDriver<CONN_TYPE>['dbdriver'],
            sqlQuery?: DXLDriver<CONN_TYPE>['sqlQuery'],
            singleton?: boolean,
        })

        toSingleton (): this
        useTrans (callback: (dxl: DXLDriver<CONN_TYPE>) => any): this
        releaseSingleton (): this

        useConnection (callback: (connection: CONN_TYPE) => any): any

        execSqlQuery<T_RESULT = any>(
            connection: any,
            sqlstr: string,
            args?: any[]
        ): T_RESULT
    }
}