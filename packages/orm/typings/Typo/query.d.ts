import type { FxOrmAssociation } from './assoc';
import type { FxOrmDb } from './Db';
import type { FxOrmDMLDriver } from './DMLDriver';
import type { FxOrmInstance } from './instance';
import type { FxOrmModel } from './model';
import type { FxOrmProperty } from './property';
import type { FxOrmCommon } from './_common';
import type { FxSqlQueryColumns, FxSqlQueryComparator, FxSqlQuerySubQuery, FxSqlQuery, FxSqlQuerySql } from '@fxjs/sql-query';
export declare namespace FxOrmQuery {
    type QueryConditionInTypeType = string | number;
    type QueryCondition_SimpleEq = {
        [key: string]: FxSqlQueryComparator.SimpleEqValueType;
    };
    type QueryCondition_eq = {
        [key: string]: FxSqlQueryComparator.SimpleEqValueType | FxSqlQueryComparator.InputValue_eq;
    };
    type QueryCondition_ne = {
        [key: string]: FxSqlQueryComparator.InputValue_ne;
    };
    type QueryCondition_gt = {
        [key: string]: FxSqlQueryComparator.InputValue_gt;
    };
    type QueryCondition_gte = {
        [key: string]: FxSqlQueryComparator.InputValue_gte;
    };
    type QueryCondition_lt = {
        [key: string]: FxSqlQueryComparator.InputValue_lt;
    };
    type QueryCondition_lte = {
        [key: string]: FxSqlQueryComparator.InputValue_lte;
    };
    type QueryCondition_like = {
        [key: string]: FxSqlQueryComparator.InputValue_like;
    };
    type QueryCondition_not_like = {
        [key: string]: FxSqlQueryComparator.InputValue_not_like;
    };
    type QueryCondition_between = {
        [key: string]: FxSqlQueryComparator.InputValue_between;
    };
    type QueryCondition_not_between = {
        [key: string]: FxSqlQueryComparator.InputValue_not_between;
    };
    type QueryCondition_in = {
        [key: string]: FxSqlQueryComparator.InputValue_in;
    };
    type QueryCondition_not_in = {
        [key: string]: FxSqlQueryComparator.InputValue_not_in;
    };
    type QueryConditionAtomicType = QueryCondition_eq | QueryCondition_ne | QueryCondition_gt | QueryCondition_gte | QueryCondition_lt | QueryCondition_lte | QueryCondition_like | QueryCondition_not_like | QueryCondition_between | QueryCondition_not_between | QueryCondition_in | QueryCondition_not_in;
    type QueryConditions = FxSqlQuerySubQuery.SubQueryConditions;
    type QueryConditionsItem = FxSqlQuerySql.SqlFragmentStr | FxOrmQuery.QueryConditions__Find;
    type OrderNormalizedTuple = FxSqlQuery.OrderNormalizedTuple;
    type OrderSqlStyleTuple = FxSqlQuery.OrderSqlStyleTuple;
    type OrderNormalizedResult = FxSqlQuery.OrderNormalizedResult;
    type OrderSeqRawTuple = (OrderNormalizedTupleWithoutTable[0] | OrderNormalizedTupleWithoutTable[1])[];
    type OrderRawInput = string | OrderSeqRawTuple;
    type OrderNormalizedTupleWithoutTable = [string, "Z" | "A"];
    type OrderNormalizedTupleMixin = (OrderNormalizedTupleWithoutTable | FxSqlQuery.OrderNormalizedResult)[];
    interface QueryConditions__Find extends FxSqlQuerySubQuery.SubQueryConditions {
        [property: string]: any;
    }
    interface ChainFindMergeInfo {
        from: {
            table: string;
            field: string[];
        };
        to: {
            table?: string;
            field: string[];
        };
        select: FxSqlQueryColumns.SelectInputArgType[];
        where: [string, QueryConditions__Find];
        table: string;
    }
    interface ChainWhereExistsInfo {
        table: string;
        link: FxSqlQuerySql.WhereExistsLinkTuple;
        conditions: FxSqlQuerySubQuery.SubQueryConditions;
    }
    interface InsertResult {
        insertId?: string | number;
        [extra_key: string]: any;
    }
    interface CountResult {
        c: number;
        [extra_key: string]: any;
    }
    interface RemoveResult {
        [extra_key: string]: any;
    }
    interface AggregationMethod {
        (...args: string[]): IAggregated;
        (arg: string[]): IAggregated;
    }
    interface IAggregated {
        groupBy: {
            (...columns: string[]): IAggregated;
        };
        limit: {
            (limit: number): IAggregated;
            (offset: number, limit: number): IAggregated;
        };
        order: {
            (...order: string[]): IAggregated;
        };
        select: {
            (columns: string[]): IAggregated;
            (...columns: string[]): IAggregated;
        };
        as: {
            (alias: string): IAggregated;
        };
        call: {
            (fun: FxOrmDb.AGGREGATION_METHOD_COMPLEX, args: string[]): IAggregated;
        };
        getSync: {
            <T = any>(): FxOrmCommon.ExecutionCallback<T[]>;
        };
        get: {
            <T = any>(cb?: FxOrmCommon.ExecutionCallback<T[]>): void;
        };
        [ext_k: string]: any;
    }
    type KeyOfIAggregated = keyof IAggregated;
    type AggregationFuncTuple = FxOrmDb.AGGREGATION_METHOD_TUPLE__COMMON;
    interface SqlSelectFieldsDescriptor extends FxSqlQuerySql.SqlSelectFieldItemDescriptor {
        args?: string | string[];
    }
    interface AggregateConstructorOptions {
        driver: FxOrmDMLDriver.DMLDriver;
        driver_name?: string;
        limit?: [number, number];
        order?: FxOrmQuery.ChainFindOptions['order'];
        propertyList?: string[];
        table?: string;
        conditions?: FxOrmQuery.QueryConditions;
        properties: Record<string, FxOrmProperty.NormalizedProperty>;
    }
    type AggregateConstructor = new (opts: AggregateConstructorOptions) => IAggregated;
    type ChainFindGenerator = new (Model: FxOrmModel.Model, opts: FxOrmQuery.ChainFindOptions) => IChainFind;
    interface IChainFind<HP extends Record<string, FxOrmInstance.FieldRuntimeType> = Record<string, FxOrmInstance.FieldRuntimeType>, HM extends Record<string, (...args: any) => any> = Record<string, (...args: any) => any>> {
        model: FxOrmModel.Model<HP, HM>;
        options: ChainFindInstanceOptions;
        only(...args: (string | string[])[]): this;
        omit(...args: (string | string[])[]): this;
        skip(offset: number): this;
        offset(offset: number): this;
        order(propertyOrderDesc: string, order?: FxOrmQuery.OrderNormalizedTuple[1]): this;
        order(...orders: FxOrmQuery.OrderSeqRawTuple): this;
        orderRaw(str: FxOrmQuery.OrderSqlStyleTuple[0], args?: FxOrmQuery.OrderSqlStyleTuple[1]): this;
        limit(limit: number): this;
        count(callback?: FxOrmCommon.ExecutionCallback<number>): this;
        countSync(): number;
        remove(callback?: FxOrmCommon.ExecutionCallback<FxOrmQuery.RemoveResult>): this;
        removeSync(): FxOrmQuery.RemoveResult;
        find<T = FxOrmInstance.Instance<HP, HM>[]>(...conditions: (FxOrmQuery.QueryConditionsItem | FxOrmCommon.ExecutionCallback<T>)[]): this;
        findSync: {
            <T = FxOrmInstance.Instance<HP, HM>[]>(...conditions: (FxOrmQuery.QueryConditionsItem | FxOrmCommon.ExecutionCallback<T>)[]): T;
        };
        all: this['find'];
        allSync: this['findSync'];
        where: this['find'];
        whereSync: this['findSync'];
        whereExists(...exists: FxOrmQuery.ChainWhereExistsInfo[]): this;
        whereExists(exists: FxOrmQuery.ChainWhereExistsInfo[]): this;
        run(callback?: FxOrmQuery.IChainInstanceCallbackFn): this;
        runSync<T = FxOrmInstance.Instance<HP, HM>[]>(): T;
        first(callback?: FxOrmCommon.GenericCallback<FxOrmInstance.Instance<HP, HM> | null>): this;
        firstSync(): FxOrmInstance.Instance<HP, HM> | null;
        last(callback?: FxOrmCommon.GenericCallback<FxOrmInstance.Instance<HP, HM> | null>): this;
        lastSync(): FxOrmInstance.Instance<HP, HM> | null;
        each: {
            <T = FxOrmInstance.Instance<HP, HM>>(cb?: FxOrmCommon.ExecutionCallback<T>): IChainInstance;
        };
        eager(...assocs: string[]): this;
        eager(assocs: string[]): this;
        [extraProperty: string]: any;
    }
    interface IChainInstanceCallbackFn {
        (...args: any[]): any | FxOrmQuery.IChainInstance;
    }
    interface IChainInstance {
        _each(cb: IChainInstanceCallbackFn): IChainInstance;
        filter(cb: IChainInstanceCallbackFn): IChainInstance;
        sort(cb: IChainInstanceCallbackFn): IChainInstance;
        count(cb: IChainInstanceCallbackFn): IChainInstance;
        get(cb: IChainInstanceCallbackFn): IChainInstance;
        save(cb: IChainInstanceCallbackFn): IChainInstance;
    }
    interface ChainFindOptions {
        keys: string[];
        table: string;
        generateSqlSelect?: FxOrmDMLDriver.DMLDriver_FindOptions['generateSqlSelect'];
        driver: FxOrmDMLDriver.DMLDriver;
        conditions: QueryConditions;
        /**
         * @notice virtual properties included here
         */
        properties: Record<string, FxOrmProperty.NormalizedProperty>;
        keyProperties: FxOrmProperty.NormalizedProperty[];
        order: (FxOrmQuery.OrderNormalizedTuple | FxOrmQuery.OrderSqlStyleTuple)[];
        only: (string | FxSqlQueryColumns.SelectInputArgType)[];
        limit: number;
        offset: number;
        merge: FxOrmQuery.ChainFindMergeInfo | FxOrmQuery.ChainFindMergeInfo[];
        newInstanceSync: {
            (data: FxOrmInstance.InstanceDataPayload): FxOrmInstance.Instance;
        };
        associations: FxOrmAssociation.InstanceAssociationItem[];
        exists?: FxOrmQuery.ChainWhereExistsInfo[];
        __eager?: FxOrmAssociation.InstanceAssociationItem[];
    }
    interface ChainFindInstanceOptions extends ChainFindOptions {
    }
}
