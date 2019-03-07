import util = require('util')

import { defineDefaultExtendsToTableName, defineAssociationAccessorMethodName, ACCESSOR_KEYS, addAssociationInfoToModel } from "./_utils";

import _cloneDeep = require('lodash.clonedeep');
import ORMError   = require("../Error");
import Singleton  = require("../Singleton");
import Utilities  = require("../Utilities");

/**
 * 
 * @param db orm instance
 * @param Model model
 * @param associations association definitions
 */
export function prepare (db: FibOrmNS.FibORM, Model: FxOrmModel.Model, associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[]) {
	Model.extendsTo = function (
		name: string,
		properties: FxOrmModel.DetailedPropertyDefinitionHash,
		assoc_options: FxOrmAssociation.AssociationDefinitionOptions_ExtendsTo
	) {
		assoc_options = assoc_options || {};

		const associationSemanticNameCore = assoc_options.name || Utilities.formatNameFor("assoc:extendsTo", name);
		const association: FxOrmAssociation.InstanceAssociationItem_ExtendTos = {
			name           : name,
			table          : assoc_options.table || defineDefaultExtendsToTableName(Model.table, name),
			reversed       : assoc_options.reversed,
			autoFetch      : assoc_options.autoFetch || false,
			autoFetchLimit : assoc_options.autoFetchLimit || 2,
			field          : Utilities.wrapFieldObject({
				field: assoc_options.field as FxOrmProperty.NormalizedPropertyHash,
				model: Model,
				altName: Model.table
			}) || Utilities.formatField(
				Model,
				Model.table,
				false,
				false
			),

			getAccessor    : assoc_options.getAccessor || defineAssociationAccessorMethodName(ACCESSOR_KEYS.get, associationSemanticNameCore),
			setAccessor    : assoc_options.setAccessor || defineAssociationAccessorMethodName(ACCESSOR_KEYS.set, associationSemanticNameCore),
			hasAccessor    : assoc_options.hasAccessor || defineAssociationAccessorMethodName(ACCESSOR_KEYS.has, associationSemanticNameCore),
			delAccessor    : assoc_options.delAccessor || defineAssociationAccessorMethodName(ACCESSOR_KEYS.del, associationSemanticNameCore),
			modelFindByAccessor: assoc_options.modelFindByAccessor || defineAssociationAccessorMethodName(ACCESSOR_KEYS.modelFindBy, associationSemanticNameCore),

			model: null
		};

		const newProperties: FxOrmModel.DetailedPropertyDefinitionHash = _cloneDeep(properties);
		const assoc_field = association.field as FxOrmProperty.NormalizedPropertyHash

		for (let k in assoc_field) {
		    newProperties[k] = assoc_field[k];
		}

		const modelOpts: FxOrmModel.ModelOptions = util.extend(
			util.pick(assoc_options, 'identityCache', 'autoSave', 'cascadeRemove', 'hooks', 'methods', 'validations'),
			{
				id        : Object.keys(assoc_field),
				extension : true,
			}
		);

		association.model = db.define(association.table, newProperties, modelOpts);
		association.model.hasOne(Model.table, Model, { extension: true, field: assoc_field });

		associations.push(association);

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

			options.__merge = {
				from  : { table: association.model.table, field: Object.keys(assoc_field) },
				to    : { table: Model.table, field: Model.id },
				where : [ association.model.table, conditions ],
				table : Model.table,
				select: []
			};
			options.extra = [];

			if (typeof cb === "function") {
				return Model.find({}, options, cb);
			}
			return Model.find({}, options);
		};

		addAssociationInfoToModel(Model, name, {
			type: 'extendsTo',
			association: association
		});

		return association.model;
	};
};

export function extend (
	Model: FxOrmModel.Model,
	Instance: FxOrmInstance.Instance,
	Driver: FxOrmPatch.PatchedDMLDriver,
	associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[],
	opts: FibOrmNS.ModelExtendOptions
) {
	for (let i = 0; i < associations.length; i++) {
		extendInstance(Model, Instance, Driver, associations[i], opts);
	}
};

