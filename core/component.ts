export let registry: Record<string, [any, string | null | undefined]> = {};
export let store: Record<string, number[]> = {};

/**
 * [createComponent description]
 * @param  {any}       value [description]
 * @param  {string |     null          | undefined} label [description]
 * @param  {[type]}          [description]
 * @return {number}          [description]
 */
export default function createComponent(
	value: any,
	label: string | null | undefined,
): number {
	let bit = 1 + Object.keys(registry).length << 1;
	return registry[bit] = [value, label], bit;
}
