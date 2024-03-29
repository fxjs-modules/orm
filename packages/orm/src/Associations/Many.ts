/// <reference lib="es5" />

import util = require('util');

import _flatten = require('lodash.flatten')

import Hook = require("../Hook");
import Settings = require("../Settings");
import Property = require("../Property");
import ORMError from "../Error";
import Utilities = require("../Utilities");
import { ACCESSOR_KEYS, addAssociationInfoToModel, getMapsToFromPropertyHash } from './_utils';
import { listFindByChainOrRunSync } from '../Model';
import * as Helpers from '../Helpers';

import type { FxOrmInstance } from '../Typo/instance';
import type { FxOrmAssociation } from '../Typo/assoc';
import type { FxOrmError } from '../Typo/Error';
import type { FxOrmCommon } from '../Typo/_common';
import type { FxOrmModel } from '../Typo/model';
import type { FxOrmDMLDriver } from '../Typo/DMLDriver';
import type { FxOrmProperty } from '../Typo/property';
import type { FxOrmNS } from '../Typo/ORM';
import type { FxOrmQuery } from '../Typo/query';

import type {
	FxSqlQuerySubQuery
} from '@fxjs/sql-query';

function noOperation (...args: any[]) {};

function throwErrorIfExtraPropertyNameRepeat(
	hostModel: FxOrmModel.Model,
	extraProps: FxOrmAssociation.InstanceAssociationItem_HasMany['props']
) {
	Object.entries(extraProps).forEach(([eKey]) => {
		if (hostModel.allProperties[eKey]) {
			throw new ORMError(
				`disallow defining same name extra property '${eKey}' with property on model '${hostModel.name}'`,
				'BAD_MODEL',
				{ repeatKey: eKey }
			)
		}
	});
}

