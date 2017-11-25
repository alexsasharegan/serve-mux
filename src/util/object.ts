export function hasOwn(o: object, k: string): boolean {
	return Object.prototype.hasOwnProperty.call(o, k)
}
