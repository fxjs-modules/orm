export function isEmptyPlainObject (input: any) {
    return input && typeof input === 'object' && Object.keys(input).length === 0
}

export function mapObjectToTupleList (input: object | any[]) {
  if (!input || typeof input !== 'object') return null

  return Array.isArray(input) ? input : Object.entries(input).map(([k, v]) => ({[k]: v}))
}
