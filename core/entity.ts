import {registry, store} from './component.js';

export let entities: Record<
	string,
	{mask: number, components: Record<string, any>}
> = {};

let count = 0;

/**
 * [createEntity description]
 * @param  {Array<number | [number,      any?]>} ...descriptors [description]
 * @return {number}            [description]
 */
export default function createEntity(
	...descriptors: Array<number | [number, any?]>
): number {
	let id: number = count++;
	let components: Record<string, any> = {};
	let mask: number = 0;

	for (let descriptor of descriptors) {
		let [bit, ...args] = (
			Array.isArray(descriptor) ?
				descriptor :
				[descriptor]
		) as [number, any?];

		let [value, label] = registry[bit];
		let type = typeof value;

		store[bit] = store[bit] || [];
		store[bit] = [...store[bit], id];

		if (type === 'function') {
			components[label || bit] = value(...args);
		}

		if (type !== 'undefined' && type !== 'function') {
			components[label || bit] = value;
		}

		mask |= bit;
	}

	entities[id] = {mask, components};

	return id;
}
