import * as utils from '../utils/utils.js';

import { recognizeNumbers } from './parse.num.js';
import { recognizeTimestamps } from './parse.timestamp.js';
import { Enum, recognizeEnums } from './parse.enum.js';
import { recognizeStrings } from './parse.string.js';

import { numberConstants, enumConstants, timestampConstants } from './parse.constants.js';
import { getCommonPrefix, getCommonSuffix } from '../utils/string.js';

const defaultRecognizerArgs = {
	skipConstants: false,
	sizeHardLimit: 50,
	sampleSize: 500
}

/**
 * Try to recognize possible types of provided strings in data array.
 * @param {string[]} data array of strings to recognize, usually column from SourceData
 * @returns {import('./usetype.js').Usetype} list of possible usetypes
 */
export function determineType(data, args) {
	args = Object.assign((args ?? {}), defaultRecognizerArgs);

	let gatheredUsetypes = [];

	let isValid = preprocessHardLimitSize(data, args);

	let enumUsetypes = [];
	if (isValid) {
		[data, enumUsetypes] = preprocessEnumlikeness(data, args);
		gatheredUsetypes.push(...enumUsetypes);
	}

	// [data, args] = preprocessIndicators(data, args);
	
	if ((!args.skipConstants || !args.isConstant) && isValid) {
		let numUsetypes = recognizeNumbers(data, args);
		gatheredUsetypes.push(...numUsetypes);	

		let timestampUsetypes = recognizeTimestamps(data, args);
		gatheredUsetypes.push(...timestampUsetypes);
	}
	if (gatheredUsetypes.length === 0) {
		let stringUsetypes = recognizeStrings(data, args);
		gatheredUsetypes = stringUsetypes;
	}

	return gatheredUsetypes;
}

/**
 * In extreme cases when some columns contain large strings (e.g. records/JSONs...), it is necessary to identify and ignore these
 * to avoid extreme processing times, which in most cases return no useful information (these often can't be used as targets and shouldn't be used as source).
 * @param {string[]} source 
 * @param {object} args 
 * @returns {boolean}
 */
function preprocessHardLimitSize(source, args) {
	if (!args.sizeHardLimit)
		return true;
	let withinSizeLimit = source.every(sample => sample.length < args.sizeHardLimit);
	if (!withinSizeLimit)
		args.limitExceeded = true;
	return withinSizeLimit;
}

/**
 * Special wrapper for categorical recognizer.
 * Created due to its different nature and required additional preprocessing in some cases.
 * @param {string[]} source 
 * @param {object} args 
 * @returns {[string[], Enum[]]}
 */
function preprocessEnumlikeness(source, args) {
	let enumUsetypes = recognizeEnums(source, args);
	
	if (args.hasNoval) {
		source = source.filter(value => value !== args.novalVal);
	}
	
	if (args.isConstant) {
		source = [source[0]];
	}
	
	return [source, enumUsetypes];
}

// Not implemented, would require internal changes to respective parsers
/**
 * A potential improvement, where prefixes and suffixes would be identified before individual recognizers are used.
 * These affixes could even help determining the most probable use-types (e.g. $ sign for numbers).
 * @param {string[]} source 
 * @param {object} args 
 */
function preprocessIndicators(source, args) {

	let timestampConstantGroups = Object.values(timestampConstants).map(getFunc => getFunc(args.locale));
	let enumConstantGroups = Object.values(enumConstants).map(getFunc => getFunc(args.locale));
	let numberConstantGroups = Object.values(numberConstants).map(getFunc => getFunc(args.locale));
	const changeLimit = 10;

	let change = true;
	while (change) {
		change = false;

		let [prefix, suffix] = extractCommonAffixes(source);
		if (prefix) {
			args.prefixes = (args.prefixes || []).push([prefix]);
			source = source.map(value => value.substring(prefix.length));
			change = true;
		}
		if (suffix) {
			args.suffixes = (args.suffixes || []).push([suffx]);
			source = source.map(value => value.substring(value.length - suffix.length));
			change = true;
		}
		
		for (let i = 0; i < 3; i++) {
			let affixType = ["timestamp", "enum", "number"][i];
			let group = [timestampConstantGroups, enumConstantGroups, numberConstantGroups][i];

			let [prefixes, strippedSource, suffixes] = extractCommonIndicators(source, group);
			if (prefixes.length) {
				args.prefixes = (args.prefixes || []).push(prefixes);
				args.indicators = (args.indicators || []).push(affixType);
				source = strippedSource;
				change = true;
			}
			if (suffixes.length) {
				args.suffixes = (args.suffixes || []). push(suffixes);
				args.indicators = (args.indicators || []).push(affixType);
				source = strippedSource;
				change = true;
			}
		}

	}

	function extractCommonAffixes(source) {
	
		// construct common prefix and suffix
		let prefix = source[0];
		let suffix = source[0];
		let lastChange = 0;
		let counter = 1;
		while (lastChange < changeLimit && counter < source.length) {
			let newPrefix = getCommonPrefix(prefix, source[counter]);
			let newSuffix = getCommonSuffix(suffix, source[counter]);
			if (suffix !== newSuffix || prefix !== newPrefix) {
				lastChange = 0;
				prefix = newPrefix;
				suffix = newSuffix;
			}
		}
		return [prefix, suffix];
	}

	function extractCommonIndicators(source, groups) {
		let prefixesEnabled = groups.map(group => true);
		let suffixesEnabled = groups.map(group => true);
		let lastChange = 0;
		let counter = 0;
		while (lastChange < changeLimit && counter < source.length) {
			let sample = source[counter];

			for (let g = 0, l = groups.length; g < l; g++) {
				if (prefixesEnabled[g] && groups[g].every(indicator => !sample.startsWith(indicator))) {
					prefixesEnabled[g] = false;
					lastChange = 0;
				}
				if (suffixesEnabled[g] && groups[g].every(indicator => !sample.endsWith(indicator))) {
					suffixesEnabled[g] = false;
					lastChange = 0;
				}
			}

			let prefixCount = prefixesEnabled.reduce((a,n) => a + +n, 0);
			let extractedPrefixes = [];
			if (prefixCount > 1) {
				throw "extractCommonIndicators -- multiple prefixes found";
			}
			else if (prefixCount === 1) {
				let prefixIndex = prefixesEnabled.indexOf(true);
				extractedPrefixes = groups[prefixIndex];
			}
			
			let suffixCount = suffixesEnabled.reduce((a,n) => a + +n, 0);
			let extractedSuffixes = [];
			if (suffixCount > 1) {
				throw "extractCommonIndicators -- multiple suffixes found";
			}
			else if (prefixCount === 1) {
				let suffixIndex = suffixesEnabled.indexOf(true);
				extractedSuffixes = groups[suffixIndex];
			}

			let strippedSource = [];
			for (let i = 0, l = source.length; i < l; i++) {
				let sample = source[i];
				for (let prefix of extractedPrefixes) {
					if (sample.startsWith(prefix)) {
						sample = sample.replace(prefix, "");
						break;
					}
				}
				for (let suffix of extractedSuffixes) {
					if (sample.endsWith(suffix)) {
						sample = sample.replace(suffix, "");
						break;
					}
				}
				strippedSource.push(sample);
			}

			return [extractedPrefixes, strippedSource, extractedSuffixes];
		}

	}

}