export function prepare(
	Model: FxOrmModel.Model,
	assocs: {
		one_associations: FxOrmAssociation.InstanceAssociationItem_HasOne[],
		many_associations: FxOrmAssociation.InstanceAssociationItem_HasMany[],
		extend_associations: FxOrmAssociation.InstanceAssociationItem_ExtendTos[],
	},
	opts: {
		db: FxOrmNS.ORM,
	}
) {
	const { many_associations } = assocs;
	const { db } = opts

	Model.hasMany = function () {
		Utilities.disAllowOpForVModel(Model, 'model.hasMany');

		let name: string,
			makeKey: boolean,
			mergeId: Record<string, FxOrmProperty.NormalizedProperty>,
			mergeAssocId: Record<string, FxOrmProperty.NormalizedProperty>;

		let OtherModel: FxOrmModel.Model = Model;
		let props: Record<string, FxOrmProperty.NormalizedProperty> | Record<string, FxOrmModel.ModelPropertyDefinition> = null;
		let assoc_options: FxOrmAssociation.AssociationDefinitionOptions_HasMany = {};

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
						assoc_options = arguments[i];
					}
					break;
			}
		}

		Utilities.disAllowOpForVModel(OtherModel, 'associated by model.hasMany');

		for (let i = 0; i < db.plugins.length; i++) {
			if (typeof db.plugins[i].beforeHasMany === "function") {
				db.plugins[i].beforeHasMany(Model, {
					association_name: name,
					ext_model: OtherModel,
					assoc_props: props,
					assoc_options
				});
			}
		}

		if (props === null) {
			props = {};
		} else {
			for (let k in props) {
				props[k] = Property.normalize({
					prop: props[k] as FxOrmModel.ComplexModelPropertyDefinition,
					name: k,
					customTypes: db.customTypes,
					settings: Model.settings
				});
			}
		}
		// restrain association.props[any].name not same with Model[any].name
		throwErrorIfExtraPropertyNameRepeat(OtherModel, props);

		makeKey = assoc_options.key || Settings.defaults().hasMany.key;

		mergeId = Utilities.convertPropToJoinKeyProp(
			Utilities.wrapFieldObject({
				field: assoc_options.mergeId, model: Model, altName: Model.table
			}) ||
			Utilities.formatAssociatedField(Model, Model.table, true, assoc_options.reversed),
			{ makeKey: makeKey, required: true }
		);

		mergeAssocId = Utilities.convertPropToJoinKeyProp(
			Utilities.wrapFieldObject({
				field: assoc_options.mergeAssocId, model: OtherModel, altName: name
			}) ||
			Utilities.formatAssociatedField(OtherModel, name, true, assoc_options.reversed),
			{ makeKey: makeKey, required: true }
		)

		const associationSemanticNameCore = assoc_options.name || Utilities.formatNameFor("assoc:hasMany", name);
		
		const fieldhash = Utilities.wrapFieldObject({ field: assoc_options.field, model: OtherModel, altName: Model.table }) || Utilities.formatAssociatedField(Model, name, true, assoc_options.reversed)
		const association = <FxOrmAssociation.InstanceAssociationItem_HasMany>{
			name: name,
			model: OtherModel,
			props: props,
			autoFetch: assoc_options.autoFetch || false,
			autoFetchLimit: assoc_options.autoFetchLimit || 2,
			// I'm not sure the next key is used..
			field: fieldhash,
			mergeTable: assoc_options.mergeTable || (Model.table + "_" + name),
			mergeId: mergeId,
			mergeAssocId: mergeAssocId,
			getAccessor: assoc_options.getAccessor || (ACCESSOR_KEYS.get + associationSemanticNameCore),
			setAccessor: assoc_options.setAccessor || (ACCESSOR_KEYS.set + associationSemanticNameCore),
			hasAccessor: assoc_options.hasAccessor || (ACCESSOR_KEYS.has + associationSemanticNameCore),
			delAccessor: assoc_options.delAccessor || (ACCESSOR_KEYS.del + associationSemanticNameCore),
			addAccessor: assoc_options.addAccessor || (ACCESSOR_KEYS.add + associationSemanticNameCore),

			modelFindByAccessor: assoc_options.modelFindByAccessor || (ACCESSOR_KEYS.modelFindBy + associationSemanticNameCore),

			hooks: {...assoc_options.hooks},
		};
		Utilities.fillSyncVersionAccessorForAssociation(association);
		Utilities.addHookPatchHelperForAssociation(association);

		many_associations.push(association);

		if (assoc_options.reverse) {
			OtherModel.hasMany(assoc_options.reverse, Model, association.props, {
				reversed: true,
				association: assoc_options.reverseAssociation,
				mergeTable: association.mergeTable,
				mergeId: association.mergeAssocId,
				mergeAssocId: association.mergeId,
				field: fieldhash,
				autoFetch: association.autoFetch,
				autoFetchLimit: association.autoFetchLimit,
				hooks: assoc_options.reverseHooks
			});
		}

		const findByAccessorChainOrRunSync = function (is_sync: boolean = false) {
			return function () {
				var cb: FxOrmModel.ModelMethodCallback__Find = null,
					conditions: FxOrmModel.ModelQueryConditions__Find = null,
					right_find_opts: FxOrmAssociation.ModelAssociationMethod__FindByOptions = null;

				for (let i = 0; i < arguments.length; i++) {
					switch (typeof arguments[i]) {
						case "function":
							cb = arguments[i];
							break;
						case "object":
							if (conditions === null) {
								conditions = { ...arguments[i] };
							} else if (right_find_opts === null) {
								right_find_opts = arguments[i];
							}
							break;
					}
				}

				if (conditions === null) {
					throw new ORMError(`.${association.modelFindByAccessor}() is missing a conditions object`, 'PARAM_MISMATCH');
				}

				right_find_opts = right_find_opts || {};

				const extraWhere = Utilities.extractHasManyExtraConditions(association, conditions)
				// only set exists conditions when extraWhere is not empty
				if (Object.keys(extraWhere).length > 0) {
					// always set it only 1 element
					right_find_opts.exists = [{
						table: '',
						link: ['', ''],
						conditions: {}
					}];

					right_find_opts.exists.forEach(exists => {
						exists.table = association.mergeTable;
	
						// TODO: how to link complex associated fields?
						exists.link = [
							getMapsToFromPropertyHash(association.mergeAssocId)[0],
							association.model.keys[0]
						]
						
						exists.conditions = extraWhere;
	
						if (!Object.keys(exists.conditions).length) {
							throw new ORMError(`"assocConditions.exists[number].conditions" is required on ".${association.modelFindByAccessor}(conds, assocConditions)"!`, 'PARAM_MISMATCH');
						}
	
						return exists;
					})
				}

				return listFindByChainOrRunSync(Model, 
					{},
					[
						{
							association_name: association.name,
							conditions: conditions
						},
					],
					right_find_opts,
					{ callback: cb, is_sync }
				);
			}
		}

		Model[association.modelFindByAccessor] = findByAccessorChainOrRunSync();
		Model[association.modelFindBySyncAccessor] = findByAccessorChainOrRunSync(true);

		addAssociationInfoToModel(Model, name, {
			type: 'hasMany',
			association: association
		});

		return this;
	};
};

