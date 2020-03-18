export function snapshot(input: any) {
    switch (input) {
        case undefined:
            return undefined
        default:
            return JSON.parse(JSON.stringify(input));
    }
}