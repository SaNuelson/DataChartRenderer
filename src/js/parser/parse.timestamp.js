import { must } from '../utils/logic.js';
import { clamp, conditionalCartesian } from '../utils/utils.js';
import { Usetype } from './usetype.js';
import { getCutPattern } from '../utils/patterns.js';
import { infill, areEqual, groupBy, hasDuplicates } from '../utils/array.js';
import { escapeRegExp } from '../utils/string.js';
import { timestampConstants } from './parse.constants.js';
import { compareDates, compareTods } from '../utils/time.js';

/**
 * @file Holds timestsamp parsing, recognizing logic along with format wrapper
 * @todo UTC time zones
 */

/**
 * Recognize possible timestamp formats in provided strings.
 * @param {string[]} source array of strings with expected uniform formatting
 * @param {*} args NYI, additional parameters for recognizer
 * @returns {Timestamp[]} array of extracted timestamp usetypes
 */
export function recognizeTimestamps(source, args) {
    const initialBatchSize = 5;

    // first try the most frequently used timestamps
    let expectedUsetypes = getExpectedUsetypes(args);
    expectedUsetypes = filterTimestampUsetypes(source, expectedUsetypes);
    expectedUsetypes = filterDuplicatesAndSubtypes(expectedUsetypes);

    if (expectedUsetypes.length > 0) {
        return expectedUsetypes;
    }

    // otherwise do it the hard way
    let initialBatch = source.slice(0, initialBatchSize);
    let extractedUsetypes = extractTimestampUsetypes(initialBatch, args);
    
    extractedUsetypes = filterInvalidUsetypes(extractedUsetypes);
    
    extractedUsetypes = filterTimestampUsetypes(source, extractedUsetypes);
    
    extractedUsetypes = filterDuplicatesAndSubtypes(extractedUsetypes);

    return extractedUsetypes;
}

/** For each string in source, find all possible mappable formattings */
function extractTimestampUsetypes(source, args) {

    let formattings = [];
    let memo = {};
    let hashTable = {};
    let tokenHandles = Object.keys(TimestampTokenDetails);
    for (let string of source) {
        let combinations = extractTokenRecursive(string);
        combinations.forEach(combination => {
            if (!hashTable[combination]) {
                hashTable[combination] = true;
                formattings.push(combination);
            }
        })
    }

    let usetypes = formattings.map(f => new Timestamp({ formatting: f }, args));
    return usetypes;

    function extractTokenRecursive(string, usedCategories = [], startingIndex = 0) {

        if (string === "")
            return [[]];

        if (memo[[string, '|', usedCategories]]) {
            let ret = memo[[string, '|', usedCategories]];
            return ret;
        }

        let retSet = [];
        for (let i = startingIndex, l = tokenHandles.length; i < l; i++) {
            let token = TimestampTokenDetails[tokenHandles[i]];

            if (usedCategories.includes(token.category)) {
                continue;
            }

            let pattern = new RegExp(token.regexBit);
            let match = string.match(pattern);
            if (match) {

                let newUsedCategories = [token.category, ...usedCategories];
                let parts = string.split(match[1]);
                let leftPart = parts[0];
                let rightPart = parts.slice(1).join(match[1]);

                let leftSplits = extractTokenRecursive(leftPart, newUsedCategories);
                for (let left of leftSplits) {

                    let leftUsedCategories = left.map(label => getTokenDetailsByLabel(label).category).filter(c => c);
                    let newNewUsedCategories = [].concat(newUsedCategories, leftUsedCategories);

                    let rightSplits = extractTokenRecursive(rightPart, newNewUsedCategories);
                    for (let right of rightSplits) {
                        let comb = [].concat(left, [token.label], right);
                        retSet.push(comb);
                    }
                }
            }
        }

        if (retSet.length > 0) {
            memo[[string, '|', usedCategories]] = retSet;
            return retSet;
        }

        // unknown string, considered literal
        memo[[string, '|', usedCategories]] = [[string]];
        return [[string]];
    }
}

/** For each string in source, check if each usetype is applicable and correct */
function filterTimestampUsetypes(source, usetypes) {
    for (let i = 0; i < source.length; i++) {
        for (let usetype of usetypes) {
            let val = usetype.deformat(source[i]);
            if (val === null) {
                usetype.disabled = true;
            }
        }

        let nextUsetypes = usetypes.filter(usetype => !usetype.disabled);

        // False positive on [1000, 1000, 5000, ...] with single usetype ['{YYYY}']
        // if (nextUsetypes.length === 1) {
        //     return nextUsetypes;
        // }
        if (nextUsetypes.length === 0) {
            return [];
        }
        usetypes = nextUsetypes;
    }
    return usetypes;
}

