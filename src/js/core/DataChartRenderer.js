import { SourceData } from './SourceData.js';
/** 
 * Class ChartBinder.
 * 
 * @prototype Might be redundant if the amount of bindings is sufficiently reduced by heuristics.
 * 
 * It is responsible for easier management of different representations of data using charts.
 * Plainly said, it's a glorified array of different SourceData casts.
 * 
 * 
 */
class DataChartRenderer {

    /**
     * @type {SourceData} underlying source data
     */
    _data

    /**
     * Holds array of possible chart representationss
     * @type {}
     */
    _mappings
    
    /**
     * 
     * @param {*} sdata 
     */

    constructor(sdata) {
        this._data = sdata;
    }
    
    /**
     * Set a new data source by file URL.
     * @param {string} url
     * @returns {ChartBinder}
     */
    static fromUrl(url) {
        console.log(`loadDataFromUrl(${url})`);
        return fetch(url)
            .then(data => data.text())
            .then(text => {
                this._data = new SourceData(text);
            });
    }

    /**
     * Set a new data source directly by providing the data either in unsplit format (TODO: Versatility).
     * @param {string} data 
     * @returns {ChartBinder}
     */
    static fromRaw(data) {
        if (!data) {
            console.err("No data provided for new data source.")
        }
        this._data = new SourceData(data);
    }

}