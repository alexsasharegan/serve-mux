export function Bind<T extends Function>(
	target: object,
	_propertyKey: string,
	descriptor: TypedPropertyDescriptor<T>
): void {
	if (!descriptor.value) {
		throw new TypeError()
	}

	descriptor.value = descriptor.value.bind(target)
}
