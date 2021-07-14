import { Usetype } from './usetype.js';
import { getCutPattern } from '../utils/patterns.js';
import { unicodeConstants, numberConstants } from './parse.constants.js';
import { areEqual, findIndexes, unique } from '../utils/array.js';
import { escapeRegExp } from '../utils/string.js';

let verbose = (window.verbose ?? {}).number;
console.log("parse.num.js verbosity = ", verbose);
if (verbose) {
	var debug = window.console;
}
else {
	var debug = {};
	let funcHandles = Object.getOwnPropertyNames(window.console).filter(item => typeof window.console[item] === 'function');
	funcHandles.forEach(handle => debug[handle] = window.console[handle]);
}


/**
 * Try to recognize possible formats of string-represented numbers in source array.
 * @param {string[]} source strings upon which format should be determined
 * @returns {Number[]} possible number formats of specified strings
 */
export function recognizeNumbers(source, args) {
	// TODO
	const initialBatchSize = 5;

	if (!source || source.length === 0) {
		return [];
	}

	// populate initial batch with largest samples
	let initialBatch = [];
	{
		let sortedSource = [...source].sort();
		initialBatch = sortedSource.slice(0, initialBatchSize);
	}
	debug.log("recognizeNum -- initial batch = ", initialBatch);

	let nuts = extractPossibleFormats(initialBatch, args);
	debug.log("extractedNumUsetypes", nuts);
	let matches = nuts.map(() => 0);
	let disabled = 0;
	for (let i = 0, il = source.length; i < il; i++) {
		let token = source[i];
		// cached in case multiple number usetypes fail here
		let potentialExpansion = undefined;
		for (let j = 0, jl = nuts.length; j < jl; j++) {
			if (!nuts[j].disabled) {
				let num = nuts[j].deformat(token);
				if (num) {
					matches[j]++;
					if (nuts[j].max < num) nuts[j].max = num;
					if (nuts[j].min > num) nuts[j].min = num;
				}
				else {
					debug.log("Matching", nuts[j], "against", token, "failed, disabling potential format.");
					debug.log("Trying to recover expanded number usetype...");
					if (!potentialExpansion) {
						potentialExpansion = extractPossibleFormats([token], args);
						debug.log("Extracting potential expanding usetypes ", potentialExpansion);
					}
					else {
						debug.log("Using pre-extracted potential usetypes ", potentialExpansion);
					}
					let foundExpansion = false;
					for (let k = 0, kl = potentialExpansion.length; k < kl; k++) {
						if (potentialExpansion[k].isSupersetOf(nuts[j])) {
							debug.log("Found fitting expansion. Replacing old ", nuts[j], "with new ", potentialExpansion[k]);

							foundExpansion = true;
							nuts[j] = potentialExpansion[k];
							potentialExpansion.splice(k, 1);
							break;
						}
					}
					if (!foundExpansion) {
						nuts[j].disabled = true;
					}
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

function extractPossibleFormats(source, args) {
	const exlog = (line, msg) => {
		debug.warn(`Number Recognizer (CSV line ${line} = ${source[line]}): ${msg}`);
	}

	/* Unicode character not currently working well, need to find a workaround */
	const knownThousandSeparators = ['.', ',', ' ', '\xa0']; //...unicodeConstants.getUtf16Whitespace()];
	const knownDecimalSeparators = ['.', ','];
	const allKnownSeparators = unique(knownThousandSeparators.concat(knownDecimalSeparators));
	const pureNumericFormPattern = new RegExp('^[' + allKnownSeparators.join('') + '\\d]+$');
	let determinedPrefixes = [];
	let determinedSuffixes = [];

	let determinedMinus = false; // whether format contains negative numbers as well
	let determinedPlus = false; // whether format explicitly uses plus sign

	let determinedLeftEllipsis = false;
	let determinedRightEllipsis = false;

	let determinedScientific = false; // whether format uses scientific notation
	let determinedDelimiterSets = []; // tuples of thousand and decimal separators found

	// Detailed specification:
	// SAMPLE = PREFIX NUMBER SUFFIX
	// PREFIX, SUFFIX = non-numeric sequence
	// NUMBER can be
	// 		- scientific (contains e12345 at the end)
	//		- unsigned/signed/explicit (contains no signs / only minus / both minus and plus)
	//		- whole/decimal (does not / contains decimal part)
	//			DECIMAL - left/right/not ellipsed (can contain forms ".NUM" / "NUM." / only "NUM.NUM")
	//		- fully/partially/not separated (each 3 digits / each 3 decimal digits / no digits are separated by separator)
	for (let i = 0, upto = source.length; i < upto; i++) {
		let sample = source[i];

		let potentialPrefix = "";
		let potentialPrefixMatch = sample.match(/^[^0-9]*[^0-9+-]/);
		if (potentialPrefixMatch) {
			potentialPrefix = potentialPrefixMatch[0];
			sample = sample.replace(potentialPrefixMatch[0], "");
		}
		// sample is now without prefix

		let potentialSuffix = "";
		let potentialSuffixMatch = sample.match(/[^.0-9][^0-9]*$/);
		if (potentialSuffixMatch) {
			potentialSuffix = potentialSuffixMatch[0];
			sample = sample.replace(potentialSuffixMatch[0], "");
		}
		// sample now without suffix

		let potentialScientific = false
		let potentialScientificMatch = sample.match(/e[0-9]+$/);
		if (potentialScientificMatch) {
			potentialScientific = true;
			sample = sample.replace(potentialScientificMatch[0], "");
		}
		// sample now without scienfitic notation

		let potentialMinus = false;
		let potentialPlus = false;
		let potentialSignMatch = sample.match(/^[-+]/);
		if (potentialSignMatch) {
			if (potentialSignMatch[0] === "+")
				potentialPlus = true;
			potentialMinus = true;
			sample = sample.replace(potentialSignMatch[0], "");
		}
		// sample now without sign

		// sample should now contain only numbers and separators
		if (!sample.match(pureNumericFormPattern)) {
			exlog(i, `Stripped sample ${sample} not in pure numeric form .`);
			window.purePat = pureNumericFormPattern;
			continue;
		}

		let potentialThousandSeparators = knownThousandSeparators.filter(sep => sample.includes(sep));
		let potentialDecimalSeparators = knownDecimalSeparators.filter(sep => sample.includes(sep));
		let potentialSeparatorSets = [];
		let containedSeparators = allKnownSeparators.filter(sep => sample.includes(sep));

		// CASE "nothing left"
		if (sample.length === 0) {
			exlog(i, `Sample ${source[i]} empty after stripping process.`);
			continue;
		}
		// CASE no separators
		else if (containedSeparators.length === 0) {
			potentialSeparatorSets.push(["", ""]);
		}
		// CASE only decimal or only thousands separator
		else if (containedSeparators.length === 1) {
			let sep = containedSeparators[0];
			if (isValidThousandSeparator(sample, sep)) {
				potentialSeparatorSets.push([sep, ""]);
			}
			if (isValidDecimalSeparator(sample, sep)) {
				potentialSeparatorSets.push(["", sep]);
			}
		}
		// CASE both decimal and thousands separators present
		else {
			let builtinParseSuccess = false;
			for (let tsep of potentialThousandSeparators) {
				for (let dsep of potentialDecimalSeparators) {
					if (tsep === dsep)
						continue;

					if (!isValidThousandSeparator(sample, tsep))
						continue;

					if (!isValidDecimalSeparator(sample, dsep))
						continue;

					let parseSample = sample.split(tsep).join("").split(dsep).join(".");

					if (!isNaN(parseFloat(parseSample))) {
						potentialSeparatorSets.push([tsep, dsep]);
						console.error("ALSEP", [tsep, dsep]);
						builtinParseSuccess = true;
					}
				}
			}
			if (!builtinParseSuccess) {
				exlog(i, `Failed to parse ${sample} using parseFloat with any combination of separators.`);
				continue;
			}
		}

		/* TODO: Potentially check for ellipses, and separation (full/partial) */
		// let potentialLeftEllipsis = false;
		// let potentialLeftEllipsisMatch = sample.match(/^\./);
		// if (potentialLeftEllipsisMatch)
		// 	potentialLeftEllipsis = true;

		// let potentialRightEllipsis = false;
		// let potentialRightEllipsisMatch = sample.match(/\.$/);

		/* TODO: Potential strict mode where inconsitencies are considered errors */
		if (potentialPrefix)
			determinedPrefixes.push(potentialPrefix);
		if (potentialSuffix)
			determinedSuffixes.push(potentialSuffix);

		determinedMinus &= potentialMinus;
		determinedPlus &= potentialPlus;

		determinedLeftEllipsis = false;
		determinedRightEllipsis = false;

		determinedScientific &= potentialScientific;
		determinedDelimiterSets = determinedDelimiterSets.concat(potentialSeparatorSets);

	}

	let numutypes = [];
	for (let delimset of determinedDelimiterSets) {
		let numutype = new Number({
			prefixes: determinedPrefixes,
			suffixes: determinedSuffixes,
			separators: delimset,
			integral: !delimset[1],
			scientific: determinedScientific,
			explicitSign: determinedPlus
		}, args);
		numutypes.push(numutype);
	}

	let change = true;
	while (change) {
		change = false;
		for (let i = 0; i < numutypes.length; i++) {
			for (let j = 0; j < numutypes.length; j++) {
				if (i === j)
					continue;
				if (numutypes[i].isEqualTo(numutypes[j]) ||
					numutypes[i].isSupersetOf(numutypes[j])) {
					numutypes.splice(j);
					change = true;
				}
				else if (numutypes[j].isSupersetOf(numutypes[i])) {
					numutypes.splice(i);
					change = true;
				}
				if (change) break;
			}
			if (change) break;
		}
	}

	return numutypes;
}

/**
 * @param {string[]} source formats (possibly a subset of one passed in)
 * @returns {Number[]} possible numutypes
 */
function extractPossibleFormatsOld(source, args) {
	const exlog = (line, msg) => {
		debug.warn(`Number Recognizer (CSV line ${line} = ${source[line]}): ${msg}`);
	}

	const potentialThousandSeparators = ['.', ',', ...unicodeConstants.getUtf16Whitespace()];
	const potentialDecimalSeparators = ['.', ','];
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

			console.log(`addDelims(${kd},${dd},${md}) = (${kd.charCodeAt(0)})-(${potentialThousandSeparators.includes(kd)}) `);
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
			this.maxVal = Math.max(this.maxVal, num);
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
		console.log("delims for ", source[i], " are (", delims.join(","), ")");

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
				return acc
			}, {});
			let delimkeys = Object.keys(counts);

			if (delimkeys.length === 1) {
				memory.addDelims(delimkeys[0], "", "");
				continue;
			}

			if (delimkeys.length !== 2) {
				exlog(i, `Too many unique delimiters (${delimkeys})`);
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
	console.log("MEM", memory);
	let numutypes = [];
	for (let delimset in memory.delims) {
		let delims = delimset.split('|');
		numutypes.push(new Number({
			prefixes: Object.keys(memory.prefixes),
			suffixes: Object.keys(memory.suffixes),
			separators: delims,
			integral: delims[1] === ''
		}, args));
	}

	return numutypes;
}

function isValidThousandSeparator(string, sep) {
	// thousands separator is valid only if it separates groups of 3 digits,
	// with the exception of first part, last part, and the part with decimal separator
	let split = string.split(sep);
	if (split[0].length > 3)
		return false;
	if (split[split.length - 1].length !== 3 && split[split.length - 1].match(/^[0-9]+$/))
		return false;
	return split.slice(1, -1).every(part => part.length === 3 || part.match(/\D/));
}

function isValidDecimalSeparator(string, sep) {
	// decimal separator is valid only if it occurs once
	let decimalMatch = string.match(new RegExp(escapeRegExp(sep), "g"));
	return decimalMatch && decimalMatch.length === 1;
}

/**
 * Try to parse a number based on provided format
 * @param {string} source 
 * @param {import('./usetype.js').Number} format Usetype.Number instance containing format info
 * @returns Parsed num if possible, NaN otherwise
 */
export function parseNum(source, format) {
	if (source.length)
		return source.map(format.deformat);
	return format.deformat(source);
}

/**
 * @typedef NumberUsetypeArgs
 * Argument object used to construct {@see Number}.
 * @property {number} [min] minimal value, if none provided, max is treated as a sample
 * @property {number} [max] maximal value, if none provided, min is treated as a sample
 * @property {string} [decimalSeparator] default ".", replaces dot in e.g. $13.59
 * @property {string} [thousandSeparator] default "", inserted between thousands, e.g. 15.000.000 pcs
 * @property {boolean} [separateDecimalThousands] default false, if thousands should be separated on right-side as well
 * @property {string} [prefix] default none, prefixes all numbers
 * @property {string} [suffix] default none, suffixes all numbers
 * @property {number} [integerPlaces] default 0, minimal length to be padded on the left
 * @property {number} [decimalPlaces] default 0, minimal length to be padded on the right
 * @property {boolean} [integral] default true, if number is whole (no decimal places)
*/

const nullNum = () => 1234567.654321;

/**
 * Number usetype. Mostly any numerical formats can be wrapped by this.
 * Usetypes such as prices, numbers...
 * @todo ratios, fractions
 * @implements {Usetype}
 */
export class Number extends Usetype {

	constructor({
		separators = [],
		prefixes = [],
		suffixes = [],
		scientific = false,
		strictlyPositive = false,
		explicitSign = false
	}, args) {
		super(args);
		if (separators.length > 0 && separators[0] !== "") {
			this.thousandSeparator = separators[0];
		}
		if (separators.length > 1 && separators[1] !== "") {
			this.decimalSeparator = separators[1];
		}
		else {
			this.integral = true;
		}
		if (separators.length > 2 && separators[2] === separators[0]) {
			this.separateDecimalThousands = true;
		}
		if (scientific) {
			this.scientific = true;
		}
		if (strictlyPositive) {
			this.strictlyPositive = true;
		}
		if (explicitSign) {
			this.explicit = true;
		}

		this.prefixes = prefixes;
		let prefixIndicators = recognizeIndicators(this.prefixes);
		if (prefixIndicators.type !== 'unknown') {
			this.prefixes = prefixIndicators.domain;
			this.prefixPlaceholder = prefixIndicators.type;
		}

		this.suffixes = suffixes;
		let suffixIndicators = recognizeIndicators(this.suffixes);
		if (suffixIndicators.type !== 'unknown') {
			this.suffixes = suffixIndicators.domain;
			this.suffixPlaceholder = suffixIndicators.type;
		}

	}

	//#region Defaults
	prefixes = [];
	suffixes = [];
	decimalSeparator = "";
	thousandSeparator = "";
	separateDecimalThousands = false;
	scientific = false;
	explicit = false;
	//#endregion

	/**
	 * Format passed in number as a string, using this Usetype's config.
	 * @param {number} num number to convert to formatted string
	 * @returns {string} formatted number as string using self
	 */
	format(num) {
		function _addSeparator(str, sep, leftAligned) {
			let bits = leftAligned ?
				str.match(/.{1,3}/g) :
				str.match(/.{1,3}(?=(.{3})*$)/g)
			return bits.join(sep);
		}

		let outPrefix = this.prefixPlaceholder ?? this.prefixes;
		let outSuffix = this.suffixPlaceholder ?? this.suffixes;

		if (this.scientific) {
			let exponent = num.toFixed(1).indexOf(".") - 1;
			num /= 10 ** exponent;
			suffix = "e" + exponent + suffix;
		}

		if (this.explicit && num >= 0) {
			prefix += "+";
		}

		var numString;
		if (this.decimalPlaces)
			numString = num.toFixed(this.decimalPlaces);

		else
			numString = num.toString();
		var numParts = numString.split(".");

		var wholePart = numParts[0];

		if (this.integerPlaces > 0 && numParts[0].length < this.integerPlaces)
			wholePart = "0".repeat(this.integerPlaces - wholePart.length) + wholePart;

		wholePart = _addSeparator(numParts[0], this.thousandSeparator, false);

		if (this.integral)
			return outPrefix + wholePart + outSuffix;

		var decimalPart = "0";

		if (numParts.length > 1)
			decimalPart = numParts[1];

		if (this.decimalPlaces > 0 && numParts[1].length < this.decimalPlaces)
			decimalPart = decimalPart + "0".repeat(this.decimalPlaces - decimalPart.length);

		if (this.separateDecimalThousands)
			decimalPart = _addSeparator(numParts[1], this.thousandSeparator, true);

		return outPrefix + wholePart + this.decimalSeparator + decimalPart + outSuffix;
	}

	/** 
	 * Transform formatted string to number
	 * @param {string} x to try to parse
	 * @returns {number} number represented by input string
	 */
	deformat(str) {
		// TODO
		let temp = str;
		this.prefixes.forEach(prefix => temp.startsWith(prefix) && (temp = temp.slice(prefix.length)));
		this.suffixes.forEach(suffix => temp.endsWith(suffix) && (temp = temp.slice(0, temp.length - suffix.length)));
		if (this.decimalSeparator)
			temp = temp.split(this.decimalSeparator).join('.');
		if (this.thousandSeparator)
			temp = temp.split(this.thousandSeparator).join('');
		if (isNaN(temp))
			return null;
		return +temp;
	}

	isSupersetOf(other) {
		if (!other.prefixes.every(prefix => this.prefixes.includes(prefix))) {
			let exceptions = other.prefixes.filter(prefix => !this.prefixes.includes(prefix));
			debug.warn("isSupersetOf() incompatible prefix sets", this.prefixes, other.prefixes, " -> ", exceptions);
			return false;
		}

		if (!other.suffixes.every(suffix => this.suffixes.includes(suffix))) {
			let exceptions = other.suffixes.filter(suffix => !this.suffixes.includes(suffix));
			debug.warn("isSupersetOf() incompatible suffix sets", this.suffixes, other.suffixes, " -> ", exceptions);
			return false;
		}

		if (other.decimalSeparator &&
			this.decimalSeparator !== other.decimalSeparator) {
			debug.warn("isSupersetOf() incompatible decimal separators ", this.decimalSeparator, other.decimalSeparator);
			return false;
		}

		if (other.thousandSeparator &&
			this.thousandSeparator !== other.thousandSeparator) {
			debug.warn("isSupersetOf() incompatible thousand separators ", this.thousandSeparator, other.thousandSeparator);
			return false;
		}

		return true;
	}

	isSubsetOf(other) {
		return other.isSupersetOf(this);
	}

	isEqualTo(other) {
		return this.isSupersetOf(other) && other.isSupersetOf(this);
	}

	isSimilarTo(other) {
		return this.isSupersetOf(other) || this.isSubsetOf(other);
	}

	toString() {
		if (this.min && this.max) {
			return "N{" + this.format(this.min) + "-" + this.format(this.max) + "}";
		}
		else if (this.min) {
			return "N{" + this.format(this.min) + "}";
		}
		else if (this.max) {
			return "N{" + this.format(this.max) + "}";
		}
		else {
			return "N{" + this.format(nullNum()) + "}";
		}
	}
	toFormatString() { return ""; }
	toDebugString() { return "Usetype::Number()"; }

	/** 
	 * Possible underlying types for this Usetype subclass.
	 * @type {string}
	 * @todo Set as static
	 */
	compatibleTypes = [];

	/**
	 * Underlying type for this Usetype instance.
	 * @type {string}
	 */
	compatibleTypes = ["number"];
	type = "number";
	domainType = 'ordinal';
	priority = 2;
}

function recognizeIndicators(indicators) {
	let currCodes = numberConstants.getCurrencyCodes();

	if (!indicators || 
		!(indicators instanceof Array) || 
		indicators.length === 0 || 
		indicators.every(ind => ind.match(/^\s*$/))) {
		return { type: 'unknown', format: 'unknown', domain: [] };
	}

	if (indicators.every(indicator => currCodes.includes(indicator))) {
		return { type: 'currency', format: 'code', domain: [...currCodes] };
	}

	let currSymbols = numberConstants.getCurrencySymbols();
	if (indicators.every(indicator => currSymbols.includes(indicator))) {
		return { type: 'currency', format: 'symbol', domain: [...currSymbols] };
	}

	let metricPrefixSymbols = numberConstants.getMetricPrefixSymbols();
	let cardinalityPrefixSymbols = numberConstants.getCardinalityPrefixSymbols();
	let magnitudePrefixSymbols = [].concat(metricPrefixSymbols, cardinalityPrefixSymbols);
	if (indicators.every(indicator => magnitudePrefixSymbols.includes(indicator))) {
		return { type: 'magnitude', format: 'symbol', domain: [...magnitudePrefixSymbols] };
	}

	let metricPrefixNames = numberConstants.getMetricPrefixes();
	if (indicators.every(indicator => metricPrefixNames.includes(indicator)))
		return { type: 'magnitude', format: 'prefix', domain: [...metricPrefixNames] };

	return { type: 'unknown', format: 'unknown', domain: [] };
}