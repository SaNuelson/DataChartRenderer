import { tryParse } from '../parser/parse.main.js';
import { bindEventSystemMixin } from '../utils/events.js';

console.log("Loaded SourceData.js");

const recordDelimiters = [',', ';', '\t'];

/**
 * Class responsible for parsing, holding and working with raw data.
 */
export class SourceData {

    /** 
     * Create instance from raw text, which will be split and cut appropriately.
     * @param {string} text 
     */
    constructor(text) {
        if (!text.match(/^\s*$/))
            this.parseData(text);
    }

    /** 
     * Empty dummy SourceData 
     */
    static Empty = new SourceData("");


    /** 
     * Header array (of size |Features|) 
     */
    head = [];

    /** 
     * Data 2d array (of size |Records| x |Features|)
     */
    data = [];
    
    /** 
     * Get header array 
     */
    get head() {
        return this.head;
    }

    /**
     * Get i-th header string
     * @param {number} i index
     * @returns {string} header
     */
    header(i) {
        return this.head[i];
    }

    /**
     * Get size of data array (rows x cols)
     */
    get size() { 
        return (this.data.length * this.data[0].length) ?? 0; 
    }

    /**
     * Get number of features
     */
    get width() { 
        return (this.data[0].length) ?? 0; 
    }
    
    /**
     * Get number of records
     */
    get height() { 
        return (this.data.length) ?? 0; 
    }

    /** 
     * Get i-th column 
     * @param {number} i
     * @returns {string[]} single column from data 
     */
    col(i) {
        return this.data.map((v) => v[i]);
    }
    /** 
     * Get columns with indexes ...is 
     * @param {...number} is indexes for selection
     * @returns {string[][]} selection of rows from data
     */
    cols(...is) {
        let filtered = this.data.map(row => row.filter((_, i) => is.includes(i)));
        return filtered[0].map((_, colIndex) => filtered.map(row => row[colIndex]));
    }
    /** 
     * Get columns i-th up to j-th column (j < i returns in reversed order) 
     * @param {number} i starting index incl. (in reversed ending excl.)
     * @param {number} j ending index excl. (in reversed starting incl.)
     * @returns {string[][]} span of columns from data
     */
    colr(i, j) {
        if (i > j) {
            var rev = true;
            [i, j] = [j, i];
        }
        let filtered = this.data.map(row => row.slice(i, j));
        let transposed = filtered[0].map((_, colIndex) => filtered.map(row => row[colIndex]));
        return rev ? transposed.reverse() : transposed;
    }

    /** 
     * Get i-th row 
     * @param {number} i
     * @returns {string[]} single row from data
     */
    row(i) {
        return this.data[i];
    }
    /** 
     * Get rows with indexes ...is
     * @param {...number} is indexes for selection
     * @returns {string[][]} selection of rows from data
     */
    rows(...is) {
        return this.data.filter((_, i) => is.includes(i));
    }
    /** 
     * Get i-th up to j-th row (j < i returns in reversed order) 
     * @param {number} i starting index incl. (in reversed ending excl.)
     * @param {number} j ending index excl. (in reversed starting incl.)
     * @returns {string[][]} span of rows from the data
     */
    rowr(i, j) {
        if (i > j) {
            var rev = true;
            [i, j] = [j, i];
        }
        let ret = this.data.slice(i, j);
        return rev ? ret.reverse() : ret;
    }


    /**
     * Parse the data: find delimiter and split header and data, throw away raw text.
     * @param {string} text 
     */
    parseData(text) {
        let lines = text.trim().split(/\r?\n/);

        const determineDelimiter = (line) => recordDelimiters.filter((del) => line.replace(/"[^"]"/, "").match(del));

        {
            let dels = determineDelimiter(lines[0]);
            if (!dels)
                dels = determineDelimiter(lines[1]);
            if (dels.length !== 1)
                throw new Error('Multiple (or no) valid delimiters encountered (' + dels + ')');
            var del = dels[0];
        }

        // [(START + DEL)](PARGROUP + NODELGROUP)[(DEL + END)] 
        let reg = new RegExp(`(?<=^|,)("[^"]*")|[^${del}]+(?=${del}|$)`, 'g');

        this.head = lines[0].match(reg).map(str => str.startsWith('"') && str.endsWith('"') ? str.slice(1, -1) : str);

        for (let i = 1; i < lines.length; i++) {
            let tokens = lines[i].match(reg).map(str => str.startsWith('"') && str.endsWith('"') ? str.slice(1, -1) : str);
            this.data.push(tokens);
        }

        this.triggerEvent(eventHandles.dataParsed, this);
    }

    /**
     * Formats data based on params. Should be refactored in some way.
     * @param {number[]} cols indexes of columns to keep
     * @param {string[]} types string names of types to parse into
     * @param {string[]} formats possible formats to use
     * @returns {Object} google.visualization.DataTable populated instance
     */
    getChartData(cols, types, formats) {
        console.log("GetChartData ", cols, types, formats);
        let parsed_data = new google.visualization.DataTable();

        for (let i = 0; i < cols.length; i++) {
            parsed_data.addColumn(types[i], this.head[cols[i]]);
        }

        for (let i = 0; i < this.data.length; i++) {
            let parsed_line = [];
            for (let j = 0; j < cols.length; j++) {
                let parsed = tryParse(this.data[i][cols[j]], types[j], formats[j]);
                if (parsed == null) {
                    throw "In column " + this.head[cols[j]] +
                    " Could not parse value " + this.data[i][cols[j]] +
                    " into type " + types[j] +
                    " using format " + formats[j];
                } else {
                    parsed_line.push(parsed);
                }
            }
            parsed_data.addRow(parsed_line);
        }
        return parsed_data;
    }

}

const eventHandles = {
    dataParsed: 'onDataParsed'
}

bindEventSystemMixin(SourceData, Object.values(eventHandles));