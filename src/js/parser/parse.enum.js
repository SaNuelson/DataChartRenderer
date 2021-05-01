import { Enum as EnumUsetype } from './usetype.js';
import * as arr from '../utils/array.js';

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

	// Check if found set is enum-like
	let reductionFactor = source.length / counts.length;
	if (reductionFactor > 0.5 && counts[0][1] >= 2) {
		return [new EnumUsetype({domain:counts.map(a=>a[0])})];
	}

	// otherwise check for NOVAL
	if (counts[counts.length - 1][1] / counts[counts.length - 2][1] > 2) {
		return [new EnumUsetype({domain:counts[counts.length - 1][0]})];
	}

	return [];
}
