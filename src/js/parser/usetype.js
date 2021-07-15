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
        if (args.ambiguousSets) {
            this.ambiguousSets = args.ambiguousSets;
        }
        if (args.limitExceeded) {
            this.ignored = true;
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
    toDebugString() { return "Usetype::Base()";}

    /**
     * Check if other usetype is a superset (if any string is parsable by this, it is parsable by other).
     * @param {Usetype<T>} other
     * @returns {boolean} 
     */
    isSubsetOf(other) { throw new Error("Abstract base class Usetype.isSubsetOf() called."); }
    /**
     * Check if this usetype is a superset (if any string is parsable by other, it is parsable by this).
     * @param {Usetype<T>} other 
     * @returns {boolean}
     */
    isSupersetOf(other) { throw new Error("Abstract base class Usetype.isSupersetOf() called."); }
    /**
     * Check if this usetype is equal to other (both parse the same set of strings).
     * Usually implemented as isSupersetOf && isSubsetOf
     * @param {Usetype<T>} other 
     * @returns {boolean}
     */
    isEqualTo(other) { throw new Error("Abstract base class Usetype.isEqualTo() called."); }
    /**
     * Check if this usetype is similar to other (parsed strings convey the same meaning).
     * Usually implemented as isSupersetOf || isSubsetOf
     * @param {Usetpe<T>} other 
     * @returns {boolean}
     */
    isSimilarTo(other) { throw new Error("Abstract base class Usetype.isSimilarTo() called."); }

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

    /**
     * Type of the universe. Can be ordinal or nominal.
     * @type {"ordinal"|"nominal"}
     */
    domainType = 'none';

    /**
     * Priority with respect to other Usetype instances.
     * Could be intertwined with confidence. For now basically depends on its subclass.
     * @type {number}
     */
    priority = -1;
}