function filterInvalidUsetypes(usetypes) {
    return usetypes.filter(hasValidFormat);
}

/** For each usetype, check if there is more specific usetype in the set */
function filterDuplicatesAndSubtypes(usetypes) {
    for (let i = 0; i < usetypes.length; i++) {
        let subtypes = [];
        for (let j = i + 1; j < usetypes.length; j++) {
            if (usetypes[i].isSupersetOf(usetypes[j]))
                subtypes.push(j);
        }
        usetypes = usetypes.filter((_, i) => !subtypes.includes(i));
    }

    return usetypes;
}

/** If present, select usetypes which belong to the expected set of timestamp formats */
var expectedUsetypesCache;
function getExpectedUsetypes(args) {
    if (!expectedUsetypesCache)
        generateExpectedUsetypes();
    return expectedUsetypesCache.map(format => new Timestamp({formatting: format, skipValidation: true}, args));

    function generateExpectedUsetypes() {
        // TODO: Move to json and fetch from there.
        let cache = [];

        //#region UTC

        const utcDateBasic = [
            ['{YYYY}', '{MM}', '{DD}'],
            ['--', '{MM}', '{DD}']
        ];
        cache = cache.concat(utcDateBasic);

        const utcDateExtended = [
            ['{YYYY}', '-', '{MM}', '-', '{DD}'],
            ['{YYYY}', '-', '{MM}'],
            ['--', '{MM}', '-', '{DD}']
        ];
        cache = cache.concat(utcDateExtended);

        const utcDateTimeConnector = 'T';

        const utcTimeBasic = [
            ['T', '{hh}', '{mm}', '{ss}', '.', '{nnn}'],
            ['T', '{hh}', '{mm}', '{ss}'],
            ['T', '{hh}', '{mm}'],
            ['T', '{hh}']
        ];
        cache = cache.concat(utcTimeBasic);

        let utcDatetimeBasic = [];
        for (let date of utcDateBasic)
            for (let time of utcTimeBasic)
                utcDatetimeBasic.push(date.concat(time));
        cache = cache.concat(utcDatetimeBasic);

        const utcTimeExtended = [
            ['{hh}', ':', '{mm}', ':', '{ss}', '.', '{nnn}'],
            ['{hh}', ':', '{mm}', ':', '{ss}'],
            ['{hh}', ':', '{mm}']
        ];
        cache = cache.concat(utcTimeExtended);

        let utcDatetimeExtended = [];
        for (let date of utcDateExtended)
            for (let time of utcTimeExtended)
                utcDatetimeExtended.push(date.concat([utcDateTimeConnector], time));
        cache = cache.concat(utcDatetimeExtended);

        //#endregion

        //#region Frequent

        const frequentDateSeparators = ['.','-','/'];
        const frequentTimeSeparators = [':','.'];
        const frequentDateTimeSeparators = [' ', '\t'];
        const frequentDateOrders = [
            ['{DD}','{MM}','{YYYY}'],
            ['{DD}','{MM}','{YY}'],
            ['{MM}','{DD}','{YYYY}'],
            ['{MM}','{DD}','{YY}'],
            ['{YYYY}','{MM}','{DD}']
        ];

        const frequentTimeOrders = [
            ['{hh}','{mm}','{ss}','{nnn}'],
            ['{hh}','{mm}','{ss}'],
            ['{hh}','{mm}']
        ];

        let frequentDates = [];
        for (let date of frequentDateOrders)
            for (let sep of frequentDateSeparators)
                frequentDates.push(infill(date, sep));
        cache = cache.concat(frequentDates);

        let frequentTimes = [];
        for (let time of frequentTimeOrders)
            for (let sep of frequentTimeSeparators)
                frequentTimes.push(infill(time, sep));
        cache = cache.concat(frequentTimes);

        let frequentDatetimes = [];
        for (let date of frequentDates)
            for (let time of frequentTimes)
                frequentDatetimes = frequentDatetimes.concat(frequentDateTimeSeparators.map(sep => [].concat(date, [sep], time)));
        cache = cache.concat(frequentDatetimes);

        //#endregion

        expectedUsetypesCache = cache;
    }

}

/**********************\
   Timestamp::Usetype   
\**********************/

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthAbbrevs = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekDayAbbrevs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


