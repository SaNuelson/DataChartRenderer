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
    let ret = determinePrimaryKeysBruteForce(ambiguitySetsArray);
    return ret;
}

function determinePrimaryKeysBruteForce(ambiguitySetsArray) {
    let potentialSet = getPotentialSet([...Array(ambiguitySetsArray.length).keys()]);
    let isSetDisabled = potentialSet.map(()=>false);
    let detectedKeys = [];
    for (let i in potentialSet) {
        if (isSetDisabled[i])
            continue;
        
        let set = potentialSet[i];

        let selection = ambiguitySetsArray.filter((_,i)=>set.includes(i));
        let isValidKey = isCompoundKeyValid(selection);
        if (isValidKey)
        {
            detectedKeys.push(set);
            isSetDisabled = isSetDisabled.map((v,i) => v || isSubsetOf(set, potentialSet[i]));
        }
    }
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

    let referenceSet = ambiguitySets[0];
    let otherSets = ambiguitySets.slice(1);

    // for each edge in referenceSet
    //     for each vertex in referenceEdge
    //         create list of indexes of edges in all respective sets, where referenceVertex appears
    //     if any two referenceVertices were found in the same edge, return false
    
    // in other words, we get arrays for each referenceVertex in some referenceEdge in form
    // [ s_2_v, s_3_v, s_4_v, ...]
    // which specify edges in individual sets, where vertex v has been found
    // return false, if for any index we can find some value more than once

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
                        searchedValuePositions.push([l, searchedValueIndex]);
                        break;
                    }
                }
            }
            referenceEdgePositions.push(searchedValuePositions);
        }
        for (let j = 0; j < referenceEdge.length; j++) {
            let vertexAppearances = referenceEdgePositions
                .map(poss => poss[j])
                .filter(v => v !== undefined);
            if (vertexAppearances.some(vertexApp => hasDuplicates(vertexApp.filter(v => v !== undefined)))) {
                return false;
            }
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