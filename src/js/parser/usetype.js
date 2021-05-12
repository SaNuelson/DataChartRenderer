import { escapeRegExp } from '../utils/string.js';
import * as TimestampMethods from '../parser/parse.timestamp.js';

/**
 * @file Manages usetype classes.
 * Usetype is a concept better described in readme (or will be if it's not yet).
 * These are returned from respective parsers.
 * They're self-contained, able to format and deformat underlying types.
 * For more info about structure {@see Usetype}.
 */

//#region Usetype::Base

/**
 * Base class for all usetypes, basically an interface.
 * Always bound to specific primary datatype (e.g. Enum <-> String[]),
 * for which it is essentially a glorified wrapper.
 * Some can also have secondary compatible types.
 * @interface
 * @template T
 */
export class Usetype {

    constructor(args) { }

    /** Transform value of underlying type to formatted string */
    format(x) { return x; }
    /** 
     * Transform formatted string (conforming to this' format) to underlying type 
     * @param {string} x to try to parse
     * @returns {T|null} instance of underlying type if successful, null otherwise.
     */
    deformat(x) { return x; }

    toString() { return "{undefined}"; }
    toFormatString() { return ""; }
    toDebugString() { return "Usetype::Base()"; }

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
    type = "undefined";
}

//#endregion

//#region Usetype::String

/**
 * Compatibility wrapper for string-recognized values
 * @implements {Usetype}
 */
export class String extends Usetype {

    constructor(args) { super(); }

    /** 
     * Transform value of underlying type using self 
     * @param {string}
     * @returns {string}
     */
    format(x) { return x; }
    /** 
     * Transform self-formatted string to value 
     * @param {string}
     * @returns {string}
     */
    deformat(x) { return x; }

    toString() { return "{string}" }
    toFormatString() { return "" }
    toDebugString() { "Usetype.Base()" }

    /** 
     * Possible underlying types for this Usetype subclass.
     * @type {string}
     * @todo Set as static
     */
    compatibleTypes = ["string"];

    /**
     * Underlying type for this Usetype instance.
     * @type {string}
     */
    type = "string";
}

//#endregion

//#region Usetype::Enum

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
        super();
        this.domain = args.domain ?? [];
    }

    format(string) { return this.domain.includes(string) ? string : undefined }
    deformat(value) { return this.domain.includes(value) ? value : undefined }

    size() { return this.domain.length }
    toString() { `{[${this.domain}]}` }
    toDebugString() { `Usetype.Enum([${this.domain}])` }
    compatibleTypes = ["string"];
    type = "string";
}

//#endregion

//#region Usetype::Number

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

/**
 * Number usetype. Mostly any numerical formats can be wrapped by this.
 * Usetypes such as prices, numbers...
 * @todo ratios, fractions
 * @implements {Usetype}
 */
export class Number extends Usetype {

    /**
     * @param {NumberUsetypeArgs} args 
     */
    constructor({
        min = null,
        max = null,
        sample = null,
        decimalSeparator = ".",
        thousandSeparator = "",
        prefix = "",
        suffix = "",
        integerPlaces = 0,
        decimalPlaces = 0,
        integral = true
    }) {
        super();
        this.min = min;
        this.max = max;
        if (!min && !max)
            this.min = sample;
        this.decimalSeparator = decimalSeparator;
        this.thousandSeparator = thousandSeparator;
        this.prefix = prefix;
        this.suffix = suffix;
        this.integerPlaces = integerPlaces;
        this.decimalPlaces = decimalPlaces;
        this.integral = integral;
    }

    //#region Defaults
    min = null;
    max = null;
    prefix = "";
    suffix = "";
    decimalSeparator = ".";
    thousandSeparator = "";
    separateDecimalThousands = false;
    decimalPlaces = 0;
    integerPlaces = 0;
    integral = true;
    //#endregion

    toString() {

        if (this.min !== null && this.max !== null) {
            let min = this.format(this.min);
            let max = this.format(this.max);
            return `{[${min}][${max}]}`;
        }
        else if (this.min !== null || this.max !== null) {
            let sample = this.format(this.min ? this.min : this.max);
            return `{${sample}}`;
        }
        else {
            return this.toFormatString();
        }

    }

