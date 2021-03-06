/**
 * @file Entity Component System Implementation
 * @licence MIT
 * @author Thomas Démocrite
 */

/**
 * Class, to be extended, representing a Component. We can destinguish three
 * types of component:
 *
 * **Basic/Shared Component**: those two type allow to provide a value
 * to a given entity. The difference between **Basic** and **Shared**,
 * it that the first one is by entity and the second one is accross multiple
 * entities.
 *
 * **Tag Component**: it don't provide any values, but it is usefull to flag
 * a particular entity in order to create more accurate {@link Query|queries}.
 *
 * @description
 * You will not call `new Component()` directly. Instead, you will extend
 * from Component and then instantiate the child class.
 *
 * @see {@link Query}
 *
 * @example
 * // Create a basic component
 * class Position extends Component {
 *    x = 0;
 *    y = 1;
 * }
 *
 * // Create a shared component
 * class Origin extends Component {
 *    static x = 0;
 *    static y = 0;
 * }
 *
 * // Create a tag component
 * class CanMove extends Component {}
 *
 * @hideconstructor
 */
export class Component {
	/**
	 * Get the value of the component's mask. If the value for a given
	 * constructor does not exists, it will be created.
	 *
	 * @example
	 * // Given a component `Position`, as the first component created.
	 * +Position // 2
	 *
	 * @return {number} - component's mask.
	 */
	static valueOf() {
		if (!componentRegistry.has(this)) {
			componentRegistry.set(this, 1 + componentRegistry.size << 1);
		}
		return componentRegistry.get(this);
	}
}

/**
 * Class representing a World, e.g a specific group of entities.
 * @example
 * // Import the default world, if needed.
 * import world from '@thmsmdmcrt/ecs'
 *
 * // Create a new world.
 * import {World} from '@thmsdmcrt/ecs'
 *
 * const world = new World();
 */
