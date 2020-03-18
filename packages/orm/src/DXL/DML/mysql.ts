import KnexBased from './_knex';

class DML_MySQL extends KnexBased<Class_MySQL> implements FxOrmDML.DMLDialect<Class_MySQL> {
    dbdriver: FxDbDriverNS.SQLDriver;

    clear(
        collection: FxOrmTypeHelpers.FirstParameter<FxOrmDML.DMLDialect<Class_MySQL>['clear']>,
        {
            connection
        }: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDialect<Class_MySQL>['clear']>
    ) {
        const bTransResult = this.execSqlQuery(
            connection,
            "TRUNCATE TABLE " + this.sqlQuery.escapeId(collection),
        )

        return bTransResult
    }
}

export default DML_MySQL
