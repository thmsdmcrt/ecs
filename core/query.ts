import {store} from './component.js';
import {entities} from './entity.js';

/**
 * [createQuery description]
 * @param {number[]} ...bits [description]
 * @return {{entities: Record<string, any>[]}}
 */
export default function createQuery(
	...bits: number[]
): {
	readonly entities: Record<string, any>[]
} {
	let includes: number[] = [];
	let include: number = 0;
	let exclude: number = 0;
	let matches: number[] = [];
	let length: number = 0;
	let results: Record<string, any>[] = [];

	for (let bit of bits) {
		if (bit < 0) exclude |= -bit;
		if (bit > 0) {
			includes = [...includes, bit];
			include |= bit;
		}
	}

	return {
		get entities() {
			for (let bit of includes) {
				if (matches.length > 0 &&
					matches.length < store[bit].length) {
					continue;
				}
				matches = store[bit];
			}

			if (matches.length === length) return results;

			results.length = 0;
			length = matches.length;

			for (let entity of matches) {
				let {mask, components} = entities[entity];
				let inc = (mask & include) === include;
				let exc = (mask & exclude) !== exclude;
				if ((exclude === 0 && inc) || (inc && exc)) {
					results.push(components);
				}
			}

			return results;
		},
	};
}
