import { Number as NumUsetype } from './usetype.js';
import { getCutPattern } from '../utils/patterns.js';
import { indexesOf } from '../utils/utils.js';

let verbose = (window.verbose ?? {}).number;
console.log("parse.num.js verbosity = ", verbose);
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
 * Try to recognize possible formats of string-represented numbers in source array.
 * @param {string[]} source strings upon which format should be determined
 * @returns {NumUsetype[]} possible number formats of specified strings
 */
export function recognizeNum(source, args) {
	// TODO
	const extractorChunkSize = 5;
	const usetypePrecision = .95;

	if (args.noval) {
		var noval = args.noval;
	}

	if (!source || source.length === 0) {
		return [];
	}

	let nuts = extractPossibleFormats(source.slice(0, extractorChunkSize));
	log("extractedNumUsetypes", nuts);
	let matches = nuts.map(()=>0);
	let disabled = 0;
	for (let i = 0, il = source.length; i < il; i++) {
		let token = source[i];
		for (let j = 0, jl = nuts.length; j < jl; j++) {
			if (!nuts[j].disabled) {
				let num = nuts[j].deformat(token);
				if (num) {
					matches[j]++;
					if (nuts[j].max < num) nuts[j].max = num;
					if (nuts[j].min > num) nuts[j].min = num;
				}
				else if (matches[j] < usetypePrecision * (i + 1)) {
					console.log("Matching", nuts[j], "against", token, "failed, disabling potential format.");
					nuts[j].disabled = true;
					disabled++;
				}
			}
		}
		if (disabled === nuts.length)
			return [];
	}
	nuts.forEach((nut, idx) => nut.confidence = matches[idx] / source.length)
	nuts = nuts.filter(nut => !nut.disabled);

	return nuts;
}

/**
 * @param {string[]} source formats (possibly a subset of one passed in)
 * @returns {NumUsetype[]} possible numutypes
 */
