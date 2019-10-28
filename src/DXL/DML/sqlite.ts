import KnexBased from './_knex';

class DML_SQLite extends KnexBased<Class_SQLite> implements FxOrmDML.DMLDialect<Class_SQLite> {
    dbdriver: FxDbDriverNS.SQLDriver;

    clear (
        collection: FxOrmTypeHelpers.FirstParameter<FxOrmDML.DMLDialect<Class_SQLite>['clear']>
    ) {
        const bTransResult = this.useSingletonTrans(dml => {
            return dml.useConnection(connection => {
                dml.execSqlQuery(
                        connection,
                        dml.sqlQuery.remove()
                                .from(collection)
                                .build(),

                    );

                    dml.execSqlQuery(
                        connection,
                        dml.sqlQuery.remove()
                                .from(collection)
                                .where({ name: 'sqlite_sequence' })
                                .build(),

                    );
            })
        })

        return bTransResult
    }
}

export default DML_SQLite
