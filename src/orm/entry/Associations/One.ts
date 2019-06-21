import util = require('util')

import Hook = require("../Hook");
import Utilities = require("../Utilities");
import ORMError = require("../Error");
import { ACCESSOR_KEYS, addAssociationInfoToModel } from './_utils';
import { listFindByChainOrRunSync } from '../Model';
import * as Helpers from '../Helpers';

function noOperation (...args: any[]) {};

export function prepare (
	Model: FxOrmModel.Model,
	assocs: {
		one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[],
		many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[],
		extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[],
	},
	opts: {
		db: FibOrmNS.FibORM
	}
) {
	const { one_associations } = assocs;
	const { db } = opts;

	Model.hasOne = function (assoc_name, ext_model, assoc_options) {
		if (arguments[1] && !arguments[1].table) {
			assoc_options = arguments[1] as FxOrmAssociation.AssociationDefinitionOptions_HasOne
			ext_model = arguments[1] = null as FxOrmModel.Model
		}

		ext_model = ext_model || Model;
		assoc_name = assoc_name || ext_model.table;
		assoc_options = {...assoc_options};

		for (let i = 0; i < db.plugins.length; i++) {
			if (typeof db.plugins[i].beforeHasOne === "function") {
				db.plugins[i].beforeHasOne(assoc_name, ext_model, assoc_options);
			}
		}

		const associationSemanticNameCore = Utilities.formatNameFor("assoc:hasOne", assoc_name);	
		
		const association = <FxOrmAssociation.InstanceAssociationItem_HasOne>{
			name           : assoc_name,
			model          : ext_model,

			field		   : null,
			reversed       : false,
			__for_extension: false,
			autoFetch      : false,
			autoFetchLimit : 2,
			required       : false,

			setAccessor	   : ACCESSOR_KEYS.set + associationSemanticNameCore,
			getAccessor	   : ACCESSOR_KEYS.get + associationSemanticNameCore,
			hasAccessor    : ACCESSOR_KEYS.has + associationSemanticNameCore,
			delAccessor    : null,
			
			modelFindByAccessor : assoc_options.modelFindByAccessor || (ACCESSOR_KEYS.modelFindBy + associationSemanticNameCore),

			...assoc_options,
			hooks		   : {...assoc_options.hooks},
		};
		
		if (!association.reversed)
			association.delAccessor = ACCESSOR_KEYS['del'] + associationSemanticNameCore;
		
		Utilities.fillSyncVersionAccessorForAssociation(association);
		Utilities.addHookPatchHelperForAssociation(association);

		if (!association.field) {
			association.field = Utilities.formatField(association.model, association.name, association.required, association.reversed);
		} else if (!association.__for_extension) {
			association.field = Utilities.wrapFieldObject({
				field: association.field, model: Model, altName: Model.table,
				mapsTo: association.mapsTo
			});
		}

		const normalizedField = association.field

		Utilities.convertPropToJoinKeyProp(normalizedField, { makeKey: false, required: association.required });

		one_associations.push(association);
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
				autoFetchLimit : association.autoFetchLimit,
				hooks		   : assoc_options.reverseHooks
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

				return listFindByChainOrRunSync(Model, 
					{},
					[
						{
							association_name: association.name,
							conditions: conditions
						},
					],
					options,
					{ callback: cb, is_sync }
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
	associations: FxOrmAssociation.InstanceAssociationItem_HasOne[],
	cfg: {
		assoc_opts: any,
		genHookHandlerForInstance: Function
	}
) {
	for (let i = 0; i < associations.length; i++) {
		extendInstance(Model, Instance, Driver, associations[i], cfg);
	}
};

export function autoFetch (
	Instance: FxOrmInstance.Instance,
	associations: FxOrmAssociation.InstanceAssociationItem[],
	opts: FxOrmAssociation.AutoFetchInstanceOptions,
	parallel: boolean
) {
	if (associations.length === 0)
		return ;

	Utilities.parallelQueryIfPossible(
		parallel,
		associations,
		(item) => autoFetchInstance(Instance, item, opts)
	)
};

function extendInstance(
	Model: FxOrmModel.Model,
	Instance: FxOrmInstance.Instance,
	Driver: FxOrmDMLDriver.DMLDriver,
	// extend target
	association: FxOrmAssociation.InstanceAssociationItem_HasOne,
	cfg: {
		assoc_opts: FxOrmAssociation.AssociationDefinitionOptions_HasOne,
		genHookHandlerForInstance: Function
	}
) {
	const { genHookHandlerForInstance } = cfg
	
	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.hasSyncAccessor, function (_has_opts?: FxOrmAssociation.AccessorOptions_has) {
		if (!Utilities.hasValues(Instance, Object.keys(association.field)))
			return false;
		
		try {
			const instance = association.model.getSync(
				Utilities.values(Instance, Object.keys(association.field)),
				_has_opts
			);

			return !!instance;
		} catch (error) {
			console.log('error', error)
			return false
		}
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
		withOutCallbackWhenNonSync: boolean,
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
				
				if (withOutCallbackWhenNonSync) {
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
		return getAccessorChainOrRunSync(opts, false) as FxOrmAssociation.InstanceAssociatedInstance | FxOrmAssociation.InstanceAssociatedInstance[];
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.getAccessor, function (
		opts?: FxOrmModel.ModelOptions__Find,
		cb?: FxOrmNS.GenericCallback<FxOrmAssociation.InstanceAssociatedInstance>
	): FxOrmQuery.IChainFind {
		if (typeof opts === "function") {
			cb = opts as any;
			opts = {};
		}

		const withCallback = typeof cb === 'function';

		if (withCallback) {
			process.nextTick(() => {
				const syncResponse = Utilities.exposeErrAndResultFromSyncMethod<FxOrmInstance.Instance>(getAccessorChainOrRunSync, [opts, !withCallback]);
				Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: true, callback: cb });
			});

			return this;
		}

		return getAccessorChainOrRunSync(opts, !withCallback) as FxOrmQuery.IChainFind;
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.setSyncAccessor, function (
		OtherInstance: FxOrmInstance.Instance | FxOrmInstance.Instance[]
	): FxOrmInstance.Instance | FxOrmInstance.Instance[] {
		const inst_arr = Array.isArray(OtherInstance) ? Array.from(OtherInstance) : [ OtherInstance ];

		let results = [] as FxOrmInstance.Instance[] | FxOrmInstance.Instance;
		let hookHandlr = null;

		const $ref = <Fibjs.AnyObject>{
			instance: Instance,
			association: association.reversed ? null : OtherInstance,
			associations: association.reversed ? inst_arr : null,
		};

		if (association.reversed) {
			hookHandlr = genHookHandlerForInstance(() => {
				Instance.saveSync();

				const runReversed = function (other: FxOrmInstance.Instance) {
					Instance.$emit(`before:set:${association.name}`, other)

					Utilities.populateModelIdKeysConditions(Model, Object.keys(association.field), Instance, other, true);
					// link
					other.saveSync({}, { saveAssociations: false });
					
					Instance.$emit(`after:set:${association.name}`, other)

					return other;
				};
				results = Utilities.parallelQueryIfPossible(
					Driver.isPool,
					$ref.associations,
					runReversed
				);
			})
		} else {
			hookHandlr = genHookHandlerForInstance(() => {
				const runNonReversed = function (oinst: FxOrmInstance.Instance) {
					Instance.$emit(`before:set:${association.name}`, oinst)

					oinst.saveSync({}, { saveAssociations: false });

					Instance[association.name] = oinst;
					Utilities.populateModelIdKeysConditions(association.model, Object.keys(association.field), oinst, Instance);

					Instance.$emit(`after:set:${association.name}`, oinst)

					return oinst;
				}
				
				results = runNonReversed($ref.association)
				
				// link
				Instance.saveSync({}, { saveAssociations: false });
			})
		}

		Hook.wait(
			Instance,
			association.hooks[`beforeSet`],
			hookHandlr,
			Utilities.buildAssociationActionHooksPayload('beforeSet', { $ref })
		);
		Hook.trigger(Instance, association.hooks['afterSet']);
		
		return results;
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
	
	// only non-reversed could delete associated instance
	if (!association.reversed && !association.__for_extension) {
		Utilities.addHiddenUnwritableMethodToInstance(Instance, association.delSyncAccessor, function (
		) {
			const $ref = <Fibjs.AnyObject>{
				instance: Instance,
			};
			Hook.wait(
				Instance,
				association.hooks[`beforeRemove`],
				Utilities.hookHandlerDecorator({ thisArg: Instance })(() => {
					Instance.$emit(`before:del:${association.name}`);
					for (let k in association.field) {
						if (association.field.hasOwnProperty(k)) {
							Instance[k] = null;
						}
					}

					Instance.saveSync({}, { saveAssociations: false });
					delete Instance[association.name];
					Instance.$emit(`after:del:${association.name}`)
				}),
				Utilities.buildAssociationActionHooksPayload('beforeRemove', { $ref })
			);
			Hook.trigger(Instance, association.hooks['afterRemove']);

			return this;
		}, {});

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
) {
	if (!Instance.saved())
		return ;

	if (!opts.hasOwnProperty("autoFetchLimit") || typeof opts.autoFetchLimit === "undefined") {
		opts.autoFetchLimit = association.autoFetchLimit;
	}

	if (opts.autoFetchLimit === 0 || (!opts.autoFetch && !association.autoFetch))
		return ;

	/**
	 * When we have a new non persisted instance for which the association field (eg owner_id)
	 * is set, we don't want to auto fetch anything, since `new Model(owner_id: 12)` takes no
	 * callback, and hence this lookup would complete at an arbitrary point in the future.
	 * The associated entity should probably be fetched when the instance is persisted.
	 */
	if (Instance.isPersisted()) {
		Instance[association.getSyncAccessor]({ autoFetchLimit: opts.autoFetchLimit - 1 });
	}

	return ;
}