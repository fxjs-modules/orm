import events = require("events");
import type { FxOrmNS } from "./Typo/ORM";
import type { FxOrmCommon } from "./Typo/_common";
import type { FxOrmDMLDriver } from "./Typo/DMLDriver";
import type { FxOrmCoreCallbackNS } from "@fxjs/orm-core";
import type { FxOrmSettings } from "./Typo/settings";
export declare class ORM extends events.EventEmitter implements FxOrmNS.ORM {
    validators: FxOrmNS.ORM['validators'];
    enforce: FxOrmNS.ORM['enforce'];
    settings: FxOrmNS.ORM['settings'];
    driver_name: FxOrmNS.ORM['driver_name'];
    driver: FxOrmNS.ORM['driver'];
    tools: FxOrmNS.ORM['tools'];
    comparators: FxOrmNS.ORM['comparators'];
    models: FxOrmNS.ORM['models'];
    plugins: FxOrmNS.ORM['plugins'];
    customTypes: FxOrmNS.ORM['customTypes'];
    constructor(driver_name: string, driver: FxOrmDMLDriver.DMLDriver, settings: FxOrmSettings.SettingInstance);
    use(...[plugin_const, opts]: Parameters<FxOrmNS.ORM['use']>): this;
    define(...[name, properties, opts]: Parameters<FxOrmNS.ORM['define']>): any;
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
