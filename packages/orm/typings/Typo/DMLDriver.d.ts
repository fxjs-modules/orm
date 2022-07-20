/// <reference types="@fibjs/types" />
import { FxDbDriverNS, IDbDriver } from "@fxjs/db-driver";
import type { FxOrmSqlDDLSync__Dialect } from "@fxjs/sql-ddl-sync";
import * as Knex from "@fxjs/knex";
import type { FxOrmAssociation } from "./assoc";
import type { FxOrmDb } from "./Db";
import type { FxOrmModel } from "./model";
import type { FxOrmProperty } from "./property";
import type { FxOrmQuery } from "./query";
import type { FxOrmSettings } from "./settings";
import type { FxOrmCommon } from "./_common";
import type { FxSqlQuery, FxSqlQuerySubQuery, FxSqlQuerySql, FxSqlQueryColumns } from '@fxjs/sql-query';
export declare namespace FxOrmDMLDriver {
    type DriverUidType = string;
    interface QueryDataPayload {
        [key: string]: any;
    }
    interface QueriedCountDataPayload {
        c: number;
    }
    interface DMLDriverOptions {
        pool?: boolean;
        debug?: boolean;
        settings: FxOrmSettings.SettingInstance;
    }
    interface DMLDriverConstructor {
        new (config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.Database, opts: FxOrmDMLDriver.DMLDriverOptions): DMLDriver;
        prototype: DMLDriver;
    }
    interface DMLDriver<TConn extends IDbDriver.ISQLConn = IDbDriver.ISQLConn> {
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
        knex: typeof Knex;
        readonly query: FxSqlQuery.Class_Query;
        /**
         * @deprecated
         */
        getQuery: {
            (): FxSqlQuery.Class_Query;
        };
        readonly ddlDialect: FxOrmSqlDDLSync__Dialect.Dialect<IDbDriver.ISQLConn>;
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
            <T = FxOrmDMLDriver.QueryDataPayload[]>(fields: FxSqlQueryColumns.SelectInputArgType[], table: string, conditions: FxSqlQuerySubQuery.SubQueryConditions, opts: DMLDriver_FindOptions, cb?: FxOrmCommon.GenericCallback<T>): T;
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
        execQuerySync: (query: string, opt: Fibjs.AnyObject) => any;
        [ext_key: string]: any;
    }
    type ChainWhereExistsInfoPayload = FxOrmQuery.ChainWhereExistsInfo[];
    interface DMLDriver_FindOptions {
        offset?: number;
        limit?: number;
        order?: FxOrmQuery.OrderNormalizedResult[];
        merge?: FxOrmQuery.ChainFindMergeInfo[];
        exists?: ChainWhereExistsInfoPayload;
    }
    interface DMLDriver_CountOptions {
        merge?: DMLDriver_FindOptions['merge'];
        exists?: DMLDriver_FindOptions['exists'];
    }
    interface DMLDriverConstructor_MySQL extends DMLDriverConstructor {
        (this: DMLDriver_MySQL, config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.Database<Class_MySQL>, opts: FxOrmDMLDriver.DMLDriverOptions): void;
        prototype: DMLDriver_MySQL;
    }
    interface DMLDriver_MySQL extends DMLDriver {
        db: FxOrmDb.Database<Class_MySQL>;
        config: DMLDriver['config'] & {
            timezone: string;
        };
        aggregate_functions: (FxOrmDb.AGGREGATION_METHOD_MYSQL | FxOrmDb.AGGREGATION_METHOD_TUPLE__MYSQL)[];
    }
    interface DMLDriverConstructor_PostgreSQL extends DMLDriverConstructor {
        (this: DMLDriver_PostgreSQL, config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.DatabaseBase_PostgreSQL, opts: FxOrmDMLDriver.DMLDriverOptions): void;
        prototype: DMLDriver_PostgreSQL;
    }
    interface DMLDriver_PostgreSQL extends DMLDriver {
        db: FxOrmDb.DatabaseBase_PostgreSQL;
        config: DMLDriver['config'] & {
            timezone: string;
        };
        aggregate_functions: (FxOrmDb.AGGREGATION_METHOD_POSTGRESQL)[];
    }
    interface DMLDriverConstructor_SQLite extends DMLDriverConstructor {
        (this: DMLDriver_SQLite, config: FxDbDriverNS.DBConnectionConfig, connection: FxOrmDb.DatabaseBase_SQLite, opts: FxOrmDMLDriver.DMLDriverOptions): void;
        prototype: DMLDriver_SQLite;
    }
    interface DMLDriver_SQLite extends DMLDriver {
        db: FxOrmDb.DatabaseBase_SQLite;
        config: DMLDriver['config'] & {
            timezone: string;
        };
        aggregate_functions: (FxOrmDb.AGGREGATION_METHOD_SQLITE)[];
    }
    type DefaultSqlDialect = FxOrmSqlDDLSync__Dialect.Dialect<IDbDriver.ISQLConn>;
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
        properties: FxOrmProperty.NormalizedPropertyHash;
        one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[];
        many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[];
    }
}
