export type Primitive = string | number | boolean | null
export type PrimitiveArray = string[] | number[] | boolean[] | null[]
export type QueryObject = {
	[index: string]: Primitive | PrimitiveArray
}
/**
 * RegExpURL matches URLs containing a query string.
 * - [0] full match
 * - [1] base url
 * - [2] query string
 * - [3] hash (without #)
 */
const RegExpURL = /^(.*)\?([^#]*)(?:#(.*))?$/
/**
 * RegExpListKey matches a URL key/value pair that uses array syntax (`key[]=value`).
 * - [0] full match
 * - [1] key
 * - [2] index
 * - [3] value
 */
const RegExpListKey = /^(.+)\[(\d*)]=(.+)$/

export function DecodeQuery(queryString: string) {
	let decoded: object = Object.create(null),
		matches: string[] | null = null,
		k = "",
		v = ""

	// Test for a full URL. If match, extract query.
	if (RegExpURL.test(queryString) && (matches = RegExpURL.exec(queryString)) != null) {
		queryString = matches[2]
		matches = null
	}

	for (const kvPair of queryString.split("&")) {
		// Test for list key items (`key[]=value`).
		if (RegExpListKey.test(kvPair) && (matches = RegExpListKey.exec(kvPair)) != null) {
			k = decodeURIComponent(matches[1])
			v = decodeURIComponent(matches[3])
			matches = null
			if (!Array.isArray(decoded[k])) {
				decoded[k] = []
			}
			decoded[k].push(v)
			continue
		}

		;[k, v] = kvPair.split("=")
		if (!k) {
			continue
		}

		decoded[decodeURIComponent(k)] = decodeURIComponent(v)
	}

	return decoded
}

export function EncodeQuery(data: QueryObject) {
	let encoded: string[] = [],
		e = encodeURIComponent,
		k: string,
		v: Primitive | PrimitiveArray,
		val: Primitive

	for (k of Object.getOwnPropertyNames(data)) {
		v = data[k]
		if (typeof v == "function" || v === undefined) {
			continue
		}

		if (Array.isArray(v)) {
			for (val of v) {
				encoded.push(e(k) + "[]=" + e(val.toString()))
			}
			continue
		}

		encoded.push(e(k) + "=" + e(v.toString()))
	}

	return encoded.join("&")
}
