/// <reference lib="es6" />

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

export function getMapsToFromProperty (property: FxOrmProperty.NormalizedProperty) {
	return property.mapsTo || property.name
}

export function cutOffAssociatedModelFindOptions (
	findby_options: FxOrmAssociation.ModelAssociationMethod__FindByOptions,
	assocNameTplName: string
) {
	let opts = null;
	if (findby_options.hasOwnProperty(assocNameTplName)) {
		const k = `${assocNameTplName}_find_options`;
		opts = findby_options[k];
		
		delete findby_options[k]
	}
		return 
	
	return opts
}

export function addAssociationInfoToModel (
	Model: FxOrmModel.Model,
	association_name: string,
	opts: {
		type: FxOrmAssociation.AssociationType
		association: FxOrmAssociation.InstanceAssociationItem
	}
): FxOrmModel.Model['associations'][string] {
	if (opts.type === 'extendsTo') {
		Model.associations[association_name] = {
			type: opts.type,
			association: opts.association
		};
	} else {
		Model.associations[association_name] = {
			type: opts.type,
			association: opts.association
		};
	}
	

	return Model.associations[association_name];
}