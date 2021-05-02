import * as logic from '../utils/logic.js';
import { conditionalCartesian } from '../utils/utils.js';
import { Timestamp } from './usetype.js';
/**
 * @file Handles parsing of types *Date*, *DateTime* and *TimeOfDay*.
 * 
 * Terminology-wise, all of the types above belong to a *Timestamp* group.
 * They consist of *Specifiers* (year, month, day, hour...), and *Delimiters*
 * 
 * For simplicity, internally it uses array [Y, M, D, h, m, s, q], where elements are indexes
 * of respective *Specifiers*.
 * 
 * E.g. date "22.06.1998 13:55:48" would correspond to a format [2, 1, 0, 3, 4, 5, -7] (DD.MM.YYYY hh:mm:ss)
 * Specifiers which are not present are indexed by arbitrary negative number.
 * 
 * Outside, it returns a usual readable format (e.g. DD.MM.YYYY, hh:mm)
 * Which for one enables to write down more complex compositions, different types (DD as in 04.02.1990 vs D as 4.2.1990)
 * And is readable right off the bat.
 * Also enables nice expansion of new elements (year quadrant, month abbrevs...)
 */

export function recognizeTimestamp(source, params) {
	let formats = recognizeTimestampFormat(source, params);
	let categories = recognizeTimestampKinds(formats);
	let readableFormats = formats.map(f => formatToString(f));
	return readableFormats.map(format => new Timestamp(format)); // [categories, readableFormats];
}


/**
 * @param {string[]} source Source string array holding data to be recognized.
 * @param {object} params Uncertaing usage as for now (TODO), holds info about NOVAL etc.
 * @returns {[string[], string[]]} Tuples of arrays in form of [date/datetime/timeofday, format].
 */
function recognizeTimestampFormat(source, params) {
	if (source.length === 0)
		return [];

	let yearIdxs = [-7]; // (technically 271821 BCE ~ 275760 CE) 1970 - 9999 (following suite for C#'s datetime)
	let monthIdxs = [-6]; // 1 - 12
	let dayIdxs = [-5]; // 1 - 31 (28)
	let hourIdxs = [-4]; // 0 - 23
	let minIdxs = [-3]; // 0 - 59
	let secIdxs = [-2]; // 0 - 59
	let milsecIdxs = [-1]; // 0 - 999

	let split = source[0].match(alphanumCutPattern);

	if (params.noval) {
		let at = 0;
		while (source[at++] === params.noval);
		split = source[at].match(alphanumCutPattern);
	}

	for (let i in split) {
		let token = split[i];
		let parsed = parseInt(token);
		if (!parsed) {
			if (MonthNames.includes(token) || MonthAbbrevs.includes(token)) {
				monthIdxs.push(i);
				token = split[i] = MonthNames.indexOf(token) ? MonthNames.indexOf(token) + 1 : MonthAbbrevs.indexOf(token) + 1;
				continue;
			}
		}

		if (1970 <= token && token <= 9999)
			yearIdxs.push(i);
		if (1 <= token && token <= 12)
			monthIdxs.push(i);
		if (1 <= token && token <= 31)
			dayIdxs.push(i);
		if (0 <= token && token <= 23)
			hourIdxs.push(i);
		if (0 <= token && token <= 59)
			minIdxs.push(i);
		if (0 <= token && token <= 59)
			secIdxs.push(i);
		if (0 <= token && token <= 999)
			milsecIdxs.push(i);
	}

	let filterCallback = logic.ruleAll(
		logic.ruleImplies(exist('D'), exist('M')),
		logic.ruleImplies(exist('q'), exist('s')),
		logic.ruleImplies(exist('m'), exist('h')),
		logic.ruleImplies(exist('s', 'h'), exist('m')),
		logic.ruleImplies(exist('s','q'), grouped('s','q')),
		logic.ruleImplies(exist('m','s'), grouped('m','s')),
		logic.ruleImplies(exist('h','m'), grouped('h','m')),
		logic.ruleImplies(exist('D','M'), grouped('D','M')),
		logic.ruleImplies(exist('D','M','Y'), logic.ruleAny(
			grouped('D','Y'), // ...MDY...
			grouped('M','Y') // ...DMY...
		)),
		inclusive()
	);
	
	let condCartArgs = {
		sturdy:true, 
		callback:filterCallback
	};
	let formats = conditionalCartesian(condCartArgs, yearIdxs, monthIdxs, dayIdxs, hourIdxs, minIdxs, secIdxs, milsecIdxs);

	console.log("recognizeTimestampFormats - initial conditional cartesian: ", formats);

	let maxErrs = Math.max(5, source.length / 1000);

	let missThreshold = -1;
	while (++missThreshold <= 6) {
		const misses = (f) => f.reduce((i, n) => n < 0 ? ++i : i, 0);
		let formatBatch = formats.filter(f => misses(f) === missThreshold);
		let formatBatchErrs = formatBatch.map(x => 0);

		if(formatBatch.length === 0) continue;

		for (let t = 1; t < source.length; t++) {

			if (params.noval && source[t] === params.noval)
				continue;	

			let split = source[t].match(alphanumCutPattern);
			let tokens = split.map(parseSpecifier);

			// validate current record against all formats within batch
			// penalize incorrect ones
			for (let j = 0; j < formatBatch.length; j++) {
				if (!validateTimestampFormat(tokens, formatBatch[j]))
					formatBatchErrs[j]++;
			}

			// get rid of imprecise formats
			formatBatch = formatBatch.filter((_, idx) => formatBatchErrs[idx] < maxErrs);
		}

		if(formatBatch.length > 0)
		{
			console.log("recognizeTimestampFormats - successful format batch: ", formatBatch);
			return formatBatch;
		}
	}

	return [];

}

