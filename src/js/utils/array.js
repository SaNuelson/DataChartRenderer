
export const unique = function (arr) {
    return [...Set(arr)];
}

/**
 * Reduce array into object containing its values as keys with values being occurences
 * @param {any[]} arr 
 * @param {object} object with keys equal to unique values in arr, their values being number of occurences
 */
export const count = function (arr) {
    return arr.reduce((acc, next) => {
        acc[next] ? acc[next]++ : acc[next] = 1;
        return acc;
    }, {});
}

/**
 * Sum elements in array (concat if strings)
 * @param {number[]} arr 
 * @returns {number}
 */
export const sum = function (arr) {
    return arr.reduce((a,b) => a + b)
}

/**
 * Average elements in array
 * @param {number[]} arr 
 * @returns {number}
 */
export const avg = function(arr) {
    return sum(arr) / arr.length;
}

/**
 * Convert object to array with elements in form [key, object[key]]
 * @param {object} obj
 * @returns {Array.<[string, any]>}
 * @example
 * let o = {a: 1, b: "2", c: {d: "three"}};
 * let a = toKvp(o);
 * // [["a", 1], ["b", "2"], ["c", {d: "three"}]]
 */
export const toKvp = function(obj) {
    let arr = [];
    for (let key in obj) {
        arr.push([key, obj[key]]);
    }
    return arr;
}

/**
 * 
 * @param {any[]} arr 
 * @param {any[]|string} against either array to use as other distribution 
 * or string specifying kind of distribution with same domain as arr
 * @returns {number} cross-entropy value for specified empirical distributions
 */
export const crossEntropy = function(arr, against) {
    // H(x) = - sum_x p1(x) * log p2(x) 
    if (Array.isArray(against)) {
        throw "NotImplemented";
    }
    else {
        if (["u", "uni", "uniform"].includes(against)) {
            let as = count(arr);
            let fac = Math.log(1 / Object.keys(as).length) / array.length;
            let cross = 0;
            for (let k in as) {
                cross -= as[k] / size * fac;
            }
            return cross;
        }
    }
}