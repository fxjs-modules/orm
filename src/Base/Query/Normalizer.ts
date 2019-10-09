import { isEmptyPlainObject } from "../../Utils/object"

const SYM_SELECT_ALL = Symbol('Class_QueryNormalizer#select_all')

function normalizeSelect (
    select: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmQueries.Class_QueryNormalizer>[1]['select']
): FxOrmQueries.Class_QueryNormalizer['select'] {
    if (!select)
        throw new Error('[normalizeSelect] select must be string array')

    if (select === '*')
        return SYM_SELECT_ALL

    if (!Array.isArray(select))
        select = [select].filter(x => typeof x === 'string')

    if (!select.length)
        return SYM_SELECT_ALL
}

function normalizeLimit (
    input: any
) {
    if (typeof input !== 'number' || isNaN(input) || !isFinite(input) || !input)
        input = -1

    if (input < -1) input = -1

    return input
}

function normalizeOffset (
    input: any
) {
    if (typeof input !== 'number' || isNaN(input) || !isFinite(input) || !input)
        input = 0

    if (input < 0) input = 0

    return input
}

export default class Class_QueryNormalizer implements FxOrmQueries.Class_QueryNormalizer {
    collection: string
    select: FxOrmQueries.Class_QueryNormalizer['select']
    selectableFields: FxOrmQueries.Class_QueryNormalizer['selectableFields']

    where: FxOrmQueries.Class_QueryNormalizer['where']
    limit: FxOrmQueries.Class_QueryNormalizer['limit'] = -1
    offset: FxOrmQueries.Class_QueryNormalizer['offset'] = 0
    orderBy: FxOrmQueries.Class_QueryNormalizer['orderBy'] = []
    groupBy: FxOrmQueries.Class_QueryNormalizer['groupBy'] = []

    get isSelectAll () { return this.select === SYM_SELECT_ALL }
    get isEmptyWhere () { return !this.where || isEmptyPlainObject(this.where) }
    get crossCollection () { return false }

    constructor (...args: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmQueries.Class_QueryNormalizer>) {
        const [collection, opts] = args

        if (!collection || typeof collection.toString !== 'function')
            throw new Error('[Class_QueryNormalizer::constructor] collection is required')
        
        this.collection = collection

        const {
            select = '*',
            where,
            limit = -1,
            offset = 0,
            fields = []
        } = opts || {}

        this.select = normalizeSelect(select)

        if (!Array.isArray(fields) || fields.some(x => typeof x !== 'string'))
            throw new Error(`[Class_QueryNormalizer::constructor] fields must be string array`)
        this.selectableFields = Array.isArray(fields) ? fields : []

        this.limit = normalizeLimit(limit)
        this.offset = normalizeOffset(offset)

        this.where = where;

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