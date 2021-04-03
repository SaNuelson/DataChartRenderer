import { Number } from './usetype.js';
import { getCutPattern } from '../utils/patterns.js';

/**
 * Try to recognize possible formats of string-represented numbers in source array.
 * @param {string[]} source strings upon which format should be determined
 * @returns {string[]} possible number formats of specified strings
 */
export function recognizeNumNew(source) {
	if (!source || source.length === 0) {
		return [];
	}
	
	let args = {};
	const possibleDels = ['.',',',' '];
	for (let i = 0; i < source.length; i++) {
		// TODO
	}
}

export function recognizeNum(source) {
	if (source.length === 0)
		return [];
	
	let dDels = [];
	let tDels = [];
	let delCs = [];
	let addDel = (td, dd) => {
		let idx = dDels.indexOf(dd);
		if (idx === -1) {
			dDels.push(dd);
			tDels.push(td);
			delCs.push(1);
		}
		if (tDels[idx] === td)
			delCs[idx]++;
	}

	let errs = 0;
	for (let i = 0; i < source.length; i++){

		if (errs > 5)
			return [];

		let trimmed = source[i].replace(/\s/g,'');
		let digits = trimmed.match(/\d+/g) || [];
		
		// no digits present OR digit sequences in the middle don't have length of 3
		if (digits.length === 0 || !digits.slice(1, -1).every((digs => digs.length === 3))){
			errs++;
			continue;
		}

		let dels = trimmed.match(/\D+/g) || [];
		
		if (dels.length === 0)
			addDel(null, null);

		if (trimmed.startsWith(dels[0]))
			dels = dels.slice(1);
		if (trimmed.endsWith(dels[dels.length - 1]))
			dels = dels.slice(0, -1);
		
		if (dels.length === 1){
			
			// eg. 120.000 (pieces)
			if (digits[0].length <= 3 && digits[1].length === 3 && !digits[0].startsWith('0')){}
				addDel(dels[0], null);
			
			// eg. $3.95
			addDel(null, dels[0]);
		}
		else {

			if (dels.slice(0, -1).every(d => d === dels[0])) {
				
				// eg. 125,383.75 (revenue)
				if (dels[0] !== dels[dels.length - 1])
					addDel(dels[0], dels[dels.length - 1]);

				// eg. 137.254.376
				else
					addDel(dels[0], null);

			}
			else {
				errs++;
				continue;
			}

		}
	}

	let argmax = delCs.indexOf(Math.max(...delCs));

	let errorTooLarge = false;
	if (errorTooLarge)
		return null;

	return new Number({
		
	})

	// TODO Check if untrue formats ain't too large
	return errs > 5 ? [] : [tDels[argmax], dDels[argmax]];
}

/**
 * Try to parse a number based on provided format
 * @param {string} source 
 * @param {string[]} format in form [thousands_delimiter, decimal delimiter]
 * @returns Parsed num if possible, NaN otherwise
 */
export function parseNum(source, format = []) {
	let trimmed = source.replace(/\s/g, '');
	let dels = trimmed.match(/\D+/g);
	let nums = trimmed.match(/[0-9]+/g);

	if (trimmed.startsWith(dels[0]))
		trimmed = trimmed.replace(dels[0], '');
	if (trimmed.endsWith(dels[dels.length - 1]))
		trimmed = trimmed.replace(dels[dels.length - 1], '');

	if (format) {
		if (format[0])
			trimmed = trimmed.replace(format[0], '');
		if (format[1])
			trimmed = trimmed.replace(format[1], '.');
		return +trimmed;
	}
	else {
		return +trimmed;
	}
}
