import type { FxOrmCommon } from './_common';
import type { FxOrmAssociation } from "./assoc";
import type { FxOrmInstance } from "./instance";
import type { FxOrmModel } from "./model";
import type { FxOrmQuery } from './query';

import type { FxSqlQuerySubQuery } from "@fxjs/sql-query";

export namespace FxOrmSynchronous {
    export interface VoidReturn {
        (): void
    }
    export interface UnknownReturn {
        (): any
    }

    export interface SynchronizedModel<
        HP extends Record<string, FxOrmInstance.FieldRuntimeType> = Record<string, FxOrmInstance.FieldRuntimeType>,
        HM extends Record<string, (...args: any) => any> = Record<string, (...args: any) => any>
    > {
        findSync<T = FxOrmInstance.Instance<HP, HM>[]>(conditions?: FxOrmQuery.QueryConditions__Find, options?: FxOrmModel.ModelOptions__Find): T
        findSync<T = FxOrmInstance.Instance<HP, HM>[]>(conditions: FxOrmQuery.QueryConditions__Find, limit: number, order: string[]): T

        allSync: SynchronizedModel['findSync']
        whereSync: SynchronizedModel['findSync']

        countSync(conditions?: FxOrmQuery.QueryConditions__Find): number;
        existsSync(...conditions: (FxOrmCommon.IdType | FxSqlQuerySubQuery.SubQueryConditions)[]): boolean

        oneSync(conditions?: FxOrmQuery.QueryConditions__Find, options?: FxOrmModel.ModelOptions__Find): FxOrmInstance.Instance<HP, HM> | null
        oneSync(conditions?: FxOrmQuery.QueryConditions__Find, order?: string[]): FxOrmInstance.Instance<HP, HM> | null

        createSync<T = FxOrmInstance.Instance<HP, HM>>(data: FxOrmInstance.InstanceDataPayload): T;
        createSync<T = FxOrmInstance.Instance<HP, HM>[]>(data: FxOrmInstance.InstanceDataPayload[]): T;

        // // this Instance is from its callback
        getSync(...ids: any[]): FxOrmInstance.Instance<HP, HM> | null;

        findBySync: {
            <T = FxOrmInstance.Instance<HP, HM>[]>(
                ext_name: string,
                conditions?: FxOrmQuery.QueryConditions__Find,
                options?: FxOrmAssociation.ModelAssociationMethod__FindByOptions,
            ): T
        }

        // it's callback version could return `this: ORM`
        syncSync: VoidReturn
        clearSync: VoidReturn
        dropSync: UnknownReturn

        /**
         * other patched synchronous version method
         * - lazyLoad: getXXXSync, setXXXSync, removeXXXSync
         * - association: [addAccessor]Sync, [getAccessor]Sync, [hasAccessor]Sync, [setAccessor]Sync, [removeAccessor]Sync
         */
        [ek: string]: any
    }

    // TODO: to implement it.
    export interface SynchronizedIChainFind {

    }

    export interface SynchronizedORMInstance {
        // it's callback version could return `this: ORM`
        syncSync: VoidReturn
        closeSync: VoidReturn
        dropSync: VoidReturn
        pingSync: VoidReturn
    }
}