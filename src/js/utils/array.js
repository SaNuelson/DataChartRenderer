
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

/**
 * Check if array has any duplicates (shallow?)
 * @param {*[]} array 
 * @returns {boolean} true if has any duplicates 
 */
export function hasDuplicates(array) {
    return (new Set(array)).size !== array.length;
}

/**
 * Group objects in array by specific key
 * @param {*[]} xs array to group
 * @param {*} key key to group by
 * @param {boolean} dropKeyless whether to skip objects lacking specified key or not
 * @returns {*} object with keys equal to grouping keys, values being arrays of objects
 * @example
 * let objs = [{'a':5},{'a':10},{'b':20},{'a':false}]
 * let grouped = groupBy(objs, 'a', true);
 * // {'5':[{'a':5}], '10':[{'a':10}], 'false':{'a':false}]}
 */
export function groupBy(xs, key, dropKeyless = true) {
    if (dropKeyless)
        xs = xs.filter(x => x[key] || x[key] === 0);

    let groups = {};
    for (let x of xs) {
        groups[x[key]] = (groups[x[key]] || []);
        groups[x[key]].push(x);
    }
    return groups;
}

/**
 * Check if two arrays are equal element-wise (shallow)
 * @param {*[]} ax 
 * @param {*[]} bx 
 * @returns {boolean} true if of same size and all eleements equal, false otherwise
 */
export function areEqual(ax, bx) {
    if (ax.length !== bx.length)
        return false;
    for (let i in ax)
        if (ax[i] !== bx[i])
            return false;
    return true;
}

/**
 * Insert element el between every two elements of arr.
 * @param {any[]} arr array to infill (won't be mutated)
 * @param {any} el infilling element (shallow copy)
 * @param {boolean} [start=false] (=false) whether to put one element at the start
 * @param {boolean} [end=false] (=false) whether to put one element at the end
 * @example
 * let arr = ["a","b","c","d"];
 * let filler = "X";
 * console.log(infill(arr, filler, true, false));
 * // ["X", "a", "X", "b", "X", "c", "X", "d"];
 */
export function infill(arr, el, start = false, end = false) {
    let infilled = arr.map(a => [a, el]).flat(1);
    if (start)
        infilled.splice(0, 0, el);
    if (!end)
        infilled.splice(-1, 1);
    return infilled;
}

let a = ["a", ["b","c"], "d", {e:true}, ()=>{}];
let b = "X";

let ret = infill(a, b, true, true);
