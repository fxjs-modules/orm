/// <reference types="@fxjs/sql-query" />

declare namespace FxOrmQuery {
    /* query conditions :start */
    type QueryConditionInTypeType = string | number

    type QueryCondition_SimpleEq = { [key: string]: FxSqlQueryComparator.SimpleEqValueType }

    type QueryCondition_eq = { [key: string]: FxSqlQueryComparator.SimpleEqValueType | FxSqlQueryComparator.InputValue_eq }
    type QueryCondition_ne = { [key: string]: FxSqlQueryComparator.InputValue_ne }
    type QueryCondition_gt = { [key: string]: FxSqlQueryComparator.InputValue_gt }
    type QueryCondition_gte = { [key: string]: FxSqlQueryComparator.InputValue_gte }
    type QueryCondition_lt = { [key: string]: FxSqlQueryComparator.InputValue_lt }
    type QueryCondition_lte = { [key: string]: FxSqlQueryComparator.InputValue_lte }
    type QueryCondition_like = { [key: string]: FxSqlQueryComparator.InputValue_like }
    type QueryCondition_not_like = { [key: string]: FxSqlQueryComparator.InputValue_not_like }
    type QueryCondition_between = { [key: string]: FxSqlQueryComparator.InputValue_between }
    type QueryCondition_not_between = { [key: string]: FxSqlQueryComparator.InputValue_not_between }

    type QueryCondition_in = { [key: string]: FxSqlQueryComparator.InputValue_in }
    type QueryCondition_not_in = { [key: string]: FxSqlQueryComparator.InputValue_not_in }

    type QueryConditionAtomicType =
        QueryCondition_eq |
        QueryCondition_ne |
        QueryCondition_gt |
        QueryCondition_gte |
        QueryCondition_lt |
        QueryCondition_lte |
        QueryCondition_like |
        QueryCondition_not_like |
        QueryCondition_between |
        QueryCondition_not_between |
        QueryCondition_in |
        QueryCondition_not_in

    type QueryConditions = FxSqlQuerySubQuery.SubQueryConditions
    /* query conditions :end */
    
    interface ChainFindMergeInfo {
        from: {
            table: string
            field: string
        }
        to: {
            field: string
        }
        select: FxSqlQueryColumns.SelectInputArgType[]
        where: FxSqlQuerySubQuery.SubQueryConditions[]
        table: string
    }

    interface ChainWhereExistsInfo {
        table: string
        link: string
        conditions: FxSqlQuerySubQuery.SubQueryConditions
    }

    interface InsertResult {
        insertId?: string | number
        
        [extra_info: string]: any
    }

    interface IAggregated {
        groupBy(...columns: string[]): IAggregated;
        limit(limit: number): IAggregated;
        limit(offset: number, limit: number): IAggregated;
        order(...order: string[]): IAggregated;
        select: {
            (columns: string[]): IAggregated;
            (...columns: string[]): IAggregated;
        }
        as(alias: string): IAggregated;
        call(fun: string, args: any[]): IAggregated;
        get: {
            <T>(cb: FxOrmNS.GenericCallback<T[]>)
        }
    }

    interface AggregateConstructorOptions {
        driver: FxOrmDMLDriver.DMLDriver
        driver_name?: string
        limit?: [number, number]
        order?: string[]
        // property name's list
        propertyList?: string[]
        table?: string
        conditions?: FxOrmQuery.QueryConditions
        properties: FxOrmProperty.NormalizedPropertyHash
    }
    interface AggregateConstructor {
        (opts: AggregateConstructorOptions): void
        prototype: IAggregated
    }

    interface ChainFindGenerator {
        // new (Model: FxOrmModel.Model, opts: FxOrmQuery.ChainFindOptions)
        (Model: FxOrmModel.Model, opts: FxOrmQuery.ChainFindOptions): void
        prototype: IChainFind
    }

    interface IChainFind {
        find: {
            (...conditions: FxOrmModel.ModelQueryConditionsItem[]): IChainFind;
        }
        all: IChainFind['find']
        where: IChainFind['find']
        
        only(...args: (string|string[])[]): IChainFind;
        omit(): IChainFind;
        skip(offset: number): IChainFind;
        offset(offset: number): IChainFind;

        order(propertyOrderDesc: string, order?: string | "Z" | "A"): IChainFind;
        orderRaw(str: string, args: any[]): IChainFind;
        limit(limit: number): IChainFind;
        count(callback: FxOrmNS.ExecutionCallback<number>): void;
        remove(callback: FxOrmNS.VoidCallback): void;
        run<T>(callback?: FxOrmNS.ExecutionCallback<T>): void;

        // removed in commit 717ee65a7a23ed6762856cf3c187700e36c9ba70
        // success(callback?: FxOrmModel.ModelMethodCallback__Find): void;
        // fail(callback?: FxOrmModel.ModelMethodCallback__Find): void;

        first<T>(callback?: FxOrmNS.ExecutionCallback<T>): void;
        last<T>(callback?: FxOrmNS.ExecutionCallback<T>): void;

        each(callback: (result: FxOrmInstance.Instance) => void): void;
        each(): IChainFind;

        eager(): IChainFind;

        model: FxOrmModel.Model;
        options: ChainFindInstanceOptions

        [extraProperty: string]: any;
    }

    interface ChainFindOptions {
        keys: FxOrmModel.ModelConstructorOptions['keys']
        table: FxOrmModel.ModelConstructorOptions['table']
        driver: FxOrmModel.ModelConstructorOptions['driver']
        
        conditions: QueryConditions
        properties
        order
        only
        limit
        merge
        offset
        newInstance: {
            (data: FxOrmInstance.InstanceDataPayload, cb: FxOrmNS.GenericCallback<FxOrmInstance.Instance>): void
        }
        keyProperties
        associations

        /* in instance */
        exists?
        __eager?
    }

    interface ChainFindInstanceOptions extends ChainFindOptions {
    }
}