/**
 * Component storage. Indexed by component mask.
 * @type {Object}
 */
const store = {};

/**
 * Entities storage. Indexed by entity.
 * @type {Object}
 */
const entities = {};

/**
 * Component mask tracking
 * @type {Number}
 */
let bits = 0;
/**
 * Create a component
 * @param  {any} value Component value. If value is a function,
 * it will be considered as a factory, used to provide by entity value or data.
 * @param  {string} name Component name.
 * @return {number}       Component mask.
 */
export function createComponent(value, name) {
	const bit = ++bits << 1;
	const fn = (...args) => [typeof value === 'function' ? value(...args) : value, name, bit];
	return fn.valueOf = () => bit, fn;
}

/**
 * Create an entity, passing component mask or component mask and factory arguments.
 * @param  {...[number | [number, any?]]} descriptors Component descriptors.
 * @return {number}                The created entity.
 */
export function createEntity(...components) {
	const entity = Object.keys(entities).length;
	const manager = { entity };

	let mask = 0;

	for (const component of components) {
		const [value, name, bit] = Array.isArray(component) ? component : component();
		store[bit] = store[bit] ? [...store[bit], entity] : [entity];
		if (typeof value !== 'undefined') manager[name || bit] = value;
		mask |= bit;
	}

	return entities[entity] = {mask, manager}, entity;
}

/**
 * Create a query to fetch matching entities.
 * @param  {...[number]} bits Component masks selector.
 * Should be a positive or a negative number.
 * @return {Object}         Matching entity iterator.
 */
export function createQuery(...bits) {
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
		/**
		 * Query results iterator
		 * @return {[Object]} Mathcing entities components.
		 */
		*[Symbol.iterator]() {
			for (const bit of includes) {
				if (matches.length === 0 ||
					matches.length > store[bit].length) {
					matches = store[bit];
				}
			}

			if (matches.length !== length) {
				length = matches.length;
				results.length = 0;

				for (const entity of matches) {
					const {mask, manager} = entities[entity];
					const inc = (mask & include) === include;
					const exc = (mask & exclude) !== exclude;
					if ((exclude === 0 && inc) || (exclude > 0 && inc && exc))
						results.push(manager);
				}
			}

			yield* results;
		}
	};
}