function determineTypeFromFormatting(format) {

    let tokens = format.map(label => TimestampLabelToToken[label]);
    tokens = tokens.filter(t => t);
    let tokenCategories = tokens.map(token => TimestampTokenDetails[token].category);

    const timeCategories = [
        TimestampCategory.Hours,
        TimestampCategory.Minutes,
        TimestampCategory.Seconds,
        TimestampCategory.Milliseconds
    ];

    const dateCategories = [
        TimestampCategory.Years,
        TimestampCategory.Months,
        TimestampCategory.Days,
        TimestampCategory.Era
    ];

    let containsDate = false;
    if (tokenCategories.some(category => dateCategories.includes(category)))
        containsDate = true;

    let containsTime = false;
    if (tokenCategories.some(category => timeCategories.includes(category)))
        containsTime = true;

    if (containsTime && containsDate)
        return "datetime";

    if (containsTime)
        return "timeofday";

    if (containsDate)
        return "date";

    return "unknown";
}

function hasValidFormat(timestamp) {
    return validateTimestampFormat(timestamp.formatting) && timestamp.type !== "unknown";
}

function dateToTimeOfDay(date) {
    return [date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()];
}

function validateTimestampFormat(format) {

    let tokenLabels = format.filter(label => Object.values(TimestampTokenDetails).some(token => token.label === label));
    if (hasDuplicates(tokenLabels)) {
        return false;
    }
    let tokens = format.map(label => TimestampLabelToToken[label]);
    tokens = tokens.filter(l => l);
    let categories = tokens.map(token => TimestampTokenDetails[token].category);

    if (hasDuplicates(categories))
        return false;

    if (!enforceCustomRules(format))
        return false;

    return true;
}

