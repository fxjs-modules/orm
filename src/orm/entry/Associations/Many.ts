import util = require('util');

const _flatten = require('lodash.flatten')

import Hook = require("../Hook");
import Settings = require("../Settings");
import Property = require("../Property");
import ORMError = require("../Error");
import Utilities = require("../Utilities");

export function prepare(db: FibOrmNS.FibORM, Model: FxOrmModel.Model, associations: FxOrmAssociation.InstanceAssociationItem_HasMany[]) {
	Model.hasMany = function () {
		let name: string,
			makeKey: boolean,
			mergeId: FxOrmProperty.NormalizedFieldOptionsHash,
			mergeAssocId: FxOrmProperty.NormalizedFieldOptionsHash;

		let OtherModel: FxOrmModel.Model = Model;
		let props: FxOrmModel.DetailedPropertyDefinitionHash = null;
		let opts: FxOrmAssociation.AssociationDefinitionOptions_HasMany = {};

		for (let i = 0; i < arguments.length; i++) {
			switch (typeof arguments[i]) {
				case 'string':
					name = arguments[i];
					break;
				case 'function':
					OtherModel = arguments[i];
					break;
				case 'object':
					if (props === null) {
						props = arguments[i];
					} else {
						opts = arguments[i];
					}
					break;
			}
		}

		if (props === null) {
			props = {};
		} else {
			for (var k in props) {
				props[k] = Property.normalize({
					prop: props[k], name: k, customTypes: db.customTypes, settings: Model.settings
				});
			}
		}

		makeKey = opts.key || Settings.defaults().hasMany.key;

		mergeId = Utilities.convertPropToJoinKeyProp(
			Utilities.wrapFieldObject({
				field: opts.mergeId, model: Model, altName: Model.table
			}) ||
			Utilities.formatField(Model, Model.table, true, opts.reversed),
			{ makeKey: makeKey, required: true }
		);

		mergeAssocId = Utilities.convertPropToJoinKeyProp(
			Utilities.wrapFieldObject({
				field: opts.mergeAssocId, model: OtherModel, altName: name
			}) ||
			Utilities.formatField(OtherModel, name, true, opts.reversed),
			{ makeKey: makeKey, required: true }
		)

		var assocName = opts.name || ucfirst(name);
		var assocTemplateName = opts.accessor || assocName;
		const fieldhash = Utilities.wrapFieldObject({ field: opts.field, model: OtherModel, altName: Model.table }) || Utilities.formatField(Model, name, true, opts.reversed)
		var association: FxOrmAssociation.InstanceAssociationItem_HasMany = {
			name: name,
			model: OtherModel || Model,
			props: props,
			hooks: opts.hooks || {},
			autoFetch: opts.autoFetch || false,
			autoFetchLimit: opts.autoFetchLimit || 2,
			// I'm not sure the next key is used..
			field: fieldhash,
			mergeTable: opts.mergeTable || (Model.table + "_" + name),
			mergeId: mergeId,
			mergeAssocId: mergeAssocId,
			getAccessor: opts.getAccessor || ("get" + assocTemplateName),
			setAccessor: opts.setAccessor || ("set" + assocTemplateName),
			hasAccessor: opts.hasAccessor || ("has" + assocTemplateName),
			delAccessor: opts.delAccessor || ("remove" + assocTemplateName),
			addAccessor: opts.addAccessor || ("add" + assocTemplateName),
		};
		associations.push(association);

		if (opts.reverse) {
			OtherModel.hasMany(opts.reverse, Model, association.props, {
				reversed: true,
				association: opts.reverseAssociation,
				mergeTable: association.mergeTable,
				mergeId: association.mergeAssocId,
				mergeAssocId: association.mergeId,
				field: fieldhash,
				autoFetch: association.autoFetch,
				autoFetchLimit: association.autoFetchLimit
			});
		}
		return this;
	};
};

