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
    createCollection (...args: FxOrmTypeHelpers.Parameters<FxOrmDDL.DDLDriver['createCollection']>): any {}
    alertCollection (...args: FxOrmTypeHelpers.Parameters<FxOrmDDL.DDLDriver['alertCollection']>): any {}
    truncateCollection (...args: FxOrmTypeHelpers.Parameters<FxOrmDDL.DDLDriver['truncateCollection']>): any {}
    commentCollection (...args: FxOrmTypeHelpers.Parameters<FxOrmDDL.DDLDriver['commentCollection']>): any {}
    dropCollection (...args: FxOrmTypeHelpers.Parameters<FxOrmDDL.DDLDriver['dropCollection']>): any {}
    renameCollection (...args: FxOrmTypeHelpers.Parameters<FxOrmDDL.DDLDriver['renameCollection']>): any {}
}