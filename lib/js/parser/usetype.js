/**
 * @file Manages usetype classes.
 * These are returned from respective parsers.
 * They're self-contained, able to format and deformat underlying types.
 * For more info about structure {@see Usetype}.
 */

/**
 * Argument object used to construct {@see Enum}.
 * @typedef EnumUsetypeArgs
 * @property {string[]} domain array containing all distinct values
 */

/**
 * Argument object used to construct {@see Number}.
 * @typedef NumberUsetypeArgs
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
 * DatetimeUsetypeArgs.format valid values
 * @readonly
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

/**
 * @typedef DatetimeUsetypeArgs
 * @property {Date} min minimal value
 * @property {Date} max maximal value
 * @property {(TimestampToken|String)[]} format array specifying timestamp 
 * format drawing from {@see TimestampToken}, also delimiters and affixes 
 */

/**
 * Base class for all usetypes, basically an interface.
 * @class
 * @alias Usetype:Base
 * Always bound to specific primary datatype (e.g. Enum <-> String[]),
 * for which it is essentially a glorified wrapper.
 * Some can also have secondary compatible types.
 */
export class Usetype {
    constructor(args) {}

    /** 
     * Transform value of underlying type using self 
     * @param {}
     */
    format = (x) => x;
    /** Transform self-formatted string to value */
    deformat = (x) => x;

    toString = () => "{undefined}";
    toFormatString = () => "";
    toDebugString = () => "Usetype.Base()";
}

export class Enum extends Usetype {
    /**
     * @param {EnumUsetypeArgs} args
     */
    constructor(args) {
        super();
        Object.assign(this, args);
    }

    size = () => values.length;
    toString = () => `{[${this.values}]}`;
    toDebugString = () => `Usetype.Enum([${this.values}])`;
}

export class Number extends Usetype {

    /**
     * @param {NumberUsetypeArgs} args 
     */
    constructor(args) {
        super();
        Object.assign(this, args);

        if (args.decimalPlaces) {
            this.integral = args.decimalPlaces === 0;
        }
        else if (args.integral === true) {
            this.decimalPlaces = 0;
        }
        else if (!args.decimalPlaces && !args.integral) {
            let min = args.min % 1 == 0 ? 0 : args.min.toString().split(".")[1].length;
            let max = args.max % 1 == 0 ? 0 : args.min.toString().split(".")[1].length;
            this.decimalPlaces = Math.max(min, max);
            this.integral = this.decimalPlaces === 0;
        }
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

    toString = () => {

        if (this.min && this.max) {
            let min = this.format(this.min);
            let max = this.format(this.max);
            return `{[${min}][${max}]}`;
        }
        else if (this.min || this.max) {
            let sample = this.format(this.min ?? this.max);
            return `{${sample}}`;
        }
        else {
            return this.toFormatString();
        }

    }

    toFormatString = () => {
        let sample = (this.max ?? this.min ?? 12345.6789);
        let formatted = this.format(sample);
        let parts = formatted.split(this.decimalSeparator);
        if (parts.length === 1)
            return parts[0].replace(/[0-9]/g,'X');
        return parts[0].replace(/[0-9]/g,'X') + this.decimalSeparator + parts[1].replace(/[0-9]/g,'x');
    }

    /**
     * Format passed in number as a string, using this Usetype's config.
     * @param {number} num number to convert to formatted string
     * @returns {string} formatted number as string using self
     */
    format = (num) => {
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
    
        if (decimalPlaces > 0 && numParts[1].length < decimalPlaces)
            decimalPart = decimalPart + "0".repeat(this.decimalPlaces - decimalPart.length);
    
        if (separateDecimalThousands)
            decimalPart = this._addSeparator(numParts[1], this.thousandSeparator, true);
    
        return this.prefix + wholePart + this.decimalSeparator + decimalPart + this.suffix;
    }

    /**
     * Deformat a string representation of a number in this format into the number value.
     * @param {string} string Formatted string using this pattern. Other patterns may not work.
     * @returns {number} Value of formatted string passed in
     */
    deformat = (string) => {
        if (string.startsWith(this.prefix) && string.endsWith(this.suffix)) {
            let stripped = string
                .slice(this.prefix.length, string.length - this.prefix.length - this.suffix.length)
                .replace(new RegExp(this.thousandSeparator,'g'))
                .replace(new RegExp(this.decimalSeparator, 'g'));
            if (!isNaN(stripped))
                return +stripped;
        }
        return null;
    }
    
    /**
     * @param {boolean} leftAligned = decimalPart
     * @example _addSeparator("1234567890", ".", false); // returns "1.234.567.890"
     * @example _addSeparator("1234567890", " ", true); // returns "123 456 789 0"
     */
    _addSeparator = (str, sep, leftAligned) => {
        let bits = leftAligned ?
            str.match(/.{1,3}/g) :
            str.match(/.{1,3}(?=(.{3})*$)/g)
        return bits.join(sep);
    }
}

export class Timestamp extends Usetype {

    /**
     * 
     * @param {DatetimeUsetypeArgs} args 
     */
    constructor(args) {
        super();
        Object.assign(this, args);
    }

    
}
