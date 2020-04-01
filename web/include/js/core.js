/**
 * Main class. Responsible for rendering chart using provided data.
 * Wrapped into class for the user to be able to use multiple instances for multiple charts (eg. when comparing).
 */
class ChartManager {

    /* #region Properties */

    /**
     * class SourceData instance, holds currently loaded CSV
     * @type {SourceData}
     */
    SourceData = null;
    /**
     * Array holding current roles (unfilled and filled alike). 
     * @type {Oeject[]}
    */
    ChartRoles = []
    /**
     * Element (div) onto which google chart should be rendered.
     * @type {HTMLElement}
     */
    ChartBoundElement = null;
    /**
     * Name of chart type currently selected.
     * @type {string}
     */
    SelectedChartTypeName = null;

    /* #endregion */

    /////////////////////////////////////////////////////////////////////////////////////////

    /* #region API Methods */

    /**
     * Set a new data source for the by file URL.
     * @param {String} url
     * @returns {Promise}
     */
    setDataSource(url) {
        return fetch(url)
            .then(data => data.text())
            .then(text => this.SourceData = new SourceData(text))
            .catch(err => console.error(err))
    }

    /**
     * Set a new data source directly by providing the data either in unsplit format (TODO: Versatility).
     * @param {(string)} data 
     */
    setDataValue(data) {
        if (!data) {
            console.error("No data provided for new data source.")
        }
        SourceData = new SourceData(data);
        console.log("Loaded new data source from direct data.")
    }

    /**
     * Set a div in which the chart should be rendered either by providing the elementId.
     * @param {string} element
     */
    setChartContainer(elementId) {
        if (elementId) {
            var el = document.getElementById(elementId);
            if (el && el.tagName.toUpperCase() == "DIV") {
                ChartBoundElement = el;
                console.log("Successfully bound div with id " + elementId + " to the GC.");
                return;
            }
            else {
                console.error("Element with id " + elementId + "does not exist or is not a div.");
            }
        }
        else {
            console.error("Please provide a valid div id.");
        }
    }

    /**
     * Get a string array of names of valid Google Charts.
     * @returns {string[]}
     */
    getChartTypes() {
        let types = [];
        for (let type of ChartManager.ChartTypeData["ChartTypes"])
            types.push(type["name"])
        return types;
    }

    /**
     * Select a chart type you wish to render. It has to be one of the strings provided by getChartTypes.
     * @param {string} value
     */
    setChartType(value) {
        console.log("setChartType: " + value);
        ChartManager.checkChartTypeData();
        if (this.getChartTypes().includes(value)){
            this.SelectedChartTypeName = value;
            this.ChartRoles = ChartRole.createListByMixedContent(ChartManager.ChartTypeData["ChartTypes"].find(type=>type.name===value)["roles"], this);
        }
        else
            console.log("Please provide a valid chart type name from getChartTypes.");
    }

    /**
     * Get roles for currently selected chart type in format TODO FORMAT_ROLE_LIST.
     * Pass by sharing enables you to make persistent changes, thus filling out columns in roles.
     * @returns {object[]} 
     */
    getChartRoles() {
        if (!this.SelectedChartTypeName){
            console.log("No chart type selected.");
            return null
        }
        return this.ChartRoles;
    }

    /* #endregion */

    /////////////////////////////////////////////////////////////////////////////////////////

    /* #region Manager */

    /**
     * Parsed graph_types.json
     * @type {Object}
     */
    static ChartTypeData = null;

    static checkChartTypeData() {
        // TODO: should use some checksum or other mechanism to ensure that the data is valid.
        if (!ChartManager.ChartTypeData) {
            throw new Error("ChartTypeData is not defined. Please contact the developer.")
        }
    }

    /**
     * Get all role templates as objects.
     * @returns {object[]}
     */
    static getChartRoleTemplates() {
        ChartManager.checkChartTypeData();
        return ChartManager.ChartTypeData["RoleDetails"];
    }

    /**
     * Get a specific role template as object.
     * @returns {object}
     */
    static getChartRoleTemplate(roleName) {
        ChartManager.checkChartTypeData()
        return ChartManager.ChartTypeData["RoleDetails"].find(role=>role["name"]===roleName);
    }

    /* #endregion */

}

/* #region Init Static Methods */

// CRITICAL: Load JSON with chart type data
fetch('http://siret.ms.mff.cuni.cz/novelinka/new/web/json/graph_types.json')
    .then((data)=>data.json())
    .then((json)=>ChartManager.ChartTypeData = json)
    .catch((err)=>console.warn(err))

// CRITICAL: Set up Google Charts connection
google.charts.load('current', { packages: ['corechart', 'annotationchart', 'calendar', 'sankey', 'timeline', 'treemap', 'wordtree'] });
google.charts.setOnLoadCallback(()=>{console.log("Google Charts loaded successfully.")});