export function parseTimestamp(source, format) {
	if (format.match(/Y|M|D/))
		return parseDate(source, format);
	else
		return parseTimeOfDay(source, format);
}

function parseDate(source, format) {
	let data = source.split(/[^0-9]/);
	let Y = 0, M = 1, D = 1, h = 0, m = 0, s = 0, q = 0;
	for (let i = 0; i < format.length; i++) {
		switch (format[i]) {
			case "Y":
				Y = parseInt(data[i]);
				break;
			case "M":
				M = parseInt(data[i]);
				break;
			case "D":
				D = parseInt(data[i]);
				break;
			case "h":
				h = parseInt(data[i]);
				break;
			case "m":
				m = parseInt(data[i]);
				break;
			case "s":
				s = parseInt(data[i]);
				break;
			case "q":
				q = parseInt(data[i]);
				break;
		}
	}
	return new Date(Y, M, D, h, m, s, q);
}

function parseTimeOfDay(source, format) {
	let data = source.split(/[^0-9]/);
	let h = 0, m = 0, s = 0, q = 0;
	for (let i = 0; i < format.length; i++) {
		switch (format[i]) {
			case "h":
				h = parseInt(data[i]);
				break;
			case "m":
				m = parseInt(data[i]);
				break;
			case "s":
				s = parseInt(data[i]);
				break;
			case "q":
				q = parseInt(data[i]);
				break;
		}
	}
	return [h, m, s, q];
}


var DayAbbrevs = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
var DayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
var MonthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var MonthAbbrevs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Sep', 'Oct', 'Nov', 'Dec']
var MonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'September', 'October', 'November', 'December']
var DateFormatChars = ['Y','M','D','h','m','s','q'];

const allCutPattern = /((?:[A-Za-z]+)|(?:[0-9]+)|(?:[^a-zA-Z0-9]*))/g;
const alphanumCutPattern = /((?:[A-Za-z]+)|(?:[0-9]+))/g;
const numCutPattern = /((?:[0-9]+)|(?:[^0-9]+))/g;

// Functions below generate helper functions for format filter.
// is - characters from {@var DateFormatChars} to check conditions with.
// f - array of numbers indicating indexes of timestamp units ordering.
// 		eg. [0, 1, 2, 5, 6, -2, -1] mean indexes of Year, Month, Day, Hour, Minute, Second, Millisecond respectively,
//		while all negative values mean the specific part isn't present.

