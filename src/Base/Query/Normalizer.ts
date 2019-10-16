import { isEmptyPlainObject } from "../../Utils/object"
import hql = require('@fxjs/orm-hql')

const SYM_SELECT_ALL = Symbol('Class_QueryNormalizer#select_all')

function normalizeSelect (select: any): FxOrmQueries.Class_QueryNormalizer['select'] {
    if (!select)
        throw new Error('[normalizeSelect] select must be string array')

    if (select === '*')
        return SYM_SELECT_ALL

    if (!Array.isArray(select))
        select = [select].filter(x => typeof x === 'string')

    if (!select.length)
        return SYM_SELECT_ALL
}

function normalizeLimit (input: any) {
    if (typeof input !== 'number' || isNaN(input) || !isFinite(input) || !input)
        input = -1

    if (input < -1) input = -1

    return input
}

function normalizeOffset (input: any) {
    if (typeof input !== 'number' || isNaN(input) || !isFinite(input) || !input)
        input = 0

    if (input < 0) input = 0

    return input
}

export default class QueryNormalizer implements FxOrmQueries.Class_QueryNormalizer {
    collection: string
    select: FxOrmQueries.Class_QueryNormalizer['select']
    selectableFields: FxOrmQueries.Class_QueryNormalizer['selectableFields']

    offset: FxOrmQueries.Class_QueryNormalizer['offset'] = 0
    from: FxOrmQueries.Class_QueryNormalizer['from']
    where: FxOrmQueries.Class_QueryNormalizer['where']
    groupBy: FxOrmQueries.Class_QueryNormalizer['groupBy']
    having: FxOrmQueries.Class_QueryNormalizer['having']
    orderBy: FxOrmQueries.Class_QueryNormalizer['orderBy']
    limit: FxOrmQueries.Class_QueryNormalizer['limit'] = -1

    join: FxOrmQueries.Class_QueryNormalizer['join'] = []

    get isSelectAll () { return this.select === SYM_SELECT_ALL }
    get isEmptyWhere () { return !this.where || isEmptyPlainObject(this.where) }
    get isJoined () { return false }

    constructor (...args: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmQueries.Class_QueryNormalizer>) {
        const [sql, opts] = args
        if (!sql || typeof sql !== 'string')
            throw new Error(`[QueryNormalizer::constructor] sql must be non-empty string`)

        const json = hql.parse(sql);

        if (json.parsed.type !== 'select')
            throw new Error(`[QueryNormalizer::constructor] "select" type hql supported only!`)

        const { models = {} } = opts || {};
        if (models && !isEmptyPlainObject(models)) {
          this.collection = json.sourceTables.find(table => models.hasOwnProperty(table)) || null
          if (!this.collection)
            throw new Error(`[QueryNormalizer::constructor] no any source collection find in passed model dictionary, check your config.`)
        }

        make__selectableFields: {
          if (json.parsed.selection.type === 'select_all') {
            this.select = SYM_SELECT_ALL
          } else {
            this.select = json.returnColumns

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

            // console.warn(
            //   'selectable_fields',
            //   selectable_fields
            // )
            this.selectableFields = selectable_fields
          }
        }

        make_fromTable: {
          if (json.parsed.table_exp.type === 'from_table') {
            this.from = json.parsed.table_exp.from
            this.where = json.parsed.table_exp.where
            this.groupBy = json.parsed.table_exp.groupby
            this.having = json.parsed.table_exp.having
          }
        }

        make_offsetlimit: {
          if (json.parsed.table_exp.limit) {
            this.limit = normalizeLimit(json.parsed.table_exp.limit.limit)
            this.offset = normalizeLimit(json.parsed.table_exp.limit.offset)
          }
        }

        return new Proxy(this, {
          set (target: any, setKey: string, value: any) {
            if (['collection', 'selectableFields', 'select'].includes(setKey)) {
                return false
            }

            if (!target.hasOwnProperty(setKey))
                throw new Error(`[Class_QueryNormalizer::proxy] unknown property is not allowed`)

            target[setKey] = value
            return true
          }
        })
    }
}
