import Property from "./Property"

export class AssociationProperty extends Property implements FxOrmAssociation.Class_AssociationProperty {
    $collection: string
    $association: FxOrmAssociation.Class_Association

    static New (...args: FxOrmTypeHelpers.Parameters<typeof FxOrmAssociation.Class_AssociationProperty['New']>) {
        return new AssociationProperty(...args)
    }
    
    constructor (
        input: FxOrmTypeHelpers.FirstParameter<typeof FxOrmAssociation.Class_AssociationProperty['New']>,
        opts: FxOrmTypeHelpers.SecondParameter<typeof FxOrmAssociation.Class_AssociationProperty['New']>
    ) {
        const { association, collection } = opts || {};
        if (!association) throw new Error(`[AssociationProperty] association is required!`)
        // if (!(association instanceof Association)) throw new Error(`[AssociationProperty] association must be valid Association instance!`)
        
        super(input, opts)

        this.$association = association
        this.$collection = collection
    }
}