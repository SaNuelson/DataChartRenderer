
/**
 * Escape any RegExp characters present in a string.
 * Beneficial when such string is used in construction of another RegExp (to avoid broken code).
 * @param {string} string
 * @returns {string} provided string with backslashed RegExp operators
 * @example
 * let a = "test.string?"
 * escapeRegExp(a);
 * // "test\\.string\\?"
 */
export function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function getCommonPrefix(str1, str2) {
    let len = Math.min(str1.length, str2.length);
    let prefix = [];
    for (let i = 0; i < len; i++) {
        if (str1[i] === str2[i])
            prefix.push(str1[i]);
        else
            break;
    }
    return prefix.join("");
}

export function getCommonSuffix(str1, str2) {
    let len = Math.min(str1.length, str2.length);
    let str1l = str1.length;
    let str2l = str2.length;
    let suffix = [];
    for (let i = 1; i <= len; i++) {
        if (str1[str1l - i] === str2[str2l - i])
            suffix.push(str1[str1l - i]);
        else
            break;
    }
    return suffix.reverse().join("");
}