import KnexBased from './_knex';

class DML_MySQL extends KnexBased<Class_MySQL> implements FxOrmDML.DMLDriver<Class_MySQL> {
    dbdriver: FxDbDriverNS.SQLDriver;

    clear: FxOrmDML.DMLDriver['clear'] = function(
        this: FxOrmDML.DMLDriver<Class_MySQL>,
        collection
    ) {
        const bTransResult = this.useConnection(connection => 
            connection.trans(() => {
                this.execSqlQuery(
                    connection,
                    "TRUNCATE TABLE " + this.sqlQuery.escapeId(collection),
                    
                );
            })
        )
        
        return bTransResult
    }
}

export default DML_MySQL