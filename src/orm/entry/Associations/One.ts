import util = require('util')

import Utilities = require("../Utilities");
import ORMError = require("../Error");
import { ACCESSOR_KEYS, addAssociationInfoToModel } from './_utils';

export function prepare (
	Model: FxOrmModel.Model, associations: FxOrmAssociation.InstanceAssociationItem_HasOne[]
) {
	Model.hasOne = function (assoc_name, ext_model, assoc_options) {
		if (arguments[1] && !arguments[1].table) {
			assoc_options = arguments[1] as FxOrmAssociation.AssociationDefinitionOptions_HasOne
			ext_model = arguments[1] = null as FxOrmModel.Model
		}

		assoc_name = assoc_name || ext_model.table;
		ext_model = ext_model || Model;
		
		var association: FxOrmAssociation.InstanceAssociationItem_HasOne = {
			name           : assoc_name,
			model          : ext_model,

			field		   : null,
			reversed       : false,
			extension      : false,
			autoFetch      : false,
			autoFetchLimit : 2,
			required       : false,

			setAccessor	   : null,
			getAccessor	   : null,
			hasAccessor    : null,
			delAccessor    : null,
			
			modelFindByAccessor : null,
		};
		association = util.extend(association, assoc_options || {})

		var associationSemanticNameCore = Utilities.formatNameFor("assoc:hasOne", association.name);

		if (!association.field) {
			association.field = Utilities.formatField(association.model, association.name, association.required, association.reversed);
		} else if(!association.extension) {
			association.field = Utilities.wrapFieldObject({
				field: association.field, model: Model, altName: Model.table,
				mapsTo: association.mapsTo
			});
		}

		const normalizedField = association.field as FxOrmProperty.NormalizedPropertyHash

		Utilities.convertPropToJoinKeyProp(
			normalizedField as FxOrmProperty.NormalizedPropertyHash,
			{
				makeKey: false, required: association.required
			});

		for (let k in ACCESSOR_KEYS) {
			if (!association[k + "Accessor"]) {
				association[k + "Accessor"] = ACCESSOR_KEYS[k] + associationSemanticNameCore;
			}
		}

		associations.push(association);
		for (let k in normalizedField) {
			if (!normalizedField.hasOwnProperty(k)) {
				continue;
			}
			if (!association.reversed) {
				Model.addProperty(
					util.extend({}, normalizedField[k], { klass: 'hasOne' }),
					false
				);
			}
		}

		if (association.reverse) {
			association.model.hasOne(association.reverse, Model, {
				reversed       : true,
				accessor       : association.reverseAccessor,
				reverseAccessor: undefined,
				field          : normalizedField,
				autoFetch      : association.autoFetch,
				autoFetchLimit : association.autoFetchLimit
			});
		}

		Model[association.modelFindByAccessor] = function () {
			var cb: FxOrmModel.ModelMethodCallback__Find = null,
				conditions: FxOrmModel.ModelQueryConditions__Find = null,
				options: FxOrmAssociation.ModelAssociationMethod__FindOptions = {};

			for (let i = 0; i < arguments.length; i++) {
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
				throw new ORMError(`.${association.modelFindByAccessor}() is missing a conditions object`, 'PARAM_MISMATCH');
			}

			const ft_tuple_fields = [Object.keys(normalizedField), association.model.id]
			let ft_tuple_table = null

			let from_table = `${association.model.table}`,
				to_table = `${Model.table}`,
				where_table = from_table;

			const same_ft = from_table === to_table;
			if (same_ft) {
				ft_tuple_table = [
					// from
					!association.reversed ? `${from_table}2` : `${to_table}1`,
					// to
					!association.reversed ? `${from_table}1` : `${to_table}2`,
				]

				where_table = ft_tuple_table[0]

				from_table = `${from_table} as ${ft_tuple_table[0]}`
				to_table = `${to_table} as ${ft_tuple_table[1]}`
			}

			options.__merge = {
				from  : { table: from_table, field: (!association.reversed ? ft_tuple_fields[1] : ft_tuple_fields[0]) },
				to    : { table: to_table, field: (!association.reversed ? ft_tuple_fields[0] : ft_tuple_fields[1] ) },
				where : [ where_table, conditions ],
				table : Model.table,
				select: []
			};

			if (same_ft) {
				options.chainfind_linktable = to_table
			}

			options.extra = [];

			if (typeof cb === "function") {
				return Model.find({}, options, cb);
			}
			return Model.find({}, options);
		};

		addAssociationInfoToModel(Model, assoc_name, {
			type: 'hasOne',
			association
		});

		return this;
	};
};

export function extend (
	Model: FxOrmModel.Model,
	Instance: FxOrmInstance.Instance,
	Driver: FxOrmDMLDriver.DMLDriver,
	// extend target
	associations: FxOrmAssociation.InstanceAssociationItem_HasOne[]
) {
	for (let i = 0; i < associations.length; i++) {
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

	for (let i = 0; i < associations.length; i++) {
		autoFetchInstance(Instance, associations[i], opts, autoFetchDone);
	}
};

function extendInstance(
	Model: FxOrmModel.Model,
	Instance: FxOrmInstance.Instance,
	Driver: FxOrmDMLDriver.DMLDriver,
	// extend target
	association: FxOrmAssociation.InstanceAssociationItem_HasOne
) {
	Object.defineProperty(Instance, association.hasAccessor, {
		value: function (_has_opts?: FxOrmAssociation.AccessorOptions_has, cb?: FxOrmNS.GenericCallback<boolean>) {
			if (typeof _has_opts === "function") {
				cb = _has_opts as any;
				_has_opts = {};
			}

			if (Utilities.hasValues(Instance, Object.keys(association.field))) {
				association.model.get(Utilities.values(Instance, Object.keys(association.field)),
				_has_opts,
				function (err: FxOrmError.ExtendedError, instance: FxOrmInstance.Instance) {
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
				for (let k in association.field as FxOrmProperty.NormalizedPropertyHash) {
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