    toFormatString() {
        let sample = this.max ? this.max : this.min ? this.min : 12345.6789;
        let formatted = this.format(sample);
        let parts = formatted.split(this.decimalSeparator);
        if (parts.length === 1)
            return parts[0].replace(/[0-9]/g, 'X');
        return parts[0].replace(/[0-9]/g, 'X') + this.decimalSeparator + parts[1].replace(/[0-9]/g, 'x');
    }

    /**
     * Format passed in number as a string, using this Usetype's config.
     * @param {number} num number to convert to formatted string
     * @returns {string} formatted number as string using self
     */
    format(num) {
        var numString = num.toFixed(this.decimalPlaces);
        var numParts = numString.split(".");

        var wholePart = numParts[0];

        if (this.integerPlaces > 0 && numParts[0].length < this.integerPlaces)
            wholePart = "0".repeat(this.integerPlaces - wholePart.length) + wholePart;

        wholePart = this._addSeparator(numParts[0], this.thousandSeparator, false);

        if (this.integral)
            return this.prefix + wholePart + this.suffix;

        var decimalPart = "0";

        if (numParts.length > 1)
            decimalPart = numParts[1];

        if (this.decimalPlaces > 0 && numParts[1].length < this.decimalPlaces)
            decimalPart = decimalPart + "0".repeat(this.decimalPlaces - decimalPart.length);

        if (this.separateDecimalThousands)
            decimalPart = this._addSeparator(numParts[1], this.thousandSeparator, true);

        return this.prefix + wholePart + this.decimalSeparator + decimalPart + this.suffix;
    }

    /**
     * Deformat a string representation of a number in this format into the number value.
     * @param {string} string Formatted string using this pattern. Other patterns may not work.
     * @returns {number} Value of formatted string passed in
     */
    deformat(string) {
        let stripped = string;

        this.prefix.forEach(p => {
            if (stripped.startsWith(p))
                stripped = stripped.slice(p.length);
        });

        this.suffix.forEach(s => {
            if (stripped.endsWith(s))
                stripped = stripped.slice(0, -s.length);
        })

        if (this.thousandSeparator) {
            stripped = stripped.split(this.thousandSeparator);
            if (stripped.slice(1, -1).some(part => part.length < 3))
                return null;
            stripped = stripped.join("");
        }

        if (this.decimalSeparator) {
            stripped = stripped
                .split(this.decimalSeparator)
                .join(".");
        }

        if (!isNaN(stripped)){
            return +stripped;
        }

        return null;
    }

    /**
     * @param {boolean} leftAligned = decimalPart
     * @example _addSeparator("1234567890", ".", false); // returns "1.234.567.890"
     * @example _addSeparator("1234567890", " ", true); // returns "123 456 789 0"
     */
    _addSeparator (str, sep, leftAligned) {
        let bits = leftAligned ?
            str.match(/.{1,3}/g) :
            str.match(/.{1,3}(?=(.{3})*$)/g)
        return bits.join(sep);
    }

    compatibleTypes = ["number"];
    type = "number";
}

//#endregion

//#region Usetype::Timestamp

/**
 * @typedef DatetimeUsetypeArgs
 * @property {Date} min minimal value
 * @property {Date} max maximal value
 * @property {(TimestampToken|String)[]} formatting array specifying timestamp 
 * format drawing from {@see TimestampToken}, also delimiters and affixes 
 */

/**
 * DatetimeUsetypeArgs.format valid values
 * @readonly
 * @deprecated
 * @enum {string}
 */