export function extend(
	Model: FxOrmModel.Model,
	Instance: FxOrmInstance.Instance,
	Driver: FxOrmDMLDriver.DMLDriver,
	associations: FxOrmAssociation.InstanceAssociationItem_HasMany[],
	cfg: {
		assoc_opts: FxOrmAssociation.AssociationDefinitionOptions_HasMany,
	}
) {
	for (let i = 0; i < associations.length; i++) {
		extendInstance(Model, Instance, Driver, associations[i], cfg);
	}
};

export function autoFetch(
	Instance: FxOrmInstance.Instance,
	associations: FxOrmAssociation.InstanceAssociationItem_HasMany[],
	opts: FxOrmAssociation.AssociationDefinitionOptions_HasMany,
	parallel: boolean = false
) {
	if (associations.length === 0)
		return ;

	Utilities.parallelQueryIfPossible(
		parallel,
		associations,
		(item) => autoFetchInstance(Instance, item, opts)
	)
};

function adjustForMapsTo(properties: Record<string, FxOrmProperty.NormalizedProperty>, field: string[]) {
	if (!field)
		return ;

	/**
	 * Loop through the (cloned) association model id fields ... some of them may've been mapped to different
	 * names in the actual database - if so update to the mapped database column name
	 */
	for (let i = 0; i < field.length; i++) {
		var idProp = properties[field[i]];
		if (idProp && idProp.mapsTo) {
			field[i] = idProp.mapsTo;
		}
	}
}

function mapKeysToString (keys: string[], item: FxOrmInstance.Instance) {
	return util.map(keys, function (k: string) {
		return item[k];
	}).join(',')
}

