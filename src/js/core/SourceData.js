import { tryParse } from '../parser/parse.main.js';
import { bindEventSystemMixin } from '../utils/events.js';
import { determineType } from '../parser/parse.main.js';
import { Usetype } from '../parser/usetype.js';

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

    /** Empty dummy SourceData */
    static Empty = new SourceData("");


    /** Header array (of size |Features|) */
    _head = [];

    /** Data 2d array (of size |Records| x |Features|)*/
    _data = [];

    /** 
     * Usetypes 2d jagged array 
     * @type {Usetype[][]}
     */
    _usetypes = [];
    
    /** Get header array */
    get head() {
        return this._head;
    }

    /**
     * Get i-th header string
     * @param {number} i index
     * @returns {string} header
     */
    header(i) {
        return this._head[i];
    }

    /**
     * Get size of data array (rows x cols)
     */
    get size() { 
        return (this._data.length * this._data[0].length) ?? 0; 
    }

    /**
     * Get number of features
     */
    get width() { 
        return (this._data[0].length) ?? 0; 
    }
    
    /**
     * Get number of records
     */
    get height() { 
        return (this._data.length) ?? 0; 
    }

    /** 
     * Get i-th column 
     * @param {number} i
     * @returns {string[]} single column from data 
     */
    col(i) {
        return this._data.map((v) => v[i]);
    }
    /** 
     * Get columns with indexes ...is 
     * @param {...number} is indexes for selection
     * @returns {string[][]} selection of rows from data
     */
    cols(...is) {
        let filtered = this._data.map(row => row.filter((_, i) => is.includes(i)));
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
        let filtered = this._data.map(row => row.slice(i, j));
        let transposed = filtered[0].map((_, colIndex) => filtered.map(row => row[colIndex]));
        return rev ? transposed.reverse() : transposed;
    }

    /** 
     * Get i-th row 
     * @param {number} i
     * @returns {string[]} single row from data
     */
    row(i) {
        return this._data[i];
    }
    /** 
     * Get rows with indexes ...is
     * @param {...number} is indexes for selection
     * @returns {string[][]} selection of rows from data
     */
    rows(...is) {
        return this._data.filter((_, i) => is.includes(i));
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
        let ret = this._data.slice(i, j);
        return rev ? ret.reverse() : ret;
    }

    /**
     * Get possible usetypes for i-th column
     * @param {number} i index of column
     * @returns {Usetype[]}
     */
    usetype(i) {
        if (i < 0) {
            i = this.width - 1;
        }
        if(this._usetypes.length < this.width)
            this.determineUsetypes();
        return this._usetypes[i];
    }

    /**
     * Get possible usetypes for is columns
     * @param {...number} is index of column
     * @returns {Usetype[][]}
     */
    usetypes(...is) {
        is = is.map(i => i < 0 ? this.width - 1 : i);
        if(this._usetypes.length < this.width)
            this.determineUsetypes();
        return this._usetypes.filter((_, i) => is.includes(i));
    }

    
    /**
     * Get i-th up to j-th row  usetypes (j < i returns in reversed order) 
     * @param {number} i starting index incl. (in reversed ending excl.)
     * @param {number} j ending index excl. (in reversed starting incl.)
     * @returns {Usetype[][]}
     */
    usetyper(i = 0, j = -1) {
        if (i < 0) {
            i = this.width - i;
        }
        if (j < 0) {
            j = this.width - j;
        }
        if (i > j) {
            var rev = true;
            [i, j] = [j, i];
        }
        if(this._usetypes.length < this.width)
            this.determineUsetypes();
        let ret = this._usetypes.slice(i, j);
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

        this._head = lines[0].match(reg).map(str => str.startsWith('"') && str.endsWith('"') ? str.slice(1, -1) : str);

        for (let i = 1; i < lines.length; i++) {
            let tokens = lines[i].match(reg).map(str => str.startsWith('"') && str.endsWith('"') ? str.slice(1, -1) : str);
            this._data.push(tokens);
        }

        this.triggerEvent(eventHandles.dataParsed, this);
    }

    determineUsetypes() {
        this._usetypes = [];
        for (let i = 0, len = this.width; i < len; i++) {
            this._usetypes[i] = determineType(this.col(i));
        }
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
            parsed_data.addColumn(types[i], this._head[cols[i]]);
        }

        for (let i = 0; i < this._data.length; i++) {
            let parsed_line = [];
            for (let j = 0; j < cols.length; j++) {
                let parsed = tryParse(this._data[i][cols[j]], types[j], formats[j]);
                if (parsed == null) {
                    throw "In column " + this._head[cols[j]] +
                    " Could not parse value " + this._data[i][cols[j]] +
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

    getUsetypedData(cols) {
        console.log("getUsetypedData ", cols);
        let parsed_data = new google.visualization.DataTable();

        for (let i = 0; i < cols.length; i++) {
            // TODO: multiple usetypes on single column will break stuff
            let retIdx = parsed_data.addColumn(this._usetypes[cols[i]][0].type, this._head[cols[i]]);
        }

        for (let i = 0; i < this._data.length; i++) {
            let parsed_line = [];
            for (let j = 0; j < cols.length; j++) {
                let parsed = this._usetypes[cols[j]][0].deformat(this._data[i][cols[j]]);
                if (!parsed && parsed !== 0) {
                    console.error("In column ", this._head[cols[j]],
                    " Could not parse value ", this._data[i][cols[j]],
                    " into type ", this._usetypes[cols[j]][0]);
                    return null;
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