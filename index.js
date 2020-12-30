/**
 * [E_COMP_ARRAY_TYPE description]
 * @type {String}
 */
const E_COMP_ARRAY_TYPE = 'expects @param {Array<Object|Function>} components.';

/**
 * [E_TARGET_TYPE description]
 * @type {String}
 */
const E_TARGET_TYPE = 'expects @param {number} target.';

/**
 * [E_TARGET_UNDEFINED description]
 * @type {String}
 */
const E_TARGET_UNDEFINED = 'expects @param {number} target to exist in world.';

/**
 * [validateComponentArgument description]
 * @param  {[type]} component [description]
 * @return {[type]}           [description]
 */
function validateComponentType(component) {
	return component && (typeof component !== 'object' || typeof component !== 'function');
}

/**
 * [warnUnregistredComponent description]
 * @param  {[type]} component [description]
 * @return {[type]}           [description]
 */
function warnUnregistredComponent(component) {
	if (!World.components.has(component)) {
		console.warn(`Expects ${component} to be registred. Skipping.`);
		return true;
	}
	return false;
}

/**
 *
 */
export class World {
	static default = new World();
	/**
	 * [components description]
	 * @type {Map}
	 */
	static components = new Map();
	/**
	 * [entities description]
	 * @type {Array}
	 */
	entities = [];
	/**
	 * [attachments description]
	 * @type {Object}
	 */
	attachments = {};
	/**
	 * [managers description]
	 * @type {Object}
	 */
	managers = {};
	/**
	 * [push description]
	 * @param  {Array}  components [description]
	 * @param  {[type]} target     [description]
	 * @return {[type]}            [description]
	 */
	push(components = [], target = null) {
		/* Validate method's arguments */
		if (!Array.isArray(components) ||
			!components.every(validateComponentType))
			throw new TypeError(`world#push ${E_COMP_ARRAY_TYPE}`);

		if (target && typeof target !== 'number')
			throw new TypeError(`world#push ${E_TARGET_TYPE}`);

		if (target && !this.entities[target])
			throw new TypeError(`world#push ${E_TARGET_UNDEFINED}`);

		/* Body */
		const entity = target ? target : this.entities.push(0) - 1;

		for (const component of components) {
			const constructor = typeof component === 'function' ? component : component.constructor;

			if (warnUnregistredComponent(constructor)) continue;

			/* Register entity's component mask */
			const mask = +constructor;
			this.entities[entity] |= mask;

			/* Attach entity's component */
			this.attachments[mask] = this.attachments[mask] || [];
			if (this.attachments[mask].indexOf(entity) < 0)
				this.attachments[mask].push(entity);

			/* Register entity's component */

			// Skipping for Tag Component.
			if (Object.keys(constructor).length === 0 && Object.keys(component).length === 0)
				continue;

			this.managers[entity] = this.managers[entity] || {};
			this.managers[entity][mask] = component;

			Object.defineProperty(this.managers[entity], constructor.name.toLowerCase(), {
				get: () => this.managers[entity][mask]
			});
		}

		return entity;
	}
	/**
	 * [pull description]
	 * @param  {[type]} target     [description]
	 * @param  {Array}  components [description]
	 * @return {[type]}            [description]
	 */
	pull(target, components = []) {
		/* Validate method's arguments */
		if (!target || typeof target !== 'number')
			throw new TypeError(`world#pull ${E_TARGET_TYPE}`);

		if (!Array.isArray(components) ||
			!components.every((component) => component && typeof component === 'function'));
			throw new TypeError('world#pull expects @param {Array<Function>} components.');

		if (!this.entities[target])
			throw new TypeError(`world#pull ${E_TARGET_UNDEFINED}`);$

		/* Body */
		if (components.length === 0)
			/* Reset entity's component mask */
			this.entities[target] = 0;

		if (components.length > 0) {
			for (const component of components) {
				if (warnUnregistredComponent(component)) continue;
				const mask = +component;
				/* Detach entity's component */
				const i = this.attachments[mask].indexOf(entity);
				if (i >= 0) this.attachments[mask].splice(i, 1);

				/* Unregister entity's component mask */
				this.entities[target] &= ~mask;
			}
		}
	}
}

/**
 *
 */
export class Component {
	/**
	 * [valueOf description]
	 * @return {[type]} [description]
	 */
	static valueOf() {
		if (!World.components.has(this)) {
			World.components.set(this, 1 + World.components.size << 1);
		}
		return World.components.get(this);
	}
}

/**
 *
 */
export class Query {
	attachments = [];
	include = 0;
	exclude = 0;
	match = [];
	size = 0;
	results = [];
	/**
	 * [constructor description]
	 * @param  {Array}  masks [description]
	 * @return {[type]}       [description]
	 */
	constructor(masks = []) {
		if (masks.some(Number.isNaN))
			throw new TypeError(`query#constructor expects @param {Array<number>} masks. Corresponding component has not been registered.`);

		for (const mask of masks) {
			if (mask > 0) {
				this.include |= mask;
				this.attachments.push(mask);
			}

			if (mask < 0) {
				this.exclude |= -mask;
			}
		}
	}
	/**
	 * [iter description]
	 * @param  {[type]} world [description]
	 * @return {[type]}       [description]
	 */
	*iter(world) {
		if (!(world instanceof World))
			throw new TypeError('query#iter expects @param {World} world.');

		for (const mask of this.attachments) {
			if (!this.match ||
				this.match.length === 0 ||
				(world.attachments[mask] && this.match.length > world.attachments[mask].length)) {
				this.match = world.attachments[mask];
			}
		}

		if (this.match.length !== this.size) {
			this.size = this.match.length;
			this.results.length = 0;
		}

		if (this.results.length === 0) {
			for (const entity of this.match) {
				const mask = world.entities[entity];
				const include = (mask & this.include) === this.include;

				if ((this.exclude === 0 && include)/* ||
					(this.exclude > 0 && include && (mask & this.exclude) !== this.exclude)*/)
					this.results.push(world.managers[entity]);
			}
		}

		yield* this.results;
	}
}

export default World.default;