/** Generate function that tells if format 'f' contains timestamp parts '...is' */
const exist = (...is) => (f => is.every(i => f[DateFormatChars.indexOf(i)] >= 0));
/** Generate function that tells if timestamp parts '...is' appear in specified order in format 'f' */
const inorder = (...is) => (f => is.map(i => f[DateFormatChars.indexOf(i)]).every((_,p,is) => !is[p + 1] || is[p] < is[p + 1]));
/** Generate function that tells if timestamp parts '...is' are together AND in specified order in format 'f' */
const consecutives = (...is) => logic.ruleBoth(inorder(...is), grouped(...is));
/** Generate function that tells if timestamp parts '...is' are together in format 'f' */
const grouped = (...is) => function(f) {
	let fis = is.map(i => f[DateFormatChars.indexOf(i)]);
	let [bot, top] = [Math.min(...fis), Math.max(...fis)];
	let debug = f.map(ff => fis.includes(ff) ? 1 : ff <= bot ? 2 : ff >= top ? 3 : 0);
	return f.every(ff => fis.includes(ff) | ff <= bot | ff >= top);
}
/** Generate function that tells if format 'f' includes all parts within defined parts (eg. format with Years and Minutes needs Month, Days and Hours as well) */
const inclusive = () => function(f) {
	let wasT = false;
	let wasF = false;
	for (let i = 0; i < f.length; i++) {
		if (f[i] >= 0 && !wasT)
			wasT = true;
		else if (f[i] < 0 && wasT)
			wasF = true;
		else if (f[i] >= 0 && wasF)
			return false;
	}
	return true;
}


const upperBounds = [9999, 12, 31, 23, 59, 59, 999];
const lowerBounds = [1970, 1, 1, 0, 0, 0, 0];
const validateTimestampBounds = (tokens, format) => format.every((f,i) => f < 0 || lowerBounds[i] <= tokens[f] && tokens[f] <= upperBounds[i])

const validateTimestampFormat = (tokens, format) => (format[0] < 0 || 1970 <= tokens[format[0]] && tokens[format[0]] <= 9999)
													&& (format[1] < 0 || (1 <= tokens[format[1]] && tokens[format[1]] <= 12))
													&& (format[2] < 0 || (1 <= tokens[format[2]] && tokens[format[2]] <= 31))
													&& (format[3] < 0 || (0 <= tokens[format[3]] && tokens[format[3]] <= 23))
													&& (format[4] < 0 || (0 <= tokens[format[4]] && tokens[format[4]] <= 59))
													&& (format[5] < 0 || (0 <= tokens[format[5]] && tokens[format[5]] <= 59))
													&& (format[6] < 0 || (0 <= tokens[format[6]] && tokens[format[6]] <= 999));

/**
 * Parse string as a possible datetime specified (account for it being a number, month abbrev, month name, day name...)
 * @param {string} x 
 * @returns 
 */
const parseSpecifier = (x) => {
	let num = parseInt(x);
	if (num || num === 0) // JS is really dumb sometimes
		return num;

	let monthAbbrevIdx = MonthAbbrevs.indexOf(x);
	if (monthAbbrevIdx >= 0)
		return monthAbbrevIdx + 1;

	let monthNameIdx = MonthNames.indexOf(x);
	if (monthNameIdx >= 0)
		return monthNameIdx + 1;

	return undefined;
}

/**
 * 
 * @param {number[][]} formats Array of internal-like formats
 * @returns {string[]} Categories of provided formats (date,datetime,timeofday)
 */
function recognizeTimestampKinds(formats) {
	let types = [];
	const dateCondition = logic.ruleAny(
		exist('Y'),
		exist('M'),
		exist('D')
	);

	const timeCondition = logic.ruleAny(
		exist('h'),
		exist('m'),
		exist('s'),
		exist('q')
	)

	let kinds = [];
	for (let f of formats) {
		let isd = dateCondition(f);
		let ist = timeCondition(f);
		if (isd && ist)
			kinds.push("datetime");
		else if (isd)
			kinds.push("date");
		else if (ist)
			kinds.push("timeofday");
	}
	
	return kinds;
}

function formatToString(format) {
	let reformat = ["","","","","","",""];
	if(format[0] >= 0)reformat[format[0]] = "Y";
	if(format[1] >= 0)reformat[format[1]] = "M";
	if(format[2] >= 0)reformat[format[2]] = "D";
	if(format[3] >= 0)reformat[format[3]] = "h";
	if(format[4] >= 0)reformat[format[4]] = "m";
	if(format[5] >= 0)reformat[format[5]] = "s";
	if(format[6] >= 0)reformat[format[6]] = "n";
	return reformat.join("");
}

