import { Enum as EnumUsetype } from './usetype.js';
import * as arr from '../utils/array.js';

let verbose = (window.verbose ?? {}).enum;
console.log("parse.enum.js verbosity = ", verbose);
if (verbose) {
	var log = console.log;
	var warn = console.warn;
	var error = console.error;
}
else {
	var log = () => {};
	var warn = () => {};
	var error = () => {};
}

/**
 * Try to recognize possible formats of string-represented enums in source array.
 * @param {string[]} source strings upon which format should be determined
 * @returns {EnumUsetype[]} possible enum formats of specified strings
 */
export function recognizeEnumset(source) {
	if (!source || source.length === 0)
		return [];

	let counts = arr.count(source);
	counts = arr.toKvp(counts);
	counts = counts.sort((a,b) => a[1] - b[1]);
	log("enum counts", counts);

	// TODO: single val for whole column. Should be ignored?
	if (counts.length === 1) {
		return [];
	}

	// Check if found set is enum-like
	// - domain is small enough
	// - has at least 2 keys
	let reductionFactor = source.length / counts.length;
	if (reductionFactor > 0.5 && counts[0][1] >= 2 && counts.length > 2) {
		return [new EnumUsetype({domain:counts.map(a=>a[0])})];
	}


	// otherwise check for NOVAL
	if (counts[counts.length - 1][1] / counts[counts.length - 2][1] > 2 &&
		counts[counts.length - 2][1] > 0) {
		return [{noval:counts[counts.length - 1][0]}];
	}

	return [];
}

export const recognizeEnums = recognizeEnumset;