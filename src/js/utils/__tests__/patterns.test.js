import { getCutPattern } from '../patterns.js';

/**
 * Pre-defined test case data
 * @typedef {TestStringData}
 * @property {String} source raw string passed to regex
 * @property {object[]} split splits (of all types) in format {type: group}
 */

/**
 * @type {TestStringData[]}
 */
const testStrings = {
    wspaces: {
        source: "space tab\tlinuxEndline\nwinEndline\r\n",
        split: [
            {letters: "space"},
            {separators: " "},
            {letters: "tab"},
            {separators: "\t"},
            {letters: "linuxEndline"},
            {separators: "\n"},
            {letters: "winEndline"},
            {separators: "\r\n"}
        ]
    },
    mix: {
        source: "aBc123\u{20AC}.DeF-GHI98.76$",
        split: [
            {letters: "aBc"},
            {numbers: "123"},
            {symbols: "\u{20AC}"},
            {punctuations: "."},
            {letters: "DeF"},
            {punctuations: "-"},
            {letters: "GHI"},
            {numbers: "98"},
            {punctuations: "."},
            {numbers: "76"},
            {symbols: "$"}
        ]
    },
    chinese: {
        source: "\u{6D4B}\u{8BD5}\u{5B57}\u{7B26}\u{4E32}123",
        split: [
            {letters: "\u{6D4B}\u{8BD5}\u{5B57}\u{7B26}\u{4E32}"},
            {numbers: "123"}
        ]
    },
    arabic: {
        source: "\u{633}\u{644}\u{633}\u{644}\u{629} \u{627}\u{644}\u{627}\u{62E}\u{62A}\u{628}\u{627}\u{631} 123",
        split: [
            {letters: "\u{633}\u{644}\u{633}\u{644}\u{629}"},
            {separators: " "},
            {letters: "\u{627}\u{644}\u{627}\u{62E}\u{62A}\u{628}\u{627}\u{631}"},
            {separators: " "},
            {numbers: "123"}
        ]
    },
    math : {
        // \forall x \in \Sigma * \exists y \in \Sigma * : x . y \in P : 
        source: "\u{2200}x\u{2208}\u{2211}*\u{2203}y\u{2208}\u{2211}*:x.y\u{2208}P",
        split: [
            {symbols: "\u{2200}"}, // forall
            {letters: "x"},
            {symbols: "\u{2208}\u{2211}"}, // in Sigma
            {punctuations: "*"},
            {symbols: "\u{2203}"}, // exists
            {letters: "y"},
            {symbols: "\u{2208}\u{2211}"}, // in Sigma
            {punctuations: "*:"},
            {letters: "x"},
            {punctuations: "."},
            {letters: "y"},
            {symbols: "\u{2208}"}, // in
            {letters: "P"}
        ]
    },
    price: {
        source: "$1,540,500.00",
        split: [
            {symbols: "$"},
            {numbers: "1"},
            {punctuations: ","},
            {numbers: "540"},
            {punctuations: ","},
            {numbers: "500"},
            {punctuations: "."},
            {numbers: "00"}
        ]
    },
    datetime: {
        source: "28.Feb 1999 15:32:38.105",
        split: [
            {numbers: "28"},
            {punctuations: "."},
            {letters: "Feb"},
            {separators: " "},
            {numbers: "1999"},
            {separators: " "},
            {numbers: "15"},
            {punctuations: ":"},
            {numbers: "32"},
            {punctuations: ":"},
            {numbers: "38"},
            {punctuations: "."},
            {numbers: "105"},
        ]
    }
}

/**
 * Brute-force generator of all possible boolean combinations of getPatternData args.
 * @param {boolean} matchall 
 * @returns {object[]} see getPatternData args 
 */
const generateAllCombinations = (matchall) => {
    let params = ["letters", "punctuations", "numbers", "separators", "symbols", "rest"];
    let os = [];
    let size = Math.pow(2, params.length);
    for (let i = 0; i < size; i++) {
        let o = {matchall: matchall};
        params.forEach((par, idx) => o[par] = !!((i >> idx) & 1));

        os.push(o);
    }
    return os;
}

/**
 * Generate modified testStringData. In case of rest === true, replace type of uncaught bits
 * to "rest" and merge them, otherwise just remove them.
 * In case of non-matchall also removes type names.
 * @param {object} testStringData element from const testStrings
 * @param {object} patternFormat element from generateAllCombinations()
 * @example
 * reformatTestUsingSettings({source: "Abc123=/=deF!", split: [...]}, {letters: true, rest: true});
 * // returns {source: ..., split: [{letters:"Abc"}, {rest:"123=/="}, {letters:"deF"}, {rest:"!"}]}
 * // with rest === false, returns {source: ..., split: [{letters:"Abc"}, {letters:"deF"}]}
 */
const reformatTestUsingSettings = (testStringData, patternFormat) => {
    // replace unwanted token types with "rest"
    let newSplit = testStringData.split.map(token => {
        if (patternFormat[Object.keys(token)[0]])
            return token;
        return {rest: token[Object.keys(token)[0]]};
    })

    // if rest is on, merge rest groups
    if (patternFormat.rest || Object.entries(patternFormat).every(e => e[0] === "matchall" || e[0] === "rest" || !e[1])) {
        newSplit = newSplit.reduce((acc, next) => {
            if (next.rest && acc.length > 0 && acc[acc.length - 1].rest) {
                acc[acc.length - 1].rest += next.rest;
                return acc;
            }
            acc.push(next);
            return acc;
        }, []);
    }
    // else filter them out
    else {
        newSplit = newSplit.filter(token => !token.rest);
    }

    if (!patternFormat.matchall) {
        newSplit = newSplit.map(token => token[Object.keys(token)[0]]);
    }

    return {
        source: testStringData.source,
        split: newSplit
    }
}

describe("Pattern cutter factory", () => {
    describe("produces valid matchall regexes", () => {
        let dataSets = Object.values(testStrings);
        let paramSets = generateAllCombinations(true);
        let combinations = paramSets.map(ps => 
            dataSets.map(ds => 
                [reformatTestUsingSettings(ds, ps), ps]))
            .flat();
        combinations = combinations.map((c) => [c[0].source, c[0].split, c[1]]);
        //combinations = combinations.map(([data, params]) => [data.source, data.split, params]);
        test.each(combinations)("from string '%s' extracting expected %p using groups %p", (source, split, params) => {
            let regex = getCutPattern(params);
            let actual = [...source.matchAll(regex)].map(x => x.groups);
            expect(actual).toEqual(split);
        })
    });

    describe("produces valid match regexes", () => {
        let dataSets = Object.values(testStrings);
        let paramSets = generateAllCombinations(false);
        let combinations = paramSets.map(ps => 
            dataSets.map(ds => 
                [reformatTestUsingSettings(ds, ps), ps]))
            .flat();
        combinations = combinations.map(([data, params]) => [data.source, data.split, params]);
        test.each(combinations)("from string '%s' extracting expected %p using groups %p", (source, split, params) => {
            let regex = getCutPattern(params);
            let actual = source.match(regex);
            if (actual === null)
                actual = [];
            expect(actual).toEqual(split);
        })
    })
})