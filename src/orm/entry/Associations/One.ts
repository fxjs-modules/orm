const _          = require("lodash");
import util       = require("../Utilities");
import ORMError   = require("../Error");
const Accessors  = {
	"get": "get",
	"set": "set",
	"has": "has",
	"del": "remove"
};

export function prepare (Model: FibOrmNS.Model, associations: FibOrmNS.InstanceAssociationItem_HasOne[]) {
	Model.hasOne = function (assoc_name: string, ext_model?: any, assoc_options?: any) {
		if (arguments[1] && !arguments[1].table) {
			assoc_options = arguments[1] as FibOrmNS.AssociationDefinitionOptions_HasOne
			ext_model = arguments[1] = null as FibOrmNS.Model
		}
		
		var assocName;
		var assocTemplateName;
		var association: FibOrmNS.InstanceAssociationItem_HasOne = {
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
		association = _.extend(association, assoc_options || {})

		assocName = ucfirst(association.name);
		assocTemplateName = association.accessor || assocName;

		// if (!association.hasOwnProperty("field")) {
		if (!association.field) {
			association.field = util.formatField(association.model, association.name, association.required, association.reversed);
		} else if(!association.extension) {
			association.field = util.wrapFieldObject({
				field: association.field, model: Model, altName: Model.table,
				mapsTo: association.mapsTo
			});
		}

		util.convertPropToJoinKeyProp(association.field, {
			makeKey: false, required: association.required
		});

		for (var k in Accessors) {
			// if (!association.hasOwnProperty(k + "Accessor")) {
			if (!association[k + "Accessor"]) {
				association[k + "Accessor"] = Accessors[k] + assocTemplateName;
			}
		}

		associations.push(association);
		for (k in association.field) {
			if (!association.field.hasOwnProperty(k)) {
				continue;
			}
			if (!association.reversed) {
				Model.addProperty(
					_.extend({}, association.field[k], { klass: 'hasOne' }),
					false
				);
			}
		}

		if (association.reverse) {
			association.model.hasOne(association.reverse, Model, {
				reversed       : true,
				accessor       : association.reverseAccessor,
				reverseAccessor: undefined,
				field          : association.field,
				autoFetch      : association.autoFetch,
				autoFetchLimit : association.autoFetchLimit
			});
		}

		Model["findBy" + assocTemplateName] = function () {
			var cb = null, conditions = null, options: FibOrmNS.ModelAssociationMethod__FindOptions = {} as FibOrmNS.ModelAssociationMethod__FindOptions;

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

export function extend (Model, Instance, Driver, associations) {
	for (var i = 0; i < associations.length; i++) {
		extendInstance(Model, Instance, Driver, associations[i]);
	}
};

export function autoFetch (Instance, associations, opts, cb) {
	if (associations.length === 0) {
		return cb();
	}

	var pending = associations.length;
	var autoFetchDone = function autoFetchDone() {
		pending -= 1;

		if (pending === 0) {
			return cb();
		}
	};

	for (var i = 0; i < associations.length; i++) {
		autoFetchInstance(Instance, associations[i], opts, autoFetchDone);
	}
};

function extendInstance(Model, Instance, Driver, association) {
	Object.defineProperty(Instance, association.hasAccessor, {
		value: function (opts, cb) {
			if (typeof opts === "function") {
				cb = opts;
				opts = {};
			}

			if (util.hasValues(Instance, Object.keys(association.field))) {
				association.model.get(util.values(Instance, Object.keys(association.field)), opts, function (err, instance) {
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
		value: function (opts, cb) {
			if (typeof opts === "function") {
				cb = opts;
				opts = {};
			}

			var saveAndReturn = function (err, Assoc) {
				if (!err) {
					Instance[association.name] = Assoc;
				}

				return cb(err, Assoc);
			};

			if (association.reversed) {
				if (util.hasValues(Instance, Model.id)) {
					if (typeof cb !== "function") {
						return association.model.find(util.getConditions(Model, Object.keys(association.field), Instance), opts);
					}
					association.model.find(util.getConditions(Model, Object.keys(association.field), Instance), opts, saveAndReturn);
				} else {
					cb(null);
				}
			} else {
				if (Instance.isShell()) {
					Model.get(util.values(Instance, Model.id), function (err, instance) {
						if (err || !util.hasValues(instance, Object.keys(association.field))) {
							return cb(null);
						}
						association.model.get(util.values(instance, Object.keys(association.field)), opts, saveAndReturn);
					});
				} else if (util.hasValues(Instance, Object.keys(association.field))) {
					association.model.get(util.values(Instance, Object.keys(association.field)), opts, saveAndReturn);
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
		value: function (OtherInstance, cb) {
			if (association.reversed) {
				Instance.save(function (err) {
					if (err) {
						return cb(err);
					}

					if (!Array.isArray(OtherInstance)) {
						util.populateConditions(Model, Object.keys(association.field), Instance, OtherInstance, true);

						return OtherInstance.save({}, { saveAssociations: false }, cb);
					}

					var associations = _.clone(OtherInstance);

					var saveNext = function () {
						if (!associations.length) {
							return cb();
						}

						var other = associations.pop();

						util.populateConditions(Model, Object.keys(association.field), Instance, other, true);

						other.save({}, { saveAssociations: false }, function (err) {
							if (err) {
								return cb(err);
							}

							saveNext();
						});
					};

					return saveNext();
				});
			} else {
				OtherInstance.save({}, { saveAssociations: false }, function (err) {
					if (err) {
						return cb(err);
					}

					Instance[association.name] = OtherInstance;

					util.populateConditions(association.model, Object.keys(association.field), OtherInstance, Instance);

					return Instance.save({}, { saveAssociations: false }, cb);
				});
			}

			return this;
		},
		enumerable: false,
		writable: true
	});
	if (!association.reversed) {
		Object.defineProperty(Instance, association.delAccessor, {
			value: function (cb) {
				for (var k in association.field) {
					if (association.field.hasOwnProperty(k)) {
						Instance[k] = null;
					}
				}
				Instance.save({}, { saveAssociations: false }, function (err) {
					if (!err) {
						delete Instance[association.name];
					}

					return cb();
				});

				return this;
			},
			enumerable: false,
			writable: true
		});
	}
}

function autoFetchInstance(Instance, association, opts, cb) {
	if (!Instance.saved()) {
		return cb();
	}

	if (!opts.hasOwnProperty("autoFetchLimit") || typeof opts.autoFetchLimit === "undefined") {
		opts.autoFetchLimit = association.autoFetchLimit;
	}

	if (opts.autoFetchLimit === 0 || (!opts.autoFetch && !association.autoFetch)) {
		return cb();
	}

	// When we have a new non persisted instance for which the association field (eg owner_id)
	// is set, we don't want to auto fetch anything, since `new Model(owner_id: 12)` takes no
	// callback, and hence this lookup would complete at an arbitrary point in the future.
	// The associated entity should probably be fetched when the instance is persisted.
	if (Instance.isPersisted()) {
		Instance[association.getAccessor]({ autoFetchLimit: opts.autoFetchLimit - 1 }, cb);
	} else {
		return cb();
	}
}

function ucfirst(text) {
	return text[0].toUpperCase() + text.substr(1);
}
