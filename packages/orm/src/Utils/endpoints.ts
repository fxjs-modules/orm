export function parseCollColumn(
    input: string,
    source_collection: string = ''
): { collection: string, column: string } {
    let collection, column
    const [_1, _2] = input.split('.')
    if (input.indexOf('.') > 0) {
        collection = _1
        column = _2
    } else {
        collection = source_collection
        column = _1
    }
    return { collection, column }
}

export function normalizeCollectionColumn(
    input: string,
    source_collection: string = ''
) {
    const {collection, column} = parseCollColumn(input, source_collection)

    return `${collection ? collection + '.' : ''}${column}`
}