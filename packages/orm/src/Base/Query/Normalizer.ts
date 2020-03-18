import { isEmptyPlainObject } from "../../Utils/object"
import hql = require('@fxjs/orm-hql')

const SYM_SELECT_ALL = Symbol('HqLNormalizer#select_all')

function normalizeSelect(select: any): FxOrmQueries.HqLNormalizer['select'] {
    if (!select)
        throw new Error('[normalizeSelect] select must be string array')

    if (select === '*')
        return SYM_SELECT_ALL

    if (!Array.isArray(select))
        select = [select].filter(x => typeof x === 'string')

    if (!select.length)
        return SYM_SELECT_ALL
}

function normalizeLimit(input: any) {
    if (typeof input !== 'number' || isNaN(input) || !isFinite(input) || !input)
        input = -1

    if (input < -1) input = -1

    return input
}

function normalizeOffset(input: any) {
    if (typeof input !== 'number' || isNaN(input) || !isFinite(input) || !input)
        input = 0

    if (input < 0) input = 0

    return input
}

export default function getNormalizedHQLObject(
    ...args: FxOrmTypeHelpers.Parameters<typeof FxOrmNS.Class_ORM['parseHQL']>
) {
    const [sql, opts] = args
    if (!sql || typeof sql !== 'string')
        throw new Error(`[QueryNormalizer::constructor] sql must be non-empty string`)

    const json = hql.parse(sql);

    if (json.parsed.type !== 'select')
        throw new Error(`[QueryNormalizer::constructor] "select" type hql supported only!`)

    const tobj = <FxOrmQueries.HqLNormalizer>{
        get isSelectAll () { return tobj.select === SYM_SELECT_ALL },
        get isEmptyWhere () { return !tobj.where || isEmptyPlainObject(tobj.where) },
        get isJoined () { return false },
    };

    const { models = {} } = opts || {};
    if (models && !isEmptyPlainObject(models)) {
        tobj.collection = json.sourceTables.find(table => models.hasOwnProperty(table)) || null
        if (!tobj.collection)
            throw new Error(`[QueryNormalizer::constructor] no any source collection find in passed model dictionary, check your config.`)
    }

    make__selectableFields: {
        if (json.parsed.selection.type === 'select_all') {
            tobj.select = SYM_SELECT_ALL
        } else {
            tobj.select = json.returnColumns

            let selectable_fields = <string[]>[]
            let model = null
            /**
             * @couldi deal with field name conflict here?
             */
            json.parsed.selection.columns.forEach(selectCol => {
                if (selectCol.expression.type === 'select_all' && (model = models[selectCol.expression.table.value])) {
                    selectable_fields = selectable_fields.concat(model.propertyList.map(property => property.mapsTo));
                } else if (selectCol.expression.type === 'column' && (model = models[selectCol.expression.table])) {
                    if (selectCol.alias && selectCol.alias.value) selectable_fields.push(selectCol.alias.value)
                    else selectable_fields.push(selectCol.expression.name)
                }
            })

            selectable_fields = Array.from(new Set(selectable_fields))

            tobj.selectableFields = selectable_fields
        }
    }

    make_fromTable: {
        if (json.parsed.table_exp.type === 'from_table') {
            tobj.from = json.parsed.table_exp.from
            tobj.where = json.parsed.table_exp.where
            tobj.groupBy = json.parsed.table_exp.groupby
            tobj.having = json.parsed.table_exp.having
        }
    }

    make_offsetlimit: {
        if (json.parsed.table_exp.limit) {
            tobj.limit = normalizeLimit(json.parsed.table_exp.limit.limit)
            tobj.offset = normalizeLimit(json.parsed.table_exp.limit.offset)
        }
    }

    make_joins: {
        if (json.joins) tobj.joins = json.joins
    }

    return new Proxy(tobj, {
        set(target: any, setKey: string, value: any) {
            if (['collection', 'selectableFields', 'select'].includes(setKey)) {
                return false
            }

            if (!target.hasOwnProperty(setKey))
                throw new Error(`[HqLNormalizer::proxy] unknown property is not allowed`)

            target[setKey] = value
            return true
        }
    })
}