export function extend(
	Model: FxOrmModel.Model,
	Instance: FxOrmInstance.Instance,
	Driver: FxOrmPatch.PatchedDMLDriver,
	associations: FxOrmAssociation.InstanceAssociationItem_HasMany[],
	opts: FxOrmAssociation.AssociationDefinitionOptions_HasMany,
	createInstance: Function
) {
	for (var i = 0; i < associations.length; i++) {
		extendInstance(Model, Instance, Driver, associations[i], opts, createInstance);
	}
};

export function autoFetch(
	Instance: FxOrmInstance.Instance,
	associations: FxOrmAssociation.InstanceAssociationItem_HasMany[],
	opts: FxOrmAssociation.AssociationDefinitionOptions_HasMany,
	cb: FxOrmNS.GenericCallback<void>
) {
	if (associations.length === 0) {
		return cb(null);
	}

	var pending = associations.length;
	var autoFetchDone = function autoFetchDone() {
		pending -= 1;

		if (pending === 0) {
			return cb(null);
		}
	};

	for (var i = 0; i < associations.length; i++) {
		autoFetchInstance(Instance, associations[i], opts, autoFetchDone);
	}
};

function extendInstance(
	Model: FxOrmModel.Model,
	Instance: FxOrmInstance.Instance,
	Driver: FxOrmPatch.PatchedDMLDriver,
	association: FxOrmAssociation.InstanceAssociationItem_HasMany,
	opts: FxOrmAssociation.AssociationDefinitionOptions_HasMany,
	createInstance: Function
) {
	if (Model.settings.get("instance.cascadeRemove")) {
		Instance.on("beforeRemove", function () {
			Instance[association.delAccessor]();
		});
	}

	function adjustForMapsTo(options) {
		// Loop through the (cloned) association model id fields ... some of them may've been mapped to different
		// names in the actual database - if so update to the mapped database column name
		for (var i = 0; i < options.__merge.to.field.length; i++) {
			var idProp = association.model.properties[options.__merge.to.field[i]];
			if (idProp && idProp.mapsTo) {
				options.__merge.to.field[i] = idProp.mapsTo;
			}
		}
	}

	Object.defineProperty(Instance, association.hasAccessor, {
		value: function (...Instances: FxOrmInstance.Instance[]) {
			// var Instances = Array.prototype.slice.apply(arguments);
			var cb: FxOrmNS.GenericCallback<boolean> = Instances.pop() as any;
			var conditions = {}, options: FxOrmAssociation.ModelAssociationMethod__FindOptions = {} as FxOrmAssociation.ModelAssociationMethod__FindOptions;

			if (Instances.length) {
				if (Array.isArray(Instances[0])) {
					Instances = Instances[0] as any;
				}
			}
			if (Driver.hasMany) {
				return Driver.hasMany(Model, association)
					.has(Instance, Instances, conditions, cb);
			}

			options.autoFetchLimit = 0;
			options.__merge = {
				from: { table: association.mergeTable, field: Object.keys(association.mergeAssocId) },
				to: { table: association.model.table, field: association.model.id.slice(0) },   // clone model id
				where: [association.mergeTable, {}],
				table: association.model.table
			};

			adjustForMapsTo(options);

			options.extra = association.props;
			options.extra_info = {
				table: association.mergeTable,
				id: Utilities.values(Instance, Model.id),
				id_prop: Object.keys(association.mergeId),
				assoc_prop: Object.keys(association.mergeAssocId)
			};

			Utilities.populateConditions(Model, Object.keys(association.mergeId), Instance, options.__merge.where[1]);

			for (var i = 0; i < Instances.length; i++) {
				Utilities.populateConditions(association.model, Object.keys(association.mergeAssocId), Instances[i], options.__merge.where[1], false);
			}

			association.model.find(conditions, options, function (err, foundItems) {
				if (err) return cb(err);
				if (util.isEmpty(Instances)) return cb(null, false);

				var mapKeysToString = function (item) {
					return util.map(association.model.keys, function (k) {
						return item[k];
					}).join(',')
				}

				var foundItemsIDs = Array.from( new Set ( foundItems.map(mapKeysToString) ) );
				var InstancesIDs = Array.from( new Set ( Instances.map(mapKeysToString) ) );

				var sameLength = foundItemsIDs.length == InstancesIDs.length;
				var sameContents = sameLength && util.isEmpty(util.difference(foundItemsIDs, InstancesIDs));

				return cb(null, sameContents);
			});
			return this;
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(Instance, association.getAccessor, {
		value: function () {
			var options: FxOrmAssociation.ModelAssociationMethod__GetOptions = {} as FxOrmAssociation.ModelAssociationMethod__GetOptions;
			var conditions = null;
			var order = null;
			var cb = null;

			for (var i = 0; i < arguments.length; i++) {
				switch (typeof arguments[i]) {
					case "function":
						cb = arguments[i];
						break;
					case "object":
						if (Array.isArray(arguments[i])) {
							order = arguments[i];
							order[0] = [association.model.table, order[0]];
						} else {
							if (conditions === null) {
								conditions = arguments[i];
							} else {
								options = arguments[i];
							}
						}
						break;
					case "string":
						if (arguments[i][0] == "-") {
							order = [[association.model.table, arguments[i].substr(1)], "Z"];
						} else {
							order = [[association.model.table, arguments[i]]];
						}
						break;
					case "number":
						options.limit = arguments[i];
						break;
				}
			}

			if (order !== null) {
				options.order = order;
			}

			if (conditions === null) {
				conditions = {};
			}

			if (Driver.hasMany) {
				return Driver.hasMany(Model, association).get(Instance, conditions, options, createInstance, cb);
			}

			options.__merge = {
				from: { table: association.mergeTable, field: Object.keys(association.mergeAssocId) },
				to: { table: association.model.table, field: association.model.id.slice(0) }, // clone model id
				where: [association.mergeTable, {}],
				table: association.model.table
			};

			adjustForMapsTo(options);

			options.extra = association.props;
			options.extra_info = {
				table: association.mergeTable,
				id: Utilities.values(Instance, Model.id),
				id_prop: Object.keys(association.mergeId),
				assoc_prop: Object.keys(association.mergeAssocId)
			};

			Utilities.populateConditions(Model, Object.keys(association.mergeId), Instance, options.__merge.where[1]);

			if (cb === null) {
				return association.model.find(conditions, options);
			}

			association.model.find(conditions, options, cb);

			return this;
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(Instance, association.setAccessor, {
		value: function () {
			var items = _flatten(arguments);
			var cb = util.last(items) instanceof Function ? items.pop() : noOperation;

			Instance[association.delAccessor](function (err) {
				if (err) return cb(err);

				if (items.length) {
					Instance[association.addAccessor](items, cb);
				} else {
					cb(null);
				}
			});

			return this;
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(Instance, association.delAccessor, {
		value: function (...args: any[]) {
			var Associations: FxOrmAssociation.AssociationDefinitionOptions_HasMany[] = [];
			var cb = noOperation;

			for (var i = 0; i < args.length; i++) {
				switch (typeof args[i]) {
					case "function":
						cb = args[i];
						break;
					case "object":
						if (Array.isArray(args[i])) {
							Associations = Associations.concat(args[i]);
						} else if (args[i].isInstance) {
							Associations.push(args[i]);
						}
						break;
				}
			}
			var conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};
			var run = function () {
				if (Driver.hasMany) {
					return Driver.hasMany(Model, association).del(Instance, Associations, cb);
				}

				if (Associations.length === 0) {
					return Driver.remove(association.mergeTable, conditions, cb);
				}

				for (var i = 0; i < Associations.length; i++) {
					Utilities.populateConditions(association.model, Object.keys(association.mergeAssocId), Associations[i], conditions, false);
				}

				Driver.remove(association.mergeTable, conditions, cb);
			};

			Utilities.populateConditions(Model, Object.keys(association.mergeId), Instance, conditions);

			if (this.saved()) {
				run();
			} else {
				this.save(function (err) {
					if (err) {
						return cb(err);
					}

					return run();
				});
			}
			return this;
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(Instance, association.addAccessor, {
		value: function () {
			var Associations: FxOrmAssociation.InstanceAssociatedInstance[] = [];
			var opts = {};
			var cb = noOperation;

			for (var i = 0; i < arguments.length; i++) {
				switch (typeof arguments[i]) {
					case "function":
						cb = arguments[i];
						break;
					case "object":
						if (Array.isArray(arguments[i])) {
							Associations = Associations.concat(arguments[i]);
						} else if (arguments[i].isInstance) {
							Associations.push(arguments[i]);
						} else {
							opts = arguments[i];
						}
						break;
				}
			}

			if (Associations.length === 0) {
				throw new ORMError("No associations defined", 'PARAM_MISMATCH', { model: Model.name });
			}

			var run = function () {
				const savedAssociations: FxOrmAssociation.InstanceAssociatedInstance[] = [];
				var saveNextAssociation = function () {
					if (Associations.length === 0) {
						return cb(null, savedAssociations);
					}

					var Association = Associations.pop();
					var saveAssociation = function (err: Error) {
						if (err) {
							return cb(err);
						}

						Association.save(function (err: Error) {
							if (err) {
								return cb(err);
							}

							var data = {};

							for (var k in opts) {
								if (k in association.props && Driver.propertyToValue) {
									data[k] = Driver.propertyToValue(opts[k], association.props[k]);
								} else {
									data[k] = opts[k];
								}
							}

							if (Driver.hasMany) {
								return Driver.hasMany(Model, association).add(Instance, Association, data, function (err: Error) {
									if (err) {
										return cb(err);
									}

									savedAssociations.push(Association);

									return saveNextAssociation();
								});
							}

							Utilities.populateConditions(Model, Object.keys(association.mergeId), Instance, data);
							Utilities.populateConditions(association.model, Object.keys(association.mergeAssocId), Association, data);

							Driver.insert(association.mergeTable, data, null, function (err) {
								if (err) {
									return cb(err);
								}

								savedAssociations.push(Association);

								return saveNextAssociation();
							});
						});
					};

					if (Object.keys(association.props).length) {
						Hook.wait(Association, association.hooks.beforeSave, saveAssociation, opts);
					} else {
						Hook.wait(Association, association.hooks.beforeSave, saveAssociation);
					}
				};

				return saveNextAssociation();
			};

			if (this.saved()) {
				run();
			} else {
				this.save(function (err: Error) {
					if (err) {
						return cb(err);
					}

					return run();
				});
			}

			return this;
		},
		enumerable: false,
		writable: true
	});

	Object.defineProperty(Instance, association.name, {
		get: function () {
			return Instance.__opts.associations[association.name].value;
		},
		set: function (val) {
			Instance.__opts.associations[association.name].changed = true;
			Instance.__opts.associations[association.name].value = val;
		},
		enumerable: true
	});
}

function autoFetchInstance(
	Instance: FxOrmInstance.Instance,
	association: FxOrmAssociation.InstanceAssociationItem_HasMany,
	opts: FxOrmAssociation.AssociationDefinitionOptions_HasMany,
	cb: FxOrmNS.GenericCallback<void>
) {
	if (!Instance.saved()) {
		return cb(null);
	}

	if (!opts.hasOwnProperty("autoFetchLimit") || typeof opts.autoFetchLimit == "undefined") {
		opts.autoFetchLimit = association.autoFetchLimit;
	}

	if (opts.autoFetchLimit === 0 || (!opts.autoFetch && !association.autoFetch)) {
		return cb(null);
	}

	Instance[association.getAccessor](
		{},
		{ autoFetchLimit: opts.autoFetchLimit - 1 },
		function (err: Error, Assoc: FxOrmAssociation.InstanceAssociatedInstance) {
			if (!err) {
				// Set this way to prevent setting 'changed' status
				Instance.__opts.associations[association.name].value = Assoc;
			}

			return cb(null);
		}
	);
}

function ucfirst(text: string) {
	return text[0].toUpperCase() + text.substr(1).replace(/_([a-z])/, function (m, l) {
		return l.toUpperCase();
	});
}

function noOperation(...args: any[]) { }
