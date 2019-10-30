import Base from "../Base.class";
import { configurable } from "../../Decorators/accessor";
import {
  filterKnexBuilderBeforeQuery,
  filterResultAfterQuery,
  filterWhereToKnexActions,
  filterJoinSelectToKnexActions
} from "./_utils"
import { arraify } from "../../Utils/array";
import { isEmptyPlainObject } from "../../Utils/object";

function HOOK_DEFAULT () {}

class DML_KnexBased<CONN_TYPE = any> extends Base<CONN_TYPE> implements FxOrmDML.DMLDialect<CONN_TYPE> {
    @configurable(false)
    get isDebug () {
        return false
    }

    constructor(opts: FxOrmTypeHelpers.ConstructorParams<typeof Base>[0]) {
        super({...opts})
    }

    find: FxOrmDML.DMLDialect['find'] = function (
        this: DML_KnexBased,
        collection,
        opts
    ) {
        filterWhereToKnexActions(opts);
        filterJoinSelectToKnexActions(opts, collection)

        const {
            connection = this.connection,
            fields = undefined,
            select = undefined,
            where = undefined,
            offset = undefined,
            // @todo: use default MAX limit to get better perfomance, such as '9223372036854775807' or '18446744073709551615'
            limit = undefined,
            orderBy = undefined,
            beforeQuery = HOOK_DEFAULT,
            filterQueryResult = undefined
        } = opts || {};

        let kbuilder = this.sqlQuery.knex(collection)

        if (select) kbuilder.select(select)
        else if (fields) kbuilder.select(fields)
        if (offset) kbuilder.offset(offset)

        if (limit) kbuilder.limit(limit as number)
        else if (offset && this.dialect === 'sqlite')
            kbuilder.limit(-1)

        if (orderBy) kbuilder.orderBy.apply(kbuilder, arraify(orderBy))
        if (where) kbuilder.where.apply(kbuilder, arraify(where))

        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { knex: this.sqlQuery.knex, dml: this })

        return filterResultAfterQuery(
            this.execSqlQuery(connection, kbuilder.toString()),
            filterQueryResult
        )
    }

    exists (
        collection: string,
        {
            connection = this.connection,
            where = null
        } = {}
    ) {
        const results = this.find(
            collection,
            {
                connection,
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

    count: FxOrmDML.DMLDialect['count'] = function (
        this: DML_KnexBased,
        table,
        opts
    ) {
        filterWhereToKnexActions(opts)

        const {
            connection = this.connection,
            countParams = undefined,
            beforeQuery = HOOK_DEFAULT,
            filterQueryResult = (result: any) => Object.values(result[0])[0]
        } = opts || {}

        let kbuilder = this.sqlQuery.knex(table)

        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { knex: this.sqlQuery.knex, dml: this })
        kbuilder.count.apply(kbuilder, countParams ? arraify(countParams) : [])

        return filterResultAfterQuery(
            this.execSqlQuery<number>(connection, kbuilder.toString(), []),
            filterQueryResult
        )
    }

    insert: FxOrmDML.DMLDialect['insert'] = function (
        this: DML_KnexBased,
        table,
        data,
        {
            connection = this.connection,
            idPropertyList,
            beforeQuery = HOOK_DEFAULT
        }
    ) {
        let kbuilder = this.sqlQuery.knex(table).insert(data)

        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { knex: this.sqlQuery.knex, dml: this })
        const sql = kbuilder.toQuery()

        const info = this.execSqlQuery<{insertId: string | number}>(connection, sql)

        if (!idPropertyList) return null;

        const ids: {[k: string]: any} = {};
        if (idPropertyList.length == 1) {
            ids[idPropertyList[0].name] = info.insertId;
        } else {
            idPropertyList.forEach(prop => {
                if (prop.joinNode && prop.joinNode.refColumn)
                    // Zero is a valid value for an ID column
                    ids[prop.name] = data[prop.mapsTo] !== undefined ? data[prop.mapsTo] : null;
                else
                    ids[prop.name] = info.insertId;
            });
        }

        return ids;
    }

    update: FxOrmDML.DMLDialect['update'] = function (
        this: DML_KnexBased,
        table,
        changes,
        opts
    ) {
        filterWhereToKnexActions(opts)

        const {
            connection = this.connection,
            where = undefined,
            beforeQuery = HOOK_DEFAULT
        } = opts || {}

        let kbuilder = this.sqlQuery.knex(table)

        if (where) kbuilder.where.apply(kbuilder, arraify(where))

        if (isEmptyPlainObject(changes))
            throw new Error(`[DML_KnexBased::update] invalid changes input given! it must be non-empty object`);

        kbuilder.update(changes)
        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { knex: this.sqlQuery.knex, dml: this })

        return this.execSqlQuery<any>(connection, kbuilder.toString())
    }

    remove: FxOrmDML.DMLDialect['remove'] = function (
        this: DML_KnexBased,
        table,
        opts
    ) {
        filterWhereToKnexActions(opts)

        const {
            connection = this.connection,
            beforeQuery = HOOK_DEFAULT
        } = opts || {}

        if (!beforeQuery || !beforeQuery.length) return this.clear(table, { connection })

        let kbuilder = this.sqlQuery.knex(table)

        kbuilder.delete()
        kbuilder = filterKnexBuilderBeforeQuery(kbuilder, beforeQuery, { knex: this.sqlQuery.knex, dml: this })

        return this.execSqlQuery<any>(connection, kbuilder.toString())
    }

    clear(...args: FxOrmTypeHelpers.Parameters<FxOrmDML.DMLDialect['clear']>) { return null as any }
}

export default DML_KnexBased
