import DXLBase from '../Base.class';

export default class Base<ConnType = any> extends DXLBase<ConnType> implements FxOrmDML.DMLDriver<ConnType> {
    dbdriver: FxDbDriverNS.Driver<ConnType>;
    sqlQuery: FxSqlQuery.Class_Query;

    // static create (opts: { dbdriver: Base['dbdriver'] }) {
    //     return new Base({ dbdriver: opts.dbdriver })
    // }

    // constructor (opts: FxOrmTypeHelpers.ConstructorParams<(typeof FxOrmDML.DMLDriver)>[0]) {
    //     console.log('opts', opts.singleton)
    //     super(opts)
    // }

    /**
     * @description find items from remote endpoints
     */
    find (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDriver['find']>): any {}
    insert (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDriver['insert']>): any {}
    update (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDriver['update']>): any {}
    remove (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDriver['remove']>): any {}
    exists (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDriver['exists']>): any {}
    count (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDriver['count']>): any {}
    clear (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDriver['clear']>): any {}
}