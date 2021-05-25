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
        if (args.hasNoval) {
            this.hasNoval = true;
            this.novalVal = args.novalVal;
        }
        if (args.isConstant) {
            this.isConstant = args.isConstant;
            this.constantVal = args.constantVal;
        }
        if (args.potentialIds) {
            this.potentialIds = true;
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
    deformat(x) { throw new Error("Abstract base class Usetype.deformat() called."); }

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
