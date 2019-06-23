import util = require('util')

import Hook = require("../Hook");
import _cloneDeep = require('lodash.clonedeep');
import ORMError   = require("../Error");
import Singleton  = require("../Singleton");
import Utilities  = require("../Utilities");
import Helpers  = require("../Helpers");

import { listFindByChainOrRunSync } from '../Model';
import { defineDefaultExtendsToTableName, defineAssociationAccessorMethodName, ACCESSOR_KEYS, addAssociationInfoToModel } from "./_utils";

function noOperation (...args: any[]) {};

/**
 * 
 * @param db orm instance
 * @param Model model
 * @param associations association definitions
 */
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
	const { extend_associations } = assocs;
	const { db } = opts

	Model.extendsTo = function (
		name: string,
		properties: FxOrmModel.DetailedPropertyDefinitionHash,
		assoc_options: FxOrmAssociation.AssociationDefinitionOptions_ExtendsTo
	) {
		assoc_options = assoc_options || {};

		for (let i = 0; i < db.plugins.length; i++) {
			if (typeof db.plugins[i].beforeExtendsTo === "function") {
				db.plugins[i].beforeExtendsTo(Model, {
					association_name: name,
					properties: properties,
					assoc_options
				});
			}
		}

		const associationSemanticNameCore = assoc_options.name || Utilities.formatNameFor("assoc:extendsTo", name);
		const association = <FxOrmAssociation.InstanceAssociationItem_ExtendTos>{
			name           : name,
			model		   : null,
			table          : assoc_options.table || defineDefaultExtendsToTableName(Model.table, name),
			reverse        : assoc_options.reverse,
			// reversed       : assoc_options.reversed,
			autoFetch      : assoc_options.autoFetch || false,
			autoFetchLimit : assoc_options.autoFetchLimit || 2,
			field          : Utilities.wrapFieldObject({
				field: assoc_options.field,
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

			hooks: {...assoc_options.hooks},
		};
		Utilities.fillSyncVersionAccessorForAssociation(association);
		Utilities.addHookPatchHelperForAssociation(association);
		
		const newProperties: FxOrmModel.DetailedPropertyDefinitionHash = _cloneDeep(properties);
		const assoc_field = association.field as FxOrmProperty.NormalizedPropertyHash

		for (let k in assoc_field) {
		    newProperties[k] = assoc_field[k];
		}

		const modelOpts: FxOrmModel.ModelOptions = util.extend(
			util.pick(assoc_options, 'identityCache', 'autoSave', 'cascadeRemove', 'hooks', 'methods', 'validations'),
			{
				id        : Object.keys(assoc_field),
				__for_extension : true,
			}
		);

		association.model = db.define(association.table, newProperties, modelOpts);
		
		association.model.hasOne(association.reverse || Model.table, Model, {
			__for_extension: true,
			field: assoc_field,
			reverse: null,
			reversed: false,
			hooks: assoc_options.reverseHooks
		});

		extend_associations.push(association);

		const findByAccessorChainOrRunSync = function (is_sync: boolean = false) {
			return function () {
				var cb: FxOrmModel.ModelMethodCallback__Find = null,
					conditions: FxOrmModel.ModelQueryConditions__Find = null,
					options: FxOrmAssociation.ModelAssociationMethod__FindOptions = {};

				const args = Array.prototype.slice.apply(arguments)
				Helpers.selectArgs(args, (arg_type, arg) => {
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
				});

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
			}
		};
		
		Model[association.modelFindByAccessor] = findByAccessorChainOrRunSync();
		Model[association.modelFindBySyncAccessor] = findByAccessorChainOrRunSync(true);

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
	Driver: FxOrmDMLDriver.DMLDriver,
	associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[],
	cfg: {
		assoc_opts: FxOrmAssociation.AssociationDefinitionOptions_HasOne,
		genHookHandlerForInstance: Function
	}
) {
	for (let i = 0; i < associations.length; i++) {
		extendInstance(Model, Instance, Driver, associations[i], cfg);
	}
};

export function autoFetch (
	Instance: FxOrmInstance.Instance,
	associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[],
	opts: FibOrmNS.ModelAutoFetchOptions,
	parallel: boolean = false
) {
	if (associations.length === 0) {
		return ;
	}

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
	association: FxOrmAssociation.InstanceAssociationItem_ExtendTos,
	cfg: {
		assoc_opts: FxOrmAssociation.AssociationDefinitionOptions_HasOne,
		genHookHandlerForInstance: Function
	}
) {
	const { genHookHandlerForInstance } = cfg

	Utilities.addHiddenPropertyToInstance(Instance, association.hasSyncAccessor, function () {
		if (!Instance[Model.id + ''])
			throw new ORMError("Instance not saved, cannot get extension", 'NOT_DEFINED', { model: Model.table });
			
		try {
			return !!association.model.getSync(Utilities.values(Instance, Model.id));
		} catch (error) {
			if (!Model.settings.get('extendsTo.throwWhenNotFound') && error.literalCode === 'NOT_FOUND') return false
			throw error
		}
	});

	Utilities.addHiddenPropertyToInstance(Instance, association.hasAccessor, function (cb: FxOrmNS.GenericCallback<boolean>) {
		process.nextTick(() => {
			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod<boolean>(Instance[association.hasSyncAccessor]);
			syncResponse.result = !!syncResponse.result;
			Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: true, callback: cb })
		});

		return this;
	});

	Utilities.addHiddenPropertyToInstance(Instance, association.getSyncAccessor, function (opts: FxOrmModel.ModelOptions__Get = {}) {
		if (!Instance[Model.id + ''])
			throw new ORMError("Instance not saved, cannot get extension", 'NOT_DEFINED', { model: Model.table });
		
		try {
			return association.model.getSync(Utilities.values(Instance, Model.id), opts);
		} catch (error) {
			if (!Model.settings.get('extendsTo.throwWhenNotFound') && error.literalCode === 'NOT_FOUND') return null
			throw error
		}
	});

	Utilities.addHiddenPropertyToInstance(Instance, association.getAccessor, function () {
		let opts: FxOrmModel.ModelOptions__Get = {};
		let cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>

		const args = Array.prototype.slice.apply(arguments)
		Helpers.selectArgs(args, (arg_type, arg) => {
			switch (arg_type) {
				case "function":
					cb = arg;
					break;
				case "object":
					opts = arg;
					break;
			}
		});

		process.nextTick(() => {
			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod<FxOrmInstance.Instance>(Instance[association.getSyncAccessor], [ opts ]);
			Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: true, callback: cb })
		});

		return this;
	});

	Utilities.addHiddenPropertyToInstance(Instance, association.setSyncAccessor, function (
		Extension: FxOrmInstance.Instance | FxOrmInstance.InstanceDataPayload
	) {
		const $ref = <Fibjs.AnyObject>{
			instance: Instance,
			association: Extension,
			useChannel: Utilities.reusableChannelGenerator()
		};
		Hook.wait(
			Instance,
			association.hooks[`beforeSet`],
			genHookHandlerForInstance(() => {
				let Extension = $ref.association
				Instance.$emit(`before:set:${association.name}`, Extension);

				Instance.saveSync();
				
				Instance.$emit(`before-del-extension:${association.setAccessor}`);
				Instance[association.delSyncAccessor]();
				Instance.$emit(`after-del-extension:${association.setAccessor}`);

				const fields = Object.keys(association.field);

				if (!Extension.isInstance) {
					$ref.association = Extension = new association.model(Extension);
				}

				for (let i = 0; i < Model.id.length; i++) {
					Extension[fields[i]] = Instance[Model.id[i]];
				}

				Instance.$emit(`before-save-extension:${association.setAccessor}`, Extension);
				Extension.saveSync();
				Instance.$emit(`after-save-extension:${association.setAccessor}`, Extension);
				
				Instance.$emit(`after:set:${association.name}`, Extension);
			}),
			Utilities.buildAssociationActionHooksPayload('beforeSet', { $ref })
		);
		
		Hook.trigger(Instance, association.hooks['afterSet'], Utilities.buildAssociationActionHooksPayload('afterSet', { $ref }));

		return $ref.association;
	});

	Utilities.addHiddenPropertyToInstance(Instance, association.setAccessor, function (
		Extension: FxOrmInstance.Instance | FxOrmInstance.InstanceDataPayload,
		cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance>
	) {
		process.nextTick(() => {
			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod(Instance[association.setSyncAccessor], [ Extension ]);
			Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: true, callback: cb })
		});
		
		return this;
	});

	Utilities.addHiddenPropertyToInstance(Instance, association.delSyncAccessor, function () {
		if (!Instance[Model.id + ''])
			throw new ORMError("Instance not saved, cannot get extension", 'NOT_DEFINED', { model: Model.table });

		const conditions: {[k: string]: any} = {};
		const fields = Object.keys(association.field);

		for (let i = 0; i < Model.id.length; i++) {
			conditions[fields[i]] = Instance[Model.id[i]];
		}

		const $ref = <Fibjs.AnyObject>{
			instance: Instance,
			removeConditions: conditions,
			useChannel: Utilities.reusableChannelGenerator()
		};
		Hook.wait(
			Instance,
			association.hooks[`beforeRemove`],
			genHookHandlerForInstance(() => {
				const extensions = association.model.findSync($ref.removeConditions)

				Instance.$emit(`before:del:${association.name}`, extensions);
				for (let i = 0; i < extensions.length; i++) {
					Singleton.clear(extensions[i].__singleton_uid() + '');
					extensions[i].removeSync();
				}
				Instance.$emit(`after:del:${association.name}`, extensions);
			}),
			Utilities.buildAssociationActionHooksPayload('beforeRemove', { $ref })
		);

		Hook.trigger(Instance, association.hooks['afterRemove'], Utilities.buildAssociationActionHooksPayload('afterRemove', { $ref }));

		return ;
	});

	Utilities.addHiddenPropertyToInstance(Instance, association.delAccessor, function (cb: FxOrmNS.ExecutionCallback<FxOrmInstance.Instance, FxOrmInstance.Instance>) {
		process.nextTick(() => {
			const syncResponse = Utilities.exposeErrAndResultFromSyncMethod<void>(Instance[association.delSyncAccessor]);
			Utilities.throwErrOrCallabckErrResult(syncResponse, { no_throw: true, callback: cb })
		});

		return this;
	});
}

function autoFetchInstance(
	Instance: FxOrmInstance.Instance,
	association: FxOrmAssociation.InstanceAssociationItem_ExtendTos,
	opts: FibOrmNS.InstanceAutoFetchOptions,
) {
	if (!Instance.saved())
		return ;

	if (!opts.hasOwnProperty("autoFetchLimit") || typeof opts.autoFetchLimit == "undefined") {
		opts.autoFetchLimit = association.autoFetchLimit;
	}

	if (opts.autoFetchLimit === 0 || (!opts.autoFetch && !association.autoFetch))
		return ;

	if (Instance.isPersisted()) {
		try {
			const Assoc = Instance[association.getSyncAccessor]({ autoFetchLimit: opts.autoFetchLimit - 1 })
			Instance[association.name] = Assoc;
		} catch (err) {}
	}

	return ;
}
