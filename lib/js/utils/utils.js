/**
 * Creates a cartesian product of provided arrays, while filtering it at the same time using the callback filter.
 * @param {object} opts
 * @param {boolean} opts.sturdy Indicates if the filter callback is sturdy and can be used iteratively at each cart.prod. for better efficiency
 * @param {function(string) : boolean} opts.callback Callback used withing Array.filter()
 * @param  {...any[]} data 
 */
export function conditionalCartesian(opts, ...data) {
    if (!data)
        return [];

    if (opts.sturdy && opts.callback) {
        let temp = data[0];
        let nextit = 0;
        while (++nextit < data.length) {
            temp = temp
                .flatMap(t => data[nextit].filter(n => t.includes ? !t.includes(n) : t !== n).map(d => [t, d].flat()))
                .filter(opts.callback);
            // console.log("Sturdy debug at ", nextit, "with new options ", data[nextit], ":\n", temp.reduce((b,n) => b += n.toString() + "\n",""));
        }
        return temp;
    }
    else {
        let temp = ((a) => a.reduce((a, b) => a.flatMap(d => b.filter(e => d.includes ? !d.includes(e) : d !== e).map(e => [d, e].flat()))))(data);
        return opts.callback ? temp.filter(opts.callback) : temp;
    }

}

export const zip = (...rows) => rows[0].map((_,c) => rows.map(row => row[c]));

/**
 * Get intersection of provided arrays
 * @param {...any[]} as 
 * @param {object} opts 
 * @returns {any[]} intersection of ...as
 */
export function intersection(opts, ...as) {
    if (!as)
        return [];
    
    return as[0].filter(a => as.splice(0,1).every(ao => ao.includes(a)));
}

/**
 * @template T, U
 * @param {T[]} as First set of groups
 * @param {U[]} bs Second set of groups
 * @param {object} opts 
 * @param {function(T, U) : boolean} opts.mappable callback function that returns if two groups can be joined
 * @param {"1v1"|"1vn"|"nv1"|"nvn"} opts.uniqueness type of mapping
 * @param {"none"|"left"|"right"|"both"} opts.totality which group has to be full mapped to other side
 */
export function mapping(as, bs, opts) {

    if (!as || !bs)
        return [];
    
    if (!opts["totality"])
        opts.totality = "both";

    if (!opts["uniqueness"])
        opts.uniqueness = "1v1";

    if (!opts["mappable"])
        opts.mappable = (ls, rs) => ls.some(l => rs.includes(l));

    // 2d boolean array
    let mappable = [];
    as.forEach(a => mappable.push(bs.map(b => opts.mappable(a, b))));
    
    let ltr = mappable.map(row => row.reduce((acc, next) => acc + +next));
    let rtl = zip(...mappable).map(col => col.reduce((acc, next) => acc + +next));

    if ((opts.totality === "left" || opts.totality === "both") && ltr.some(c => c === 0)) {
        console.warn(`Invalid sets for ${opts.totality}-like mapping. Left-side group ${ltr.filter(c => c === 0)[0]} has no possible pairing.`);
    }

    if ((opts.totality === "right" || opts.totality === "both") && rtl.some(c => c === 0)) {
        console.warn(`Invalid sets for ${opts.totality}-like mapping. Right-side group ${rtl.filter(c => c === 0)[0]} has no possible pairing.`);
    }
    
    let fixed = [];
    ltr.forEach((c, i) => c === 1
        && fixed.push([i, mappable[i].indexOf(true)])
        && mappable[i].splice(i,1));
    rtl.forEach((c, i) => c === 1 
        && fixed.push([zip(mappable)[i].indexOf(true), i]) 
        && mappable.forEach(row => row.splice(i,1)));

    
}

export function dummy(a) {
    return "DUMMY -- " + a;
}