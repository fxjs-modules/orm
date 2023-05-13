import { FxSqlQueryColumns } from "@fxjs/sql-query";
import { FxOrmDMLDriver } from "../../Typo/DMLDriver";
import { FxOrmInstance } from "../../Typo/instance";
import { FxOrmProperty } from "../../Typo/property";

export function safeParseJson<T extends object>(input: string | T, fallbackValue: any = {}): T {
	if (typeof input !== 'string') {
	  return input;
	}
  
	try {
	  return JSON.parse(input);
	} catch (e) {
	  return fallbackValue;
	}
  }

export function normalizePropertyValueOnFound (
	data: FxOrmInstance.InstanceDataPayload, property: FxOrmProperty.NormalizedProperty, ctx: {
		driver: FxOrmDMLDriver.DMLDriver,
	}
) {
	if (ctx.driver.db.type !== 'mysql') return ;

	if (property.type === 'point') {
		
	}
	return data;
}

export function pickPointTypeFields(
	dmlDriver: FxOrmDMLDriver.DMLDriver,
	modelProperties: Record<string, FxOrmProperty.NormalizedProperty>
): string[] {
	if (dmlDriver.db.type !== 'mysql') return [];

	return Object.values(modelProperties)
		.filter(p => p.type === 'point')
		.map(p => p.mapsTo);
}

export function filterFieldsOnFind(ctx: {
	dmlDriver: FxOrmDMLDriver.DMLDriver,
	pointPropertiesMapsTo: string[],
}, ret: {
	selectFields: FxSqlQueryColumns.SelectInputArgType[],
}) {
	if (ctx.dmlDriver.db.type !== 'mysql') return ;

	ctx.pointPropertiesMapsTo.forEach(mapsTo => {
		const idx = ret.selectFields.indexOf(mapsTo);
		if (idx === -1) return ;
		
		ret.selectFields[idx] = {
			sql: `CONCAT('{','\"x\":', ST_X(${mapsTo}), ',','\"y\":', ST_Y(${mapsTo}),'}')`,
			as: mapsTo,
		}
	});
}