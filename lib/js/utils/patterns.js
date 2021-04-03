import * as XRegExp from 'xregexp';

window.xreg = XRegExp;

/** 
 * Use str.match() to get a string split into groups of numeric, alpha characters and others
 * @example 
 * console.log("abc123...4,d-5".match(allCutPattern))
 * // ["abc", "123", "...", "4", ",", "d", "-", "5"]
 */
const allCutPattern = /((?:[A-Za-z]+)|(?:[0-9]+)|(?:[^a-zA-Z0-9]+))/g;

/** 
 * Use str.match() to get a string split into groups of numeric and alpha characters. Other characters are ignored.
 * @example
 * console.log("abc123...4,d-5".match(allCutPattern))
 * // ["abc", "123", "4", "d", "5"]
 */
const alphanumCutPattern = /((?:[A-Za-z]+)|(?:[0-9]+))/g;

/**
 * 
 */
const numCutPattern = /((?:[0-9]+)|(?:[^0-9]+))/g;

/**
 * Get Regex pattern that can be used with str.match() to cut a string into chunks of different kinds.
 * @param {object} params
 * @param {boolean} params.alpha match groups of letters, default false
 * @param {boolean} params.numeric match groups of letters, default false
 * @param {boolean} params.alphanum match groups of alphanumeric characters. Overrides params.alpha and params.numeric, default false
 * @param {boolean} params.punct match groups of punctuation characters, default false
 * @param {boolean} params.wspace
 * @param {boolean} params.other match additional groups of any uncaught characters, default true
 * @example
 * console.log("abc123.def".match(getCutPattern({alpha = true, numeric = true})))
 * // []
 */
export const getCutPattern = function({
    alpha = true, 
    numeric = true, 
    alnum = false,
    punct = false, 
    wspace = false,
    other = true} = {}) {
        const bitAlpha = "([A-Za-zÀ-ÖØ-öø-ÿ]+)";
        const bitNum = "(\d+)";
        const bitAlnum = "([A-Za-zÀ-ÖØ-öø-ÿ0-9]+)";
        const bitWspace = "(\s+)";
    }