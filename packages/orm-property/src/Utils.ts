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