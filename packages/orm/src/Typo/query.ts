/// <reference types="@fxjs/sql-query" />

import type { FxOrmAssociation } from './assoc';
import type { FxOrmDb } from './Db';
import type { FxOrmDMLDriver } from './DMLDriver';
import type { FxOrmInstance } from './instance';
import type { FxOrmModel } from './model';
import type { FxOrmProperty } from './property';
import type { FxOrmCommon } from './_common';

import type {
    FxSqlQueryColumns,
    FxSqlQueryComparator,
    FxSqlQuerySubQuery,
    FxSqlQuery,
    FxSqlQuerySql,
} from '@fxjs/sql-query';

export namespace FxOrmQuery {
    /* query conditions :start */
    export type QueryConditionInTypeType = string | number

    export type QueryCondition_SimpleEq = { [key: string]: FxSqlQueryComparator.SimpleEqValueType }

    export type QueryCondition_eq = { [key: string]: FxSqlQueryComparator.SimpleEqValueType | FxSqlQueryComparator.InputValue_eq }
    export type QueryCondition_ne = { [key: string]: FxSqlQueryComparator.InputValue_ne }
    export type QueryCondition_gt = { [key: string]: FxSqlQueryComparator.InputValue_gt }
    export type QueryCondition_gte = { [key: string]: FxSqlQueryComparator.InputValue_gte }
    export type QueryCondition_lt = { [key: string]: FxSqlQueryComparator.InputValue_lt }
    export type QueryCondition_lte = { [key: string]: FxSqlQueryComparator.InputValue_lte }
    export type QueryCondition_like = { [key: string]: FxSqlQueryComparator.InputValue_like }
    export type QueryCondition_not_like = { [key: string]: FxSqlQueryComparator.InputValue_not_like }
    export type QueryCondition_between = { [key: string]: FxSqlQueryComparator.InputValue_between }
    export type QueryCondition_not_between = { [key: string]: FxSqlQueryComparator.InputValue_not_between }

    export type QueryCondition_in = { [key: string]: FxSqlQueryComparator.InputValue_in }
    export type QueryCondition_not_in = { [key: string]: FxSqlQueryComparator.InputValue_not_in }

    export type QueryConditionAtomicType =
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

    export type QueryConditions = FxSqlQuerySubQuery.SubQueryConditions
    /* query conditions :end */

    export type OrderNormalizedTuple = FxSqlQuery.OrderNormalizedTuple
    export type OrderSqlStyleTuple = FxSqlQuery.OrderSqlStyleTuple
    export type OrderNormalizedResult = FxSqlQuery.OrderNormalizedResult

    export type OrderSeqRawTuple = (OrderNormalizedTupleWithoutTable[0] | OrderNormalizedTupleWithoutTable[1])[]
    export type OrderRawInput = string | OrderSeqRawTuple
    export type OrderNormalizedTupleWithoutTable = [string, "Z" | "A"]
    export type OrderNormalizedTupleMixin = (OrderNormalizedTupleWithoutTable|FxSqlQuery.OrderNormalizedResult)[]
    
    export interface ChainFindMergeInfo {
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

    export interface ChainWhereExistsInfo {
        table: string
        link: FxSqlQuerySql.WhereExistsLinkTuple
        conditions: FxSqlQuerySubQuery.SubQueryConditions
    }

    export interface InsertResult {
        insertId?: string | number
        
        [extra_key: string]: any
    }

    export interface CountResult {
        c: number
        
        [extra_key: string]: any
    }

    export interface RemoveResult {
        [extra_key: string]: any
    }

    export interface AggregationMethod {
        (...args: string[]): IAggregated
        (arg: string[]): IAggregated
    }

    export interface IAggregated {
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
            <T = any>(): FxOrmCommon.ExecutionCallback<T[]>
        }
        get: {
            <T = any>(cb?: FxOrmCommon.ExecutionCallback<T[]>): void
        }

        // [ext_method: string]: AggregationMethod

        [ext_k: string]: any
    }

    export type KeyOfIAggregated = keyof IAggregated
    export type AggregationFuncTuple = FxOrmDb.AGGREGATION_METHOD_TUPLE__COMMON

    export interface SqlSelectFieldsDescriptor extends FxSqlQuerySql.SqlSelectFieldsDescriptor {
        args?: string | string[]
    }

    export interface AggregateConstructorOptions {
        driver: FxOrmDMLDriver.DMLDriver
        driver_name?: string
        limit?: [number, number]
        order?: FxOrmQuery.ChainFindOptions['order']
        // property name's list
        propertyList?: string[]
        table?: string
        conditions?: FxOrmQuery.QueryConditions
        properties: Record<string, FxOrmProperty.NormalizedProperty>
    }
    
    export type AggregateConstructor = new (opts: AggregateConstructorOptions) => IAggregated

    export type ChainFindGenerator = new (Model: FxOrmModel.Model, opts: FxOrmQuery.ChainFindOptions) => IChainFind

    export interface IChainFind {
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

        count(callback?: FxOrmCommon.ExecutionCallback<number>): IChainFind;
        countSync(): number;
        
        remove(callback?: FxOrmCommon.ExecutionCallback<FxOrmQuery.RemoveResult>): IChainFind;
        removeSync(): FxOrmQuery.RemoveResult;

        find: {
            (...conditions: (FxOrmModel.ModelQueryConditionsItem | FxOrmCommon.ExecutionCallback<FxOrmInstance.Instance[]>)[]): IChainFind;
        }
        findSync: {
            (...conditions: (FxOrmModel.ModelQueryConditionsItem | FxOrmCommon.ExecutionCallback<FxOrmInstance.Instance[]>)[]): FxOrmInstance.Instance[]
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

        first(callback?: FxOrmCommon.GenericCallback<FxOrmInstance.Instance>): IChainFind;
        firstSync(): FxOrmInstance.Instance;
        last(callback?: FxOrmCommon.GenericCallback<FxOrmInstance.Instance>): IChainFind;
        lastSync(): FxOrmInstance.Instance;

        each: {
            (cb?: FxOrmCommon.ExecutionCallback<FxOrmInstance.Instance>): IChainInstance;
        }

        eager: {
            (...assocs: string[]): IChainFind;
            (assocs: string[]): IChainFind;
        }

        [extraProperty: string]: any;
    }

    export interface IChainInstanceCallbackFn {
		(...args: any[]): any | FxOrmQuery.IChainInstance
	}
    export interface IChainInstance {
        _each (cb: IChainInstanceCallbackFn): IChainInstance
        filter (cb: IChainInstanceCallbackFn): IChainInstance
        sort (cb: IChainInstanceCallbackFn): IChainInstance
        count (cb: IChainInstanceCallbackFn): IChainInstance
        get (cb: IChainInstanceCallbackFn): IChainInstance
        save (cb: IChainInstanceCallbackFn): IChainInstance
    }


    export interface ChainFindOptions {
        keys: FxOrmModel.ModelConstructorOptions['keys']
        table: FxOrmModel.ModelConstructorOptions['table']
        driver: FxOrmModel.ModelConstructorOptions['driver']
        
        conditions: QueryConditions
        properties: Record<string, FxOrmProperty.NormalizedProperty>
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

    export interface ChainFindInstanceOptions extends ChainFindOptions {
    }
}