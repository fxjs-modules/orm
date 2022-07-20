/// <reference types="@fibjs/enforce" />
import { FxDbDriverNS, IDbDriver } from "@fxjs/db-driver";
import SqlQuery = require("@fxjs/sql-query");
import type { FxOrmNS } from "./Typo/ORM";
import type { FxOrmDb } from "./Typo/Db";
import type { FxOrmError } from "./Typo/Error";
import type { FxOrmDMLDriver } from "./Typo/DMLDriver";
import type { FxOrmCoreCallbackNS } from "@fxjs/orm-core";
import type { FxOrmSettings } from "./Typo/settings";
export import Helpers = require("./Helpers");
/**
 * @deprecated
 */
export import validators = require("./Validators");
export import Settings = require("./Settings");
export import singleton = require("./Singleton");
export declare const Text: SqlQuery.FxSqlQuery.TypedQueryObjectWrapper<"text", any>;
export declare const between: SqlQuery.FxSqlQueryComparatorFunction.between;
export declare const not_between: SqlQuery.FxSqlQueryComparatorFunction.not_between;
export declare const like: SqlQuery.FxSqlQueryComparatorFunction.like;
export declare const not_like: SqlQuery.FxSqlQueryComparatorFunction.not_like;
export declare const eq: SqlQuery.FxSqlQueryComparatorFunction.eq;
export declare const ne: SqlQuery.FxSqlQueryComparatorFunction.ne;
export declare const gt: SqlQuery.FxSqlQueryComparatorFunction.gt;
export declare const gte: SqlQuery.FxSqlQueryComparatorFunction.gte;
export declare const lt: SqlQuery.FxSqlQueryComparatorFunction.lt;
export declare const lte: SqlQuery.FxSqlQueryComparatorFunction.lte;
export declare const not_in: SqlQuery.FxSqlQueryComparatorFunction.not_in;
export declare const enforce: FibjsEnforce.ExportModule;
export declare const settings: FxOrmSettings.SettingInstance;
export import Property = require("./Property");
export declare function use(connection: FxOrmDb.Database, proto: string, opts: FxOrmNS.IUseOptions, cb: (err: Error, db?: FxOrmNS.ORM) => void): any;
export declare function connectSync(opts?: string | FxDbDriverNS.DBConnectionConfig): FxOrmNS.ORMLike;
export declare function connect<T extends IDbDriver.ISQLConn = any>(uri?: string | FxDbDriverNS.DBConnectionConfig, cb?: FxOrmCoreCallbackNS.ExecutionCallback<IDbDriver<T>>): FxOrmNS.ORMLike;
export declare const ORM: FxOrmNS.ORMConstructor;
export declare type ORMInstance = FxOrmNS.ORM;
export declare const ErrorCodes: FxOrmError.PredefineErrorCodes;
export declare const addAdapter: (name: string, constructor: FxOrmDMLDriver.DMLDriverConstructor) => void;