export class World {
	/**
	 * World constructor
	 */
	constructor() {
		/**
		 * World entities/masks list. Indexed by entity.
		 * @type {Array<number>}
		 * @ignore
		 */
		this.entities = [];
		/**
		 * World components attached to an entity. Indexed by component's mask.
		 * @type {Object}
		 * @ignore
		 */
		this.attachments = {};
		/**
		 * World entities components. Indexed by entity.
		 * @type {Object}
		 * @ignore
		 */
		this.managers = {};
	}
	/**
	 * Method to add an entity to the world instance.
	 * If the second parameter is provided, `world#push` will add components
	 * to the target. Otherwise, it create a new entity. There is two way
	 * to use a component to create an entity or to add to an entity:
	 * If the component is a **Shared Component** or a **Tag Component**,
	 * simply pass the constructor. For a **Base Component**, pass a new instance.
	 *
	 * @see Component
	 *
	 * @example
	 * // Assumes that your using components created in the Component examples.
	 *
	 * // Create a new entity.
	 * const player = world.push([new Position, Origin, CanMove]);
	 *
	 * // Add a component to the created entity.
	 * world.push([new MyNewComponent], player);
	 *
	 * @param  {Array}  components – Components list to add to an entity.
	 * @param  {number} target     – The target entity (Optional).
	 *
	 * @return {number}            – The entity.
	 *
	 * @throws Will throw a `TypeError` if components or target arguments types
	 * are invalid.
	 */
	push(components = [], target = null) {
		/* Validate method's arguments */
		const areComponentsValid = components.every((component) => {
			return component &&
				(typeof component === 'object' ||
					typeof component === 'function');
		});

		if (!Array.isArray(components) || !areComponentsValid) {
			throw new TypeError(`world#push ${E_COMP_ARRAY_TYPE}`);
		}

		if (target && typeof target !== 'number') {
			throw new TypeError(`world#push ${E_TARGET_TYPE}`);
		}

		if (target && !this.entities[target]) {
			throw new TypeError(`world#push ${E_TARGET_UNDEFINED}`);
		}

		/* Body */
		const entity = target ? target : this.entities.push(0) - 1;

		for (const component of components) {
			const constructor = typeof component === 'function' ?
				component : component.constructor;
			const mask = +constructor;

			/* Register entity's component mask */
			this.entities[entity] |= mask;

			/* Attach entity's component mask */
			this.attachments[mask] = this.attachments[mask] || [];
			if (this.attachments[mask].indexOf(entity) < 0) {
				this.attachments[mask].push(entity);
			}

			/* Register entity's component */

			// Skipping for Tag Component.
			if (Object.keys(constructor).length === 0 &&
				Object.keys(component).length === 0) {
				continue;
			}

			/* Attach entity's component value */
			this.managers[entity] = this.managers[entity] || {};
			this.managers[entity][mask] = component;

			// Use component's class name to provide key access in object
			Object.defineProperty(
				this.managers[entity],
				`${constructor.name[0].toLowerCase()}${constructor.name.slice(1)}`,
				{get: () => this.managers[entity][mask]},
			);
		}

		return entity;
	}
	/**
	 * Method to remove an entity or one or more of its components.
	 * It only handle the entity's mask value, to prevent entity's
	 * component garbage collection.
	 *
	 * @example
	 * // Remove a specific component for the given entity.
	 * world.pull(player, [Position]);
	 *
	 * // Remove an entity.
	 * world.pull(player);
	 *
	 * @param  {number} target     – The entity target.
	 * @param  {Array}  components – Components list to remove.
	 * It expects component constructors, not instances.
	 *
	 * @throws Will throw a `TypeError` if components or target arguments types
	 * are invalid.
	 */
	pull(target, components = []) {
		/* Validate method's arguments */
		if (!target || typeof target !== 'number') {
			throw new TypeError(`world#pull ${E_TARGET_TYPE}`);
		}

		if (!Array.isArray(components) ||
			!components.every((component) => {
				return component && typeof component === 'function';
			})) {
			throw new TypeError(
				'world#pull expects @param {Array<Function>} components.',
			);
		}

		if (!this.entities[target]) {
			throw new TypeError(`world#pull ${E_TARGET_UNDEFINED}`);
		};

		/* Body */
		if (components.length === 0) {
			/* Reset entity's component mask */
			this.entities[target] = 0;
		}

		if (components.length > 0) {
			for (const component of components) {
				const mask = +component;

				if (!this.attachments[mask]) continue;

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
 * Class representing a Query.
 *
 * @example
 * // Retrive entities that can move.
 * const MovableEntities = new Query([+Position, +CanMove]);
 *
 * // Retrive entities that can't move.
 * const StaticEntities = new Query([+Position, -CanMove]);
 */
export class Query {
	/**
	 * Query constructor.
	 *
	 * @param  {Array}  masks Component's mask list, using component `valueOf`.
	 *
	 * @throws Will throw a `TypeError` if masks argument type is invalid.
	 */
	constructor(masks = []) {
		if (masks.some(Number.isNaN)) {
			throw new TypeError(`query#constructor ${E_MASK_ARRAY_TYPE}`);
		}

		/**
		 * Included query's component
		 * @type {Array}
		 */
		this.attachments = [];
		/**
		 * Included query's component mask
		 * @type {Number}
		 */
		this.include = 0;
		/**
		 * Excluded query's component mask
		 * @type {Number}
		 */
		this.exclude = 0;
		/**
		 * Query's entities match
		 * @type {Array}
		 */
		this.match = [];
		/**
		 * Query's match size
		 * @type {Number}
		 */
		this.size = 0;
		/**
		 * Query's results
		 * @type {Array}
		 */
		this.results = [];

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
	 * Method to filter entities for the given components in a given world.
	 * It should be used in a System (e.g Function as it follows).
	 *
	 * @example
	 * function MoveEntities() {
	 *   // Assuming you using `World.default`.
	 *   for (const {position} of MovableEntities.iter()) {
	 *     // ...
	 *   }
	 * }
	 *
	 * @param  {World} world The world target. Default to `World.default`.
	 */
	* iter(world) {
		if (!(world instanceof World)) {
			throw new TypeError(E_WORLD_TYPE);
		}

		// Get the shortest entity list for the given query's masks.
		for (const mask of this.attachments) {
			if (!this.match ||
				this.match.length === 0 ||
				(world.attachments[mask] &&
					this.match.length > world.attachments[mask].length)) {
				this.match = world.attachments[mask];
			}
		}

		// On iteration, reset results if the match change.
		if (this.match.length !== this.size) {
			this.size = this.match.length;
			this.results.length = 0;
		}

		// Populate results
		if (this.results.length === 0) {
			for (const entity of this.match) {
				const mask = world.entities[entity];
				const include = (mask & this.include) === this.include;

				// Check if entity include or exclude components. If the predicate
				// is valid, push the entity to the results array.
				if ((this.exclude === 0 && include) ||
					(this.exclude > 0 && include &&
						(mask & this.exclude) !== this.exclude)) {
					this.results.push(world.managers[entity]);
				}
			}
		}

		yield* this.results;
	}
}

export default new World();

// @ignore
const E_COMP_ARRAY_TYPE = 'expects @param {Array<Object|Function>} components.';

// @ignore
const E_TARGET_TYPE = 'expects @param {number} target.';

// @ignore
const E_TARGET_UNDEFINED = 'expects @param {number} target to exist in world.';

// @ignore
const E_MASK_ARRAY_TYPE = 'expects @param {Array<number>} masks';

// @ignore
const E_WORLD_TYPE = 'query#iter expects @param {World} world.';

/**
 * Simple Map to store each Component's Mask, indexed by Component.
 * It is used in combination with Component#valueOf.
 *
 * @type {Map}
 * @ignore
 */
const componentRegistry = new Map();
