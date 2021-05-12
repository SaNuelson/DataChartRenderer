import * as Logic from '../utils/logic.js';
import { Usetype } from './usetype.js';
import { recognizeNumbers } from './parse.num.js';
import { recognizeEnums } from './parse.enum.js';
import { recognizeTimestamps } from './parse.timestamp.js';
import { clamp } from '../utils/utils.js';

/**
 * Let's try aggregating the parsing process.
 * Thanks to different Usetypes, we can condense the process into a single file (hopefully).
 * By decoupling as much as possible, we could first run initialRecognizers for each Usetype.
 * These will generate a list of possible Usetypes.
 * Next, we can run the checking process on all usetypes simultaneously.
 * Thanks to their common interface, we may achieve the same logic with all of them at once.
 * This would cut off all the excess mess, and computation time as well.
 */

const BATCH_SIZE_DEFAULT_RATIO = 0.1;
const BATCH_SIZE_MINIMAL = 10;
const BATCH_SIZE_MAXIMAL = 100;
function getBatchSize(size) {
    let min = Math.min(size, BATCH_SIZE_MINIMAL);
    let max = Math.mix(size, BATCH_SIZE_MAXIMAL);
    return clamp(size, min, max);
}

/**
 * Try to find a possible formats of types found within the source string.
 * @param {string[]} source 
 * @returns {Usetype.Usetype[]}
 */
export function recognizeUsetypes(source) {
    let noval = null;

    console.groupCollapsed("recognizeUsetypes()");

    let initialBatchSize = getBatchSize(source.length);
    let initialBatch = source.slice(0, initialBatchSize);
    let restBatch = source.slice(initialBatchSize);

    console.log("-- initialBatchSize = " + initialBatchSize);

    let enumUsetypes = recognizeEnums(source);

    if (enumUsetypes.length === 1 && enumUsetypes[0].noval) {
        console.log("-- NOVAL detected = ", enumUsetypes[0].noval);
        noval = enumUsetypes[0].noval;
        source = source.filter(entry => entry !== noval);
        enumUsetypes = [];
    }

    let numUsetypes = recognizeNumbers(initialBatch);
    let timeUsetypes = recognizeTimestamps(initialBatch);
    
    console.log("-- initialUsetypes");
    console.log("-- -- enums      = ", enumUsetypes);
    console.log("-- -- numbers    = ", numberUsetypes);
    console.log("-- -- timestamps = ", timestampUsetypes);

    console.log("-- for tolerance 100 or 0.01");
    let tolerance = Math.min(100, source.length * 0.01);
    console.log("-- tolerance is ", tolerance);

    console.log("-- filtering starting...");

    console.log("-- using chunks of size 200");

    const chunkSize = 200;
    /** @type {Usetype[]} */
    let usetypes = [].concat(numberUsetypes, timestampUsetypes);
    let missCount = usetypes.map(() => 0);
    for (let i = 0; i < restBatch.length; i++) {
        
        if (i % chunkSize === 0) {
            console.log("-- chunk filled, filtering...");
            usetypes.forEach((usetype, idx) => {
                if (missCount[idx] > tolerance) {
                    console.log("-- -- filtering out ", usetype);
                    usetype.disabled = true;
                }
            })
        }
        
        for (let j = 0; j < usetypes.length; j++) {
            if (usetypes[j].disabled)
                continue;

            let val = usetypes[j].deformat(restBatch[i]);   
            if (!val) {
                missCount[idx]++;
            }
        }
    }

    console.groupEnd();
}