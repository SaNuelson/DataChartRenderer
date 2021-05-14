import * as utils from '../utils/utils.js';
import { parseNum, recognizeNum } from './parse.num.js';
import { parseTimestamp, recognizeTimestamp } from './parse.timestamp.js';
import { recognizeEnumset } from './parse.enum.js';
import { String as StringUsetype } from './usetype.js';

let verbose = (window.verbose ?? {}).parser;
console.log("parse.main.js verbosity = ", verbose);
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
 * Try to parse string into specified type using optional format.
 * @param {string} source string to be parsed
 * @param {string} type string name of the type to parse into
 * @param {string} format optional parameter (mostly required in case of datetime format)
 * @returns {string|number|Date|number[]} Parsed type if successful, null otherwise.
 */
export function tryParse(source, type, format) {
	switch (type) {
		case "string":
			return source;
		case "number":
			let num = parseNum(source.replace(/\s/g, ''));
			if (isNaN(num)){
				error("Unparsable number in tryParse - ", source);
				return null;
			}
			return num;
		case "date":
		case "datetime":
		case "timeofday":
			return parseTimestamp(source, format);
		default:
			warn("Unknown type in tryParse - ", type);
			return null;
	}
}

/**
 * Try to recognize possible types of provided strings in data array.
 * @param {string[]} data array of strings to recognize, usually column from SourceData
 * @returns {import('./usetype.js').Usetype} list of possible usetypes
 */
export function determineType(data) {
	if (verbose) {
		console.groupCollapsed(`detemineType(${data.length > 0 ? data[0] + "..." : []})`);
	}

	let args = {}

	let enumUsetypes = recognizeEnumset(data, args);
	if (verbose) {
		if (enumUsetypes.length === 1 && enumUsetypes[0].size() === 1) {
			log("NOVAL determined: ", enumUsetypes[0].domain[0]);
			args.noval = enumUsetypes[0].domain[0];
			enumUsetypes = [];
		}
		else {
			log("EnumUsetypes determined: ", enumUsetypes);
		}
	}

	let numUsetypes = recognizeNum(data, args);
	if (verbose) {
		log("NumberUsetypes determined: ", numUsetypes);
	}

	let timestampUsetypes = recognizeTimestamp(data, args);
	if (verbose) {
		log("TimestampUsetypes determined: ", timestampUsetypes);
	}

	if (verbose) {
		console.groupEnd();
	}

	let rets = [].concat(enumUsetypes, numUsetypes, timestampUsetypes);
	if (rets.length === 0) {
		return [new StringUsetype()];
	}
	return rets;
}