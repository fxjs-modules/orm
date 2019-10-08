import Base from "../Base.class";
import { configurable } from "../../Decorators/accessor";
import { filterKnexBuilderBeforeQuery, filterResultAfterQuery } from "./_utils"
import { arraify } from "../../Utils/array";

function HOOK_DEFAULT () {}
interface T_DML_SQLite {
    find: FxOrmDML.DMLDriver['find']
    insert: FxOrmDML.DMLDriver['insert']
    remove: FxOrmDML.DMLDriver['remove']
    update: FxOrmDML.DMLDriver['update']
    clear: FxOrmDML.DMLDriver['clear']
}

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
        {
            fields,
            offset = undefined,
            // @todo: use default MAX limit to get better perfomance, such as '9223372036854775807'
            limit = undefined,
            orderBy = undefined,
            beforeQuery = HOOK_DEFAULT
        } = {}
    ) {
        let kbuilder = this.sqlQuery.knex(table)

        if (fields) kbuilder.select(fields)
        if (offset) kbuilder.offset(offset)
        if (limit) kbuilder.limit(limit as number)
        if (orderBy) kbuilder.orderBy.apply(kbuilder, orderBy)

        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { dml: this })

        return this.useConnection(connection => 
            this.execSqlQuery(connection, kbuilder.toString())
        )
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
        {
            where,
            beforeQuery = HOOK_DEFAULT
        } = {}
    ) {
        let kbuilder = this.sqlQuery.knex(table)

        if (where) kbuilder.where.apply(kbuilder, arraify(where))

        kbuilder.update(changes)
        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { dml: this })

        return this.useConnection(connection => 
            this.execSqlQuery<any[]>(connection, kbuilder.toString())
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

    remove: FxOrmDML.DMLDriver['remove'] = function (
        this: DML_SQLite,
        table,
        {
            where,
            beforeQuery = HOOK_DEFAULT
        } = {
            where: null
        }
    ) {
        let kbuilder = this.sqlQuery.knex(table)

        if (!where)
            throw new Error(`[DML:sqlite] where is required for remove`)
        
        kbuilder.where.apply(kbuilder, arraify(where))

        kbuilder.delete()
        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { dml: this })

        return this.useConnection(connection => 
            this.execSqlQuery(connection, kbuilder.toString())
        )
    }

    count: FxOrmDML.DMLDriver['count'] = function (
        this: FxOrmDML.DMLDriver<Class_SQLite>,
        table,
        {
            where,
            countParams,
            beforeQuery = HOOK_DEFAULT,
            filterQueryResult = (result) => Object.values(result[0])[0]
        } = {}
    ) {
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