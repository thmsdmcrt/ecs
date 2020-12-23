# Hanka

Hanka is a lightweight implementation of the Entity Component System pattern, known as ECS, in javascript.

> ⚠️ This library is a work in progress. You should expect breaking changes.

## Installation

## Usage

## API Reference

## Under The Hood

Hanka is heavily inspired by [@kutuluk/js13k-ecs](https://github.com/kutuluk/js13k-ecs). The Entity/Components and Entity/Query relations are base on what we call a `mask`, an unique positive integer and javascript's internal bitwise operations. 

- From the component perspective, a `mask` is simply an identifier. 
- From the entity perspective, a `mask` describe the entity's components, computed with the `|` operator on each component `mask`. 
- From the query perspective, the `mask` describe the filter that will match an entity `mask`, using the `&` operator to compare query `mask` and entity `mask`.

