import type { FxSqlQueryChainBuilder, FxSqlQuerySubQuery } from "@fxjs/sql-query";
import type { FxOrmDMLDriver } from "../../Typo/DMLDriver";
export declare function buildBaseConditionsToQuery(this: FxOrmDMLDriver.DMLDriver, q: FxSqlQueryChainBuilder.ChainBuilder__Select, base_table: string, base_conditions: FxSqlQuerySubQuery.SubQueryConditions): FxSqlQueryChainBuilder.ChainBuilder__Select;
export declare function buildMergeToQuery(this: FxOrmDMLDriver.DMLDriver, q: FxSqlQueryChainBuilder.ChainBuilder__Select, merges: FxOrmDMLDriver.DMLDriver_FindOptions['merge']): FxSqlQueryChainBuilder.ChainBuilder__Select;
export declare function buildExistsToQuery(this: FxOrmDMLDriver.DMLDriver, q: FxSqlQueryChainBuilder.ChainBuilder__Select, table_alias: string, exists: FxOrmDMLDriver.DMLDriver_FindOptions['exists']): void;
export declare function buildOrderToQuery(this: FxOrmDMLDriver.DMLDriver, q: FxSqlQueryChainBuilder.ChainBuilder__Select, order: FxOrmDMLDriver.DMLDriver_FindOptions['order']): void;
export declare function getKnexInstance(driver: FxOrmDMLDriver.DMLDriver): void;
export declare function buildMergeToKnex(this: FxOrmDMLDriver.DMLDriver, knex: import("@fxjs/knex").Knex, merges: FxOrmDMLDriver.DMLDriver_FindOptions['merge'], conditions: FxSqlQuerySubQuery.SubQueryConditions): void;
export declare function setCouldPool(driver: FxOrmDMLDriver.DMLDriver): void;
