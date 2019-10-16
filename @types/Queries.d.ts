/// <reference types="@fxjs/knex" />

/// <reference path="_common.d.ts" />
/// <reference path="property.d.ts" />

declare namespace FxOrmQueries {
  type WhereObjectInput = null | undefined | Fibjs.AnyObject
  class Class_WhereWalker {
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

    constructor (input: any)
  }
}

declare namespace FxOrmQueries {
    interface OperatorFunction<T_OPNAME = string> {
      (value?: any): {
        value?: typeof value
        op_name: T_OPNAME
        op_left?: any
        op_right?: any
      }
      operator_name: T_OPNAME
      op_symbol: symbol
    }

    type OPERATOR_TYPE_CONJUNCTION = 'and' | 'or' | 'xor'
    type OPERATOR_TYPE_ASSERT = 'not' | 'is'
    type OPERATOR_TYPE_PREDICATE = 'between'
    type OPERATOR_TYPE_COMPARISON = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like'
}

declare namespace FxOrmQueries {
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
    class Class_QueryNormalizer {
        readonly collection: string
        readonly select: FxHQLParser.ParsedResult['returnColumns'] | symbol

        readonly selectableFields: string[]

        readonly isSelectAll: boolean
        readonly isEmptyWhere: boolean
        readonly isJoined: boolean

        join: {
            type: 'left' | 'right' | 'inner'
            /**
             * one joined normalizer cannot join with other normalizer
             */
            normalizer: Class_QueryNormalizer
        }[]
        /**
         * @integer
         */
        offset: number

        from: FxHQLParser.FromTableExpNode['from']
        where: FxHQLParser.FromTableExpNode['where']
        groupBy: FxHQLParser.FromTableExpNode['groupby']
        having: FxHQLParser.FromTableExpNode['having']
        orderBy: {
            collection: string
            colname: string
            order: 'asc' | 'desc'
        }[]
        /**
         * @description for varieties of database, numeber to express `all` or `unlimited` is different,
         * we define '-1' as 'unlimited' here
         * @default -1
         */
        limit: number

        constructor (
            sql: string,
            opts?: {
              models?: {
                [k: string]: FxOrmModel.Class_Model
              }
            }
        )
    }
    // next generation model :start
    class Class_QueryBuilder<T_RETURN = any> {
        readonly notQueryBuilder: boolean
        readonly Op: Class_QueryBuilder['QueryLanguage']['Operators']
        readonly Opf: Class_QueryBuilder['QueryLanguageFuncs']['Operators']
        readonly QueryLanguage: {
          Operators: {
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
            colref: symbol
          }
          Others: {
            bracketRound: symbol
            bracketSquare: symbol
            bracketBrace: symbol
            quoteSingle: symbol
            quoteDouble: symbol
            quoteBack: symbol
          }
        }
        readonly QueryLanguageFuncs: {
          Operators: {
            and: (value?: any) => OperatorFunction<'and'>
            or: (value?: any) => OperatorFunction<'or'>
            gt: (value?: any) => OperatorFunction<'gt'>
            gte: (value?: any) => OperatorFunction<'gte'>
            lt: (value?: any) => OperatorFunction<'lt'>
            lte: (value?: any) => OperatorFunction<'lte'>
            ne: (value?: any) => OperatorFunction<'ne'>
            eq: (value?: any) => OperatorFunction<'eq'>
            is: (value?: any) => OperatorFunction<'is'>
            not: (value?: any) => OperatorFunction<'not'>
            between: (value?: any) => OperatorFunction<'between'>
            notBetween: (value?: any) => OperatorFunction<'notBetween'>
            in: (value?: any) => OperatorFunction<'in'>
            notIn: (value?: any) => OperatorFunction<'notIn'>
            like: (value?: any) => OperatorFunction<'like'>
            notLike: (value?: any) => OperatorFunction<'notLike'>
            startsWith: (value?: any) => OperatorFunction<'startsWith'>
            endsWith: (value?: any) => OperatorFunction<'endsWith'>
            substring: (value?: any) => OperatorFunction<'substring'>
            colref: (value?: any) => OperatorFunction<'colref'>
          }
          Others: {
            bracketRound: (value?: any) => OperatorFunction<'bracketRound'>
            bracketSquare: (value?: any) => OperatorFunction<'bracketSquare'>
            bracketBrace: (value?: any) => OperatorFunction<'bracketBrace'>
            quoteSingle: (value?: any) => OperatorFunction<'quoteSingle'>
            quoteDouble: (value?: any) => OperatorFunction<'quoteDouble'>
            quoteBack: (value?: any) => OperatorFunction<'quoteBack'>
          }
        }

        model: FxOrmModel.Class_Model;
        conditions: any;
        sqlQuery: FxSqlQuery.Class_Query

        getQueryBuilder (): Class_QueryBuilder<T_RETURN>

        find (opts?: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>): T_RETURN[]
        one (opts?: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>): T_RETURN
        get (
          id?: string | number | (string|number)[] | FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['find']>['where']
        ): T_RETURN
        count (opts?: FxOrmTypeHelpers.SecondParameter<FxOrmDML.DMLDriver['count']>): number

        first (): T_RETURN
        last (): T_RETURN
        all (): T_RETURN[]

        queryByHQL <T = any> (
          hql: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmQueries.Class_QueryNormalizer>[0],
          opts?: FxOrmTypeHelpers.ConstructorParams<typeof FxOrmQueries.Class_QueryNormalizer>[1]
        ): any
    }
}