const TimestampToken = {

    /** e.g. year 50 BC */
    adbc: 'ADBC',

    /** e.g. 3.1.1998 */
    yearFull: 'YYYY',
    /** e.g. 3.1.'98 */
    yearShort: 'YY',

    /** e.g. 03.01.1998 */
    monthFull: 'MM',
    /** e.g. 3.1.1998 */
    monthShort: 'M',
    /** e.g. January 3rd 1998 */
    monthName: 'Month',
    /** e.g. Jan 3rd, 1998 */
    monthAbbrev: 'Mth',

    /** e.g. 03.01.1998 */
    dayFull: 'DD',
    /** e.g. 3.1.1998 */
    dayShort: 'D',
    /** e.g. Saturday 3.1. 1998 */
    dayOfWeekFull: 'Weekday',
    /** e.g. Sat 3.1. 1998 */
    dayOfWeekShort: 'Wdy',

    /** e.g. 7:30 AM */
    meridiem: 'AMPM',

    /** e.g. 07:05:32 */
    hourFull: 'hh',
    /** e.g. 7:05 AM */
    hourShort: 'h',

    /** e.g. 07:05:32 */
    minuteFull: 'mm',
    /** e.g. 5m 32s */
    minuteShort: 'm',

    /** e.g. 14:15:08 */
    secondFull: 'ss',
    /** e.g. 6.32 s */
    secondShort: 's',

    /** e.g. 35.027s */
    millisecondFull: 'nn',
    /** e.g. 35s 27ms */
    millisecondShort: 'n'
}

// TODO: Multilang support?
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthAbbrevs = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekDayAbbrevs = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


/**
 * Enum for different token types.
 * @enum {number}
 */
const TimestampCategory = {
    Year: 1,
    Month: 2,
    Day: 3,
    Hour: 4,
    Minute: 5,
    Second: 6,
    Millisecond: 7,
    Era: 8,
    Meridiem: 9,
    DayOfWeek: 10
}

/**
 * Overhauled @see TimestampToken
 * @enum {TimestampTokenDetail}
 */