function enforceCustomRules(format) {

    function has(...categories) {
        return function (format) {
            return categories.every(category =>
                format.some(label =>
                    getTokenDetailsByLabel(label).category === category));
        }
    }

    function areInOrder(...cats) {
        return function (format) {
            let formatCats = format.map(label => getTokenDetailsByLabel(label).category);
            let retval = cats
                .map(cat => formatCats.indexOf(cat))
                .map((cat, idx, arr) => idx === arr.length - 1 || cat < arr[idx + 1])
                .reduce((acc, cat) => acc && cat, true);
            return retval;
        }
    }

    function areInOrderIfExist(cat1, cat2) {
        if (cat1 instanceof Array && cat2 instanceof Array) {
            return function (format) {
                let formatCats = format
                    .map(label => getTokenDetailsByLabel(label).category)
                    .filter(c => c);
                let cat1idxs = cat1.map(cat => formatCats.indexOf(cat)).filter(idx => idx >= 0);
                let cat2idxs = cat2.map(cat => formatCats.indexOf(cat)).filter(idx => idx >= 0);
                return Math.max(...cat1idxs) < Math.min(...cat2idxs);
            }
        }

        return must.imply(
            has(cat1, cat2),
            areInOrder(cat1, cat2)
        );
    }

    function isBefore(cat, otherCats) {
        return function (format) {
            let rules = otherCats.map(otherCat => ordered(otherCat, cat));
            return must.all(...rules);
        }
    }

    function isAfter(cat, otherCats) {
        return function (format) {
            let rules = otherCats.map(otherCat => ordered(cat, otherCat));
            return must.all(...rules);
        }
    }

    // Return true if specified set of categories has no other non-literal tokens inbetween in format.
    function grouped(...categories) {
        return function (format) {
            let formatCats = format.map(label => getTokenDetailsByLabel(label).category);
            formatCats = formatCats.filter(c => c);
            formatCats = formatCats.map(c => categories.includes(c));
            formatCats = formatCats.slice(formatCats.indexOf(true), formatCats.lastIndexOf(true));
            return formatCats.reduce((a, n) => a && n, true);
        }
    }

    // If format contains 2 mandatory date/datetime/time tokens,
    // it has to contain all inbetween (has year, has minutes, should have months, days, hours)
    const compliesInclusion = (format) => {
        const categoriesInOrder = [
            TimestampCategory.Years,
            TimestampCategory.Months,
            TimestampCategory.Days,
            TimestampCategory.Hours,
            TimestampCategory.Minutes,
            TimestampCategory.Seconds,
            TimestampCategory.Milliseconds
        ];
        let hasCategories = categoriesInOrder.map((category) => has(category)(format));
        let firstPresent = hasCategories.indexOf(true);
        let lastPresent = hasCategories.lastIndexOf(true);
        return hasCategories.slice(firstPresent, lastPresent).reduce((a, n) => a && n, true);
    }

    // Presence of specific tokens implies presence of others
    // Meridiem makes no sense without hours, era without years...
    const compliesContinuity = must.all(
        must.imply(
            has(TimestampCategory.Milliseconds),
            has(TimestampCategory.Seconds)
        ),
        must.imply(
            has(TimestampCategory.Meridiem),
            has(TimestampCategory.Hours)
        ),
        must.imply(
            has(TimestampCategory.Era),
            has(TimestampCategory.Years)
        )
    );

    // Despite various nature of datetime formats, some things are constant
    const compliesSuccession = must.all(
        // time tokens are in direct order (hours, minutes, seconds, milliseconds)
        areInOrderIfExist(TimestampCategory.Hours, TimestampCategory.Minutes),
        areInOrderIfExist(TimestampCategory.Minutes, TimestampCategory.Seconds),
        areInOrderIfExist(TimestampCategory.Seconds, TimestampCategory.Milliseconds),
        areInOrderIfExist(TimestampCategory.Hours, TimestampCategory.Meridiem),

        // era comes only after year (AD 500 makes no sense)
        areInOrderIfExist(TimestampCategory.Years, TimestampCategory.Era),

        // time comes only after date, both are grouped
        areInOrderIfExist(
            [
                TimestampCategory.Years,
                TimestampCategory.Months,
                TimestampCategory.Days,
                TimestampCategory.Era,
                TimestampCategory.DayOfWeek
            ],
            [
                TimestampCategory.Hours,
                TimestampCategory.Minutes,
                TimestampCategory.Seconds,
                TimestampCategory.Milliseconds,
                TimestampCategory.Meridiem
            ]),

        must.imply(
            has(
                TimestampCategory.Years,
                TimestampCategory.Months,
                TimestampCategory.Days
            ),
            must.any(
                // UTC format
                areInOrder(
                    TimestampCategory.Years,
                    TimestampCategory.Months,
                    TimestampCategory.Days
                ),
                // common format
                areInOrder(
                    TimestampCategory.Days,
                    TimestampCategory.Months,
                    TimestampCategory.Years
                ),
                // american format
                areInOrder(
                    TimestampCategory.Months,
                    TimestampCategory.Days,
                    TimestampCategory.Years
                )
            )
        )
    );

    const compliesNumericSeparation = (format) => {
        const numericSpecificities = [
            TimestampSpecificity.NumericLong,
            TimestampSpecificity.NumericMedium,
            TimestampSpecificity.NumericShort
        ];

        const startsNumerically = (label) => {
            let token = getTokenDetailsByLabel(label);
            if (token.literal) {
                return /^[0-9]/.test(label);
            }
            else {
                return token.numeric;
            }
        }

        const endsNumerically = (label) => {
            let token = getTokenDetailsByLabel(label);
            if (token.literal) {
                return /[0-9]$/.test(label);
            }
            else {
                return token.numeric;
            }
        }

        for (let i = 0; i < format.length - 1; i++) {
            if (endsNumerically(format[i]) && startsNumerically(format[i + 1])) {
                return false;
            }
        }
        return true;
    }

    return compliesInclusion(format) && compliesContinuity(format) && compliesSuccession(format) && compliesNumericSeparation(format);
}

const TimestampCategory = {
    Years: 1,
    Months: 2,
    Days: 3,
    Hours: 4,
    Minutes: 5,
    Seconds: 6,
    Milliseconds: 7,
    Era: 8,
    Meridiem: 9,
    DayOfWeek: 10
}

const TimestampSpecificity = {
    NumericShort: 0,
    NumericMedium: 1,
    NumericLong: 2,
    WordShort: 3,
    WordLong: 4,
}

