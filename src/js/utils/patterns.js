/**
 * @file Handles RegExp patterns and pattern generators.
 * As this plug-in should be able to handle more than just English datasets,
 * regexes have to be written down with multi-lang support.
 */

const patternBits = {
    letters: "\\p{L}",
    marks: "\\p{M}",
    punctuations: "\\p{P}",
    symbols: "\\p{S}",
    numbers: "\\p{N}",
    separators: "\\p{Z}",
    wspaces: "\\s"
}

/**
 * Generate a multi-language compatible Unicode regex pattern.
 * When used on a string, this pattern splits it on boundaries of character types.
 * @param {object} args
 * @param {boolean} args.letters match letter groups (including marks)
 * @param {boolean} args.punctuations match punctuation groups (parentheses, dashes, dots, commas...)
 * @param {boolean} args.symbols match symbol groups (currencies, relations, borders...)
 * @param {boolean} args.numbers match number groups
 * @param {boolean} args.separators match separator groups (mostly whitespace)
 * @param {boolean} args.rest match any characters left out into merged groups
 * @param {boolean} args.matchall True - no global flag, named groups, use with .matchAll,
 * False - global flag, groups can't be named, use with .match
 * @param {object} args.custom optional custom set of matchers. key is used as label, value can be string or array (signifying disjunction).
 * If defined, these take priority over other matchers.
 * @todo args.custom needs to allow non-repeatable character sequences to avoid unexpected behaviour.
 * @returns {RegExpStringIterator|String[]} If matchall is true, returns regex result iterator,
 * else returns simple array of matches.
 * @example
 * let str = "Jake wrote 'g3t šr3kt' 1.000.000 times"
 * str.match(getCutPattern({letters = true, numbers = true, matchall = false}));
 * // ["Jake", "wrote", "g", "3", "t", "šr", "3", "kt", "1", "000", "000"]
 */
export const getCutPattern = function({
    letters = false,
    punctuations = false,
    symbols = false,
    numbers = false,
    separators = false,
    rest = false,
    matchall = true,
    custom = {}
}) {
    let used = [];

    // custom regex capture groups
    // can be used even if a part of other groups
    // thanks to the fact they're matched sequentially
    if (custom) {
        for (let label in custom) {
            if (custom[label] instanceof Array) {
                used.push({name:label, val:custom[label]});
            }
            used.push({name:label, val:[custom[label]]});
        }
    }

    if (letters)
        used.push({name:"letters", val:[patternBits.letters, patternBits.marks]});
    
    if (punctuations)
        used.push({name:"punctuations", val:[patternBits.punctuations]});

    if (symbols)
        used.push({name:"symbols", val:[patternBits.symbols]});

    if (numbers)
        used.push({name:"numbers", val:[patternBits.numbers]});

    if (separators)
        used.push({name:"separators", val:[patternBits.separators, patternBits.wspaces]});

    if (rest && used.length > 0) {
        let nonother = ["^", ...used.map(o => o.val)].flat();
        used.push({name:"rest", val:nonother});
    }
    else if (used.length == 0)
        used.push({name:"rest", val:["."]});

    const toReg = (bit) => {
        let arr = ["("];
        if (matchall) arr.push("?<", bit.name, ">");
        if (bit.val.length > 1) arr.push("[", ...bit.val, "]+)");
        else arr.push(bit.val[0], "+)");
        return arr.join("");
    }

    let regstr = used.map(toReg).join("|");
    return new RegExp(regstr, "gus");
}