import { snowflakeUUID } from "./uuid";

export function encodeColumn (column: string, prefix: string) {
    return `${prefix}${column}`
}

export function docodeColumn (str: string, prefix: string, prefix_len: number = prefix.length)  {
    if (str.slice(0, prefix_len) === prefix)
        return str.slice(prefix_len)

    return str
}

export function getRefPrefixInfo () {
    const uuid = snowflakeUUID()
    const sprefix = `s${uuid}_`
    const tprefix = `t${uuid}_`
    const mprefix = `m${uuid}_`

    return {
        sprefix, splen: sprefix.length,
        tprefix, tplen: tprefix.length,
        mprefix, mplen: mprefix.length
    }
}