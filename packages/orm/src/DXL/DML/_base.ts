import DXLBase from '../Base.class';

export default class Base<ConnType = any> extends DXLBase<ConnType> implements FxOrmDML.DMLDialect<ConnType> {
    dbdriver: FxDbDriverNS.Driver<ConnType>;
    sqlQuery: FxSqlQuery.Class_Query;

    // static create (opts: { dbdriver: Base['dbdriver'] }) {
    //     return new Base({ dbdriver: opts.dbdriver })
    // }

    // constructor (opts: FxOrmTypeHelpers.ConstructorParams<(typeof FxOrmDML.DMLDialect)>[0]) {
    //     console.log('opts', opts.singleton)
    //     super(opts)
    // }

    /**
     * @description find items from remote endpoints
     */
    find (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDialect['find']>): any {}
    insert (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDialect['insert']>): any {}
    update (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDialect['update']>): any {}
    remove (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDialect['remove']>): any {}
    exists (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDialect['exists']>): any {}
    count (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDialect['count']>): any {}
    clear (...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDialect['clear']>): any {}
}
