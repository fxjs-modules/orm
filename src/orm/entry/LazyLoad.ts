export function extend (
	Instance: FxOrmInstance.Instance,
	Model: FxOrmModel.Model,
	properties: FxOrmProperty.NormalizedPropertyHash
) {
	for (var k in properties) {
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
	var method = ucfirst(name);

	Object.defineProperty(Instance, "get" + method, {
		value: function <T>(cb: FxOrmNS.ExecutionCallback<FxOrmNS.Nilable<T>>) {
			var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
			conditions[Model.id + ''] = Instance[Model.id + ''];

			Model
				.find(conditions, { identityCache: false })
				.only(Model.id.concat(property))
				.first(function (err: Error, item: FxOrmInstance.Instance) {
					return cb(err, item ? item[property] : null);
				});

			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, "remove" + method, {
		value: function (cb: FxOrmNS.ExecutionCallback<FxOrmNS.Nilable<void>>) {
			var conditions = {};
			conditions[Model.id + ''] = Instance[Model.id + ''];

			Model
				.find(conditions, { identityCache: false })
				.only(Model.id.concat(property))
				.first(function (err: Error, item: FxOrmInstance.Instance) {
					if (err) {
						return cb(err);
					}
					if (!item) {
						return cb(null);
					}

					item[property] = null;

					return item.save(cb);
				});

			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, "set" + method, {
		value: function (data: FxOrmInstance.InstanceDataPayload, cb: FxOrmNS.ExecutionCallback<void>) {
			var conditions = {};
			conditions[Model.id + ''] = Instance[Model.id + ''];

			Model
				.find(conditions, { identityCache: false })
				.first(function (err: Error, item: FxOrmInstance.Instance) {
					if (err) {
						return cb(err);
					}
					if (!item) {
						return cb(null);
					}

					item[property] = data;

					return item.save(cb);
				});

			return this;
		},
		enumerable: false
	});
}

function ucfirst(text: string) {
	return text[0].toUpperCase() + text.substr(1).toLowerCase();
}
