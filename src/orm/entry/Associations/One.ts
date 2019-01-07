import util = require('util')

import Utilities = require("../Utilities");
import ORMError = require("../Error");
const Accessors = {
	"get": "get",
	"set": "set",
	"has": "has",
	"del": "remove"
};

export function prepare (
	Model: FxOrmModel.Model, associations: FxOrmAssociation.InstanceAssociationItem_HasOne[]
) {
	Model.hasOne = function (assoc_name: string, ext_model?: any, assoc_options?: any) {
		if (arguments[1] && !arguments[1].table) {
			assoc_options = arguments[1] as FxOrmAssociation.AssociationDefinitionOptions_HasOne
			ext_model = arguments[1] = null as FxOrmModel.Model
		}
		
		var assocName: string;
		var assocTemplateName: string;
		var association: FxOrmAssociation.InstanceAssociationItem_HasOne = {
			name           : assoc_name || Model.table,
			model          : ext_model || Model,

			field		   : null,
			reversed       : false,
			extension      : false,
			autoFetch      : false,
			autoFetchLimit : 2,
			required       : false,

			setAccessor	   : null,
			getAccessor	   : null,
			hasAccessor    : null,
			delAccessor    : null
		};
		association = util.extend(association, assoc_options || {})

		assocName = ucfirst(association.name);
		assocTemplateName = association.accessor || assocName;

		// if (!association.hasOwnProperty("field")) {
		if (!association.field) {
			association.field = Utilities.formatField(association.model, association.name, association.required, association.reversed);
		} else if(!association.extension) {
			association.field = Utilities.wrapFieldObject({
				field: association.field, model: Model, altName: Model.table,
				mapsTo: association.mapsTo
			});
		}

		Utilities.convertPropToJoinKeyProp(
			association.field as FxOrmProperty.NormalizedFieldOptionsHash,
			{
				makeKey: false, required: association.required
			});

		for (var k in Accessors) {
			// if (!association.hasOwnProperty(k + "Accessor")) {
			if (!association[k + "Accessor"]) {
				association[k + "Accessor"] = Accessors[k] + assocTemplateName;
			}
		}

		associations.push(association);
		for (k in association.field as FxOrmProperty.NormalizedFieldOptionsHash) {
			if (!association.field.hasOwnProperty(k)) {
				continue;
			}
			if (!association.reversed) {
				Model.addProperty(
					util.extend({}, association.field[k], { klass: 'hasOne' }),
					false
				);
			}
		}

		if (association.reverse) {
			association.model.hasOne(association.reverse, Model, {
				reversed       : true,
				accessor       : association.reverseAccessor,
				reverseAccessor: undefined,
				field          : association.field as FxOrmProperty.NormalizedFieldOptionsHash,
				autoFetch      : association.autoFetch,
				autoFetchLimit : association.autoFetchLimit
			});
		}

		Model["findBy" + assocTemplateName] = function () {
			var cb: FxOrmModel.ModelMethodCallback__Find = null,
				conditions: FxOrmModel.ModelQueryConditions__Find = null,
				options: FxOrmAssociation.ModelAssociationMethod__FindOptions = {};

			for (var i = 0; i < arguments.length; i++) {
				switch (typeof arguments[i]) {
					case "function":
						cb = arguments[i];
						break;
					case "object":
						if (conditions === null) {
							conditions = arguments[i];
						} else {
							options = arguments[i];
						}
						break;
				}
			}

			if (conditions === null) {
				throw new ORMError(".findBy(" + assocName + ") is missing a conditions object", 'PARAM_MISMATCH');
			}

			options.__merge = {
				from  : { table: association.model.table, field: (association.reversed ? Object.keys(association.field) : association.model.id) },
				to    : { table: Model.table, field: (association.reversed ? association.model.id : Object.keys(association.field) ) },
				where : [ association.model.table, conditions ],
				table : Model.table
			};
			options.extra = [];

			if (typeof cb === "function") {
				return Model.find({}, options, cb);
			}
			return Model.find({}, options);
		};

		return this;
	};
};

export function extend (
	Model: FxOrmModel.Model,
	Instance: FxOrmInstance.Instance,
	Driver: FxOrmDMLDriver.DMLDriver,
	// extend target
	associations: FxOrmAssociation.InstanceAssociationItem[]
) {
	for (var i = 0; i < associations.length; i++) {
		extendInstance(Model, Instance, Driver, associations[i]);
	}
};