const TimestampTokenDetails = {

    /** e.g. year 50 BC */
    era: {
        label: '{EE}',
        regexBit: '(AD|BC)',
        category: TimestampCategory.Era,
        numeric: false,
        // apply is valid since one can expect year preceding era in a format (BC 1500 makes little sense)
        apply: (date, val) => date.getFullYear() > 0 && val === 'BC' && date.setFullYear(-date.getFullYear()),
        applyTod: (tod, val) => undefined,
        extract: (date) => date.getFullYear() >= 0 ? 'AD' : 'BC',
        extractTod: (tod) => undefined
    },

    /** e.g. 3.1.1998 */
    yearFull: {
        label: '{YYYY}',
        regexBit: '([12][0-9]{3,})',
        category: TimestampCategory.Years,
        numeric: true,
        subtoken: "yearShort",
        apply: (date, val) => date.setFullYear(+val),
        applyTod: (tod, val) => undefined,
        extract: (date) => date.getFullYear().toString().padStart(4, "0"),
        extractTod: (tod) => undefined
    },

    /** e.g. 3.1.'98 */
    yearShort: {
        label: '{YY}',
        regexBit: '([0-9]{2})',
        category: TimestampCategory.Years,
        numeric: true,
        apply: (date, val) => date.setFullYear(+val),
        applyTod: (tod, val) => undefined,
        extract: (date) => date.getFullYear().toString(),
        extractTod: (tod) => undefined
    },

    /** e.g. 03.01.1998 */
    monthFull: {
        label: '{MM}',
        regexBit: '(0\\d|1[012])',
        category: TimestampCategory.Months,
        numeric: true,
        apply: (date, val) => date.setMonth(val - 1),
        applyTod: (tod, val) => undefined,
        extract: (date) => (date.getMonth() + 1).toString().padStart(2, "0"),
        extractTod: (tod) => undefined
    },

    /** e.g. 3.1.1998 */
    monthShort: {
        label: '{M}',
        regexBit: '(0?\\d|1[012])',
        category: TimestampCategory.Months,
        numeric: true,
        subtoken: "monthFull",
        apply: (date, val) => date.setMonth(val - 1),
        applyTod: (tod, val) => undefined,
        extract: (date) => (date.getMonth() + 1).toString(),
        extractTod: (tod) => undefined
    },

    /** e.g. January 3rd 1998 */
    monthName: {
        label: '{MMMM}',
        regexBit: '(' + monthNames.map(m => '(?:' + m + ')').join('|') + ')',
        category: TimestampCategory.Months,
        numeric: false,
        apply: (date, val) => date.setMonth(monthNames.indexOf(val)),
        applyTod: (tod, val) => undefined,
        extract: (date) => monthNames[date.getMonth()],
        extractTod: (tod) => undefined
    },

    /** e.g. Jan 3rd, 1998 */
    monthAbbrev: {
        label: '{MMM}',
        regexBit: '(' + monthAbbrevs.map(m => '(?:' + m + ')').join('|') + ')',
        category: TimestampCategory.Months,
        numeric: false,
        apply: (date, val) => date.setMonth(monthAbbrevs.indexOf(val)),
        applyTod: (tod, val) => undefined,
        extract: (date) => monthAbbrevs[date.getMonth()],
        extractTod: (tod) => undefined
    },

    /** e.g. 03.01.1998 */
    dayFull: {
        label: '{DD}',
        regexBit: '(0[1-9]|[12]\\d|3[01])',
        category: TimestampCategory.Days,
        numeric: true,
        apply: (date, val) => date.setDate(+val),
        applyTod: (tod, val) => undefined,
        extract: (date) => date.getDate().toString().padStart(2, "0"),
        extractTod: (tod) => undefined
    },

    /** e.g. 3.1.1998 */
    dayShort: {
        label: '{D}',
        regexBit: '(0?[1-9]|[12]\\d|3[01])',
        category: TimestampCategory.Days,
        numeric: true,
        subtoken: "dayFull",
        apply: (date, val) => date.setDate(+val),
        applyTod: (tod, val) => undefined,
        extract: (date) => date.getDate().toString(),
        extractTod: (tod) => undefined
    },

    /** e.g. Saturday 3.1. 1998 */
    dayOfWeekFull: {
        label: '{DDDD}',
        category: TimestampCategory.DayOfWeek,
        numeric: false,
        regexBit: '(' + weekDays.map(d => '(?:' + d + ')').join('|') + ')',
        apply: (date, val) => undefined,
        applyTod: (tod, val) => undefined,
        extract: (date) => weekDays[date.getDay()],
        extractTod: (tod) => undefined
    },

    /** e.g. Sat 3.1. 1998 */
    dayOfWeekShort: {
        label: '{DDD}',
        category: TimestampCategory.DayOfWeek,
        numeric: false,
        regexBit: '(' + weekDayAbbrevs.map(d => '(?:' + d + ')').join('|') + ')',
        apply: (date, val) => undefined,
        applyTod: (tod, val) => undefined,
        extract: (date) => weekDayAbbrevs[date.getDay()],
        extractTod: (tod) => undefined
    },

    /** e.g. 7:30 AM */
    meridiem: {
        label: '{RR}',
        regexBit: '(AM|PM)',
        category: TimestampCategory.Meridiem,
        numeric: false,
        // same like era, it should be safe to assume meridiem won't be preceding hours (e.g. AM 7:30)
        apply: (date, val) => {
            let hours = date.getHours();
            if (val === 'PM' && hours < 12)
                date.setHours(hours + 12); // all after noon
            else if (val === 'AM' && hours === 12)
                cate.setHours(0); // midnight
        },
        applyTod: (tod, val) => undefined,
        extract: (date) => date.getHours() < 12 || date.getHours() === 0 ? 'AM' : 'PM',
        extractTod: (tod) => tod[0] < 12 || tod[0] === 0 ? 'AM' : 'PM'
    },

    /** e.g. 07:05:32 */
    hourFull: {
        label: '{hh}',
        regexBit: '([01]\\d|2[0-3])',
        category: TimestampCategory.Hours,
        numeric: true,
        apply: (date, val) => date.setHours(val),
        applyTod: (tod, val) => tod[0] = val,
        extract: (date, format) => {
            let extracted = date.getHours();
            if (format && format.includes(TimestampTokenDetails.meridiem.label))
                extracted %= 12;
            return extracted.toString().padStart(2, '0');
        },
        extractTod: (tod, format) => {
            let extracted = tod[0];
            if (format && format.includes(TimestampTokenDetails.meridiem.label))
                extracted %= 12;
            return extracted.toString().padStart(2, '0');
        }
    },

    /** e.g. 7:05 AM */
    hourShort: {
        label: '{h}',
        regexBit: '([01]?\\d|2[0-3])',
        category: TimestampCategory.Hours,
        numeric: true,
        subtoken: "hourFull",
        apply: (date, val) => date.setHours(val),
        applyTod: (tod, val) => tod[0] = val,
        extract: (date, format) => {
            let extracted = date.getHours();
            if (format && format.includes(TimestampTokenDetails.meridiem.label))
                extracted %= 12;
            return extracted.toString();
        },
        extractTod: (tod, format) => {
            let extracted = tod[0];
            if (format && format.includes(TimestampTokenDetails.meridiem.label))
                extracted %= 12;
            return extracted.toString();
        }
    },

    /** e.g. 07:05:32 */
    minuteFull: {
        label: '{mm}',
        regexBit: '([0-5]\\d)',
        category: TimestampCategory.Minutes,
        numeric: true,
        apply: (date, val) => date.setMinutes(val),
        applyTod: (tod, val) => tod[1] = val,
        extract: (date) => date.getMinutes().toString().padStart(2, '0'),
        extractTod: (tod) => tod[1].toString().padStart(2, '0')
    },

    /** e.g. 5m 32s */
    minuteShort: {
        label: '{m}',
        regexBit: '([0-5]?\\d)',
        category: TimestampCategory.Minutes,
        numeric: true,
        subtoken: "minuteFull",
        apply: (date, val) => date.setMinutes(val),
        applyTod: (tod, val) => tod[1] = val,
        extract: (date) => date.getMinutes().toString(),
        extractTod: (tod) => tod[1].toString()
    },

    /** e.g. 14:15:08 */
    secondFull: {
        label: '{ss}',
        regexBit: '([0-5]\\d)',
        category: TimestampCategory.Seconds,
        numeric: true,
        apply: (date, val) => date.setSeconds(val),
        applyTod: (tod, val) => tod[2] = val,
        extract: (date) => date.getSeconds().toString().padStart(2, '0'),
        extractTod: (tod) => tod[2].toString().padStart(2, '0')
    },

    /** e.g. 6.32 s */
    secondShort: {
        label: '{s}',
        regexBit: '([0-5]?\\d)',
        category: TimestampCategory.Seconds,
        numeric: true,
        subtoken: "secondFull",
        apply: (date, val) => date.setSeconds(val),
        applyTod: (tod, val) => tod[2] = val,
        extract: (date) => date.getSeconds().toString(),
        extractTod: (tod) => tod[2].toString()
    },

    /** e.g. 35.027s */
    millisecondFull: {
        label: '{nnn}',
        regexBit: '(\\d{3})',
        category: TimestampCategory.Milliseconds,
        numeric: true,
        apply: (date, val) => date.setMilliseconds(val),
        applyTod: (tod, val) => tod[3] = val,
        extract: (date) => date.getMilliseconds().toString().padStart(3, '0'),
        extractTod: (tod) => tod[3].toString().padStart(3, '0')
    },

    /** e.g. 35s 27ms */
    millisecondShort: {
        label: '{n}',
        regexBit: '(\\d{,3})',
        category: TimestampCategory.Milliseconds,
        numeric: true,
        subtoken: "millisecondFull",
        apply: (date, val) => date.setMilliseconds(val),
        applyTod: (tod, val) => tod[3] = val,
        extract: (date) => date.getMilliseconds().toString(),
        extractTod: (tod) => tod[3].toString()
    }
};
(function (){
    delete TimestampTokenDetails.yearShort;
    delete TimestampTokenDetails.millisecondShort;
})();

