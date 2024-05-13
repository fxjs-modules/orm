import { FxDbDriverNS } from './Typo';
export declare function driverUUid(): string;
export declare function filterDriverType(protocol: any): FxDbDriverNS.DriverType;
export declare function forceInteger(input: any, fallback: number): number;
export declare function castQueryStringToBoolean(input: any): boolean;
export declare function ensureSuffix(str?: string, suffix?: string): string;
export declare function parseConnectionString(input: any): FxDbDriverNS.DBConnectionConfig;
export declare function parsePoolConfig(input: boolean | FxDbDriverNS.ConnectionPoolOptions | any): FxDbDriverNS.ConnectionPoolOptions;
export declare function mountPoolToDriver<CONN_TYPE = any>(driver: any, poolSetting?: any): void;
export declare function arraify<T = any>(item: T | T[]): T[];
export declare function logDebugSQL(dbtype: string, sql: string, is_sync?: boolean): void;
export declare function detectWindowsCodePoints(): {
    isWindows: boolean;
    codepoints: string;
};
export declare function filterPSQLSearchPath(input_sp?: string | string[]): string;