function extractPossibleFormats(source) {
	const exlog = (line, msg) => {
		// warn(`Number Recognizer (CSV line ${line} = ${source[line]}): ${msg}`);
	}

	let args = {};
	const potentialThousandSeparators = ['.',',',' '];
	const potentialDecimalSeparators = ['.',','];
	const cutPattern = getCutPattern({
		numbers: true,
		rest: true
	})

	let memory = {
		prefixes: [],
		suffixes: [],
		delims: [],
		addPrefix: function (p) {
			if (this.prefixes[p])
				this.prefixes[p] += 1;
			else
				this.prefixes[p] = 1;
		},
		addSuffix: function (s) {
			if (this.suffixes[s])
				this.suffixes[s] += 1;
			else
				this.suffixes[s] = 1; 
		},
		addDelims: function (kd, dd, md) {
			let valid = (!dd || potentialDecimalSeparators.includes(dd)) && 
						(!md || potentialThousandSeparators.includes(md)) &&
						(!kd || potentialThousandSeparators.includes(kd));
			if (!valid) { return false; }

			let key = kd + "|" + dd + "|" + md;
			if (this.delims[key])
				this.delims[key] += 1;
			else
				this.delims[key] = 1;

			return true;
		},
		addNum: function (num) {
			this.minVal = Math.min(this.minVal, num);
			this.maxVal = Math.max(this.maxVal, num) ;
		}
	};

	for (let i = 0, upto = source.length; i < upto; i++) {

		let split = [...source[i].trim().matchAll(cutPattern)].map(match => match.groups);

		if (split.every(s => !s.numbers)) {
			exlog(i, "String contains no digits");
			continue;
		}

		// PREFIX extraction
		if (split[0].rest) {
			memory.addPrefix(split[0].rest);
			split.splice(0, 1);
		}

		// SUFFIX extraction
		if (split[split.length - 1].rest) {
			memory.addSuffix(split[split.length - 1].rest);
			split.splice(-1, 1);
		}

		let delims = split.filter(token => token.rest).map(token => token.rest);

		// FORMAT
		// N - number sequence
		// N3 - 3 digits
		// D - delimiter sequence
		// $Di - value of delims[i]

		// FORMAT 
		// 	(N)
		if (delims.length === 0) {
			memory.addDelims("", "", "");
		}
		// FORMAT 
		// 	(N)(D)(N)
		else if (delims.length === 1) {
			memory.addDelims("", delims[0], "");
			if (split[2].numbers.length === 3) {
				memory.addDelims(delims[0], "", "");
			}
		}
		// FORMAT
		//  (N)(D)(N)((D)(N))+
		else {
			let counts = delims.reduce((acc, delim) => {
				if (acc[delim]) 
					acc[delim] += 1;
				else
					acc[delim] = 1; 
				return acc }, {});
			let delimkeys = Object.keys(counts);

			if (delimkeys.length !== 2) {
				exlog(i, `Too many unique delimiters ${delimkeys}`);
				continue;
			}

			if (counts[delimkeys[0]] > 1 && counts[delimkeys[1]] > 1) {
				exlog(i, `No delimiter ${delimkeys} recognized as decimal`);
				continue;
			}

			// FORMAT 
			//  (N)($Dx)(N3)($Dy)(N)
			if (counts[delimkeys[0]] === 1 && counts[delimkeys[1]] === 1) {
				if (split[2].numbers.length !== 3) {
					exlog(i, `Between delimiters ${delimkeys}, there should be 3 digits`);
					continue;
				}
				memory.addDelims(split[1].rest, split[3].rest, "");
				memory.addDelims("", split[1].rest, split[3].rest);
			}
			// FORMAT 
			//  (N)(($Dx)(N))*($Dy)(N)(($Dx)(N))+
			//  (N)(($Dx)(N))+($Dy)(N)(($Dx)(N))*
			else {
				// all non-border digit sequences have to be of length 3
				for (let j = 2, lnidx = split.length - 2; j < lnidx; j += 2) {
					if (split[j].numbers.length !== 3) {
						exlog(i, `Number sequence ${split[j].numbers} has invalid length`);
						continue;
					}
				}
				// first digit sequence hasto be at most 3
				if (split[0].numbers.length > 3) {
					exlog(i, `First digit sequence is longer than 3`);
					continue;
				}

				// determine which delimiter is which
				let dd, td;
				if (counts[delimkeys[0]] === 1) {
					dd = delimkeys[0];
					td = delimkeys[1];
				}
				else if (counts[delimkeys[1]] === 1) {
					dd = delimkeys[1];
					td = delimkeys[0];
				}

				// FORMAT 
				//  (N)((td)(N))+(dd)(N)
				if (split[split.length - 2].rest === dd) {
					memory.addDelims(td, dd);
				}
				// FORMAT 
				//  (N)(($Dx)(N))*($Dy)(N)(($Dx)(N))+
				else {
					// last sequence can be longer (if there are no mili-delimiters)
					if (split[split.length - 1].numbers.length > 3 && split[split.length - 2].rest !== dd) {
						exlog(i, `Last digit sequence is longer than 3 while using mili-delimiter`);
						continue;
					}

					memory.addDelims(td, dd, td);
				}
			}
		}
	}

	let numutypes = [];
	for (let delimset in memory.delims) {
		let delims = delimset.split('|');
		error("delims",delims);
		numutypes.push(new NumUsetype({
			prefixes: Object.keys(memory.prefixes),
			suffixes: Object.keys(memory.suffixes),
			separators: delims,
			integral: delims[1] === ''
		}));
	}

	return numutypes;
}

/**
 * Try to parse a number based on provided format
 * @param {string} source 
 * @param {import('./usetype.js').Number} format Usetype.Number instance containing format info
 * @returns Parsed num if possible, NaN otherwise
 */
export function parseNum(source,format) {
	if (source.length)
		return source.map(format.deformat);
	return format.deformat(source);
}

export const recognizeNumbers = extractPossibleFormats;