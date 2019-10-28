import KnexBased from './_knex';

class DML_SQLite extends KnexBased<Class_SQLite> implements FxOrmDML.DMLDialect<Class_SQLite> {
    dbdriver: FxDbDriverNS.SQLDriver;

    clear (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDialect['clear']>) {
        const [collection, opts] = args
        this.execSqlQuery(
            opts.connection,
            this.sqlQuery.remove()
                    .from(collection)
                    .build(),
        );

        this.execSqlQuery(
            opts.connection,
            this.sqlQuery.remove()
                    .from(collection)
                    .where({ name: 'sqlite_sequence' })
                    .build(),

        );

        return undefined as any
    }
}

export default DML_SQLite
