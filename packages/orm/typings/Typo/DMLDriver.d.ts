/// <reference types="@fibjs/types" />
import { FxDbDriverNS, IDbDriver } from "@fxjs/db-driver";
import type { FxOrmSqlDDLSync__Dialect } from "@fxjs/sql-ddl-sync";
import type { FxOrmAssociation } from "./assoc";
import type { FxOrmDb } from "./Db";
import type { FxOrmModel } from "./model";
import type { FxOrmProperty } from "./property";
import type { FxOrmQuery } from "./query";
import type { FxOrmSettings } from "./settings";
import type { FxOrmCommon } from "./_common";
import type { FxSqlQuery, FxSqlQuerySubQuery, FxSqlQuerySql, FxSqlQueryColumns, FxSqlQueryChainBuilder } from '@fxjs/sql-query';
export declare namespace FxOrmDMLDriver {
    export type DriverUidType = string;
    export interface QueryDataPayload {
        [key: string]: any;
    }
    export interface QueriedCountDataPayload {
        c: number;
    }
    export interface DMLDriverOptions {
        pool?: boolean;
        debug?: boolean;
        settings: FxOrmSettings.SettingInstance;
    }
    export interface DMLDriverConstructor {
        new (config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.Database, opts: FxOrmDMLDriver.DMLDriverOptions): DMLDriver;
        prototype: DMLDriver;
    }
    export interface DMLDriver<TConn extends IDbDriver.ISQLConn = IDbDriver.ISQLConn> {
        readonly db: FxOrmDb.Database<TConn>;
        readonly config: FxOrmDb.Database<TConn>['config'];
        /**
         * @description driver object for SQL-type backend
         */
        readonly sqlDriver: TConn extends IDbDriver.ISQLConn ? IDbDriver.ITypedDriver<TConn> : undefined;
        readonly isSql: TConn extends IDbDriver.ISQLConn ? true : false;
        customTypes: {
            [key: string]: FxOrmProperty.CustomPropertyType;
        };
        knex: import('@fxjs/knex').Knex;
        readonly query: FxSqlQuery.Class_Query;
        /** @internal */
        getQuery: {
            (): FxSqlQuery.Class_Query;
        };
        /**
         * @internal
         */
        readonly ddlSync: FxOrmSqlDDLSync__Dialect.Dialect<IDbDriver.ISQLConn>;
        doSync<T = any>(opts?: FxOrmDMLShared.SyncOptions): this;
        doDrop<T = any>(opts?: FxOrmDMLShared.DropOptions): this;
        connect: {
            (cb: FxOrmCommon.GenericCallback<IDbDriver>): void;
            (): IDbDriver;
        };
        reconnect: {
            (cb: FxOrmCommon.GenericCallback<IDbDriver>): void;
            (): IDbDriver;
        };
        ping: {
            (cb?: FxOrmCommon.VoidCallback): void;
        };
        on: {
            <T>(ev: string, cb?: FxOrmCommon.GenericCallback<T>): void;
        };
        close: {
            (cb?: FxOrmCommon.VoidCallback): void;
        };
        /**
         * @description
         *  aggregate_functions could be string tuple such as
         *
         *  [`RANDOM`, `RAND`] ---> FxOrmDb.AGGREGATION_METHOD_TUPLE__COMMON
         */
        aggregate_functions: ((FxOrmDb.AGGREGATION_METHOD_COMPLEX) | FxOrmDb.AGGREGATION_METHOD_TUPLE__COMMON)[];
        execSimpleQuery: {
            <T = any>(query: string, cb?: FxOrmCommon.GenericCallback<T>): T;
        };
        /**
         * @description do eager-query
         */
        eagerQuery: {
            <T = any>(association: FxOrmAssociation.InstanceAssociationItem, opts: FxOrmQuery.ChainFindOptions, keys: string[], cb?: FxOrmCommon.GenericCallback<T>): T;
        };
        find: {
            <T = FxOrmDMLDriver.QueryDataPayload[]>(selectFields: FxSqlQueryColumns.SelectInputArgType[], table: string, conditions: FxSqlQuerySubQuery.SubQueryConditions, opts: DMLDriver_FindOptions, cb?: FxOrmCommon.GenericCallback<T>): T;
        };
        count: {
            /**
             * mysql: {c: number}
             * sqlite: {c: number}
             */
            (table: string, conditions: FxSqlQuerySubQuery.SubQueryConditions, opts: DMLDriver_CountOptions, cb?: FxOrmCommon.GenericCallback<FxOrmQuery.CountResult[]>): FxOrmQuery.CountResult[];
        };
        insert: {
            (table: string, data: FxSqlQuerySql.DataToSet, keyProperties: FxOrmProperty.NormalizedProperty[], cb?: FxOrmCommon.GenericCallback<FxOrmQuery.InsertResult>): FxOrmQuery.InsertResult;
        };
        update: {
            <T = any>(table: string, changes: FxSqlQuerySql.DataToSet, conditions: FxSqlQuerySubQuery.SubQueryConditions, cb?: FxOrmCommon.GenericCallback<T>): T;
        };
        remove: {
            <T = any>(table: string, conditions: FxSqlQuerySubQuery.SubQueryConditions, cb?: FxOrmCommon.GenericCallback<T>): T;
        };
        clear: {
            <T = any>(table: string, cb?: FxOrmCommon.GenericCallback<T>): T;
        };
        poolQuery: {
            <T = any>(query: string, cb?: FxOrmCommon.GenericCallback<T>): T;
        };
        valueToProperty: {
            (value: any, property: FxOrmProperty.NormalizedProperty): any;
        };
        propertyToValue: {
            (value: any, property: FxOrmProperty.NormalizedProperty): any;
        };
        uid: string;
        hasMany?: {
            (Model: FxOrmModel.Model, association: FxOrmAssociation.InstanceAssociationItem): any;
        };
        execQuerySync: (query: string, opt: Record<string, any>) => any;
        [ext_key: string]: any;
    }
    export type ChainWhereExistsInfoPayload = FxOrmQuery.ChainWhereExistsInfo[];
    /** @internal */
    type __DMLDriver_FindSqlQueryModifierCtx = {
        table: string;
        fromTuple: FxSqlQuerySql.SqlTableTuple;
        selectFields: FxSqlQueryColumns.SelectInputArgType[];
        selectVirtualFields: Exclude<DMLDriver_FindOptions['selectVirtualFields'], void>;
    };
    export interface DMLDriver_FindOptions {
        offset?: number;
        limit?: number;
        order?: FxOrmQuery.OrderNormalizedResult[];
        merge?: FxOrmQuery.ChainFindMergeInfo[];
        exists?: ChainWhereExistsInfoPayload;
        topConditions?: FxSqlQuerySubQuery.SubQueryConditions;
        /** @experimental */
        selectVirtualFields?: string[];
        /** @experimental */
        generateSqlSelect?: (this: DMLDriver, ctx: __DMLDriver_FindSqlQueryModifierCtx, chainSelect: FxSqlQueryChainBuilder.ChainBuilder__Select) => typeof chainSelect | void;
        /** @experimental */
        __pointTypeMapsTo: string[];
    }
    export interface DMLDriver_CountOptions {
        merge?: DMLDriver_FindOptions['merge'];
        exists?: DMLDriver_FindOptions['exists'];
    }
    export interface DMLDriverConstructor_MySQL extends DMLDriverConstructor {
        (this: DMLDriver_MySQL, config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.Database<Class_MySQL>, opts: FxOrmDMLDriver.DMLDriverOptions): void;
        prototype: DMLDriver_MySQL;
    }
    export interface DMLDriver_MySQL extends DMLDriver {
        db: FxOrmDb.Database<Class_MySQL>;
        config: DMLDriver['config'] & {
            timezone: string;
        };
        aggregate_functions: (FxOrmDb.AGGREGATION_METHOD_MYSQL | FxOrmDb.AGGREGATION_METHOD_TUPLE__MYSQL)[];
    }
    export interface DMLDriverConstructor_PostgreSQL extends DMLDriverConstructor {
        (this: DMLDriver_PostgreSQL, config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.DatabaseBase_PostgreSQL, opts: FxOrmDMLDriver.DMLDriverOptions): void;
        prototype: DMLDriver_PostgreSQL;
    }
    export interface DMLDriver_PostgreSQL extends DMLDriver {
        db: FxOrmDb.DatabaseBase_PostgreSQL;
        config: DMLDriver['config'] & {
            timezone: string;
        };
        aggregate_functions: (FxOrmDb.AGGREGATION_METHOD_POSTGRESQL)[];
    }
    export interface DMLDriverConstructor_SQLite extends DMLDriverConstructor {
        (this: DMLDriver_SQLite, config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.DatabaseBase_SQLite, opts: FxOrmDMLDriver.DMLDriverOptions): void;
        prototype: DMLDriver_SQLite;
    }
    export interface DMLDriver_SQLite extends DMLDriver {
        db: FxOrmDb.DatabaseBase_SQLite;
        config: DMLDriver['config'] & {
            timezone: string;
        };
        aggregate_functions: (FxOrmDb.AGGREGATION_METHOD_SQLITE)[];
    }
    export type DefaultSqlDialect = FxOrmSqlDDLSync__Dialect.Dialect<IDbDriver.ISQLConn>;
    export {};
}
export declare namespace FxOrmDMLShared {
    interface SyncOptions {
        id: string[];
        extension: boolean;
        table: string;
        allProperties: Record<string, FxOrmProperty.NormalizedProperty>;
        indexes: string[];
        customTypes: {
            [key: string]: FxOrmProperty.CustomPropertyType;
        };
        one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[];
        many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[];
        extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[];
        tableComment?: string;
        /**
         * @default true
         */
        repair_column?: boolean;
        /**
         * @default false
         */
        allow_drop_column?: boolean;
    }
    interface DropOptions {
        table: string;
        properties: Record<string, FxOrmProperty.NormalizedProperty>;
        one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[];
        many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[];
    }
}
