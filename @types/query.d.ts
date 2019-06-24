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

    type OrderNormalizedTuple = FxSqlQuery.OrderNormalizedTuple
    type OrderSqlStyleTuple = FxSqlQuery.OrderSqlStyleTuple
    type OrderNormalizedResult = FxSqlQuery.OrderNormalizedResult

    type OrderSeqRawTuple = (OrderNormalizedTupleWithoutTable[0] | OrderNormalizedTupleWithoutTable[1])[]
    type OrderRawInput = string | OrderSeqRawTuple
    type OrderNormalizedTupleWithoutTable = [string, "Z" | "A"]
    type OrderNormalizedTupleMixin = (OrderNormalizedTupleWithoutTable|FxSqlQuery.OrderNormalizedResult)[]
    
    interface ChainFindMergeInfo {
        from: {
            table: string
            field: string[]
        }
        to: {
            table?: string
            field: string[]
        }
        select: FxSqlQueryColumns.SelectInputArgType[]
        where: [string, FxOrmModel.ModelQueryConditions__Find]
        table: string
    }

    interface ChainWhereExistsInfo {
        table: string
        link: FxSqlQuerySql.WhereExistsLinkTuple
        conditions: FxSqlQuerySubQuery.SubQueryConditions
    }

    interface InsertResult {
        insertId?: string | number
        
        [extra_key: string]: any
    }

    interface CountResult {
        c: number
        
        [extra_key: string]: any
    }

    interface RemoveResult {
        [extra_key: string]: any
    }

    interface AggregationMethod {
        (...args: string[]): IAggregated
        (arg: string[]): IAggregated
    }

    interface IAggregated {
        groupBy: {
            (...columns: string[]): IAggregated;
        }
        limit: {
            (limit: number): IAggregated;
            (offset: number, limit: number): IAggregated;
        }
        order: {
            (...order: string[]): IAggregated;
        }
        select: {
            (columns: string[]): IAggregated;
            (...columns: string[]): IAggregated;
        }
        as: {
            (alias: string): IAggregated;
        }
        call: {
            (fun: FxOrmDb.AGGREGATION_METHOD_COMPLEX, args: string[]): IAggregated;
        }
        getSync: {
            <T = any>(): FxOrmNS.ExecutionCallback<T[]>
        }
        get: {
            <T = any>(cb?: FxOrmNS.ExecutionCallback<T[]>): void
        }

        // [ext_method: string]: AggregationMethod

        [ext_k: string]: any
    }

    type KeyOfIAggregated = keyof IAggregated
    type AggregationFuncTuple = FxOrmDb.AGGREGATION_METHOD_TUPLE__COMMON

    interface SqlSelectFieldsDescriptor extends FxSqlQuerySql.SqlSelectFieldsDescriptor {
        args?: string | string[]
    }

    interface AggregateConstructorOptions {
        driver: FxOrmDMLDriver.DMLDriver
        driver_name?: string
        limit?: [number, number]
        order?: FxOrmQuery.ChainFindOptions['order']
        // property name's list
        propertyList?: string[]
        table?: string
        conditions?: FxOrmQuery.QueryConditions
        properties: FxOrmProperty.NormalizedPropertyHash
    }
    
    type AggregateConstructor = new (opts: AggregateConstructorOptions) => IAggregated

    type ChainFindGenerator = new (Model: FxOrmModel.Model, opts: FxOrmQuery.ChainFindOptions) => IChainFind

    interface IChainFind {
        model: FxOrmModel.Model;
        options: ChainFindInstanceOptions

        only(...args: (string|string[])[]): IChainFind;
        omit(...args: (string|string[])[]): IChainFind;
        skip(offset: number): IChainFind;
        offset(offset: number): IChainFind;

        order(propertyOrderDesc: string, order?: FxOrmQuery.OrderNormalizedTuple[1]): IChainFind;
        order(...orders: FxOrmQuery.OrderSeqRawTuple): IChainFind;
        orderRaw(str: FxOrmQuery.OrderSqlStyleTuple[0], args?: FxOrmQuery.OrderSqlStyleTuple[1]): IChainFind;
        limit(limit: number): IChainFind;

        count(callback?: FxOrmNS.ExecutionCallback<number>): IChainFind;
        countSync(): number;
        
        remove(callback?: FxOrmNS.ExecutionCallback<FxOrmQuery.RemoveResult>): IChainFind;
        removeSync(): FxOrmQuery.RemoveResult;

        find: {
            (...conditions: (FxOrmModel.ModelQueryConditionsItem | FxOrmNS.ExecutionCallback<FxOrmInstance.Instance[]>)[]): IChainFind;
        }
        findSync: {
            (...conditions: (FxOrmModel.ModelQueryConditionsItem | FxOrmNS.ExecutionCallback<FxOrmInstance.Instance[]>)[]): FxOrmInstance.Instance[]
        }
        all: IChainFind['find']
        allSync: IChainFind['findSync']

        where: IChainFind['find']
        whereSync: IChainFind['findSync']
        
        whereExists: {
            (...exists: FxOrmQuery.ChainWhereExistsInfo[]): IChainFind;
            (exists: FxOrmQuery.ChainWhereExistsInfo[]): IChainFind;
        }

        run(callback?: FxOrmQuery.IChainInstanceCallbackFn): IChainFind;
        runSync(): FxOrmInstance.Instance[]

        // removed in commit 717ee65a7a23ed6762856cf3c187700e36c9ba70
        // success(callback?: FxOrmModel.ModelMethodCallback__Find): void;
        // fail(callback?: FxOrmModel.ModelMethodCallback__Find): void;

        first(callback?: FxOrmNS.GenericCallback<FxOrmInstance.Instance>): IChainFind;
        firstSync(): FxOrmInstance.Instance;
        last(callback?: FxOrmNS.GenericCallback<FxOrmInstance.Instance>): IChainFind;
        lastSync(): FxOrmInstance.Instance;

        each: {
            (cb?: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>): IChainInstance;
        }

        eager: {
            (...assocs: string[]): IChainFind;
            (assocs: string[]): IChainFind;
        }

        [extraProperty: string]: any;
    }

    interface IChainInstanceCallbackFn {
		(...args: any[]): any | FxOrmQuery.IChainInstance
	}
    interface IChainInstance {
        _each (cb: IChainInstanceCallbackFn): IChainInstance
        filter (cb: IChainInstanceCallbackFn): IChainInstance
        sort (cb: IChainInstanceCallbackFn): IChainInstance
        count (cb: IChainInstanceCallbackFn): IChainInstance
        get (cb: IChainInstanceCallbackFn): IChainInstance
        save (cb: IChainInstanceCallbackFn): IChainInstance
    }


    interface ChainFindOptions {
        keys: FxOrmModel.ModelConstructorOptions['keys']
        table: FxOrmModel.ModelConstructorOptions['table']
        driver: FxOrmModel.ModelConstructorOptions['driver']
        
        conditions: QueryConditions
        properties: FxOrmProperty.NormalizedPropertyHash
        keyProperties: FxOrmProperty.NormalizedProperty[]
        order: (FxOrmQuery.OrderNormalizedTuple | FxOrmQuery.OrderSqlStyleTuple)[]
        // only: string|FxSqlQueryColumns.SelectInputArgType[]
        only: (string|FxSqlQueryColumns.SelectInputArgType)[]
        limit: number
        offset: number
        merge: FxOrmQuery.ChainFindMergeInfo | FxOrmQuery.ChainFindMergeInfo[]
        newInstanceSync: {
            (data: FxOrmInstance.InstanceDataPayload): FxOrmInstance.Instance
        }
        associations: FxOrmAssociation.InstanceAssociationItem[]

        /* in instance */
        exists?: FxOrmQuery.ChainWhereExistsInfo[]
        __eager?: FxOrmAssociation.InstanceAssociationItem[]
    }

    interface ChainFindInstanceOptions extends ChainFindOptions {
    }
}