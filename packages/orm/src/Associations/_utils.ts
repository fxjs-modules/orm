/// <reference lib="es6" />

import type { FxOrmAssociation } from "../Typo/assoc";
import type { FxOrmModel } from "../Typo/model";
import type { FxOrmProperty } from "../Typo/property";

export function defineDefaultExtendsToTableName (modelTableName: string, assocName: string): string {
	return `${modelTableName}_${assocName}`
}

type ACCESSOR_PREFIX = 'add' | 'get' | 'set' | 'has' | 'remove' | 'findBy'
export function defineAssociationAccessorMethodName (
	prefixer: ACCESSOR_PREFIX,
	assocName: string
): string {
	return `${prefixer}${assocName}`
}

export const ACCESSOR_KEYS: {[k: string]: ACCESSOR_PREFIX} = {
	/* common :start */
	"get": "get" as 'get',
	"set": "set" as 'set',
	"has": "has" as 'has',
	"del": "remove" as 'remove',
	"modelFindBy": "findBy" as 'findBy',
	/* common :end */
	
	// useful for association `hasMany` 
	"add": "add" as 'add',
};

export function getMapsToFromProperty (property: FxOrmProperty.NormalizedProperty, k: string) {
	return property.mapsTo || k
}

export function getMapsToFromPropertyHash (hash: Record<string, FxOrmProperty.NormalizedProperty>) {
	return Object.keys(hash).map(k => {
		const item = hash[k]

		return item.mapsTo || k
	})
}

export function cutOffAssociatedModelFindOptions (
	findby_options: FxOrmAssociation.ModelAssociationMethod__FindByOptions,
	association_name: string
) {
	let opts = null;

	const k = `find_options:${association_name}`;
	if (findby_options.hasOwnProperty(k)) {
		opts = findby_options[k];
		
		delete findby_options[k]
	}
		return 
	
	return opts
}

export function addAssociationInfoToModel (
	Model: FxOrmModel.Model,
	association_name: string,
	opts: FxOrmModel.Model['associations'][any]
): FxOrmModel.Model['associations'][string] {
	Model.associations[association_name] = {
		type: opts.type,
		association: opts.association
	} as FxOrmModel.Model['associations'][any];
	
	return Model.associations[association_name];
}