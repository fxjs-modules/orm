export = function defineRef (
    this: FxOrmModel.Class_Model,
    ...args: FxOrmTypeHelpers.Parameters<FxOrmModel.Class_Model['hasMany']>
) {
    const [ otherModel = this, opts ] = args;

    const { type = 'm2m', ...rest } = opts || {}

    switch (type) {
        case 'm2m':
            return otherModel.belongsToMany(this)
        case 'o2m':
            return this.hasManyExclusively(otherModel, rest)
    }
}
