
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