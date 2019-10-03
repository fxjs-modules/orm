export function arraify<T = any> (item: T | T[]): T[] {
	return Array.isArray(item) ? item : [item]
}