export function autoFetch (
	Instance: FxOrmInstance.Instance,
	associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[],
	opts: FibOrmNS.ModelAutoFetchOptions,
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
	Driver: FxOrmPatch.PatchedDMLDriver,
	association: FxOrmAssociation.InstanceAssociationItem_ExtendTos,
	opts: FibOrmNS.InstanceExtendOptions
) {
	Object.defineProperty(Instance, association.hasAccessor, {
		value : function (cb: FxOrmNS.GenericCallback<boolean>) {
			if (!Instance[Model.id + '']) {
			    cb(new ORMError("Instance not saved, cannot get extension", 'NOT_DEFINED', { model: Model.table }));
			} else {
				association.model.get(Utilities.values(Instance, Model.id), function (err: Error, extension: FxOrmInstance.Instance) {
					return cb(err, !err && extension ? true : false);
				});
			}
			return this;
		},
		enumerable : false
	});
	Object.defineProperty(Instance, association.getAccessor, {
		value: function (opts: FxOrmModel.ModelOptions__Get, cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>) {
			if (typeof opts == "function") {
				cb = opts;
				opts = {};
			}

			if (!Instance[Model.id + '']) {
			    cb(new ORMError("Instance not saved, cannot get extension", 'NOT_DEFINED', { model: Model.table }));
			} else {
				association.model.get(Utilities.values(Instance, Model.id), opts, cb);
			}
			return this;
		},
		enumerable : false
	});
	Object.defineProperty(Instance, association.setAccessor, {
		value : function (
			Extension: FxOrmInstance.Instance | FxOrmInstance.InstanceDataPayload,
			cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>
		) {
			Instance.save(function (err: FxOrmError.ExtendedError) {
				if (err) {
					return cb(err);
				}

				Instance[association.delAccessor](function (err: FxOrmError.ExtendedError) {
					if (err) {
						return cb(err);
					}

					var fields = Object.keys(association.field);

					if (!Extension.isInstance) {
						Extension = new association.model(Extension);
					}

					for (let i = 0; i < Model.id.length; i++) {
						Extension[fields[i]] = Instance[Model.id[i]];
					}

					Extension.save(cb);
				});
			});
			return this;
		},
		enumerable : false
	});
	Object.defineProperty(Instance, association.delAccessor, {
		value : function (cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>) {
			if (!Instance[Model.id + '']) {
			    cb(new ORMError("Instance not saved, cannot get extension", 'NOT_DEFINED', { model: Model.table }));
			} else {
				var conditions: {[k: string]: any} = {};
				var fields = Object.keys(association.field);

				for (let i = 0; i < Model.id.length; i++) {
				    conditions[fields[i]] = Instance[Model.id[i]];
				}

				association.model.find(conditions, function (err, extensions) {
					if (err) {
						return cb(err);
					}

					var pending = extensions.length;

					for (let i = 0; i < extensions.length; i++) {
						Singleton.clear(extensions[i].__singleton_uid() + '');
						extensions[i].remove(function () {
							if (--pending === 0) {
								return cb(null);
							}
						});
					}

					if (pending === 0) {
						return cb(null);
					}
				});
			}
			return this;
		},
		enumerable : false
	});
}

function autoFetchInstance(
	Instance: FxOrmInstance.Instance,
	association: FxOrmAssociation.InstanceAssociationItem_ExtendTos,
	opts: FibOrmNS.InstanceAutoFetchOptions,
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

	if (Instance.isPersisted()) {
		Instance[association.getAccessor]({ autoFetchLimit: opts.autoFetchLimit - 1 },
		function (err: FxOrmError.ExtendedError, Assoc: FxOrmAssociation.InstanceAssociationItem) {
			if (!err) {
				Instance[association.name] = Assoc;
			}

			return cb(null);
		});
	} else {
		return cb(null);
	}
}