/* #endregion */

/**
 * This class holds information about a specific role for a Google Chart.
 * 
 *      In example, Bubble Chart holds (among others) a role for "ID/Name" of each bubble node rendered on the chart.
 *      A ChartRole for this particular case would then hold all necessary information (name = "ID (name)", types = ["string"], corresponding CSV column = "c13").
 */
class ChartRole {

    /**
     * Properties
     */
    name; caption; types; defval; subroles; optional; repeatable;

    selectedColumn; selectedType; selectedFormat; manager;

    constructor(srcObj, manager) {
        if (srcObj["name"]) this.name = srcObj["name"];
        if (srcObj["caption"]) this.caption = srcObj["caption"];
        if (srcObj["types"]) this.types = srcObj["types"];
        if (srcObj["default"]) this.defval = srcObj["default"];
        if (srcObj["subroles"]) this.subroles = srcObj["subroles"];
        if (srcObj["optional"]) this.optional = srcObj["optional"];
        if (srcObj["repeatable"]) this.repeatable = srcObj["repeatable"];
        
        this.selectedColumn = null;
        this.selectedType = null;
        this.selectedFormat = null;

        if(!manager){
            console.error("Manager not defined for a chartRole.");
        }

        this.manager = manager;
    }

    /**
     * Factory method, create by role in ChartTypeData
     * @param {string} role 
     * @param {ChartManager} manager
     * @returns {ChartRole}
     */
    static createByRole(role, manager) {
        let roleData = ChartManager.getChartRoleTemplate(role);
        if (!roleData) {
            console.log(`Role ${role} not found`);
            return null;
        }
        return new ChartRole(roleData, manager)
    }

    /**
     * Factory method, create by object from ChartTypeData.ChartTypes[]
     * @param {Object} data
     * @param {ChartManager} manager
     * @returns {ChartRole} 
     */
    static createByData(data, manager) {
        if (!data) {
            console.log(`Invalid data provided for ChartRole factory:`);
            console.log(data);
            return null;
        }
        return new ChartRole(data, manager);
    }

    /**
     * Factory methods, create whole array from ChartTypeData.ChartTypes
     * @param {object[]} data 
     * @param {ChartManager} manager
     */
    static createListByMixedContent(data, manager){
        var arr = [];
        for(let template of data){
            if(template["role"])
                arr.push(ChartRole.createByRole(template["role"], manager))
            else
                arr.push(ChartRole.createByData(template, manager))
        }
        return arr;
    }

}

/**
 * Class responsible for parsing, holding and working with raw data.
 */
class SourceData {

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

        let lines = text.split('\n');

        let head_cut = lines[0].split(',');
        let isBuff = false;
        let buff = "";
        for (let i = 0; i < head_cut.length; i++) {
            let data = head_cut[i].trim();
            if (data[0] == '"' && data[data.length - 1] == '"') {
                this.head.push(data.slice(1, -1));
            }
            else if (data[0] == '"') {
                isBuff = true;
                buff = data.substr(1);
            }
            else if (data[data.length - 1] == '"') {
                buff += data.slice(0, -1);
                this.head.push(buff);
                buff = "";
                isBuff = false;
            }
            else {
                if (isBuff) {
                    buff += data;
                }
                else {
                    this.head.push(data);
                }
            }
        }

        for (let i = 1; i < lines.length; i++) {
            let data_row_raw = lines[i].split(',');
            let data_row = []
            for (let j = 0; j < data_row_raw.length; j++) {
                let row = data_row_raw[j].trim();
                if (row[0] == '"' && row[row.length - 1] == '"') {
                    data_row.push(row.slice(1, -1));
                }
                else if (row[0] == '"') {
                    isBuff = true;
                    buff = row.substr(1);
                }
                else if (row[row.length - 1] == '"') {
                    buff += row.slice(0, -1);
                    data_row.push(buff);
                    buff = "";
                    isBuff = false;
                }
                else {
                    if (isBuff) {
                        buff += row;
                    }
                    else {
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

    getChartData(cols, types, formats) {

        let parsed_data = new google.visualization.DataTable();

        for (let i = 0; i < cols.length; i++) {
            parsed_data.addColumn(types[i], this.head[cols[i]]);
        }

        for (let i = 0; i < this.data.length; i++) {
            let parsed_line = [];
            for (let j = 0; j < cols.length; j++) {
                let parsed = tryParse(this.data[i][cols[j]], types[j], formats[j]);
                if (parsed == null) {
                    return null;
                }
                else {
                    parsed_line.push(parsed);
                }
            }
            parsed_data.addRow(parsed_line);
        }
        return parsed_data;
    }

}