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
