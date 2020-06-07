import {tryParse, determineType} from './Parser.js';

console.log("Loaded SourceData.js");

/**
 * Class responsible for parsing, holding and working with raw data.
 */
export default class SourceData {

    head = [];
    data = [];

    static Empty = (()=>{
        let data = new SourceData("");
        data.head = [];
        data.data = [];
        return data;
    })()

    /**
     * Create instance from raw text, which will be split and cut appropriately.
     * @param {string} text 
     */
    constructor(text) {

        if (text == null || text == "") {
            this.isSourceValid = false;
        }
        // default class variable values
        this.isSourceValid = true;
        this.showDebug = true;
        this.parseData(text);
    }

    lineDelimiter = '\n';
    entryDelimiter = ',';
    parseData(text) {

        this.head = [];
        this.data = [];

        // Split by generic line breaks since there's not that many options.
        let lines = text.split(/\r?\n/);

        // Considering there's at least two items per row, and each row has the same amount
        // Try all "sane" delimiters by how probable they are.
        const possibleDelimiters = [';','\t'];
        let delimiter = ',';
        possibleDelimiters.some((del)=>{
            if((lines[0].match(del) || []).length > 0){
                delimiter = del;
                console.warn(`It seems the item delimiter isn't a simple comma. Instead, ${del} has been detected.`);
                return true;
            }
            return false;
        })

        let head_cut = lines[0].split(delimiter);
        let isBuff = false;
        let buff = "";
        for (let i = 0; i < head_cut.length; i++) {
            let data = head_cut[i].trim();
            if (data[0] == '"' && data[data.length - 1] == '"') {
                this.head.push(data.slice(1, -1));
            } else if (data[0] == '"') {
                isBuff = true;
                buff = data.substr(1);
            } else if (data[data.length - 1] == '"') {
                buff += data.slice(0, -1);
                this.head.push(buff);
                buff = "";
                isBuff = false;
            } else {
                if (isBuff) {
                    buff += data;
                } else {
                    this.head.push(data);
                }
            }
        }

        for (let i = 1; i < lines.length; i++) {
            let data_row_raw = lines[i].split(delimiter);
            let data_row = []
            for (let j = 0; j < data_row_raw.length; j++) {
                let row = data_row_raw[j].trim();
                if (row[0] == '"' && row[row.length - 1] == '"') {
                    data_row.push(row.slice(1, -1));
                } else if (row[0] == '"') {
                    isBuff = true;
                    buff = row.substr(1);
                } else if (row[row.length - 1] == '"') {
                    buff += row.slice(0, -1);
                    data_row.push(buff);
                    buff = "";
                    isBuff = false;
                } else {
                    if (isBuff) {
                        buff += row;
                    } else {
                        data_row.push(row);
                    }
                }
            }
            if (buff != "") {
                data_row.push(buff);
                buff = "";
                isBuff = false;
            }
            if (data_row.length > 0 && !(data_row.length == 1 && data_row[0] == 0)) {
                this.data.push(data_row);
            }
        }

    }

    determineFormats() {
        console.log("Trying to determine possible data formats.");
        for(let col = 0; col < this.data.length; col++) {
            console.log("For column ", this.head[col]);
            let columnData = this.data.reduce(function(acc,curr){acc.push(curr[col])},[]);
            let possibleTypes = determineType(columnData);
            console.log("Possible data types for column ", this.head[col], " are: ", possibleTypes);
        }
    }

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