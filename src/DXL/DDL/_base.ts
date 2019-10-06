import DXLBase from '../Base.class';

export default class Base<ConnType = any> extends DXLBase<ConnType> implements FxOrmDDL.DDLDriver<ConnType> {
    dbdriver: FxDbDriverNS.Driver<ConnType>;

    sqlQuery: FxSqlQuery.Class_Query;

    static create (opts: { dbdriver: Base['dbdriver'] }) {
        return new Base({ dbdriver: opts.dbdriver })
    }

    /**
     * @description find items from remote endpoints
     */
    createTable (...args: FxOrmTypeHelpers.Parameters<FxOrmDDL.DDLDriver['createTable']>): any {}
    dropTable (...args: FxOrmTypeHelpers.Parameters<FxOrmDDL.DDLDriver['dropTable']>): any {}
}