const TimestampTokenDetails = {

    /** e.g. year 50 BC */
    era: {
        label: '{EE}',
        regexBit: '((?:AD)|(?:BC))',
        category: TimestampCategory.Era,
        // apply is valid since one can expect year preceding era in a format (BC 1500 makes little sense)
        apply: (date, val) => date.getFullYear() > 0 && val === 'BC' && date.setFullYear(-date.getFullYear()),
        extract: (date) => date.getFullYear() >= 0 ? 'AD' : 'BC'
    },

    /** e.g. 3.1.1998 */
    yearFull: {
        label: '{YYYY}',
        regexBit: '([0-9]{4,})',
        category: TimestampCategory.Year,
        apply: (date, val) => date.setFullYear(+val),
        extract: (date) => date.getFullYear().toString().padStart(4, "0")
    },

    /** e.g. 3.1.'98 */
    yearShort: {
        label: '{YY}',
        regexBit: '([0-9]{2})',
        category: TimestampCategory.Year,
        apply: (date, val) => date.setFullYear(1900 + +val),
        extract: (date) => date.getFullYear().toString()
    },

    /** e.g. 03.01.1998 */
    monthFull: {
        label: '{MM}',
        regexBit: '([0-9]{2})',
        category: TimestampCategory.Month,
        apply: (date, val) => date.setMonth(+val),
        extract: (date) => date.getMonth().toString().padStart(2, "0")
    },

    /** e.g. 3.1.1998 */
    monthShort: {
        label: '{M}',
        regexBit: '([0-9]{,2})',
        category: TimestampCategory.Month,
        apply: (date, val) => date.setMonth(+val),
        extract: (date) => date.getMonth().toString()
    },

    /** e.g. January 3rd 1998 */
    monthName: {
        label: '{MMMM}',
        regexBit: '(' + monthNames.map(m => '(?:' + m + ')').join('|') + ')',
        category: TimestampCategory.Month,
        apply: (date, val) => date.setMonth(monthNames.indexOf(+val)),
        extract: (date) => monthNames[date.getMonth()]
    },

    /** e.g. Jan 3rd, 1998 */
    monthAbbrev: {
        label: '{MMM}',
        regexBit: '(' + monthAbbrevs.map(m => '(?:' + m + ')').join('|') + ')',
        category: TimestampCategory.Month,
        apply: (date, val) => date.setMonth(monthAbbrevs.indexOf(+val)),
        extract: (date) => monthAbbrevs[date.getMonth()]
    },

    /** e.g. 03.01.1998 */
    dayFull: {
        label: '{DD}',
        regexBit: '([0-9]{2}',
        category: TimestampCategory.Day,
        apply: (date, val) => date.setDate(+val),
        extract: (date) => date.getDate().toString().padStart(2, "0")
    },

    /** e.g. 3.1.1998 */
    dayShort: {
        label: '{D}',
        regexBit: '([0-9]{,2}',
        category: TimestampCategory.Day,
        apply: (date, val) => date.setDate(+val),
        extract: (date) => date.getDate().toString()
    },

    /** e.g. Saturday 3.1. 1998 */
    dayOfWeekFull: {
        label: '{DDDD}',
        regexBit: '(' + weekDays.map(d => '(?:' + d + ')').join('|') + ')',
        apply: (date, val) => console.warn("Apply dayOfWeekFull called, undefined behaviour"),
        extract: (date) => weekDays[date.getDay()]
    },

    /** e.g. Sat 3.1. 1998 */
    dayOfWeekShort: {
        label: '{DDD}',
        regexBit: '(' + weekDayAbbrevs.map(d => '(?:' + d + ')').join('|') + ')',
        apply: (date, val) => console.warn("Apply dayOfWeekFull called, undefined behaviour"),
        extract: (date) => weekDayAbbrevs[date.getDay()]
    },

    /** e.g. 7:30 AM */
    meridiem: {
        label: '{RR}',
        regexBit: '((?:AM)(?:PM))',
        category: TimestampCategory.Meridiem,
        // same like era, it should be safe to assume meridiem won't be preceding hours (e.g. AM 7:30)
        apply: (date, val) => {
            let hours = date.getHours();
            if (val === 'PM' && hours < 12)
                date.setHours(hours + 12); // all after noon
            else if (val === 'AM' && hours === 12)
                cate.setHours(0); // midnight
        },
        extract: (date) => date.getHours() < 12 || date.getHours() === 0 ? 'AM' : 'PM'
    },

    /** e.g. 07:05:32 */
    hourFull: {
        label: '{hh}',
        regexBit: '([0-9]{2})',
        category: TimestampCategory.Hour,
        apply: (date, val) => date.setHours(val),
        extract: (date) => date.getHours().toString().padStart(2, '0')
    },

    /** e.g. 7:05 AM */
    hourShort: {
        label: '{h}',
        regexBit: '([0-9]{,2}',
        category: TimestampCategory.Hour,
        apply: (date, val) => date.setHours(val),
        extract: (date) => date.getHours().toString()
    },

    /** e.g. 07:05:32 */
    minuteFull: {
        label: '{mm}',
        regexBit: '([0-9]{2})',
        category: TimestampCategory.Minute,
        apply: (date, val) => date.setMinutes(val),
        extract: (date) => date.getMinutes().toString().padStart(2, '0')
    },

    /** e.g. 5m 32s */
    minuteShort: {
        label: '{m}',
        regexBit: '([0-9]{,2}',
        category: TimestampCategory.Minute,
        apply: (date, val) => date.setMinutes(val),
        extract: (date) => date.getMinutes().toString()
    },

    /** e.g. 14:15:08 */
    secondFull: {
        label: '{ss}',
        regexBit: '([0-9]{2})',
        category: TimestampCategory.Second,
        apply: (date, val) => date.setSeconds(val),
        extract: (date) => date.getSeconds().toString().padStart(2, '0')
    },

    /** e.g. 6.32 s */
    secondShort: {
        label: '{s}',
        regexBit: '([0-9]{,2})',
        category: TimestampCategory.Second,
        apply: (date, val) => date.setSeconds(val),
        extract: (date) => date.getSeconds().toString()
    },

    /** e.g. 35.027s */
    millisecondFull: {
        label: '{nnn}',
        regexBit: '([0-9]{3})',
        category: TimestampCategory.Millisecond,
        apply: (date, val) => date.setMilliseconds(val),
        extract: (date) => date.getMilliseconds().toString().padStart(3, '0')
    },

    /** e.g. 35s 27ms */
    millisecondShort: {
        label: '{n}',
        regexBit: '([0-9]{,3})',
        category: TimestampCategory.Millisecond,
        apply: (date, val) => date.setMilliseconds(val),
        extract: (date) => date.getMilliseconds().toString()
    }
}

