import util = require('util')
import coroutine = require('coroutine')

import Utilities = require("../Utilities");
import ORMError = require("../Error");
import { ACCESSOR_KEYS, addAssociationInfoToModel } from './_utils';
import { ListFindByChainOrRunSync } from '../Model';
import * as Helpers from '../Helpers';

function noOperation (...args: any[]) {};

export function prepare (
	Model: FxOrmModel.Model, associations: FxOrmAssociation.InstanceAssociationItem_HasOne[]
) {
	Model.hasOne = function (assoc_name, ext_model, assoc_options) {
		if (arguments[1] && !arguments[1].table) {
			assoc_options = arguments[1] as FxOrmAssociation.AssociationDefinitionOptions_HasOne
			ext_model = arguments[1] = null as FxOrmModel.Model
		}

		assoc_name = assoc_name || ext_model.table;
		assoc_options = assoc_options || {};
		const associationSemanticNameCore = Utilities.formatNameFor("assoc:hasOne", assoc_name);
		ext_model = ext_model || Model;
		
		let association = <FxOrmAssociation.InstanceAssociationItem_HasOne>{
			name           : assoc_name,
			model          : ext_model,

			field		   : null,
			reversed       : false,
			extension      : false,
			autoFetch      : false,
			autoFetchLimit : 2,
			required       : false,

			setAccessor	   : ACCESSOR_KEYS.set + associationSemanticNameCore,
			getAccessor	   : ACCESSOR_KEYS.get + associationSemanticNameCore,
			hasAccessor    : ACCESSOR_KEYS.has + associationSemanticNameCore,
			delAccessor    : null,
			
			modelFindByAccessor : assoc_options.modelFindByAccessor || (ACCESSOR_KEYS.modelFindBy + associationSemanticNameCore),
		};

		if (!association.reversed)
			association.delAccessor = ACCESSOR_KEYS['del'] + associationSemanticNameCore;
		
		association = util.extend(association, assoc_options);
		Utilities.fillSyncVersionAccessorForAssociation(association);

		if (!association.field) {
			association.field = Utilities.formatField(association.model, association.name, association.required, association.reversed);
		} else if(!association.extension) {
			association.field = Utilities.wrapFieldObject({
				field: association.field, model: Model, altName: Model.table,
				mapsTo: association.mapsTo
			});
		}

		const normalizedField = association.field

		Utilities.convertPropToJoinKeyProp(normalizedField, { makeKey: false, required: association.required });

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

		const findByAccessorChainOrRunSync = function (is_sync: boolean = false) {
			return function () {
				var cb: FxOrmModel.ModelMethodCallback__Find = null,
					conditions: FxOrmModel.ModelQueryConditions__Find = null,
					options: FxOrmAssociation.ModelAssociationMethod__FindOptions = {};

				Helpers.selectArgs(arguments, (arg_type, arg) => {
					switch (arg_type) {
						case "function":
							cb = arg;
							break;
						case "object":
							if (conditions === null) {
								conditions = arg;
							} else {
								options = arg;
							}
							break;
					}
				})

				if (conditions === null) {
					throw new ORMError(`.${association.modelFindByAccessor}() is missing a conditions object`, 'PARAM_MISMATCH');
				}

				return ListFindByChainOrRunSync(Model, 
					{},
					[
						{
							association_name: association.name,
							conditions: conditions
						},
					],
					options,
					cb,
					is_sync
				);
			};
		}

		Model[association.modelFindByAccessor] = findByAccessorChainOrRunSync();
		Model[association.modelFindBySyncAccessor] = findByAccessorChainOrRunSync(true);

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
) {
	if (associations.length === 0) {
		return ;
	}

	const ev_lock = new coroutine.Event();

	let pending = associations.length;
	const autoFetchDone = function () {
		pending -= 1;

		if (pending === 0) {
			ev_lock.set();
		}
	};

	for (let i = 0; i < associations.length; i++) {
		autoFetchInstance(Instance, associations[i], opts, autoFetchDone);
	}

	ev_lock.wait();
};

function extendInstance(
	Model: FxOrmModel.Model,
	Instance: FxOrmInstance.Instance,
	Driver: FxOrmDMLDriver.DMLDriver,
	// extend target
	association: FxOrmAssociation.InstanceAssociationItem_HasOne
) {
	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.hasSyncAccessor, function (_has_opts?: FxOrmAssociation.AccessorOptions_has) {
		if (!Utilities.hasValues(Instance, Object.keys(association.field)))
			return false;
		
		const instance = association.model.get(
			Utilities.values(Instance, Object.keys(association.field)),
			_has_opts
		);

		return !!instance;
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.hasAccessor, function (_has_opts?: FxOrmAssociation.AccessorOptions_has, cb?: FxOrmNS.GenericCallback<boolean>) {
		if (typeof _has_opts === "function") {
			cb = _has_opts as any;
			_has_opts = {};
		}

		process.nextTick(() => {
			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod<FxOrmInstance.Instance>(Instance[association.hasSyncAccessor], [ _has_opts ]);
			Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: true, callback: cb })
		});

		return this;
	});

	const getAccessorChainOrRunSync = function  (
		opts: FxOrmModel.ModelOptions__Find = {},
		cb: FxOrmNS.GenericCallback<FxOrmAssociation.InstanceAssociatedInstance | FxOrmAssociation.InstanceAssociatedInstance[]>,
		is_sync: boolean = false
	): FxOrmQuery.IChainFind | FxOrmAssociation.InstanceAssociatedInstance | FxOrmAssociation.InstanceAssociatedInstance[] {
		const saveAndReturn = function (Assoc: FxOrmAssociation.InstanceAssociatedInstance | FxOrmAssociation.InstanceAssociatedInstance[]) {
			Instance[association.name] = Assoc;

			return Assoc;
		};
		
		let result: FxOrmAssociation.InstanceAssociatedInstance | FxOrmAssociation.InstanceAssociatedInstance[];

		// process get reversed instance's original instance
		if (association.reversed) {
			let reverseHostInstances: FxOrmAssociation.InstanceAssociatedInstance[] = null;

			if (Utilities.hasValues(Instance, Model.id)) {
				const query_conds: FxOrmModel.ModelQueryConditions__Find = Utilities.getConditions(
					Model,
					Object.keys(association.field),
					Instance
				);
				
				if (!is_sync && typeof cb !== "function") {
					return association.model.find.call(association.model, query_conds, opts);
				}

				reverseHostInstances = association.model.findSync(query_conds, opts);
				result = saveAndReturn(reverseHostInstances);
			}

			return result;
		}
			
		let assocInstance: FxOrmAssociation.InstanceAssociatedInstance = null;
		if (Instance.isShell()) {
			Instance = Model.getSync(Utilities.values( Instance, Model.id ))

			if (!Utilities.hasValues(Instance, Object.keys(association.field)))
				return ;
				
			assocInstance = association.model.getSync(Utilities.values(Instance, Object.keys(association.field)), opts);
			return saveAndReturn(assocInstance);
		}
		
		if (Utilities.hasValues(Instance, Object.keys(association.field))) {
			assocInstance = association.model.getSync(
				Utilities.values( Instance, Object.keys(association.field) ),
				opts,
			);
			return saveAndReturn(assocInstance);
		}
	}

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.getSyncAccessor, function (
		opts: FxOrmModel.ModelOptions__Find = {},
	): FxOrmAssociation.InstanceAssociatedInstance | FxOrmAssociation.InstanceAssociatedInstance[] {
		return getAccessorChainOrRunSync(opts, noOperation, true) as FxOrmAssociation.InstanceAssociatedInstance | FxOrmAssociation.InstanceAssociatedInstance[];
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.getAccessor, function (
		opts?: FxOrmModel.ModelOptions__Find,
		cb?: FxOrmNS.GenericCallback<FxOrmAssociation.InstanceAssociatedInstance>
	): FxOrmQuery.IChainFind {
		if (typeof opts === "function") {
			cb = opts as any;
			opts = {};
		}

		if (cb) {
			process.nextTick(() => {
				const syncResponse = Utilities.exposeErrAndResultFromSyncMethod<FxOrmInstance.Instance>(getAccessorChainOrRunSync, [opts, noOperation]);
				Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: true, callback: cb })
			});

			return this;
		}

		return getAccessorChainOrRunSync(opts, cb) as FxOrmQuery.IChainFind;
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.setSyncAccessor, function (
		OtherInstance: FxOrmInstance.Instance | FxOrmInstance.Instance[]
	) {
		const inst_arr = Array.isArray(OtherInstance) ? Array.from(OtherInstance) : [ OtherInstance ];

		if (association.reversed) {
			Instance.saveSync();

			const runReversed = function (other: FxOrmInstance.Instance) {
				Utilities.populateModelIdKeysConditions(Model, Object.keys(association.field), Instance, other, true);

				// link
				other.saveSync({}, { saveAssociations: false });

				return other;
			};

			return inst_arr.map(runReversed);
		}

		const runNonReversed = function (oinst: FxOrmInstance.Instance) {
			oinst.saveSync({}, { saveAssociations: false });

			Instance[association.name] = oinst;
			Utilities.populateModelIdKeysConditions(association.model, Object.keys(association.field), oinst, Instance);

			// link
			Instance.saveSync({}, { saveAssociations: false });

			return oinst;
		}

		return inst_arr.map(runNonReversed)
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.setAccessor, function (
		OtherInstance: FxOrmInstance.Instance | FxOrmInstance.Instance[],
		cb?: FxOrmNS.GenericCallback<FxOrmInstance.Instance>
	) {
		process.nextTick(() => {
			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod<FxOrmInstance.Instance | FxOrmInstance.Instance[]>(Instance[association.setSyncAccessor], [ OtherInstance ]);
			Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: true, callback: cb })
		});

		return this;
	});
	
	// non-reversed could delete associated instance
	if (!association.reversed) {
		Utilities.addHiddenUnwritableMethodToInstance(Instance, association.delSyncAccessor, function (
		) {
			for (let k in association.field) {
				if (association.field.hasOwnProperty(k)) {
					Instance[k] = null;
				}
			}

			Instance.saveSync({}, { saveAssociations: false });
			delete Instance[association.name];

			return this;
		});

		Utilities.addHiddenUnwritableMethodToInstance(Instance, association.delAccessor, function (
			cb?: FxOrmNS.GenericCallback<void>
		) {
			process.nextTick(() => {
				const syncResponse = Utilities.exposeErrAndResultFromSyncMethod<FxOrmInstance.Instance | FxOrmInstance.Instance[]>(Instance[association.delSyncAccessor]);
				Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: true, callback: cb })
			});
			
			return this;
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