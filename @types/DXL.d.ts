declare namespace FxOrmDXL {
    class DXLDriver<CONN_TYPE> {
        // uid: string
        dbdriver: FxDbDriverNS.Driver<CONN_TYPE>;
        singleton_connection?: CONN_TYPE;

        // readonly isSql: boolean
        /**
         * @description only valid for supported sql dbdriver
         */
        sqlQuery: FxSqlQuery.Class_Query;

        constructor(opts: {
            dbdriver: DXLDriver<CONN_TYPE>['dbdriver'],
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