// TimestampTokenDetails access methods

function getTokenByLabel(label) {
    return TimestampLabelToToken[label];
}

function getTokenDetails(token) {
    return TimestampTokenDetails[token];
}

function getTokenDetailsByLabel(label) {
    let token = getTokenDetails(getTokenByLabel(label));
    return token ? token : { literal: true };
}

function existsLabel(label) {
    return TimestampLabelToToken[label] !== undefined;
}

const TimestampLabelToToken = (() => {
    let rev = {};
    for (let type in TimestampTokenDetails) {
        let label = TimestampTokenDetails[type].label;
        rev[label] = type;
    }
    return rev;
})()

function nullDate() { return new Date(2000, 3, 21, 15, 20, 25, 30) }
function nullTod() { return [15, 20, 25, 30] }
export class Timestamp extends Usetype {

    /**
     * 
     * @param {DatetimeUsetypeArgs} args 
     */
    constructor(args, superArgs) {
        super(superArgs);

        let explicitType = args.type;
        if (!explicitType)
            explicitType = "none";

        let minType = "none";
        if (args.min) {
            this.min = args.min;
            if (isValidDate(args.min)) {
                minType = "datetime";
            }
            else if (isValidTimeOfDay(args.min)) {
                minType = "timeofday";
            }
            else minType = "unknown";
        }
        let maxType = "none";
        if (args.max) {
            this.max = args.max;
            if (isValidDate(args.max)) {
                maxType = "datetime";
            }
            else if (isValidTimeOfDay(args.max)) {
                maxType = "timeofday";
            }
            else maxType = "unknown";
        }

        let implicitType = determineTypeFromFormatting(args.formatting);

        let gatheredTypes = [minType, maxType, explicitType, implicitType];

        gatheredTypes = gatheredTypes.filter(type => type !== "none");

        let allTypesEqual = gatheredTypes.every(type => type === gatheredTypes[0]);

        if (!allTypesEqual) {
            this.timestampType = "unknown";
        }

        this.timestampType = gatheredTypes[0];

        this.formatting = [...args.formatting];

        if (!args.skipValidation && !hasValidFormat(this)) {
            this.timestampType = "unknown";
            return;
        }

        // format(date)
        // extract all bits from date, join them

        // deformat(string)
        // match with regex (which extracts all important groups)
        // apply those using appliers

        let regBits = [];
        
        let appliers = [];
        let extractors = [];

        let applyMethod = "apply";
        let extractMethod = "extract";

        if (this.timestampType === "timeofday") {
            applyMethod = "applyTod";
            extractMethod = "extractTod";
        }

        this.formatting.forEach(bit => {
            if (existsLabel(bit)) {
                let token = getTokenDetailsByLabel(bit);
                regBits.push(token.regexBit);
                appliers.push(token[applyMethod]);
                extractors.push(token[extractMethod]);

            }
            else {
                regBits.push(escapeRegExp(bit));
                extractors.push(() => bit);
            }
        });
        let pattern = new RegExp(regBits.join(''));

        this._extractors = extractors;
        this._pattern = pattern;
        this._appliers = appliers;

		if (this.hasNoval) {
			if (this.deformat(this.novalVal) !== null) {
				this.hasNoval = false;
				delete this.novalVal;
			}
		}
    }

