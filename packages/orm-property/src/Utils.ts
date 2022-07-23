import { IProperty, ITransformCtx } from "./Property"

export function filterPropertyDefaultValue (
    property: IProperty,
    ctx: ITransformCtx
) {
    let _dftValue
    if (property.hasOwnProperty('defaultValue'))
        if (typeof property.defaultValue === 'function') {
            _dftValue = property.defaultValue(ctx)
        } else
            _dftValue = property.defaultValue

    return _dftValue
}

export const enum COLUMN_NUMER_TYPE_IDX {
    SHORT = 2,
    INTEGER = 4,
    LONG = 8,

    FLOAT = 4,
    DOUBLE = 8,
}