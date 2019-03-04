export function defineDefaultExtendsToTableName (modelTableName: string, assocName: string): string {
	return `${modelTableName}_${assocName}`
}

export function defineAssociationAccessorMethodName (
	prefixer: 'get' | 'set' | 'has' | 'remove' | 'findBy',
	assocName: string
): string {
	return `${prefixer}${assocName}`
}

export const ACCESSOR_KEYS = {
	"get": "get" as 'get',
	"set": "set" as 'set',
	"has": "has" as 'has',
	"del": "remove" as 'remove',
	"modelFindBy": "findBy" as 'findBy'
};
