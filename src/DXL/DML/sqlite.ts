import Base, { ConstructorOpts } from "../Base.class";
import { configurable } from "../../Decorators/accessor";
import { filterKnexBuilderBeforeQuery, filterResultAfterQuery } from "./_utils"import { arraify } from "../../Utils/array";
, { dml: this };

function HOOK_DEFAULT () {}
interface T_DML_SQLite {
    find: FxOrmDML.DMLDriver['find']
    insert: FxOrmDML.DMLDriver['insert']
    remove: FxOrmDML.DMLDriver['remove']
    update: FxOrmDML.DMLDriver['update']
    clear: FxOrmDML.DMLDriver['clear']
}

class DML_SQLite extends Base<Class_SQLite> implements T_DML_SQLite {
    dbdriver: FxDbDriverNS.SQLDriver;

    @configurable(false)
    get isDebug () {
        return false
    }

    constructor(opts: ConstructorOpts<Class_SQLite>) {
        super({ dbdriver: opts.dbdriver })
    }

    find: FxOrmDML.DMLDriver['find'] = function (
        this: DML_SQLite,
        table,
        {
            fields,
            offset = 0,
            limit = 1000, // '9223372036854775807',
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

        return this.execSqlQuery(kbuilder.toString());
    }

    insert: FxOrmDML.DMLDriver['insert'] = function (
        this: DML_SQLite,
        table,
        data,
        {
            keyProperties,
            beforeQuery = HOOK_DEFAULT
        } = {}
    ) {
        let kbuilder = this.sqlQuery.knex(table)

        kbuilder.insert(data)
        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { dml: this })

        const info = this.execSqlQuery<FxOrmQuery.InsertResult>(kbuilder.toString());

        if (!keyProperties) return null;

        const ids: {[k: string]: any} = {};

        if (keyProperties.length == 1 && keyProperties[0].type == 'serial') {
            ids[keyProperties[0].name] = info.insertId;
        } else {
            for (let i = 0, prop; i < keyProperties.length; i++) {
                prop = keyProperties[i];
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

        return this.execSqlQuery(kbuilder.toString());
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

        return this.execSqlQuery(kbuilder.toString());
    }

    count: FxOrmDML.DMLDriver['count'] = function (
        this: FxOrmDML.DMLDriver_SQLite,
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
            this.execSqlQuery(kbuilder.toString()),
            filterQueryResult
        );
    }

    clear: FxOrmDML.DMLDriver['clear'] = function(
        this: FxOrmDML.DMLDriver_SQLite,
        table
    ) {
        this.dbdriver.trans(() => {
            this.execSqlQuery(
                this.sqlQuery.remove()
                        .from(table)
                        .build()
            );
            
            this.execSqlQuery(
                this.sqlQuery.remove()
                        .from(table)
                        .where({ name: 'sqlite_sequence' })
                        .build()
            );
        })

        return undefined
    }
}

export default DML_SQLite