function extendInstance(
	Model: FxOrmModel.Model,
	Instance: FxOrmInstance.Instance,
	Driver: FxOrmDMLDriver.DMLDriver,
	association: FxOrmAssociation.InstanceAssociationItem_HasMany,
	cfg: {
		assoc_opts: FxOrmAssociation.AssociationDefinitionOptions_HasMany
	}
) {
	if (Model.settings.get("instance.cascadeRemove")) {
		Instance.on("beforeRemove", function () {
			Instance[association.delAccessor]();
		});
	}

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.hasSyncAccessor, function (...Instances: (FxOrmInstance.Instance | FxOrmInstance.Instance)[]) {
		var conditions = {},
			join_conditions = {},
			options: FxOrmAssociation.ModelAssociationMethod__FindOptions = {};

		if (Instances.length)
			if (Array.isArray(Instances[0]))
				Instances = Instances[0] as any;

		// if (Driver.hasMany) {
		// 	return Driver.hasMany(Model, association)
		// 		.has(Instance, Instances, conditions);
		// }

		options.autoFetchLimit = 0;
		options.__merge = {
			from: { table: association.mergeTable, field: Object.keys(association.mergeAssocId) },
			to: { table: association.model.table, field: association.model.id.slice(0) },   // clone model id
			where: [association.mergeTable, join_conditions],
			table: association.model.table,
			select: []
		};

		adjustForMapsTo(association.model.properties, options.__merge.to.field);

		options.extra = association.props;
		options.extra_info = {
			table: association.mergeTable,
			id: Utilities.values(Instance, Model.id),
			id_prop: Object.keys(association.mergeId),
			assoc_prop: Object.keys(association.mergeAssocId)
		};

		Utilities.populateModelIdKeysConditions(Model, Object.keys(association.mergeId), Instance, options.__merge.where[1]);

		for (let i = 0; i < Instances.length; i++) {
			Utilities.populateModelIdKeysConditions(association.model, Object.keys(association.mergeAssocId), Instances[i], options.__merge.where[1], false);
		}

		const foundItems = association.model.findSync(conditions, options);

		if (util.isEmpty(Instances)) return foundItems.length > 0;

		var foundItemsIDs = Array.from( new Set (
			foundItems.map(item => mapKeysToString(association.model.keys, item))
		));
		var InstancesIDs = Array.from( new Set (
			Instances.map(item => mapKeysToString(association.model.keys, item))
		));

		var sameLength = foundItemsIDs.length === InstancesIDs.length;
		var sameContents = sameLength && util.isEmpty(util.difference(foundItemsIDs, InstancesIDs));

		return sameContents;
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.hasAccessor, function (...Instances: FxOrmInstance.Instance[]) {
		let cb: FxOrmCommon.GenericCallback<boolean>;
		if (typeof util.last(Instances) === 'function')
			cb = Instances.pop() as any;

		process.nextTick(() => {
			const syncResponse = Utilities.catchBlocking<boolean>(Instance[association.hasSyncAccessor], Instances);
			Utilities.takeAwayResult(syncResponse, { callback: cb })
		});

		return this;
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.getAccessor, function (
		this: typeof Instance
	): typeof Instance | FxOrmQuery.IChainFind {
		let options = <FxOrmAssociation.ModelAssociationMethod__GetOptions>{};
		let conditions = null as FxOrmModel.ModelOptions__Find;
		let order = null;
		let cb = null;

		Helpers.selectArgs(arguments, function (arg_type, arg) {
			switch (arg_type) {
				case "function":
					cb = arg;
					break;
				case "object":
					if (Array.isArray(arg)) {
						order = arg;
						order[0] = [association.model.table, order[0]];
					} else {
						if (conditions === null) {
							conditions = { ...arg };
						} else {
							options = arg;
						}
					}
					break;
				case "string":
					if (arg[0] == "-") {
						order = [[association.model.table, arg.substr(1)], "Z"];
					} else {
						order = [[association.model.table, arg]];
					}
					break;
				case "number":
					options.limit = arg;
					break;
			}
		});

		if (order !== null) {
			options.order = order;
		}

		if (conditions === null) conditions = {};

		// extract extra info on conditions
		// populate out conditions in extra, not belonging to either one model of associations
		let extraWhere = Utilities.extractHasManyExtraConditions(association, conditions)
		extraWhere = { ...options.join_where, ...extraWhere };

		options.__merge = {
			from: { table: association.mergeTable, field: Object.keys(association.mergeAssocId) },
			to: { table: association.model.table, field: association.model.id.slice(0) }, // clone model id
			where: [association.mergeTable, extraWhere],
			table: association.model.table,
			select: []
		};

		adjustForMapsTo(association.model.properties, options.__merge.to.field);

		options.extra = association.props;
		options.extra_info = {
			table: association.mergeTable,
			id: Utilities.values(Instance, Model.id),
			id_prop: Object.keys(association.mergeId),
			assoc_prop: Object.keys(association.mergeAssocId)
		};

		Utilities.populateModelIdKeysConditions(Model, Object.keys(association.mergeId), Instance, options.__merge.where[1]);

		if (cb === null)
			return association.model.find(conditions, options);

		association.model.find(conditions, options, cb);

		return this;
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.getSyncAccessor, function (this: typeof Instance, ...args: any[]): FxOrmInstance.Instance[] {
		args = args.filter(x => !util.isFunction(x));

		const chain = Instance[association.getAccessor].apply(Instance, args);

		return chain.runSync();
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.setSyncAccessor, function (this: typeof Instance) {
		const $ref = <FxOrmAssociation.__AssocHooksCtx>{
			instance: Instance,
			associations: _flatten(arguments),
			useChannel: Utilities.reusableChannelGenerator()
		};

		let results: FxOrmInstance.Instance[] = [];

		Hook.wait(
			Instance,
			association.hooks[`beforeSet`],
			Utilities.makeHandlerDecorator({ thisArg: Instance }, () => {
				Instance.$emit(`before:set:${association.name}`, $ref.associations)

				Instance.$emit(`before-del-extension:${association.setAccessor}`)
				Instance[association.delSyncAccessor]();
				Instance.$emit(`after-del-extension:${association.setAccessor}`)

				if (!$ref.associations.length)
					return ;

				Instance.$emit(`before-add-extension:${association.setAccessor}`, $ref.associations)
				results = Instance[association.addSyncAccessor]($ref.associations);
				Instance.$emit(`after-add-extension:${association.setAccessor}`, $ref.associations)
				
				Instance.$emit(`after:set:${association.name}`, $ref.associations)

				if (Instance.__instRtd.keys.length === 1) {
					const [key] = Instance.__instRtd.keys
					$ref.association_ids = $ref.associations.map((x: FxOrmInstance.InstanceDataPayload) => x[key])
				}
			}),
			Utilities.buildAssocHooksContext('beforeSet', { $ref })
		);

		Hook.trigger(Instance, association.hooks[`afterSet`], Utilities.buildAssocHooksContext('afterSet', { $ref }))

		return results;
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.setAccessor, function (this: typeof Instance) {
		// TODO: shold allow passing `extra` as 2nd argument
		const items = _flatten(arguments);
		const cb = typeof util.last(items) === 'function' ? items.pop() : noOperation;

		process.nextTick(() => {
			const syncResponse = Utilities.catchBlocking<boolean>(Instance[association.setSyncAccessor], items);
			Utilities.takeAwayResult(syncResponse, { no_throw: true, callback: cb })
		});

		return this;
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.delAccessor, function (this: typeof Instance, ...args: any[]) {
		var cb: FxOrmCommon.ExecutionCallback<typeof this>;

		Helpers.selectArgs(args, (arg_type, arg, idx) => {
			switch (arg_type) {
				case "function":
					cb = arg;
					break;
			}
		});
		args = args.filter(x => x !== cb);

		process.nextTick(() => {
			const syncResponse = Utilities.catchBlocking<void>(Instance[association.delSyncAccessor], args);
			Utilities.takeAwayResult(syncResponse, { no_throw: true, callback: cb })
		});

		return this;
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.delSyncAccessor, function (this: typeof Instance, ...args: any[]) {
		var Associations: FxOrmAssociation.AssociationDefinitionOptions_HasMany[] = [];

		Helpers.selectArgs(args, (arg_type, arg) => {
			switch (arg_type) {
				case "object":
					if (Array.isArray(arg)) {
						Associations = Associations.concat(arg);
					} else if (arg.isInstance) {
						Associations.push(arg);
					}
					break;
			}
		});

		const conditions = <FxSqlQuerySubQuery.SubQueryConditions>{};

		Utilities.populateModelIdKeysConditions(Model, Object.keys(association.mergeId), Instance, conditions);

		if (!this.saved())
			this.saveSync();

		const $ref = <Record<string, any>>{
			instance: Instance,
			associations: Associations,
			removeConditions: conditions
		};
		Hook.wait(
			Instance,
			association.hooks[`beforeRemove`],
			Utilities.makeHandlerDecorator({ thisArg: Instance }, () => {
				const Associations = $ref.associations
				Instance.$emit(`before:del:${association.name}`)
				if (Driver.hasMany) {
					return [
						Driver.hasMany(Model, association).del(Instance, Associations),
						Instance.$emit(`after:del:${association.name}`)
					][0];
				}

				if (Associations.length === 0) {
					return [
						Driver.remove(association.mergeTable, $ref.removeConditions),
						Instance.$emit(`after:del:${association.name}`)
					][0];
				}

				for (let i = 0; i < Associations.length; i++) {
					Utilities.populateModelIdKeysConditions(association.model, Object.keys(association.mergeAssocId), Associations[i], $ref.removeConditions, false);
				}

				Driver.remove(association.mergeTable, $ref.removeConditions);
				Instance.$emit(`after:del:${association.name}`)
			}),
			Utilities.buildAssocHooksContext('beforeRemove', { $ref })
		);
		
		Hook.trigger(Instance, association.hooks[`afterRemove`], Utilities.buildAssocHooksContext('afterRemove', { $ref }))

		return this;
	});

	const isExtraNonEmpty = function () {
		return !!Object.keys(association.props).length;
	}

	const collectParamsForAdd = function (args: any[]) {
		var Associations: FxOrmAssociation.InstanceAssociatedInstance[] = [];
		var add_opts: {[k: string]: any} = {};

		Helpers.selectArgs(args, (arg_type, arg) => {
			switch (arg_type) {
				case "object":
					if (Array.isArray(arg)) {
						Associations = Associations.concat(arg);
					} else if (arg.isInstance) {
						Associations.push(arg);
					} else {
						add_opts = arg;
					}
					break;
			}
		});

		if (Associations.length === 0) {
			throw new ORMError("No associations defined", 'PARAM_MISMATCH', { model: Model.name });
		}

		return { Associations, add_opts }
	}
	
	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.addSyncAccessor, function (this: typeof Instance) {
		let args: any[]= Array.prototype.slice.apply(arguments);

		const { Associations, add_opts } = collectParamsForAdd(args);

		const savedAssociations: FxOrmAssociation.InstanceAssociatedInstance[] = [];

		const $ref = <Record<string, any>>{
			instance: Instance,
			associations: Associations,
			useChannel: Utilities.reusableChannelGenerator()
		};
		Hook.wait(
			Instance,
			association.hooks[`beforeAdd`],
			Utilities.makeHandlerDecorator({ thisArg: Instance }, () => {
				Instance.$emit(`before:add:${association.name}`, $ref.associations);
				Utilities.parallelQueryIfPossible(
					Driver.isPool,
					$ref.associations,
					(Association) => {
						const saveAssociation = function (err: FxOrmError.ExtendedError) {
							if (err)
								throw err;

							Association.saveSync();

							const data: {[k: string]: any} = {};

							for (let k in add_opts) {
								if (association.props[k]) {
									const mapsTo = association.props[k].mapsTo || k;
									data[mapsTo] = Driver.propertyToValue ? 
										Driver.propertyToValue(add_opts[k], association.props[k])
										: add_opts[k];
								}
							}

							Utilities.populateModelIdKeysConditions(Model, Object.keys(association.mergeId), Instance, data);
							Utilities.populateModelIdKeysConditions(association.model, Object.keys(association.mergeAssocId), Association, data);

							Driver.insert(association.mergeTable, data, null);
							savedAssociations.push(Association);
						};
						
						Instance.$emit(`before-association-save:${association.addAccessor}`, $ref.associations)

						if (isExtraNonEmpty()) {
							Hook.wait(Association, association.hooks.beforeSave, saveAssociation, add_opts);
						} else {
							Hook.wait(Association, association.hooks.beforeSave, saveAssociation);
						}

						$ref.associations = savedAssociations;
						Instance.$emit(`after-association-save:${association.addAccessor}`, savedAssociations)
					}
				)

				if (!this.saved())
					this.saveSync();

				Instance.$emit(`after:add:${association.name}`, savedAssociations)
			}),
			Utilities.buildAssocHooksContext('beforeAdd', { $ref })
		);

		Hook.trigger(Instance, association.hooks[`afterAdd`], Utilities.buildAssocHooksContext('afterAdd', { $ref }))

		return savedAssociations;
	});

	Utilities.addHiddenUnwritableMethodToInstance(Instance, association.addAccessor, function (this: typeof Instance) {
		let args: any[] = Array.prototype.slice.apply(arguments);

		const withExtraProps = isExtraNonEmpty();
		let cb: FxOrmCommon.ExecutionCallback<any> = null;
		Helpers.selectArgs(args, (arg_type, arg) => {
			switch (arg_type) {
				case "function":
					cb = arg;
					break;
			}
		});
		args = args.filter(x => x !== cb);
		collectParamsForAdd(args);

		const errWaitor = Utilities.getErrWaitor(!cb);

		process.nextTick(() => {
			const syncResponse = Utilities.catchBlocking<void>(Instance[association.addSyncAccessor], args);
			Utilities.takeAwayResult(syncResponse, { no_throw: !withExtraProps, callback: cb });

			errWaitor.err = syncResponse.error;
			if (errWaitor.evt) errWaitor.evt.set();
		});

		if (errWaitor.evt) errWaitor.evt.wait();
		
		if (errWaitor.err) throw errWaitor.err;

		return this;
	});

	Object.defineProperty(Instance, association.name, {
		get: function () {
			return Instance.__instRtd.associations[association.name].value;
		},
		set: function (val) {
			Instance.__instRtd.associations[association.name].changed = true;
			Instance.__instRtd.associations[association.name].value = val;
		},
		enumerable: true
	});
}

function autoFetchInstance(
	Instance: FxOrmInstance.Instance,
	association: FxOrmAssociation.InstanceAssociationItem_HasMany,
	opts: FxOrmAssociation.AssociationDefinitionOptions_HasMany,
	// cb: FxOrmNS.GenericCallback<void>
) {
	if (!Instance.saved())
		return ;

	if (!opts.hasOwnProperty("autoFetchLimit") || typeof opts.autoFetchLimit == "undefined") {
		opts.autoFetchLimit = association.autoFetchLimit;
	}

	if (opts.autoFetchLimit === 0 || (!opts.autoFetch && !association.autoFetch))
		return ;
		
	try {
		const Assoc  = Instance[association.getSyncAccessor]({}, { autoFetchLimit: opts.autoFetchLimit - 1 });
		// Set this way to prevent setting 'changed' status
		Instance.__instRtd.associations[association.name].value = Assoc;
	} catch (err) {}
}
