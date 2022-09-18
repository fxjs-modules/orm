/// <reference types="@fibjs/enforce" />
import events = require("events");
import { FxDbDriverNS, IDbDriver } from "@fxjs/db-driver";
import SqlQuery = require("@fxjs/sql-query");
import { addAdapter } from "./Adapters";
import type { FxOrmNS } from "./Typo/ORM";
import type { FxOrmDb } from "./Typo/Db";
import type { FxOrmError } from "./Typo/Error";
import type { FxOrmCommon } from "./Typo/_common";
import type { FxOrmDMLDriver } from "./Typo/DMLDriver";
import type { FxOrmCoreCallbackNS } from "@fxjs/orm-core";
import type { FxOrmModel } from "./Typo/model";
import type { FxOrmSettings } from "./Typo/settings";
import * as Helpers from "./Helpers";
/**
 * @deprecated
 */
import * as validators from "./Validators";
import * as Settings from "./Settings";
import * as singleton from "./Singleton";
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
export * as Property from "./Property";
export declare function use(connection: FxOrmDb.Database, proto: string, opts: FxOrmNS.IUseOptions, cb: (err: Error, db?: FxOrmNS.ORM) => void): any;
export declare function connectSync(opts?: string | FxDbDriverNS.DBConnectionConfig): FxOrmNS.ORMLike;
export declare function connect<T extends IDbDriver.ISQLConn = any>(uri?: string | FxDbDriverNS.DBConnectionConfig, cb?: FxOrmCoreCallbackNS.ExecutionCallback<IDbDriver<T>>): FxOrmNS.ORMLike;
export declare class ORM extends events.EventEmitter implements FxOrmNS.ORM {
    validators: FxOrmNS.ORM['validators'];
    enforce: FxOrmNS.ORM['enforce'];
    settings: FxOrmNS.ORM['settings'];
    driver_name: FxOrmNS.ORM['driver_name'];
    driver: FxOrmNS.ORM['driver'];
    tools: FxOrmNS.ORM['tools'];
    models: FxOrmNS.ORM['models'];
    plugins: FxOrmNS.ORM['plugins'];
    customTypes: FxOrmNS.ORM['customTypes'];
    constructor(driver_name: string, driver: FxOrmDMLDriver.DMLDriver, settings: FxOrmSettings.SettingInstance);
    use(...[plugin_const, opts]: Parameters<FxOrmNS.ORM['use']>): this;
    define(...[name, properties, opts]: Parameters<FxOrmNS.ORM['define']>): FxOrmModel.Model;
    defineType(...[name, opts]: Parameters<FxOrmNS.ORM['defineType']>): this;
    pingSync(): void;
    ping(...[cb]: Parameters<FxOrmNS.ORM['ping']>): this;
    closeSync(): void;
    close(...[cb]: Parameters<FxOrmNS.ORM['close']>): this;
    load(): any;
    syncSync(): void;
    sync(...[cb]: Parameters<FxOrmNS.ORM['sync']>): this;
    dropSync(): void;
    drop(...[cb]: Parameters<FxOrmNS.ORM['drop']>): this;
    queryParamCastserial(...chains: any[]): {
        get: (cb: FxOrmCommon.GenericCallback<any[]>) => any;
    };
    begin(): void;
    commit(): void;
    rollback(): void;
    trans<T>(func: FxOrmCoreCallbackNS.ExecutionCallback<T>): boolean;
}
export declare type ORMInstance = FxOrmNS.ORM;
export declare const ErrorCodes: FxOrmError.PredefineErrorCodes;
export { addAdapter, Helpers, validators, Settings, singleton, };
export declare function definePlugin<TOpts extends object>(definition: FxOrmNS.PluginConstructFn<TOpts>): FxOrmNS.PluginConstructFn<TOpts, FxOrmNS.ORM>;
