import { FxSqlQueryColumns } from "@fxjs/sql-query";
import { FxOrmDMLDriver } from "../../Typo/DMLDriver";
import { FxOrmInstance } from "../../Typo/instance";
import { FxOrmProperty } from "../../Typo/property";
export declare function safeParseJson<T extends object>(input: string | T, fallbackValue?: any): T;
export declare function normalizePropertyValueOnFound(data: FxOrmInstance.InstanceDataPayload, property: FxOrmProperty.NormalizedProperty, ctx: {
    driver: FxOrmDMLDriver.DMLDriver;
}): FxOrmInstance.InstanceDataPayload;
export declare function pickPointTypeFields(dmlDriver: FxOrmDMLDriver.DMLDriver, modelProperties: Record<string, FxOrmProperty.NormalizedProperty>): string[];
export declare function filterFieldsOnFind(ctx: {
    dmlDriver: FxOrmDMLDriver.DMLDriver;
    pointPropertiesMapsTo: string[];
}, ret: {
    selectFields: FxSqlQueryColumns.SelectInputArgType[];
}): void;
