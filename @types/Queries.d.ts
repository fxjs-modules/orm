/// <reference types="@fxjs/knex" />

/// <reference path="_common.d.ts" />
/// <reference path="property.d.ts" />
/// <reference path="assoc.d.ts" />
/// <reference path="query.d.ts" />

declare namespace FxOrmQueries {
    interface Operators {
        and: symbol
        or: symbol
        gt: symbol
        gte: symbol
        lt: symbol
        lte: symbol
        ne: symbol
        eq: symbol
        is: symbol
        not: symbol
        between: symbol
        notBetween: symbol
        in: symbol
        notIn: symbol
        like: symbol
        notLike: symbol
        startsWith: symbol
        endsWith: symbol
        substring: symbol
        col: symbol
    }
    /**
     * @description `QueryNormalizer` is used to normalize dirty(maybe), incomplete query conditions,
     * it led to get one result formatted as:
     * 
     * ```javascript
     * var normalizedQueryBuilder = {
     *      select: [],
     *      where: {
     *          user_id: { [ORM.Op.gt]: 1 },
     *          user_name: {
     *              [ORM.Op.or]: [
     *                  [ORM.Op.startsWith]: 'Jane',
     *                  [ORM.Op.endsWith]: 'Rowen'
     *              ]
     *          },
     *          [ORM.Op.or]: [
     *              {
     *                  title: {
     *                      [Op.like]: 'Boat%',
     *                  }
     *              },
     *              {
     *                  description: {
     *                      [Op.notLike]: 'Road%',
     *                  }
     *              }
     *          ]
     *      },
     *      limit: 0,
     *      offset: 1,
     *      orderBy: [collection_name, 'asc' | 'desc']
     * }
     * ```
     */
    type OperatorOr = Symbol
    class Class_QueryNormalizer {
        readonly collection: string
        readonly select: string[] | symbol

        readonly selectableFields: string[]

        readonly isSelectAll: boolean
        readonly isEmptyWhere: boolean
        readonly crossCollection: boolean

        orderBy: {
            collection: string
            colname: string
            order: 'asc' | 'desc'
        }[]

        groupBy: {
            collection: string
            colname: string
        }[]

        where: {
            [fname: string]: {
                /**
                 * @for
                 * - `[Op.gt]: 1
                 * - `[Op.lt]: 2
                 * - `[Op.ne]: 'foo'
                 */
                [Symbol.toStringTag]: any
            } | {
                /**
                 * @for
                 * - `[Op.and]: [{...}, {...}]`,
                 * - `[Op.or]: [{...}, {...}]`
                 */
                [Symbol.toStringTag]: any[]
            }
        }
        /**
         * @description for varieties of database, numeber to express `all` or `unlimited` is different,
         * we define '-1' as 'unlimited' here
         * @default -1
         */
        limit: number
        /**
         * @integer
         */
        offset: number

        constructor (
            collection: string,
            opts: {
                select?: string | string[] | '*',
                fields?: string[],
                where?: any
                limit?: number
                offset?: number
            }
        )
    }
    // next generation model :start
    class Class_QueryBuilder<T_RETURN = any> {
        readonly notQueryBuilder: boolean

        model: any;
        conditions: any;
        sqlQuery: FxSqlQuery.Class_Query

        getQueryBuilder (): Class_QueryBuilder<T_RETURN>

        find (opts?: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>): T_RETURN[]
        one (opts?: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>): T_RETURN
        get (id?: string | number | (string|number)[]): T_RETURN
        count (opts?: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['count']>): number

        first (): T_RETURN
        last (): T_RETURN
        all (): T_RETURN[]
    }
    
    type WhereObject = {
        [k: string]: any,
    }
}