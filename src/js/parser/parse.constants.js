/**
 * @file Contains function which look up string values in all kinds of constant (country names and codes, currencies...)
 * @todo locales, currently the usual param 'locale' has no use and is simply ignored, returning english/global constants
 */

const fetchList = {
    countries: {
        url: 'https://raw.githubusercontent.com/samayo/country-json/master/src/country-by-abbreviation.json',
        extract: (json) => {
            fetchList.countries.names = json.map(country => country.country);
            fetchList.countries.codes = json.map(country => country.abbreviation);
        }
    },
    currencies: {
        url: 'https://gist.githubusercontent.com/Fluidbyte/2973986/raw/8bb35718d0c90fdacb388961c98b8d56abc392c9/Common-Currency.json',
        extract: (json) => {
            let codes = Object.keys(json);
            fetchList.currencies.codes = codes;
            fetchList.currencies.symbols = codes.map(code => json[code].symbol);
            fetchList.currencies.nativeSymbols = codes.map(code => json[code].symbol_native)
        }
    },
    cities: {
        url: 'https://raw.githubusercontent.com/lutangar/cities.json/master/cities.json',
        extract: (json) => {
            fetchList.cities.names = json.map(country => country.name);
            fetchList.cities.codes = json.map(country => country.country);
        }
    }
}

let isDataFetched = false;
(function prefetchData() {
    if (isDataFetched)
        return;

    for (let fetchItem in fetchList) {
        let fallbackRes;
        fetch(fetchList[fetchItem].url)
            .then(res => { return res.json() })
            .then(json => fetchList[fetchItem].extract(json))
            .catch(err => { console.error("parse.constants.js fetch item", fetchItem, "failed with err", err); return fallbackRes.text() });
    }

    isDataFetched = true;
})()

function getMonthNames(locale) {
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
}

function getMonthNameAbbreviations(locale) {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
}

function getDayCountInMonth() {
    return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
}

function getDayNames(locale) {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
}

function getDayNameAbbreviations(locale) {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
}

function getPotentialDateSeparators() {
    return ['.', '-', '/'];
}

function getPotentialTimeSeparators() {
    return [':', '.'];
}

export const timestampConstants = {
    getMonthNames: getMonthNames,
    getMonthNameAbbreviations: getMonthNameAbbreviations,
    getDayNames: getDayNames,
    getDayNameAbbreviations: getDayNameAbbreviations,
    getDayCountInMonth: getDayCountInMonth,
    getPotentialTimeSeparators: getPotentialTimeSeparators,
    getPotentialDateSeparators: getPotentialDateSeparators
}

function getCurrencySymbols() {
    let fetchItem = fetchList.currencies;
    if (!fetchItem || !fetchItem.symbols)
        return [];
    return fetchItem.symbols;
}

function getCurrencyCodes() {
    let fetchItem = fetchList.currencies;
    if (!fetchItem || !fetchItem.abbreviations)
        return [];
    return fetchItem.abbreviations;
}

function getMetricPrefixes(locale) {
    return ["yotta", "zetta", "exa", "peta", "tera", "giga", "mega", "kilo", "hecto", "deca", "", "deci", "centi", "milli", "micro", "nano", "pico", "femto", "atto", "zepto", "yocto"];
}

function getMetricPrefixSymbols(locale) {
    return ["Y", "Z", "E", "P", "T", "G", "M", "k", "h", "da", "", "d", "c", "m", "μ", "n", "p", "f", "a", "z", "y"];
}

function getCardinalityPrefixSymbols(locale) {
    return ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td"]; // ...
}

export const numberConstants = {
    getCurrencySymbols: getCurrencySymbols,
    getCurrencyCodes: getCurrencyCodes,
    getMetricPrefixes: getMetricPrefixes,
    getMetricPrefixSymbols: getMetricPrefixSymbols,
    getCardinalityPrefixSymbols: getCardinalityPrefixSymbols
}

function getCountryCodes() {
    let fetchItem = fetchList.countries;
    if (!fetchItem || !fetchItem.codes)
        return [];
    return fetchItem.codes;
}

function getCountryNames(locale) {
    let fetchItem = fetchList.countries;
    if (!fetchItem || !fetchItem.names)
        return [];
    return fetchItem.names;
}

export const enumConstants = {
    getCountryCodes: getCountryCodes,
    getCountryNames: getCountryNames
}

function getUtf16Whitespace() {
    return [
        '\t',
        '\n',
        '\x0b',
        '\x0c',
        '\r',
        ' ',
        '\xa0',
        '\xc2\x85',
        '\xc2\xa0',
        '\xe1\x9a\x80',
        '\xe1\xa0\x8e',
        '\xe2\x80\x80',
        '\xe2\x80\x81',
        '\xe2\x80\x82',
        '\xe2\x80\x83',
        '\xe2\x80\x84',
        '\xe2\x80\x85',
        '\xe2\x80\x86',
        '\xe2\x80\x87',
        '\xe2\x80\x88',
        '\xe2\x80\x89',
        '\xe2\x80\x8a',
        '\xe2\x80\x8b',
        '\xe2\x80\x8c',
        '\xe2\x80\x8d',
        '\xe2\x80\xa8',
        '\xe2\x80\xa9',
        '\xe2\x80\xaf',
        '\xe2\x81\x9f',
        '\xe2\x81\xa0',
        '\xe3\x80\x80',
        '\xef\xbb\xbf'
    ];
}

export const unicodeConstants = {
    getUtf16Whitespace: getUtf16Whitespace
};