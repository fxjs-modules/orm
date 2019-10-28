import KnexBased from './_knex';

class DML_SQLite extends KnexBased<Class_SQLite> implements FxOrmDML.DMLDriver<Class_SQLite> {
    dbdriver: FxDbDriverNS.SQLDriver;

    clear: FxOrmDML.DMLDriver['clear'] = function(
        this: FxOrmDML.DMLDriver<Class_SQLite>,
        table
    ) {
        const bTransResult = this.useSingletonTrans(dml => {
            return dml.useConnection(connection => {
                dml.execSqlQuery(
                        connection,
                        dml.sqlQuery.remove()
                                .from(table)
                                .build(),

                    );

                    dml.execSqlQuery(
                        connection,
                        dml.sqlQuery.remove()
                                .from(table)
                                .where({ name: 'sqlite_sequence' })
                                .build(),

                    );
            })
        })

        return bTransResult
    }
}

export default DML_SQLite
