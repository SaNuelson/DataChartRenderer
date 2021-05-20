import { escapeRegExp } from '../utils/string.js';
import { getCutPattern } from '../utils/patterns.js';

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
 * @abstract
 * @template T
 */
export class Usetype {

    constructor(args) {
        if (this.constructor === Usetype) {
            throw new Error("Cannot instantiate base Usetype class.");
        }
    }

    /** Transform value of underlying type to formatted string 
     * @param {T}
     * @returns {string}
     */
    format(x) { throw new Error("Abstract baseclass Usetype.format() called."); }
    /** 
     * Transform formatted string (conforming to this' format) to underlying type 
     * @param {string} x to try to parse
     * @returns {T|null} instance of underlying type if successful, null otherwise.
     */
    deformat(x) { throw new Errorr("Abstract base class Usetype.deformat() called."); }

    toString() { return "U{undefined}"; }
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

