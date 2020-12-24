/**
 * Entities/Components relation mapping.
 * @type {Object}
 */
const attachments = {};

/**
 * Entities store.
 * @constant
 * @type {Object}
 */
const entities = {};

/**
 * Component mask tracking.
 * @type {Number}
 */
let bits = 0;

/**
 * Create a Component.
 * @param  {any} value Component value.
 * If value is a function, it will be considered as a factory, used to provide by entity value or data.
 * @param  {string} name - Component name.
 * @return {Function} - Component.
 */
export function component(value, name) {
	const bit = ++bits << 1;
	const fn = (...args) => [typeof value === 'function' ? value(...args) : value, name, bit];
	return fn.valueOf = () => bit, fn;
}

/**
 * Create an Entity.
 * @param  {...Array} components - Entity's component list.
 * @return {number} - Entity.
 */
export function entity(...components) {
	const entity = Object.keys(entities).length;
	const manager = { entity };

	let mask = 0;

	for (const component of components) {
		const [value, name, bit] = typeof component === 'function' ? component() : component;
		if (typeof value !== 'undefined') manager[name || bit] = value;
		attachments[bit] = attachments[bit] ? [...attachments[bit], entity] : [entity];
		mask |= bit;
	}

	return entities[entity] = {mask, manager}, entity;
}

/**
 * Create a Query.
 * @param  {...number} bits - Components masks. Could be positive or negative. Zero values are ignored.
 * @return {Iterable} - Results
 */
export function query(...bits) {
	let results = [];
	let includes = [];
	let include = 0;
	let exclude = 0;
	let matches = [];
	let length = 0;

	for (const bit of bits) {
		if (bit < 0) exclude |= -bit;
		if (bit > 0) {
			includes = [...includes, bit];
			include |= bit;
		}
	}

	return {
		// @yields {Array}
		*[Symbol.iterator]() {
			for (const bit of includes) {
				if (matches.length === 0 ||
					matches.length > attachments[bit].length) {
					matches = attachments[bit];
				}
			}

			if (matches.length !== length) {
				length = matches.length;
				results.length = 0;

				for (const entity of matches) {
					const {mask, manager} = entities[entity];
					if ((exclude === 0 && (mask & include) === include) ||
						(exclude > 0 && (mask & include) === include && (mask & exclude) !== exclude))
						results.push(manager);
				}
			}

			yield* results;
		}
	};
}

