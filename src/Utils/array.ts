export function arraify<T = any> (item: T | T[]): T[] {
	return Array.isArray(item) ? item : [item]
}

export function idify<T = any> (item: T | T[]): T {
  return Array.isArray(item) ? item[0] : item
}


export function preDestruct (input: any[]) {
  return [input.slice(0, input.length - 1), input[input.length - 1]]
}

export function postDestruct (input: any[]) {
  return [input[0], input.slice(1)]
}

export function isEmptyArray (input: any) {
  return Array.isArray(input) && !input.length
}

export function deduplication (
  input: any[],
  get_id: (item: FxOrmTypeHelpers.FlattenIfArray<typeof input>, idx: number) => string | number
): typeof input {
  const ids = <{[k: string]: {
    idx: number,
    p: FxOrmTypeHelpers.FlattenIfArray<typeof input>
  }}>{}
  const results = <typeof input>[]

  let _t, id: any, _idx: number
  input.forEach((item, index) => {
    id = get_id(item, index);
    _t = typeof id;
    if (_t === 'number' && !isNaN(id)) {
      id = id + ''
      _t = 'string'
    }

    if (!id || _t !== 'string')
      throw new Error(`[deduplication] get_id callback must return one non-empty string or number, but got (value: \`${id}\`, type: ${_t})`)
    
      if (!ids.hasOwnProperty(id)) {
        _idx = results.push(item) - 1
        ids[id] = { idx: _idx, p: item }
      } else {
        _idx = ids[id].idx
        ids[id].p = results[_idx] = item
      }
  })

  return results
}