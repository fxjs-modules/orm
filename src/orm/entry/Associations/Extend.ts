import util = require('util')

import { defineDefaultExtendsToTableName, defineAssociationAccessorMethodName } from "./_utils";

const _cloneDeep          = require('lodash.clonedeep');
import ORMError   = require("../Error");
import Singleton  = require("../Singleton");
import Utilities       = require("../Utilities");

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
		opts: FxOrmAssociation.AssociationDefinitionOptions_ExtendsTo
	) {
		opts = opts || {};

		const assocName = opts.name || ucfirst(name);
		const association: FxOrmAssociation.InstanceAssociationItem_ExtendTos = {
			name           : name,
			table          : opts.table || defineDefaultExtendsToTableName(Model.table, name),
			reversed       : opts.reversed,
			autoFetch      : opts.autoFetch || false,
			autoFetchLimit : opts.autoFetchLimit || 2,
			field          : Utilities.wrapFieldObject({
				field: opts.field,
				model: Model,
				altName: Model.table
			}) || Utilities.formatField(
				Model,
				Model.table,
				false,
				false
			),

			getAccessor    : opts.getAccessor || defineAssociationAccessorMethodName('get', assocName),
			setAccessor    : opts.setAccessor || defineAssociationAccessorMethodName('set', assocName),
			hasAccessor    : opts.hasAccessor || defineAssociationAccessorMethodName('has', assocName),
			delAccessor    : opts.delAccessor || defineAssociationAccessorMethodName('remove', assocName),

			model: null
		};

		const newProperties: FxOrmModel.DetailedPropertyDefinitionHash = _cloneDeep(properties);
		for (var k in association.field as FxOrmProperty.NormalizedFieldOptionsHash) {
		    newProperties[k] = association.field[k];
		}

		const modelOpts: FxOrmModel.ModelOptions = util.extend(
			util.pick(opts, 'identityCache', 'autoSave', 'cascadeRemove', 'hooks', 'methods', 'validations'),
			{
				id        : Object.keys(association.field),
				extension : true,
			}
		);

		association.model = db.define(association.table, newProperties, modelOpts);
		association.model.hasOne(Model.table, Model, { extension: true, field: association.field as FxOrmProperty.NormalizedFieldOptionsHash });

		associations.push(association);

		Model["findBy" + assocName] = function () {
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
				from  : { table: association.model.table, field: Object.keys(association.field) },
				to    : { table: Model.table, field: Model.id },
				where : [ association.model.table, conditions ],
				table : Model.table
			};
			options.extra = [];

			if (typeof cb === "function") {
				return Model.find({}, options, cb);
			}
			return Model.find({}, options);
		};

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
	for (var i = 0; i < associations.length; i++) {
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

	for (var i = 0; i < associations.length; i++) {
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
				association.model.get(Utilities.values(Instance, Model.id), function (err: Error, extension) {
					return cb(err, !err && extension ? true : false);
				});
			}
			return this;
		},
		enumerable : false
	});
	Object.defineProperty(Instance, association.getAccessor, {
		value: function (opts, cb) {
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
		value : function (Extension, cb) {
			Instance.save(function (err) {
				if (err) {
					return cb(err);
				}

				Instance[association.delAccessor](function (err) {
					if (err) {
						return cb(err);
					}

					var fields = Object.keys(association.field);

					if (!Extension.isInstance) {
						Extension = new association.model(Extension);
					}

					for (var i = 0; i < Model.id.length; i++) {
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
		value : function (cb) {
			if (!Instance[Model.id + '']) {
			    cb(new ORMError("Instance not saved, cannot get extension", 'NOT_DEFINED', { model: Model.table }));
			} else {
				var conditions = {};
				var fields = Object.keys(association.field);

				for (var i = 0; i < Model.id.length; i++) {
				    conditions[fields[i]] = Instance[Model.id[i]];
				}

				association.model.find(conditions, function (err, extensions) {
					if (err) {
						return cb(err);
					}

					var pending = extensions.length;

					for (var i = 0; i < extensions.length; i++) {
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
		Instance[association.getAccessor]({ autoFetchLimit: opts.autoFetchLimit - 1 }, function (err, Assoc) {
			if (!err) {
				Instance[association.name] = Assoc;
			}

			return cb(null);
		});
	} else {
		return cb(null);
	}
}

function ucfirst(text: string) {
	return text[0].toUpperCase() + text.substr(1);
}
