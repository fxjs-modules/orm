import DXLBase from '../Base.class';

export default class Base<ConnType = any> extends DXLBase<ConnType> {
    dbdriver: FxDbDriverNS.Driver<ConnType>;

    sqlQuery: FxSqlQuery.Class_Query;

    static create (opts: { dbdriver: Base['dbdriver'] }) {
        return new Base({ dbdriver: opts.dbdriver })
    }

    /**
     * @description find items from remote endpoints
     */
    createTable: FxOrmDDL.DDLDriver['createTable'] = () => void 0
    dropTable: FxOrmDDL.DDLDriver['dropTable'] = () => void 0
}