    min = undefined;
    max = undefined;
    formatting = null;
    timestampType = "none";
    pattern = null;
    replacement = null;
    type = "timestamp";
    domainType = 'ordinal';
    priority = 3;

    toString() {
        let ret = '';
        if (this.min && this.max)
            ret = this.format(this.min) + "-" + this.format(this.max);
        else if (this.min || this.max)
            ret = this.format(this.min ? this.min : this.max);
        else {
            if (this.timestampType === "datetime")
                ret = this.format(nullDate());
            else if (this.timestampType === "date")
                ret = this.format(nullDate());
            else if (this.timestampType === "timeofday")
                ret = this.format(dateToTimeOfDay(nullDate()));
        }
        let prefix = 'X';
        if (this.timestampType === "date")
            prefix = 'D';
        else if (this.timestampType === "datetime")
            prefix = 'DT';
        else if (this.timestampType === "timeofday")
            prefix = 'TOD'
        return prefix + "{" + ret + "}";
    }

    toFormatString() {
        return 'Chronometric (' + this.timestampType + ') "' + Timestamp.toShortFormatting(this.formatting) + '"';
    }

    format(date, verbose = false) {
        return this._extractors.map(ex => ex(date, this.formatting)).join('');
    }

    deformat(string, verbose = false) {
        let retval = null;
        if (this.timestampType === "timeofday")
            retval = nullTod();
        else if (["time", "date", "datetime"].includes(this.timestampType))
            retval = nullDate();
        else {
            return retval;
        }

        let match = string.match(this._pattern);
        if (!match) {
            return null;
        }
        if (verbose)
            this._verboseAppliers.forEach((app, idx) => app(retval, match[idx + 1], this.formatting));
        else
            this._appliers.forEach((app, idx) => app(retval, match[idx + 1], this.formatting));

        // consistency check
        if (string !== this.format(retval, verbose)) {
            return null;
        }

        this._checkDomain(retval);
        return retval;
    }

