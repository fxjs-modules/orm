export function snapshot(input: any) {
    return JSON.parse(JSON.stringify(input));
}