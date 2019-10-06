export function isEmptyPlainObject (input: any) {
    return input && typeof input === 'object' && Object.keys(input).length === 0
}