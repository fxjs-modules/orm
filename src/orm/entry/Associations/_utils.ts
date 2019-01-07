export function defineDefaultExtendsToTableName (modelTableName: string, assocName: string): string {
	return `${modelTableName}_${assocName}`
}

export function defineAssociationAccessorMethodName (prefixer: 'get' | 'set' | 'has' | 'remove', assocName: string): string {
	return `${prefixer}${assocName}`
}
