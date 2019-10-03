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
    find: FxOrmDML.DMLDriver['find'] = () => void 0
    insert: FxOrmDML.DMLDriver['insert'] = () => void 0
    update: FxOrmDML.DMLDriver['update'] = () => void 0
    remove: FxOrmDML.DMLDriver['remove'] = () => void 0
}