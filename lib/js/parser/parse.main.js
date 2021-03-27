import * as utils from '../utils/utils.js';
import { parseNum, recognizeNum } from './parse.num.js';
import { parseTimestamp, recognizeTimestamp } from './parse.timestamp.js';
import { recognizeEnumset } from './parse.enum.js';


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
				console.error("Unparsable number in tryParse - ", source);
				return null;
			}
			return num;
		case "date":
		case "datetime":
		case "timeofday":
			return parseTimestamp(source, format);
		default:
			console.warn("Unknown type in tryParse - ", type);
			return null;
	}
}

/**
 * Try to recognize possible types of provided strings in data array.
 * @param {string[]} data array of strings to recognize, usually column from SourceData
 * @returns {[string[], string[]]} tuple in form (types, formats)
 */
export function determineType(data) {

	let types = [];
	let formats = [];
	let params = {};

	let enumSet = recognizeEnumset(data);
	console.log("enumSet = ", enumSet);
	if (enumSet && enumSet.length > 0) {
		if (enumSet.length === 1)
		{
			console.log("Recognized NOVAL indicator: ", enumSet[0]);
			params.noval = enumSet[0];
		}
		else
		{
			console.log("Recognized enum set: ", enumSet);
			types.push("enum");
			formats.push(enumSet);
		}
	}

	let [tsTypes, tsFormats] = recognizeTimestamp(data, params);
	if (tsTypes && tsTypes.length > 0) {
		console.log("Recognized timestamp formats: ", utils.zip(tsTypes, tsFormats));
		types.push(tsTypes);
		formats.push(tsFormats);
	}

	let numberdata = recognizeNum(data, params);
	if (numberdata && numberdata.length > 0) {
		console.log("Recognized number formats: ", numberdata);
		types.push("number");
		formats.push(numberdata);
	}

	if (!types)
		console.log("Couldn't determine any known data type for source data, returning string.");
	
	types.push("string");
	formats.push("");
	console.log("=>", types, formats);
	return [types, formats];
}