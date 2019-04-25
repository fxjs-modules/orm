import Utilities = require("./Utilities");

export function extend (
	Instance: FxOrmInstance.Instance,
	Model: FxOrmModel.Model,
	properties: FxOrmProperty.NormalizedPropertyHash
) {
	for (let k in properties) {
		if (properties[k].lazyload === true) {
			addLazyLoadProperty(properties[k].lazyname || k, Instance, Model, k);
		}
	}
};

function addLazyLoadProperty(
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

	Utilities.addHiddenPropertyToInstance(Instance, propertyAccessors.getAccessor, function <T>(cb?: FxOrmNS.ExecutionCallback<FxOrmNS.Nilable<T>>) {
		process.nextTick(() => {
			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod<FxOrmInstance.Instance | FxOrmInstance.Instance[]>(Instance[propertyAccessors.getSyncAccessor]);
			Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: true, callback: cb })
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

	Utilities.addHiddenPropertyToInstance(Instance, propertyAccessors.removeAccessor, function <T>(cb?: FxOrmNS.ExecutionCallback<FxOrmNS.Nilable<T>>) {
		process.nextTick(() => {
			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod<FxOrmInstance.Instance | FxOrmInstance.Instance[]>(Instance[propertyAccessors.removeSyncAccessor]);
			Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: true, callback: cb })
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

	Utilities.addHiddenPropertyToInstance(Instance, propertyAccessors.setAccessor, function <T>(content: FxOrmInstance.InstanceDataPayload[any], cb?: FxOrmNS.ExecutionCallback<FxOrmNS.Nilable<T>>) {
		process.nextTick(() => {
			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod<FxOrmInstance.Instance | FxOrmInstance.Instance[]>(Instance[propertyAccessors.setSyncAccessor], [content]);

			Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: true, callback: cb })
		});
		
		return this;
	});
}
