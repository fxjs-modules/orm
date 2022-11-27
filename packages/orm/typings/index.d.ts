/// <reference types="@fibjs/enforce" />
import { FxDbDriverNS, IDbDriver } from "@fxjs/db-driver";
import SqlQuery = require("@fxjs/sql-query");
import { FxOrmCoreCallbackNS } from "@fxjs/orm-core";
import { FxOrmDb } from "./Typo/Db";
import { FxOrmNS } from "./Typo/ORM";
import { FxOrmError } from "./Typo/Error";
import * as Settings from "./Settings";
import { addAdapter } from "./Adapters";
import * as validators from "./Validators";
import * as Helpers from "./Helpers";
import * as singleton from "./Singleton";
import { ORM } from './ORM';
export * as Property from "./Property";
export declare function connectSync(opts?: string | FxDbDriverNS.DBConnectionConfig): ORM;
export declare function connect<T extends IDbDriver.ISQLConn = any>(uri?: string | FxDbDriverNS.DBConnectionConfig, cb?: FxOrmCoreCallbackNS.ExecutionCallback<IDbDriver<T>>): ORM;
export { ORM } from './ORM';
/**
 * @description just re-export from @fibjs/enforce for convenience, you can also use `orm.enforce` for orm instances
 */
export declare const enforce: FibjsEnforce.ExportModule;
export declare const settings: import("./Typo/settings").FxOrmSettings.SettingInstance;
export declare function use(connection: FxOrmDb.Database, proto: string, opts: FxOrmNS.IUseOptions, cb: (err: Error, db?: FxOrmNS.ORM) => void): any;
export { addAdapter, Helpers, validators, Settings, singleton, };
export declare const ErrorCodes: FxOrmError.PredefineErrorCodes;
export declare function definePlugin<TOpts extends object>(definition: FxOrmNS.PluginConstructFn<TOpts>): FxOrmNS.PluginConstructFn<TOpts, FxOrmNS.ORM>;
export declare function defineModel<T = any>(definition: (db: FxOrmNS.ORM) => T): typeof definition;
export type { FxOrmNS } from './Typo/ORM';
export type { FxOrmModel } from './Typo/model';
export type { FxOrmInstance } from './Typo/instance';
export type { FxOrmAssociation } from './Typo/assoc';
export type { FxOrmProperty } from './Typo/property';
export type { FxOrmSettings } from './Typo/settings';
export type { FxOrmValidators } from './Typo/Validators';
export type { FxOrmError } from './Typo/Error';
export type { FxOrmQuery } from './Typo/query';
export type { FxOrmDb } from './Typo/Db';
export type { FxOrmDMLDriver } from './Typo/DMLDriver';
export type { FxOrmHook } from './Typo/hook';
/**
 * @deprecated use FxOrmNS.ORM directly
 */
export declare type ORMInstance = FxOrmNS.ORM;
/** @deprecated use require('@fxjs/sql-query').Text instead */
export declare const Text: SqlQuery.FxSqlQuery.TypedQueryObjectWrapper<"text", any>;
/** @deprecated use require('@fxjs/sql-query').comparators.between instead */
export declare const between: SqlQuery.FxSqlQueryComparatorFunction.between;
/** @deprecated use require('@fxjs/sql-query').comparators.not_between instead */
export declare const not_between: SqlQuery.FxSqlQueryComparatorFunction.not_between;
/** @deprecated use require('@fxjs/sql-query').comparators.like instead */
export declare const like: SqlQuery.FxSqlQueryComparatorFunction.like;
/** @deprecated use require('@fxjs/sql-query').comparators.not_like instead */
export declare const not_like: SqlQuery.FxSqlQueryComparatorFunction.not_like;
/** @deprecated use require('@fxjs/sql-query').comparators.eq instead */
export declare const eq: SqlQuery.FxSqlQueryComparatorFunction.eq;
/** @deprecated use require('@fxjs/sql-query').comparators.ne instead */
export declare const ne: SqlQuery.FxSqlQueryComparatorFunction.ne;
/** @deprecated use require('@fxjs/sql-query').comparators.gt instead */
export declare const gt: SqlQuery.FxSqlQueryComparatorFunction.gt;
/** @deprecated use require('@fxjs/sql-query').comparators.gte instead */
export declare const gte: SqlQuery.FxSqlQueryComparatorFunction.gte;
/** @deprecated use require('@fxjs/sql-query').comparators.lt instead */
export declare const lt: SqlQuery.FxSqlQueryComparatorFunction.lt;
/** @deprecated use require('@fxjs/sql-query').comparators.lte instead */
export declare const lte: SqlQuery.FxSqlQueryComparatorFunction.lte;
/** @deprecated use require('@fxjs/sql-query').comparators.not_in instead */
export declare const not_in: SqlQuery.FxSqlQueryComparatorFunction.not_in;
