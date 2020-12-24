# ECS

`ecs` is a lightweight implementation of the Entity Component System pattern, known as ECS, in javascript.

> ⚠️ This library is a work in progress. You should expect breaking changes.

[Installation](#installation) | [Usage](#usage) | [API Reference](#api-reference) | [How It Works](#how-it-works)

## Installation

```bash
# If you have configured npm to install package from https://npm.pkg.github.com
npm install --save @thmsdmcrt/ecs

# Otherwise
npm install --save https://github.com/thmsdmcrt/ecs
```

## Usage

> Each examples listed below assumes that you used `import * as ecs from '@thmsdmcrt/ecs'`.

### Components

As we saw before, components are the aspects of an entity. They are basically juste data, and one of the golden rules of ecs is that **components has no behaviour**. We can distinguish three types of component:

- **tag component**: this component don't provide any data. Its unique purpose is to flag an entity for precise [filtering](#queries).
```js
const Interactive = ecs.component();
```

- **shared component**: this component provide data, but shared accross multiples entities.
```js
const mouse = {x: 0, y: 0};

window.addEventListener('mousemove', (e) => {
	mouse.x = e.clientX;
	mouse.y = e.clientY;
}, false);

const Mouse = ecs.component(mouse, 'mouse');
```

- **basic component**: like the shared component, but it provide by entity value. In this case, the first argument must be a `function`.
```js
const Position = ecs.component((x = 0, y = 0) => [x, y], 'position');
```

The second argument of `ecs.component` method is an optionnal `string`, but it provide convenient access to component value, when iterating over [query](#queries) results.

### Entities

Entities are the elements that we want to manipulate. They are nothing but an unique identifier and are described by their [components](#components).

```js
const player = ecs.entity(Interactive, Mouse, Position);

// Or if you want to specify the initial position value
const player = ecs.entity(Interactive, Mouse, Position(10, 10));
```

### Queries

In `ecs`, queries are the way to retrive all entities you want for a certain process, to update their values. As [components](#components) implements `valueOf`, you would use the `+` or `-` sign to specify your request.

```js
// Get all entities that have Interactive, Mouse and Position components.
const interactiveMovables = ecs.query(+Interactive, +Mouse, +Position);

// Get all entities that don't have Interactive component but a Position one.
const movables = ecs.query(-Interactive, +Position);
```

### Systems

`ecs` does not provide any method to build systems as their are basically plain function. But you would use your defined queries to access and modify entities. As [queries](#queries) returns an iterable you should loop through entities inside a system.

```js
function moveInteractives() {
	// If you provided a name for the targeted components, 
	// you can access them destructuring the entity.
	for (const {position, mouse} of interactiveMovables) {
		position[0] = mouse.x;
		position[1] = mouse.y;
	}

	// Or you can use the component mask
	for (const entity of interactiveMovables) {
		entity[+Position][0] = mouse.x;
		entity[+Position][1] = mouse.x;
	}
}

// Then you could use your system inside en requestAnimationFrame loop:
function loop() {
	moveInteractives();
	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
```

## API Reference

- `ecs#component(value?: any, label?: string): () => [any, string, number]`
- `ecs#entity(...components: Array<Function | [any, string, number]>): number`
- `ecs#query(...masks: number[]): Iterable<Record<string, any>>`

## How It Works

`ecs` is heavily inspired by [@kutuluk/js13k-ecs](https://github.com/kutuluk/js13k-ecs). The Entity/Components and Entity/Query relations are base on `mask`, an unique positive integer and javascript's internal bitwise operations. It allows `ecs` to avoir to loop accross entities then accross components to find a match.

- From the component perspective, a `mask` is simply an identifier. 
- From the entity perspective, a `mask` describe the entity's components, computed with the `|` operator from each component `mask`. 
- From the query perspective, the `mask` describe the filter that will match an entity `mask`, using the `&` operator to compare query `mask` and entity `mask`.

