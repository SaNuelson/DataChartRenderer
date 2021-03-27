import { SourceData } from './SourceData.js';

/**
 * SourceData wrapper responsible for finding and maintaining possible mappings 
 * between SourceData and possible chart types based on recognized types.
 */
class Recognizer {

    /**
     * 
     * @param {SourceData} sourceData 
     * @param {object} options 
     */
    constructor(sourceData, options) {
        this.sd = sourceData;

    }

    /**
     * Info about possible mappings
     */
    #mappings = [];

    

}