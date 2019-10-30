export function encodeColumn (column: string, prefix: string) {
    return `${prefix}${column}`
}

export function docodeColumn (str: string, prefix: string, prefix_len: number = prefix.length)  {
    if (str.slice(0, prefix_len) === prefix)
        return str.slice(prefix_len)

    return str
}