export function autoFetch (
	Instance: FxOrmInstance.Instance,
	associations: FxOrmAssociation.InstanceAssociationItem[],
	opts: FxOrmAssociation.AutoFetchInstanceOptions,
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
	Driver: FxOrmDMLDriver.DMLDriver,
	// extend target
	association: FxOrmAssociation.InstanceAssociationItem
) {
	Object.defineProperty(Instance, association.hasAccessor, {
		value: function (opts?: FxOrmAssociation.AccessorOptions_has, cb?: FxOrmNS.GenericCallback<boolean>) {
			if (typeof opts === "function") {
				cb = opts as any;
				opts = {};
			}

			if (Utilities.hasValues(Instance, Object.keys(association.field))) {
				association.model.get(Utilities.values(Instance, Object.keys(association.field)), opts, function (err, instance) {
					return cb(err, instance ? true : false);
				});
			} else {
				cb(null, false);
			}

			return this;
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(Instance, association.getAccessor, {
		value: function (
			opts?: FxOrmAssociation.AccessorOptions_get,
			cb?: FxOrmNS.GenericCallback<FxOrmAssociation.InstanceAssociatedInstance>
		): FxOrmModel.Model | FxOrmQuery.IChainFind {
			if (typeof opts === "function") {
				cb = opts as any;
				opts = {};
			}

			var saveAndReturn: FxOrmModel.ModelMethodCallback__Get = function (
				err: Error, Assoc: FxOrmAssociation.InstanceAssociatedInstance
			) {
				if (!err) {
					Instance[association.name] = Assoc;
				}

				return cb(err, Assoc);
			};

			// process get reversed instance's original instance
			if (association.reversed) {
				if (Utilities.hasValues(Instance, Model.id)) {
					const query_conds: FxOrmModel.ModelQueryConditions__Find = Utilities.getConditions(
						Model,
						Object.keys(association.field),
						Instance
					);

					if (typeof cb !== "function") {
						return association.model.find(
							query_conds,
							opts as FxOrmNS.IdType
						);
					}

					association.model.find(
						query_conds,
						opts as FxOrmNS.IdType,
						saveAndReturn
					);
				} else {
					cb(null);
				}
			} else {
				if (Instance.isShell()) {
					Model.get(
						Utilities.values( Instance, Model.id ),
						function (err: Error, instance: FxOrmAssociation.InstanceAssociationItem) {
							if (err || !Utilities.hasValues(instance, Object.keys(association.field))) {
								return cb(null);
							}
							association.model.get(Utilities.values(instance, Object.keys(association.field)), opts, saveAndReturn);
						}
					);
				} else if (Utilities.hasValues(Instance, Object.keys(association.field))) {
					association.model.get(
						Utilities.values( Instance, Object.keys(association.field) ),
						opts,
						saveAndReturn
					);
				} else {
					cb(null);
				}
			}

			return this;
		},
		enumerable: false,
		writable: true
	});
	Object.defineProperty(Instance, association.setAccessor, {
		value: function (
			OtherInstance: FxOrmInstance.Instance,
			cb: FxOrmNS.GenericCallback<FxOrmInstance.Instance>
		) {
			if (association.reversed) {
				Instance.save(function (err) {
					if (err) {
						return cb(err);
					}

					if (!Array.isArray(OtherInstance)) {
						Utilities.populateConditions(
							Model, Object.keys(association.field), Instance, OtherInstance, true
						);

						return OtherInstance.save({}, { saveAssociations: false }, cb);
					}

					var associations = util.clone(OtherInstance);

					var saveNext = function () {
						if (!associations.length) {
							return cb(null);
						}

						var other = associations.pop();

						Utilities.populateConditions(
							Model, Object.keys(association.field), Instance, other, true
						);

						other.save({}, { saveAssociations: false }, function (err: Error) {
							if (err) {
								return cb(err);
							}

							saveNext();
						});
					};

					return saveNext();
				});
			} else {
				OtherInstance.save({}, {
					saveAssociations: false
				}, function (err: Error) {
					if (err) {
						return cb(err);
					}

					Instance[association.name] = OtherInstance;

					Utilities.populateConditions(association.model, Object.keys(association.field), OtherInstance, Instance);

					return Instance.save({}, { saveAssociations: false }, cb);
				});
			}

			return this;
		},
		enumerable: false,
		writable: true
	});
	
	// non-reversed could delete associated instance
	if (!association.reversed) {
		Object.defineProperty(Instance, association.delAccessor, {
			value: function (cb: FxOrmNS.GenericCallback<void>) {
				for (var k in association.field as FxOrmProperty.NormalizedFieldOptionsHash) {
					if (association.field.hasOwnProperty(k)) {
						Instance[k] = null;
					}
				}
				Instance.save({}, { saveAssociations: false }, function (err) {
					if (!err) {
						delete Instance[association.name];
					}

					return cb(null);
				});

				return this;
			},
			enumerable: false,
			writable: true
		});
	}
}

function autoFetchInstance(
	Instance: FxOrmInstance.Instance,
	association: FxOrmAssociation.InstanceAssociationItem,
	opts: FxOrmAssociation.AutoFetchInstanceOptions,
	cb: FxOrmNS.GenericCallback<void>
) {
	if (!Instance.saved()) {
		return cb(null);
	}

	if (!opts.hasOwnProperty("autoFetchLimit") || typeof opts.autoFetchLimit === "undefined") {
		opts.autoFetchLimit = association.autoFetchLimit;
	}

	if (opts.autoFetchLimit === 0 || (!opts.autoFetch && !association.autoFetch)) {
		return cb(null);
	}

	/**
	 * When we have a new non persisted instance for which the association field (eg owner_id)
	 * is set, we don't want to auto fetch anything, since `new Model(owner_id: 12)` takes no
	 * callback, and hence this lookup would complete at an arbitrary point in the future.
	 * The associated entity should probably be fetched when the instance is persisted.
	 */
	if (Instance.isPersisted()) {
		Instance[association.getAccessor]({ autoFetchLimit: opts.autoFetchLimit - 1 }, cb);
	} else {
		return cb(null);
	}
}

function ucfirst(text: string) {
	return text[0].toUpperCase() + text.substr(1);
}
