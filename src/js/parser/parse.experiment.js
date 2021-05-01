import * as Logic from '../utils/logic.js';

/**
 * Let's take another approach, let's go top-down as I so much like to do before everything starts falling apart.
 * As an input, we've got an array of arbitrary strings.
 * In this, we want to find a pattern, and based on it set up a probability disribution on to which type/usetype the array belongs.
 * Each type has its own set of rules, some mandatory, some optional, some disputable.
 * 
 * E.g. date has 3 parts: day, month, year. Day and year are always numbers. Month can be also represented with abberviation or the full name as a string.
 * Their order is set as DMY in Europe, MDY in USA, YMD when being a part of UTC timestamp. Those could be considered mandatory.
 * Can date be without a day? Sure it can. Consider some kind of monthly profit database of a company. Can it be year only? Sure. Those could be considered optional.
 * Can a month be missing? Hardly. Year with a day make little sense (though there's most probably some kind of date where it works).
 * 
 * These rules can be enforced and checked against the source array. The more strict rules the source array conforms to for specific type, the more probable it is
 * the source is indeed of that type.
 * 
 * The only issue is how to determine how much does a specific rule appliance contribute to overall probability. Since it would be hella hard to calculate,
 * let computers do the work.
 * 
 * We'll set down the rules, give them some initial importance and make up a ML algo which will set them appropriately in a supervised manner.
 */

const initialFactors = [];
const types = ["string", "number", "datetime", "timeofday"];
