import Utilities = require("./Utilities");

import type { FxOrmInstance } from "./Typo/instance";
import type { FxOrmModel } from "./Typo/model";
import type { FxOrmProperty } from "./Typo/property";
import type { FxOrmCommon } from "./Typo/_common";

import type {
	FxSqlQuerySubQuery
} from '@fxjs/sql-query';

export function extend (
	Instance: FxOrmInstance.Instance,
	Model: FxOrmModel.Model,
	properties: Record<string, FxOrmProperty.NormalizedProperty>
) {
	for (let k in properties) {
		if (properties[k].lazyload === true) {
			addLazyLoadAccesstor(properties[k].lazyname || k, Instance, Model, k);
		}
	}
};

function addLazyLoadAccesstor(
	name: string,
	Instance: FxOrmInstance.Instance,
	Model: FxOrmModel.Model,
	property: string
) {
	const capitalizedPropertyName = Utilities.formatNameFor("field:lazyload", name);

	const propertyAccessors = {
		getSyncAccessor: "get" + capitalizedPropertyName + "Sync",
		getAccessor: "get" + capitalizedPropertyName,
		
		setSyncAccessor: "set" + capitalizedPropertyName + "Sync",
		setAccessor: "set" + capitalizedPropertyName,

		removeSyncAccessor: "remove" + capitalizedPropertyName + "Sync",
		removeAccessor: "remove" + capitalizedPropertyName + "",
	}

	Utilities.addHiddenPropertyToInstance(Instance, propertyAccessors.getSyncAccessor, function <T>(): T {
		var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
		conditions[Model.id + ''] = Instance[Model.id + ''];

		const item: FxOrmInstance.Instance = Model
			.find(conditions, { identityCache: false })
			.only(Model.id.concat(property))
			.firstSync();

		return item ? item[property] : null
	});

	Utilities.addHiddenPropertyToInstance(Instance, propertyAccessors.getAccessor, function <T>(cb?: FxOrmCommon.ExecutionCallback<FxOrmCommon.Nilable<T>>) {
		process.nextTick(() => {
			const syncResponse = Utilities.catchBlocking<FxOrmInstance.Instance | FxOrmInstance.Instance[]>(Instance[propertyAccessors.getSyncAccessor]);
			Utilities.takeAwayResult(syncResponse, { no_throw: true, callback: cb })
		});
		
		return this;
	});

	Utilities.addHiddenPropertyToInstance(Instance, propertyAccessors.removeSyncAccessor, function () {
		var conditions: {[k: string]: any} = {};
		conditions[Model.id + ''] = Instance[Model.id + ''];

		const item: FxOrmInstance.Instance = Model
			.find(conditions, { identityCache: false })
			.only(Model.id.concat(property))
			.firstSync();

		if (!item)
			return null;

		item[property] = null;
		
		return item.saveSync();
	});

	Utilities.addHiddenPropertyToInstance(Instance, propertyAccessors.removeAccessor, function <T>(cb?: FxOrmCommon.ExecutionCallback<FxOrmCommon.Nilable<T>>) {
		process.nextTick(() => {
			const syncResponse = Utilities.catchBlocking<FxOrmInstance.Instance | FxOrmInstance.Instance[]>(Instance[propertyAccessors.removeSyncAccessor]);
			Utilities.takeAwayResult(syncResponse, { no_throw: true, callback: cb })
		});
		
		return this;
	});

	Utilities.addHiddenPropertyToInstance(Instance, propertyAccessors.setSyncAccessor, function (data: FxOrmInstance.InstanceDataPayload) {
		var conditions: {[k: string]: any} = {};
		conditions[Model.id + ''] = Instance[Model.id + ''];

		const item: FxOrmInstance.Instance = Model
			.find(conditions, { identityCache: false })
			.firstSync();

		if (!item)
			return null;

		item[property] = data;

		return item.saveSync();
	});

	Utilities.addHiddenPropertyToInstance(Instance, propertyAccessors.setAccessor, function <T>(content: FxOrmInstance.InstanceDataPayload[any], cb?: FxOrmCommon.ExecutionCallback<FxOrmCommon.Nilable<T>>) {
		process.nextTick(() => {
			const syncResponse = Utilities.catchBlocking<FxOrmInstance.Instance | FxOrmInstance.Instance[]>(Instance[propertyAccessors.setSyncAccessor], [content]);

			Utilities.takeAwayResult(syncResponse, { no_throw: true, callback: cb })
		});
		
		return this;
	});
}
