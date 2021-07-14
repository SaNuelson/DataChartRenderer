import {hasDuplicates, isSubsetOf} from '../utils/array.js';

/**
 * Find all possible sets of indexes, which together have empty ambiguity sets.
 * @param {...number[][]} ambiguitySetsArgs
 * @example 
 * let first = [[1, 2, 3]];
 * let secnd = [[1], [2, 3]];
 * let third = [[1], [2], [3]];
 * let forth = [[1, 3], [2, 4]];
 * let fifth = [[1, ]]
 */
export function determinePrimaryKeys(ambiguitySetsArray) {
    console.log("determinePrimaryKeys(", ambiguitySetsArray, ")");
    return determinePrimaryKeysBruteForce(ambiguitySetsArray);
}

function determinePrimaryKeysBruteForce(ambiguitySetsArray) {
    let potentialSet = getPotentialSet([...Array(ambiguitySetsArray.length).keys()]);
    //console.log(potentialSet);
    let isSetDisabled = potentialSet.map(()=>false);
    //console.log(isSetDisabled);
    let detectedKeys = [];
    for (let i in potentialSet) {
        if (isSetDisabled[i])
            continue;
        
        let set = potentialSet[i];

        let selection = ambiguitySetsArray.filter((_,i)=>set.includes(i));
        let isValidKey = isCompoundKeyValid(selection);
        //console.log([set, isValidKey]);
        if (isValidKey)
        {
            detectedKeys.push(set);
            isSetDisabled = isSetDisabled.map((v,i) => v || isSubsetOf(set, potentialSet[i]));
            //console.log(isSetDisabled);
        }
    }
    //console.log(detectedKeys);
    return detectedKeys;
}

function getPotentialSet(array) {
    return array.reduce(
        (subsets, value) => subsets.concat(
            subsets.map(set => [value, ...set])
        ),
        [[]]
    );
}

function isCompoundKeyValid(ambiguitySets) {
    if (ambiguitySets.length === 0) 
        return false;
    
    if (ambiguitySets.length === 1)
        return ambiguitySets[0].every(edge => edge.length === 1);

    //console.log(ambiguitySets);
    let referenceSet = ambiguitySets[0];
    let otherSets = ambiguitySets.slice(1);

    for (let i = 0; i < referenceSet.length; i++) {
        let referenceEdge = referenceSet[i];
        let referenceEdgePositions = [];
        for (let j = 0; j < referenceSet[i].length; j++) {
            let searchedValue = referenceEdge[j];
            let searchedValuePositions = [];
            for (let k = 0; k < otherSets.length; k++) {
                let otherSet = otherSets[k];
                for (let l = 0; l < otherSets[k].length; l++) {
                    let otherEdge = otherSet[l];
                    let searchedValueIndex = otherEdge.indexOf(searchedValue);
                    if (searchedValueIndex !== -1) {
                        //console.log(i,j,k,l,searchedValue, searchedValueIndex);
                        searchedValuePositions.push([l, searchedValueIndex]);
                        break;
                    }
                }
            }
            referenceEdgePositions.push(searchedValuePositions.toString());
        }
        //console.log(referenceEdgePositions);
        if (hasDuplicates(referenceEdgePositions)) {
            return false;
        }
    }
    return true;
}

function range(start, stop, step) {
    if (!step)
        step = 1;
    if (!stop)
        [start, stop] = [0, start];
    let ret = [];
    for (let i = start; i < stop; i += step)
        ret.push(i);
    return ret;
}

let domain = range(100);

let first = range(0, 100, 2).map((i) => [i, i+1]);
let second = [0, 1].map((i)=>range(i, i + 99, 2));
let third = range(100).map(i => [i]);

//console.log(determinePrimaryKeys([first, second, third]));