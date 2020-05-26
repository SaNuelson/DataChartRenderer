console.log("Loaded ChartManager.js");

import SourceData from './SourceData.js';
import ChartRole from './ChartRole.js';

/**
 * Main class. Responsible for rendering chart using provided data.
 * Wrapped into class for the user to be able to use multiple instances for multiple charts (eg. when comparing).
 */
export default class ChartManager {

    /* #region Properties */

    /**
     * class SourceData instance, holds currently loaded CSV
     * @type {SourceData}
     */
    _sourceData = null;
    get SourceData() {
        if (!this._sourceData || this._sourceData == null)
            return SourceData.Empty;
        return this._sourceData;
    }
    set SourceData(value) {
        // TODO validate source data
        this._sourceData = value;
        document.dispatchEvent(new CustomEvent("onCMSourceDataChange", { "detail": this }));
    }
    /**
     * Array holding current roles (unfilled and filled alike). 
     * @type {Object[]}
     */
    _chartRoles = []
    get ChartRoles() { return this._chartRoles; }
    set ChartRoles(value) {
        this._chartRoles = value;
        document.dispatchEvent(new CustomEvent("onCMChartRolesChange", { "detail": this }));
    }
    /**
     * Element (div) onto which google chart should be rendered.
     * @type {HTMLElement}
     */
    _chartBoundElement = null;
    get ChartBoundElement() { return this._chartBoundElement; }
    set ChartBoundElement(value) {
        this._chartBoundElement = value;
        document.dispatchEvent(new CustomEvent("onCMBoundElementChange", { "detail": this }));
    }
    /**
     * Internal name of the chart used in GC.
     * @type {String}
     */
    _selectedChartTypeInternalName = null;
    get SelectedChartTypeInternalName() {
        if (this._selectedChartTypeInternalName)
            return this._selectedChartTypeInternalName;
        return this._selectedChartTypeName;
    }
    set SelectedChartTypeInternalName(value) {
        this._selectedChartTypeInternalName = value;
        document.dispatchEvent(new CustomEvent('onCMSelectedChartTypeInternalNameChange', { 'detal': this }));
    }
    /**
     * Name of chart type currently selected.
     * @type {string}
     */
    _selectedChartTypeName = null;
    get SelectedChartTypeName() {
        return this._selectedChartTypeName;
    }
    set SelectedChartTypeName(value) {
        this._selectedChartTypeName = value;
        document.dispatchEvent(new CustomEvent("onCMSelectedChartTypeNameChange", { "detail": this }));
    }

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
            console.err("No data provided for new data source.")
        }
        this.SourceData = new SourceData(data);
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
                this.ChartBoundElement = el;
                console.log("Successfully bound div with id " + elementId + " to the GC.");
                return;
            } else {
                console.err("Element with id " + elementId + "does not exist or is not a div.");
            }
        } else {
            console.err("Please provide a valid div id.");
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
        if (this.getChartTypes().includes(value)) {
            this.SelectedChartTypeName = value;
            this.SelectedChartTypeInternalName = ChartManager.ChartTypeData["ChartTypes"].find((type)=>type["name"] === value)["internal-name"];
            this.ChartRoles = ChartRole.createListByMixedContent(ChartManager.ChartTypeData["ChartTypes"].find(type => type.name === value)["roles"], this);
        } else {
            console.err("Please provide a valid chart type name from getChartTypes.");
            this.SelectedChartTypeName = "";
            this.ChartRoles = [];
        }
    }

    /**
     * Get roles for currently selected chart type in format TODO FORMAT_ROLE_LIST.
     * Pass by sharing enables you to make persistent changes, thus filling out columns in roles.
     * @returns {object[]} 
     */
    getChartRoles() {
        return this.ChartRoles;
    }

    /**
     * Call once everything is set up and ready for rendering.
     */
    drawChart() {

        // no source data
        if (!this.SourceData) {
            console.error("No source data set, can't draw chart.");
            return;
        }

        // invalid chart type
        if (!google.visualization[this.SelectedChartTypeInternalName]) {
            console.error(`Invalid chart type ${this.SelectedChartTypeName}. Invalid state.`);
            return;
        }

        var dataTable = new google.visualization.DataTable();
        var columns = [];
        var types = [];
        var formats = []

        for (let role of this.ChartRoles) {

            // undefined role
            if (!role.selectedColumn) {
                // optional, skip
                if (role.optional) {
                    console.log(`Undefined optional role ${role.name}, skipping.`);
                    continue;
                }
                // mandatory, invalid state
                else {
                    console.error(`Role ${role.name} has no column selected despite being mandatory.`);
                    return;
                }
            }

            // invalid selected column
            if (!this.SourceData.head.includes(role.selectedColumn)) {
                console.error(`Role ${role.name} has invalid selected column ${role.selectedColumn}`);
                return;
            }

            // assign column
            if (!role.optional) {
                dataTable.addColumn(role.selectedType, role.name);
            } else {
                dataTable.addColumn({
                    type: role.selectedType,
                    role: role.role
                });
            }

            // push column to the list for later data formatting
            columns.push(this.SourceData.head.indexOf(role.selectedColumn)); // TODO: Redo selectedColumn & selectedType to indexes
            types.push(role.selectedType);
            formats.push(role.selectedFormat);

            // repeat for subroles
            for (let subrole of role.subroles) {
                // all subroles are optional
                if (!subrole.selectedColumn)
                    continue;
                if (!this.SourceData.head.includes(subrole.selectedColumn)) {
                    console.warning(`Role ${subrole.name} has invalid selected column ${subrole.selectedColumn}, skipping.`);
                }
                dataTable.addColumn({
                    type: subrole.type,
                    role: subrole.role
                })
                columns.push(this.SourceData.head.indexOf(subrole.selectedColumn));
                types.push(subrole.selectedType);
                formats.push(subrole.selectedFormat);
            }

            // and finally check any copies
            if (role.repeatable) {
                for (let copy of role.copies) {
                    // any copy automatically optional

                    // skip if unassigned
                    if (!copy.selectedColumn)
                        continue;
                    // warn and skip if invalid
                    if (!this.SourceData.head.includes(copy.selectedColumn)) {
                        console.warning(`Role ${copy.name} has invalid selected column ${copy.selectedColumn}, skipping.`);
                        continue;
                    }

                    // assign column
                    if (!role.optional) {
                        dataTable.addColumn(copy.selectedType, copy.name);
                    } else {
                        dataTable.addColumn({
                            type: copy.selectedType,
                            role: copy.role
                        });
                    }
                    columns.push(this.SourceData.head.indexOf(copy.selectedColumn));
                    types.push(copy.selectedType);
                    formats.push(copy.selectedFormat);

                    // and add any subroles of the copy
                    for (let subrole of role.subroles) {
                        // all subroles are optional
                        if (!subrole.selectedColumn)
                            continue;
                        if (!this.SourceData.head.includes(subrole.selectedColumn)) {
                            console.warning(`Role ${subrole.name} has invalid selected column ${subrole.selectedColumn}, skipping.`);
                        }
                        dataTable.addColumn({
                            type: subrole.type,
                            role: subrole.role
                        })
                        columns.push(this.SourceData.head.indexOf(subrole.selectedColumn));
                        types.push(subrole.selectedType);
                        formats.push(subrole.selectedFormat);
                    }
                }
            }
        }

        // let the source data format itself using the columns and types
        var formattedData = this.SourceData.getChartData(columns, types, formats);
        // TODO var options
        var chart = new google.visualization[this.SelectedChartTypeInternalName](this.ChartBoundElement);
        console.log("DATA");
        console.log(formattedData);
        chart.draw(formattedData, null);
    }

    /* #endregion */

    /////////////////////////////////////////////////////////////////////////////////////////

    /* #region Manager */

    /**
     * Parsed graph_types.json
     * @type {Object}
     */
    static ChartTypeData;

    static checkChartTypeData() {
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
        return ChartManager.ChartTypeData["RoleDetails"].find(role => role["name"] === roleName);
    }

    /* #endregion */

}