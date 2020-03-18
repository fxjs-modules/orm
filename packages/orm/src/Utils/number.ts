export function coerceNumber (input: any) {
    if (typeof input !== 'number' || isNaN(input))
        return 0

    return input
}