/**
 * Dynamically created reverse lookup table for @see TimestampTokenDetails
 */
const TimestampTokenRevs = (() => {
    let rev = {};
    for (let type in TimestampTokenDetails) {
        let label = TimestampTokenDetails[type].label;
        rev[label] = type;
    }
    return rev;
})()

/**
 * Timestamp Usetype. Currently not used and in dev.
 * It's brute-force placeholder is @see Timestamp
 */
export class TimestampNew extends Usetype {

    /**
     * 
     * @param {DatetimeUsetypeArgs} args 
     */
    constructor(args) {
        super();

        var minType = 0;
        if (args.min) {
            if (args.min instanceof Date)
                minType = 1;
            else if (args.min instanceof Array && args.min.length < 5) {
                minType = 2;
            }
            else {
                throw "Timestamp ctor @ min " + args.min + "unrecognized type";
            }
            this.min = args.min;
        }
        if (args.max) {
            if (args.max instanceof Date) {
                if (minType === 2) {
                    throw `Timestamp ctor, max (${args.max}) of type Date, min (${args.min}) of type Timeofday.`;
                }
                minType = 1;
            }
            else if (args.max instanceof Array && args.max.length < 5) {
                if (minType === 1) {
                    throw `Timestamp ctor, max (${args.max}) of type Timeofday, min (${args.min}) of type Date.`;
                }
                minType = 2;
            }
            this.max = args.max;
        }


        this.formatting = args.formatting;

        // format(date)
        // extract all bits from date, join them

        // deformat(string)
        // match with regex (which extracts all important groups)
        // apply those using appliers

        let regBits = [];
        let appliers = [];
        let extractors = [];
        this.formatting.forEach(bit => {
            if (TimestampTokenRevs[bit]) {
                let token = TimestampTokenDetails[TimestampTokenRevs[bit]];
                regBits.push(token.regexBit);
                appliers.push(token.apply);
                extractors.push(token.extract);
            }
            else {
                regBits.push(escapeRegExp(str));
                extractors.push(() => str);
            }
        });
        let pattern = new RegExp(regBits.join(''));
        this.format = (date) => extractors.map(ex => ex(date)).join('');
        this.deformat = (string) => {
            let date = new Date();
            let match = string.match(pattern);
            if (!match)
                return null;
            appliers.forEach((app, idx) => app(date, match[i + 1]));
            return date;
        }
    }

    min = null;
    max = null;
    formatting = null;
    type = "none";
    pattern = null;
    replacement = null;
    type = "timestamp";

    toString() {
        let ret = '';
        if (this.min && this.max)
            ret = this.deformat(this.min) + "-" + this.deformat(this.max);
        else if (this.min || this.max)
            ret = this.deformat(this.min ? this.min : this.max);
        else
            ret = this.deformat(Date.now());
        return "{" + ret + "}";
    }

    format(date) { throw "Timestamp format not rewritten." }
    deformat(string) { throw "Timestamp deformat not rewritten." }
}

/**
 * Timestamp usetype. Mostly any complex time values.
 * Usetypes such as timeofday, datetime, date, timespan... (simple ones like '155sec' are considered NumberUsetpyes currently)
 * @implements {Usetype}
 */
export class Timestamp extends Usetype {
    constructor(format) {
        super();
        this.formatting = format;
        let containsTime = format.match(/[hmsq]/);
        let containsDate = format.match(/[DMY]/);
        if (containsTime && containsDate) {
            this.type = "datetime";
        }
        else if (containsTime) {
            this.type = "timeofday";
        }
        else if (containsDate) {
            this.type = "date";
        }
        else {
            throw "Invalid format of dummy Timestamp " + format;
        }
    }

    formatting = "none";

    format(date) { return date.toString() }

    deformat(string) { return TimestampMethods.parseTimestamp(string, this.formatting) }

    toString() { return "{" + this.formatting + "}" }

    compatibleTypes = ["timeofday", "time", "date", "datetime"]
}

//#endregion
