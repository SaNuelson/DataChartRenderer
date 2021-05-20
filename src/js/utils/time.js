/**
 * Array of numbers in format [hours, minutes, seconds [, milliseconds]]
 * @typedef {number[]} TimeOfDay
 */

/**
 * Checks if provided variable is a valid Date
 * @param {any} date 
 * @returns {boolean}
 */
export function isValidDate(date) {
    if (date instanceof Date && !isNaN(date))
        return true;
    return false;
}

/**
 * Checks if provided variable is a valid Timeofday (according to Google Charts)
 * @param {*} tod 
 * @returns {boolean}
 */
export function isValidTimeOfDay(tod) {
    if (!tod instanceof Array)
        return false;

    if (tod.length < 3 || tod.length > 4)
        return false;

    if (tod[0] < 0 || tod[0] > 23)
        return false;

    if (tod[1] < 0 || tod[1] > 59)
        return false;

    if (tod[2] < 0 || tod[2] > 59)
        return false;

    if (tod[3] && (tod[3] < 0 || tod[3] > 999))
        return false;

    return true;
}

/**
 * Extracts timeofday data from a valid date object.
 * @param {Date} date
 * @returns {TimeOfDay} timeofday if successful
 */
export function dateToTimeOfDay(date) {
    return [date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()];
}