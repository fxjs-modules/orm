declare namespace FxOrmDXL {
    class DXLDriver<ConnType> {
        // uid: string
        dbdriver: FxDbDriverNS.Driver<ConnType>;
        singleton_connection?: ConnType;

        // readonly isSql: boolean
        /**
         * @description only valid for supported sql dbdriver
         */
        sqlQuery: FxSqlQuery.Class_Query;

        constructor(opts: {
            dbdriver: DXLDriver<ConnType>['dbdriver'],
            singleton?: boolean,
        })

        toSingleton (): this
        useTrans (callback: (dxl: DXLDriver<ConnType>) => any): this
        releaseSingleton (): this

        useConnection (callback: (connection: ConnType) => any): any

        execSqlQuery<T_RESULT = any>(
            connection: any,
            sqlstr: string,
            args?: any[]
        ): T_RESULT

        // poolQuery: {
        //     <T=any>(query: string, cb?: FxOrmNS.GenericCallback<T>): T
        // }
        
        // valueToProperty: {
        //     (value: any, property: FxOrmProperty.NormalizedProperty): any
        // }
        // propertyToValue: {
        //     (value: any, property: FxOrmProperty.NormalizedProperty): any
        // }
        // customTypes: {[key: string]: FxOrmProperty.CustomPropertyType}
    }
}