    isSupersetOf(other) {
        if (this.formatting.length !== other.formatting.length) {
            return false;
        }

        for (let i = 0, l = this.formatting.length; i < l; i++) {
            let thisToken = getTokenDetailsByLabel(this.formatting[i]);
            let otherToken = getTokenDetailsByLabel(other.formatting[i]);
            let otherSubtoken = TimestampTokenDetails[otherToken.subtoken];
            // literals, must be equal
            if (thisToken.literal) {
                // TODO: Expect possibility of split literal, e.g. "at " vs "at", " "
                if (!otherToken.literal) {
                    return false;
                }
                if (this.formatting[i] !== other.formatting[i]) {
                    return false;
                }
            }
            // tokens, subset token must be equal or thisToken.subtoken
            else if (otherToken !== thisToken && otherSubtoken !== thisToken) {
                return false;
            }
        }

        return true;
    }

    isSubsetOf(other) {return other.isSupersetOf(this); }

    isEqualTo(other) { return this.isSubsetOf(other) && this.isSupersetOf(other); }

    isSimilarTo(other) { return this.isSubsetOf(other) || this.isSupersetOf(other); }

    _checkDomain(value) {
        let compFunc;
        if (this.timestampType === "timeofday")
            compFunc = compareTods;
        else if (this.timestampType === "datetime" || this.timestampType === "date")
            compFunc = compareDates;
        else
            return;

        if (this.min === undefined || compFunc(this.min, value) > 0)  
            this.min = value;

        if (this.max === undefined || compFunc(this.max, value) < 0)
            this.max = value;
    }

    /**
     * Try to generate timestamp usetype from short string formatting
     * @param {string} string usual formatting joined into string (without curly brackets)
     * @warning volatile, should be used only for debugging purposes.
     */
    static fromShortFormatting(string) {
        let strippedLabels = [];
        for (let key in TimestampTokenDetails)
            strippedLabels.push(TimestampTokenDetails[key].label.slice(1,-1));
        let temp = string;
        let properLabels = [];
        while (temp.length > 0) {
            let matched = strippedLabels.filter(label => temp.startsWith(label));
            if (matched.length > 0) {
                let longest = matched.reduce((l,n)=>l.length<n.length?n:l,"");
                properLabels.push('{'+longest+'}');
                temp = temp.slice(longest.length);
            }
            else {
                properLabels.push(temp[0]);
                temp = temp.slice(1);
            }
        }
        properLabels[0] = [properLabels[0]];
        properLabels = properLabels.reduce((acc, next) => {
            if (acc[acc.length - 1].endsWith('}') || next.startsWith('{')) {
                acc.push(next);
                return acc;
            }
            else {
                acc[acc.length - 1] = acc[acc.length - 1] + next;
                return acc;
            }
        });
        return new Timestamp({formatting: properLabels});
    }

    static toShortFormatting(formatting) {
        return formatting.map(f => f.replace(/\{(.*)\}/,"$1")).join('');
    }
}