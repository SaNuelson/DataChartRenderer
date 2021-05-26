import * as arr from '../utils/array.js';
import { Usetype } from './usetype.js';

let verbose = (window.verbose ?? {}).enum;
console.log("parse.enum.js verbosity = ", verbose);
if (verbose) {
	var debug = window.console;
}
else {
	var debug = {};
	let funcHandles = Object.getOwnPropertyNames(window.console).filter(item => typeof window.console[item] === 'function');
	funcHandles.forEach(handle => debug[handle] = window.console[handle]);
}

/**
 * Try to recognize possible formats of string-represented enums in source array.
 * @param {string[]} source strings upon which format should be determined
 * @returns {Enum[]} possible enum formats of specified strings
 */
export function recognizeEnums(source) {
	if (!source || source.length === 0)
		return [];

	let counts = arr.count(source);
	counts = arr.toKvp(counts);
	counts = counts.sort((a,b) => a[1] - b[1]);

	// TODO: single val for whole column. Should be ignored?
	if (counts.length === 1) {
		return [{isConstant: true, constantVal: counts[0][0]}];
	}

	// no repeated value means possible ID column
	if (counts.length === source.length) {
		return [{potentialIds: true}];
	}

	// Check if found set is enum-like
	// - domain is small enough
	// - has at least 2 keys
	let reductionFactor = source.length / counts.length;
	if (reductionFactor > 0.5 && counts[0][1] >= 2 && counts.length > 2) {
		return [new Enum({domain:counts.map(a=>a[0])})];
	}


	// otherwise check for NOVAL
	if (counts[counts.length - 1][1] / counts[counts.length - 2][1] > 2 &&
		counts[counts.length - 2][1] > 0) {
		return [{hasNoval: true, novalVal:counts[counts.length - 1][0]}];
	}

	return [];
}

/**
 * @typedef EnumUsetypeArgs
 * Argument object used to construct {@see Enum}.
 * @property {string[]} domain array containing all distinct values
 */

/**
 * Enum usetype. Holds all possible values of a domain.
 * Is pretty much useless otherwise, mostly a compatibility wrapper similarly to StringUsetype.
 * @implements {Usetype}
 */
 export class Enum extends Usetype {

    domain = [];

    /**
     * @param {EnumUsetypeArgs} args
     */
    constructor(args) {
        super(args);
        if (args.domain)
            this.domain = args.domain;
    }

    format(string) { return this.domain.includes(string) ? string : undefined }
    deformat(value) { return this.domain.includes(value) ? value : undefined }

    size() { return this.domain.length }
    toString() { return `E{[${this.domain}]}` }
    toDebugString() { return `Usetype.Enum([${this.domain}])` }
    compatibleTypes = ["string"];
    type = "string";
}