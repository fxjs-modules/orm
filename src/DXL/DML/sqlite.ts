import Base from "../Base.class";
import { configurable } from "../../Decorators/accessor";
import { filterKnexBuilderBeforeQuery, filterResultAfterQuery, filterWhereToKnexActions } from "./_utils"
import { arraify } from "../../Utils/array";

function HOOK_DEFAULT () {}

class DML_SQLite extends Base<Class_SQLite> implements FxOrmDML.DMLDriver<Class_SQLite> {
    dbdriver: FxDbDriverNS.SQLDriver;

    @configurable(false)
    get isDebug () {
        return false
    }

    constructor(opts: FxOrmTypeHelpers.ConstructorParams<typeof Base>[0]) {
        super({ dbdriver: opts.dbdriver })
    }

    find: FxOrmDML.DMLDriver['find'] = function (
        this: DML_SQLite,
        table,
        opts?
    ) {
        filterWhereToKnexActions(opts);

        const {
            fields,
            where,
            offset = undefined,
            // @todo: use default MAX limit to get better perfomance, such as '9223372036854775807' or '18446744073709551615'
            limit = undefined,
            orderBy = undefined,
            beforeQuery = HOOK_DEFAULT
        } = opts || {};

        let kbuilder = this.sqlQuery.knex(table)

        if (fields) kbuilder.select(fields)
        if (offset) kbuilder.offset(offset)
        
        // TODO: for sqlite3, when offset provided, set limit as -1
        if (limit) kbuilder.limit(limit as number)
        else if (offset) kbuilder.limit(-1)
        
        if (orderBy) kbuilder.orderBy.apply(kbuilder, arraify(orderBy))
        if (where) kbuilder.where.apply(kbuilder, arraify(where))

        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { dml: this })

        return this.useConnection(connection => 
            this.execSqlQuery(connection, kbuilder.toString())
        )
    }

    exists (
        collection: string,
        {
            where = null
        } = {}
    ) {
        const results = this.find(
            collection,
            {
                // don't read all fields
                fields: where ? Object.keys(where) : [],
                beforeQuery: (builder) => {
                    if (!where || !Object.keys(where).length)
                        throw new Error('[DML::exists] no any where query where-conditions generated in this instance, examine your where-conditions input')

                    builder.where(where)
                }
            }
        )

        return !!results.length
    }

    count: FxOrmDML.DMLDriver['count'] = function (
        this: FxOrmDML.DMLDriver<Class_SQLite>,
        table,
        opts?
    ) {
        filterWhereToKnexActions(opts)

        const {
            where,
            countParams,
            beforeQuery = HOOK_DEFAULT,
            filterQueryResult = (result: any) => Object.values(result[0])[0]
        } = opts || {}

        let kbuilder = this.sqlQuery.knex(table)

        if (where)
            kbuilder.where.apply(kbuilder, arraify(where))
        
        if (countParams)
            kbuilder.count.apply(kbuilder, arraify(countParams))
        else
            kbuilder.count()

        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { dml: this })

        return filterResultAfterQuery(
            this.useConnection(connection => 
                this.execSqlQuery(connection, kbuilder.toString(), [])
            ),
            filterQueryResult
        );
    }

    insert: FxOrmDML.DMLDriver['insert'] = function (
        this: DML_SQLite,
        table,
        data,
        {
            idPropertyList,
            beforeQuery = HOOK_DEFAULT
        } = {}
    ) {
        let kbuilder = this.sqlQuery.knex(table)

        kbuilder.insert(data)
        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { dml: this })

        const info = this.useConnection(connection => 
            this.execSqlQuery<FxOrmQuery.InsertResult>(connection, kbuilder.toString())
        )

        if (!idPropertyList) return null;

        const ids: {[k: string]: any} = {};

        if (idPropertyList.length == 1/*  && idPropertyList[0].type == 'serial' */) {
            ids[idPropertyList[0].name] = info.insertId;
        } else {
            for (let i = 0, prop; i < idPropertyList.length; i++) {
                prop = idPropertyList[i];
                // Zero is a valid value for an ID column
                ids[prop.name] = data[prop.mapsTo] !== undefined ? data[prop.mapsTo] : null;
            }
        }

        return ids;
    }

    update: FxOrmDML.DMLDriver['update'] = function (
        this: DML_SQLite,
        table,
        changes,
        opts?
    ) {
        filterWhereToKnexActions(opts)
        
        const {
            where,
            beforeQuery = HOOK_DEFAULT
        } = opts || {}

        let kbuilder = this.sqlQuery.knex(table)

        if (where) kbuilder.where.apply(kbuilder, arraify(where))

        kbuilder.update(changes)
        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { dml: this })

        return this.useConnection(connection => 
            this.execSqlQuery<any[]>(connection, kbuilder.toString())
        )
    }

    remove: FxOrmDML.DMLDriver['remove'] = function (
        this: DML_SQLite,
        table,
        opts?
    ) {
        filterWhereToKnexActions(opts)

        const {
            where,
            beforeQuery = HOOK_DEFAULT
        } = opts || {}

        if (!where) return this.clear(table)

        let kbuilder = this.sqlQuery.knex(table)

        kbuilder.where.apply(kbuilder, arraify(where))

        kbuilder.delete()
        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { dml: this })

        const bTransResult = this.useConnection(connection => 
            connection.trans(() => {
                this.execSqlQuery(connection, kbuilder.toString());
            })
        )

        return bTransResult
    }

    clear: FxOrmDML.DMLDriver['clear'] = function(
        this: FxOrmDML.DMLDriver<Class_SQLite>,
        table
    ) {
        const bTransResult = this.useConnection(connection => 
            connection.trans(() => {
                this.execSqlQuery(
                    connection,
                    this.sqlQuery.remove()
                            .from(table)
                            .build(),
                    
                );
                
                this.execSqlQuery(
                    connection,
                    this.sqlQuery.remove()
                            .from(table)
                            .where({ name: 'sqlite_sequence' })
                            .build(),
                    
                );
            })
        )
        
        return bTransResult
    }
}

export default DML_SQLite