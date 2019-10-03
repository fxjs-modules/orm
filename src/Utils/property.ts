function getPropertyConfig (overwrite?: Fibjs.AnyObject): FxOrmProperty.NormalizedProperty {
    const {
        name: pname = '',
        mapsTo = pname
    } = overwrite || {} as any
    
    return {
        name: pname,
        type: '',
        size: 0,
        mapsTo: mapsTo,

        key: false,
        unique: false,
        index: false,
        serial: false,
        primary: false,
        required: false,

        unsigned: false,
        rational: false,

        time: false,

        big: false,

        values: null,

        defaultValue: () => null,
        ...overwrite
    }
}

export function filterProperty (
    input: FxOrmModel.ComplexModelPropertyDefinition,
    pname: string = input && (input as any['mapsTo']) ? (input as any['mapsTo']) : null
): FxOrmProperty.NormalizedProperty {
    // built-in types
    switch (input) {
        case Boolean:
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'boolean',
            })
        case String:
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'text',
                size: 255,
            })
        case Number:
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'integer',
                size: 4,

                unsigned: true,
            })
        case Date:
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'date',
                time: true,
            })
        case Buffer:
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'binary',
                big: false,
            })
        case 'password':
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'text',
            })
        case 'uuid':
            return getPropertyConfig({
                name: pname,
                mapsTo: pname,
                type: 'text'
            })
    }

    if (Array.isArray(input))
        return getPropertyConfig({
            name: pname,
            mapsTo: pname,
            type: 'enum',
            values: input
        })

    if (!input || typeof input !== 'object')
        throw new Error('property must be valid descriptor or built-in type')
    
    if (input instanceof Function)
        throw new Error(`invalid property type 'function'`)
    
    return getPropertyConfig({
        ...input,
        name: pname,
        mapsTo: (input as any).mapsTo || pname
    });
}