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

	let retval = {};

	let valueIndexes = {};
	for (let i in source) {
		if (!valueIndexes[source[i]])
			valueIndexes[source[i]] = [];
		valueIndexes[source[i]].push(i);
	}

	let valueCounts = [];
	for (let value in valueIndexes) {
		valueCounts.push([value, valueIndexes[value].length]);
	}
	valueCounts = valueCounts.sort((a,b) => a[1] - b[1]);

	// TODO: single val for whole column. Should be ignored?
	if (valueCounts.length === 1) {
		return [{isConstant: true, constantVal: valueCounts[0][0]}];
	}

	// no repeated value means possible ID column
	if (valueCounts.length === source.length) {
		return [{potentialIds: true, ambiguousSets: []}];
	}

	// create info about non-uniqueness to be used in mappingg step
	let ambiguousSets = [];
	for (let value in valueIndexes) {
		if (valueIndexes[value].length > 1)
			ambiguousSets.push(valueIndexes[value]);
	}

	// Check if found set is enum-like
	// - domain is small enough
	// - has at least 2 keys
	let reductionFactor = source.length / valueCounts.length;
	if (reductionFactor > 0.5 && valueCounts[0][1] >= 2 && valueCounts.length > 2) {
		return [new Enum({domain:valueCounts.map(a=>a[0])}, {ambiguousSets: ambiguousSets})];
	}

	// otherwise check for NOVAL
	// TODO: False positive {"1000": 213, "2000": 62, ...}, need better NOVAL criteria
	if (valueCounts[valueCounts.length - 1][1] / valueCounts[valueCounts.length - 2][1] > 2 && valueCounts[valueCounts.length - 2][1] > 0) {
		return [{hasNoval: true, novalVal:valueCounts[valueCounts.length - 1][0], ambiguousSets: ambiguousSets}];
	}

	return [{ambiguousSets: ambiguousSets}];
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
    constructor({domain = []}, args) {
        super(args);
        if (domain)
            this.domain = domain;
    }

    format(string) { return this.domain.includes(string) ? string : undefined }
    deformat(value) { return this.domain.includes(value) ? value : undefined }

	isSubsetOf(other) { return this.domain.every(value => other.domain.includes(value)); }
	isSupersetOf(other) { return other.isSubsetOf(this); }
	isEqualTo(other) { return this.isSubsetOf(other) && this.isSupersetOf(other); }
	isSimilarTo(other) { return this.isSubsetOf(other) || this.isSupersetOf(other); }

    size() { return this.domain.length }
    toString() { return `E{[${this.domain}]}` }
    toDebugString() { return `Usetype.Enum([${this.domain}])` }
    compatibleTypes = ["string"];
    type = "string";
	domainType = 'nominal';
	priority = 1;
}